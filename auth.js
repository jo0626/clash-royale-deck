// =============================================================
//  CR Deck Builder — 認証＆ユーザーデータ共有モジュール
//  全ページ共通。各ページの </body> 直前に
//     <script type="module" src="auth.js"></script>
//  の1行を入れるだけで、ヘッダーにログインボタンが自動で付きます。
//
//  提供する機能（window.CRAuth 経由）:
//    CRAuth.signIn()              … Googleログイン
//    CRAuth.signOut()             … ログアウト
//    CRAuth.getUser()             … 現在のFirebase Userまたはnull
//    CRAuth.getProfile()          … Firestoreのプロフィール（tier等）
//    CRAuth.setCrTag(tag)         … クラロワプレイヤーIDを保存
//    CRAuth.saveDeck(name, slots) … デッキをクラウド保存
//    CRAuth.listDecks()           … 保存済みデッキ一覧
//    CRAuth.deleteDeck(id)        … デッキ削除
//    CRAuth.onChange(fn)          … ログイン状態が変わるたびfn(user, profile)
//
//  デッキ保存を使うページは、グローバルに以下を用意してください:
//    window.CRDeckBridge = { getDeck:()=>[...], setDeck:(slots)=>{}, cards:[...] }
//  （index.html には組み込み済み）
// =============================================================

import { firebaseConfig, isConfigured, crPlayerApiUrl } from "./firebase-config.js";

// ===== ダブルタップ拡大を全ページ・全要素で防止（ピンチ拡大は維持） =====
// CSSのtouch-actionだけだと動的生成要素などで効かない場合があるためJSでも防ぐ
(function preventDoubleTapZoom() {
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) {
      const t = e.target;
      // 入力欄など、文字選択が必要な要素は除外
      if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) { lastTouchEnd = now; return; }
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
})();

// Firebase SDK は動的に読み込む（CDNが遅くてもUIが先に出るように）。
// 読み込んだ関数はここに入る。
let FB = null;
async function loadFirebase() {
  const [appMod, authMod, fsMod] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
  ]);
  return { ...appMod, ...authMod, ...fsMod };
}

// ---- グレード（寄付グレード）定義 — 着せ替え解放の土台 -------------
// 寄付額に応じてここを上げていく想定。今は手動 or 後で決済連携。
export const TIERS = {
  free:   { label: "ゲスト",       color: "#6b7080" },
  bronze: { label: "ブロンズ支援", color: "#cd7f32" },
  silver: { label: "シルバー支援", color: "#c0c0c0" },
  gold:   { label: "ゴールド支援", color: "#e8a020" },
};

let app, auth, db;
let currentUser = null;
let currentProfile = null;
let _ownedCards = null; // クラロワID連携で取得した所持カード（日本語名の配列）
let _slotsCache = null; // 5スロットのキャッシュ（読み取り回数の節約）
const changeCallbacks = [];

// ---- ログイン状態のヒントをローカルに保存（ページ遷移時のチラつき防止） ----
const HINT_KEY = "cr_user_hint";
function readHint() { try { return JSON.parse(localStorage.getItem(HINT_KEY) || "null"); } catch (e) { return null; } }
function writeHint(h) { try { localStorage.setItem(HINT_KEY, JSON.stringify(h)); } catch (e) {} }
function clearHint() { try { localStorage.removeItem(HINT_KEY); } catch (e) {} }

// ---- まずUIを必ず出す（Firebaseの読み込みを待たない） ---------------
injectAccountUI();
// 設定済みなら、前回ログインのヒントがあれば即アバター表示（チラつき防止）。
// 未ログインなら最初から「ログイン」を出す。未設定のときだけ「準備中」。
if (!isConfigured) {
  setLoggedOutUI(true);
} else {
  const hint = readHint();
  if (hint && hint.displayName !== undefined) applyAvatarUI(hint);
  else setLoggedOutUI(false);
}

// ---- 設定があればFirebaseを動的ロードして起動 ----------------------
if (!isConfigured) {
  console.warn("[CRAuth] firebase-config.js が未設定です。ログインは準備中表示のままです。");
} else {
  loadFirebase().then((fb) => {
    FB = fb;
    app  = fb.initializeApp(firebaseConfig);
    auth = fb.getAuth(app);
    db   = fb.getFirestore(app);

    fb.setPersistence(auth, fb.browserLocalPersistence).catch(() => {});

    fb.onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        currentProfile = await ensureProfile(user);
        setLoggedInUI(user, currentProfile);
        writeHint({ displayName: user.displayName || "プレイヤー", photoURL: user.photoURL || "", tier: (currentProfile && currentProfile.tier) || "free" });
        CRAuth.refreshOwnedCards(); // ログイン時、IDがあれば所持カードを取得（基礎）
      } else {
        currentProfile = null;
        _slotsCache = null;
        setLoggedOutUI(false); // ログイン可能状態
        clearHint();
      }
      changeCallbacks.forEach(fn => { try { fn(user, currentProfile); } catch (e) {} });
    });
  }).catch((e) => {
    console.error("[CRAuth] Firebase SDKの読み込みに失敗:", e);
    setLoggedOutUI(true);
  });
}

// ---- Firestore: プロフィール作成/取得 ------------------------------
async function ensureProfile(user) {
  const ref = FB.doc(db, "users", user.uid);
  const snap = await FB.getDoc(ref);
  if (!snap.exists()) {
    const data = {
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      crTag: "",
      tier: "free",
      theme: "default",
      createdAt: FB.serverTimestamp(),
      updatedAt: FB.serverTimestamp(),
    };
    await FB.setDoc(ref, data);
    return data;
  }
  return snap.data();
}

// ---- 公開API ------------------------------------------------------
const CRAuth = {
  // ログインボタン → ログイン方法を選ぶモーダルを開く
  signIn() {
    if (!isConfigured || !FB || !auth) { alert("ログインはまだ準備中です（firebase-config.js を設定してください）"); return; }
    openLoginModal();
  },
  async signInGoogle() {
    try {
      await FB.signInWithPopup(auth, new FB.GoogleAuthProvider());
      closeLoginModal();
    } catch (e) { handleAuthError(e); }
  },
  async signInEmail(email, password) {
    try {
      await FB.signInWithEmailAndPassword(auth, email.trim(), password);
      closeLoginModal();
    } catch (e) { handleAuthError(e); }
  },
  async signUpEmail(email, password) {
    try {
      await FB.createUserWithEmailAndPassword(auth, email.trim(), password);
      closeLoginModal();
    } catch (e) { handleAuthError(e); }
  },
  async resetPassword(email) {
    if (!email.trim()) { setModalMsg("メールアドレスを入力してください"); return; }
    try {
      await FB.sendPasswordResetEmail(auth, email.trim());
      setModalMsg("再設定メールを送りました。メールをご確認ください", true);
    } catch (e) { handleAuthError(e); }
  },
  async signOut() { if (auth && FB) await FB.signOut(auth); },
  getUser() { return currentUser; },
  getProfile() { return currentProfile; },
  onChange(fn) { changeCallbacks.push(fn); if (currentUser !== null || currentProfile !== null) fn(currentUser, currentProfile); },

  async setCrTag(tag) {
    if (!currentUser || !FB) return;
    const clean = String(tag).trim().toUpperCase().replace(/^#/, "");
    await FB.updateDoc(FB.doc(db, "users", currentUser.uid), { crTag: clean, updatedAt: FB.serverTimestamp() });
    if (currentProfile) currentProfile.crTag = clean;
  },

  // ── クラロワID連携の基礎：プレイヤータグから所持カードを取得 ──
  getCrTag() { return (currentProfile && currentProfile.crTag) || ""; },
  getOwnedCards() { return _ownedCards; }, // 取得済みなら日本語カード名の配列、未取得はnull
  async refreshOwnedCards() {
    const tag = CRAuth.getCrTag();
    if (!tag) { _ownedCards = null; return null; }
    if (!crPlayerApiUrl) {  // エンドポイント未設定（基礎のみ）。GASのdoGetを用意してURLを設定すると有効化
      console.info("[CRAuth] crPlayerApiUrl 未設定のため所持カード取得はスキップ（基礎のみ実装）");
      return null;
    }
    try {
      const url = crPlayerApiUrl + (crPlayerApiUrl.includes("?") ? "&" : "?") + "tag=" + encodeURIComponent(tag);
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      _ownedCards = Array.isArray(data.cards) ? data.cards : (Array.isArray(data) ? data : []);
      try { localStorage.setItem("cr_owned_" + tag, JSON.stringify(_ownedCards)); } catch (e) {}
      window.dispatchEvent(new CustomEvent("cr-owned-cards", { detail: _ownedCards }));
      return _ownedCards;
    } catch (e) { console.error("[CRAuth] 所持カード取得失敗:", e); return null; }
  },

  async saveDeck(name, slots) {
    if (!currentUser) { CRAuth.signIn(); return; }
    const avg = slots.length ? (slots.reduce((s, c) => s + (c.cost || 0), 0) / slots.length) : 0;
    await FB.addDoc(FB.collection(db, "users", currentUser.uid, "decks"), {
      name: name || "無題デッキ",
      slots: slots.map(c => c.name),
      avg: Math.round(avg * 100) / 100,
      createdAt: FB.serverTimestamp(),
    });
  },

  async listDecks() {
    if (!currentUser || !FB) return [];
    const q = FB.query(FB.collection(db, "users", currentUser.uid, "decks"), FB.orderBy("createdAt", "desc"));
    const snap = await FB.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async deleteDeck(id) {
    if (!currentUser || !FB) return;
    await FB.deleteDoc(FB.doc(db, "users", currentUser.uid, "decks", id));
  },

  // ---- 5スロット保存（クラウド・作成途中でも保存可） ----
  // スロットは users/{uid}/decks/slot1..slot5 に固定IDで保存
  async saveDeckToSlot(slot, name, cards) {
    if (!currentUser) { CRAuth.signIn(); return; }
    const s = Math.max(1, Math.min(5, slot | 0));
    const list = (cards || []).filter(Boolean);
    const avg = list.length ? (list.reduce((a, c) => a + (c.cost || 0), 0) / list.length) : 0;
    const data = {
      slot: s,
      name: name || ("デッキ" + s),
      slots: list.map(c => c.name),
      avg: Math.round(avg * 100) / 100,
      createdAt: FB.serverTimestamp(),
    };
    await FB.setDoc(FB.doc(db, "users", currentUser.uid, "decks", "slot" + s), data);
    // キャッシュも更新（再読み込み＝Firestore読み取りを増やさない）
    if (_slotsCache) {
      _slotsCache = _slotsCache.filter(x => x.slot !== s).concat([{ id: "slot" + s, ...data }]).sort((a, b) => (a.slot || 0) - (b.slot || 0));
    }
  },

  // 5スロットの現在の中身を返す（キャッシュ優先で読み取り回数を節約）
  async getSlots(force) {
    if (!currentUser || !FB) return [];
    if (_slotsCache && !force) return _slotsCache;
    const snap = await FB.getDocs(FB.collection(db, "users", currentUser.uid, "decks"));
    _slotsCache = snap.docs
      .filter(d => /^slot[1-5]$/.test(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.slot || 0) - (b.slot || 0));
    return _slotsCache;
  },

  // ---- お気に入り（クラウド保存・端末間で維持） ----
  getCloudFavorites() { return (currentProfile && currentProfile.favorites) || []; },
  async saveFavorites(arr) {
    if (!currentUser || !FB) return;
    const list = Array.from(new Set(arr || []));
    await FB.updateDoc(FB.doc(db, "users", currentUser.uid), { favorites: list, updatedAt: FB.serverTimestamp() });
    if (currentProfile) currentProfile.favorites = list;
  },
};
window.CRAuth = CRAuth;

// =============================================================
//  ヘッダーに差し込むアカウントUI（全ページ共通・自動生成）
// =============================================================
function injectAccountUI() {
  if (document.getElementById("cr-account")) return;

  const style = document.createElement("style");
  style.textContent = `
    #cr-account { margin-left: auto; display: flex; align-items: center; }
    .cr-login-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent, #e8a020); color: #000; font-weight: 700;
      border: none; border-radius: 8px; padding: 7px 12px; cursor: pointer;
      font-family: inherit; font-size: 13px; white-space: nowrap;
    }
    .cr-login-btn:disabled { opacity: .5; cursor: default; }
    .cr-avatar-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--surface2, #1e2230); border: 1px solid var(--border-hi, rgba(255,255,255,.15));
      border-radius: 999px; padding: 4px 10px 4px 4px; cursor: pointer; color: var(--text, #e8eaf0);
      font-family: inherit; font-size: 13px;
    }
    .cr-avatar-btn img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
    .cr-tier-chip { font-size: 10px; padding: 1px 6px; border-radius: 999px; font-weight: 700; }
    .cr-menu {
      position: absolute; top: 100%; right: 12px; margin-top: 6px; z-index: 500;
      background: var(--surface, #161920); border: 1px solid var(--border-hi, rgba(255,255,255,.15));
      border-radius: 12px; padding: 12px; width: 260px; box-shadow: 0 12px 32px rgba(0,0,0,.5);
      display: none;
    }
    .cr-menu.open { display: block; }
    /* メニュー外タップ用の透明な受け皿（ヘッダーの重なり内・メニューより下） */
    #crMenuBackdrop { position: fixed; inset: 0; z-index: 400; background: transparent; }
    .cr-menu .cr-hint { font-size: 11px; color: var(--text-muted, #6b7080); margin: 6px 0 2px; line-height: 1.5; }
    .cr-menu h4 { font-size: 13px; margin: 0 0 8px; color: var(--text, #e8eaf0); }
    .cr-menu .cr-row { display: flex; gap: 6px; align-items: center; margin: 8px 0; }
    .cr-menu input { flex: 1; background: var(--surface2,#1e2230); border: 1px solid var(--border,rgba(255,255,255,.07));
      border-radius: 6px; color: var(--text,#e8eaf0); padding: 6px 8px; font-size: 13px; outline: none; }
    .cr-menu button.cr-mini { background: var(--surface2,#1e2230); border: 1px solid var(--border-hi,rgba(255,255,255,.15));
      color: var(--text,#e8eaf0); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 12px; font-family: inherit; }
    .cr-menu .cr-divider { height:1px; background: var(--border,rgba(255,255,255,.07)); margin: 10px 0; }
    .cr-menu .cr-logout { color: #e05050; }
    .cr-decklist { max-height: 200px; overflow-y: auto; }
    .cr-deckitem { display:flex; justify-content:space-between; align-items:center; gap:6px;
      padding:6px 4px; border-bottom:1px solid var(--border,rgba(255,255,255,.07)); font-size:12px; color:var(--text,#e8eaf0); }
    .cr-deckitem .nm { flex:1; cursor:pointer; }
    .cr-deckitem .del { color:#e05050; cursor:pointer; background:none; border:none; font-size:13px; }
    @media (max-width:720px){ .cr-menu{ right:8px; width: calc(100vw - 16px); max-width:300px; } }
    /* 全ページ共通ヘッダー：タイトル1段＋副題表示＋ナビアイコンはアカウントの下・右寄せ */
    header { flex-wrap: wrap; align-items: flex-start; row-gap: 6px; }
    header .logo { white-space: nowrap; }
    header .logo span { display: block !important; white-space: nowrap; }
    #cr-account { order: 1; }
    header > nav.nav-icons { order: 2; flex-basis: 100%; display: flex; justify-content: flex-end; gap: 4px; margin-left: 0; }
  `;
  document.head.appendChild(style);

  const header = document.querySelector("header") || document.body;
  if (getComputedStyle(header).position === "static") header.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.id = "cr-account";
  wrap.innerHTML = `
    <button class="cr-login-btn" id="crLoginBtn">🔑 ログイン</button>
    <button class="cr-avatar-btn" id="crAvatarBtn" style="display:none">
      <img id="crAvatarImg" alt="">
      <span id="crAvatarName"></span>
      <span class="cr-tier-chip" id="crTierChip"></span>
    </button>
    <div class="cr-menu" id="crMenu"></div>
  `;
  header.appendChild(wrap);

  document.getElementById("crLoginBtn").onclick = () => CRAuth.signIn();
  document.getElementById("crAvatarBtn").onclick = (e) => { e.stopPropagation(); toggleMenu(); };
  document.addEventListener("click", (e) => {
    const m = document.getElementById("crMenu");
    if (m && m.classList.contains("open") && !e.target.closest("#cr-account")) m.classList.remove("open");
  });
}

function setLoggedOutUI(disabled) {
  const lb = document.getElementById("crLoginBtn");
  const ab = document.getElementById("crAvatarBtn");
  if (!lb) return;
  lb.style.display = "inline-flex";
  ab.style.display = "none";
  lb.disabled = !!disabled;
  lb.textContent = disabled ? "🔑 ログイン（準備中）" : "🔑 ログイン";
}

// アバター表示だけを更新（ヒントからの即時描画にも使う・メニューは作らない）
function applyAvatarUI(info) {
  const lb = document.getElementById("crLoginBtn");
  const ab = document.getElementById("crAvatarBtn");
  if (!lb) return;
  lb.style.display = "none";
  ab.style.display = "inline-flex";
  document.getElementById("crAvatarImg").src = info.photoURL || "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png";
  document.getElementById("crAvatarName").textContent = (info.displayName || "プレイヤー").split(" ")[0];
  const tier = info.tier || "free";
  const t = TIERS[tier] || TIERS.free;
  const chip = document.getElementById("crTierChip");
  chip.textContent = t.label;
  chip.style.background = t.color;
  chip.style.color = (tier === "free") ? "#fff" : "#000";
}

function setLoggedInUI(user, profile) {
  applyAvatarUI({ displayName: user.displayName, photoURL: user.photoURL, tier: (profile && profile.tier) || "free" });
  buildMenu(user, profile);
}

function buildMenu(user, profile) {
  const m = document.getElementById("crMenu");
  // ※このエリアは今後随時拡張していく
  m.innerHTML = `
    <h4>${user.displayName || "プレイヤー"}</h4>
    <div class="cr-row">
      <input id="crTagInput" placeholder="クラロワID 例 #ABC123" value="${(profile && profile.crTag) ? "#" + profile.crTag : ""}">
      <button class="cr-mini" id="crTagSave">保存</button>
    </div>
    <div class="cr-hint" id="crTagHint">IDを登録すると、今後「持っているカードで組めるデッキだけ」表示などに使えます。</div>
    <div class="cr-divider"></div>
    <div class="cr-row"><button class="cr-mini cr-logout" id="crLogout">ログアウト</button></div>
  `;
  document.getElementById("crTagSave").onclick = async () => {
    const v = document.getElementById("crTagInput").value;
    await CRAuth.setCrTag(v);
    flash("crTagSave", "✓");
    CRAuth.refreshOwnedCards(); // ID保存時に所持カードを取りに行く（基礎）
  };
  document.getElementById("crLogout").onclick = () => CRAuth.signOut();
}

function toggleMenu() {
  const m = document.getElementById("crMenu");
  m.classList.toggle("open");
  syncMenuBackdrop();
}
// メニューを開いたら、画面全体に透明な受け皿を出して「外側タップで閉じる（その操作は他に波及しない）」を実現
function syncMenuBackdrop() {
  const m = document.getElementById("crMenu");
  let bd = document.getElementById("crMenuBackdrop");
  const open = m && m.classList.contains("open");
  if (open && !bd) {
    bd = document.createElement("div");
    bd.id = "crMenuBackdrop";
    bd.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); m.classList.remove("open"); syncMenuBackdrop(); }, true);
    // ヘッダーの重なり（stacking context）内に入れることで、メニューより下・他コンテンツより上に出す
    (document.getElementById("cr-account") || document.body).appendChild(bd);
  } else if (!open && bd) {
    bd.remove();
  }
}

function flash(btnId, txt) {
  const b = document.getElementById(btnId);
  if (!b) return;
  const old = b.textContent; b.textContent = txt;
  setTimeout(() => { b.textContent = old; }, 1000);
}

// =============================================================
//  ログインモーダル（Google ＋ メール/パスワード）
// =============================================================
let loginMode = "login"; // "login" | "signup"

function ensureLoginModal() {
  if (document.getElementById("crLoginModal")) return;
  const style = document.createElement("style");
  style.textContent = `
    .cr-modal-ov { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 1000;
      display: none; align-items: center; justify-content: center; }
    .cr-modal-ov.open { display: flex; }
    .cr-modal { background: var(--surface,#161920); border: 1px solid var(--border-hi,rgba(255,255,255,.15));
      border-radius: 14px; padding: 22px; width: min(360px, 92vw); box-shadow: 0 16px 40px rgba(0,0,0,.55);
      font-family: inherit; color: var(--text,#e8eaf0); }
    .cr-modal h3 { margin: 0 0 4px; font-size: 18px; text-align: center; }
    .cr-modal .sub { font-size: 12px; color: var(--text-muted,#6b7080); text-align: center; margin-bottom: 16px; }
    .cr-gbtn { width: 100%; display:flex; align-items:center; justify-content:center; gap:10px;
      background:#fff; color:#1f1f1f; border:none; border-radius:8px; padding:11px; font-size:14px; font-weight:600;
      cursor:pointer; font-family:inherit; }
    .cr-gbtn img { width:18px; height:18px; }
    .cr-or { display:flex; align-items:center; gap:8px; color:var(--text-muted,#6b7080); font-size:11px; margin:14px 0; }
    .cr-or::before,.cr-or::after { content:''; flex:1; height:1px; background:var(--border,rgba(255,255,255,.07)); }
    .cr-field { width:100%; background:var(--surface2,#1e2230); border:1px solid var(--border,rgba(255,255,255,.07));
      border-radius:8px; color:var(--text,#e8eaf0); padding:11px; font-size:15px; outline:none; margin-bottom:10px; }
    .cr-field:focus { border-color: var(--accent,#e8a020); }
    .cr-primary { width:100%; background:var(--accent,#e8a020); color:#000; font-weight:700; border:none;
      border-radius:8px; padding:12px; font-size:15px; cursor:pointer; font-family:inherit; }
    .cr-msg { font-size:12px; text-align:center; margin-top:10px; min-height:16px; color:#e05050; }
    .cr-msg.ok { color:#26c6a0; }
    .cr-switch { text-align:center; font-size:12px; margin-top:14px; color:var(--text-muted,#6b7080); }
    .cr-switch a { color:var(--accent,#e8a020); cursor:pointer; text-decoration:underline; }
    .cr-reset { text-align:center; font-size:11px; margin-top:8px; }
    .cr-reset a { color:var(--text-muted,#6b7080); cursor:pointer; }
    .cr-x { position:absolute; }
    .cr-modal .top { display:flex; justify-content:flex-end; margin:-8px -8px 0 0; }
    .cr-modal .top button { background:none; border:none; color:var(--text-muted,#6b7080); font-size:20px; cursor:pointer; }
  `;
  document.head.appendChild(style);
  const ov = document.createElement("div");
  ov.className = "cr-modal-ov";
  ov.id = "crLoginModal";
  ov.innerHTML = `<div class="cr-modal">
    <div class="top"><button id="crModalClose">✕</button></div>
    <h3 id="crModalTitle">ログイン</h3>
    <div class="sub" id="crModalSub">デッキ保存やマイページに使えます</div>
    <button class="cr-gbtn" id="crGoogleBtn">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">Googleで続行
    </button>
    <div class="cr-or">または メールで</div>
    <input class="cr-field" id="crEmail" type="email" placeholder="メールアドレス" autocomplete="email">
    <input class="cr-field" id="crPass" type="password" placeholder="パスワード（6文字以上）" autocomplete="current-password">
    <button class="cr-primary" id="crEmailBtn">ログイン</button>
    <div class="cr-msg" id="crModalMsg"></div>
    <div class="cr-reset" id="crResetWrap"><a id="crResetLink">パスワードを忘れた場合</a></div>
    <div class="cr-switch" id="crSwitchWrap">
      アカウントがない？ <a id="crSwitchLink">新規登録</a>
    </div>
  </div>`;
  document.body.appendChild(ov);

  ov.addEventListener("click", (e) => { if (e.target === ov) closeLoginModal(); });
  document.getElementById("crModalClose").onclick = closeLoginModal;
  document.getElementById("crGoogleBtn").onclick = () => CRAuth.signInGoogle();
  document.getElementById("crEmailBtn").onclick = () => {
    const email = document.getElementById("crEmail").value;
    const pass = document.getElementById("crPass").value;
    if (!email || !pass) { setModalMsg("メールとパスワードを入力してください"); return; }
    if (loginMode === "login") CRAuth.signInEmail(email, pass);
    else CRAuth.signUpEmail(email, pass);
  };
  document.getElementById("crSwitchLink").onclick = () => {
    loginMode = loginMode === "login" ? "signup" : "login";
    applyLoginMode();
  };
  document.getElementById("crResetLink").onclick = () =>
    CRAuth.resetPassword(document.getElementById("crEmail").value);
}

function applyLoginMode() {
  const isLogin = loginMode === "login";
  document.getElementById("crModalTitle").textContent = isLogin ? "ログイン" : "新規登録";
  document.getElementById("crEmailBtn").textContent = isLogin ? "ログイン" : "登録する";
  document.getElementById("crSwitchWrap").innerHTML = isLogin
    ? `アカウントがない？ <a id="crSwitchLink">新規登録</a>`
    : `すでにアカウントがある？ <a id="crSwitchLink">ログイン</a>`;
  document.getElementById("crResetWrap").style.display = isLogin ? "block" : "none";
  document.getElementById("crSwitchLink").onclick = () => {
    loginMode = loginMode === "login" ? "signup" : "login";
    applyLoginMode();
  };
  setModalMsg("");
}

function openLoginModal() {
  ensureLoginModal();
  loginMode = "login";
  applyLoginMode();
  document.getElementById("crLoginModal").classList.add("open");
}
function closeLoginModal() {
  const m = document.getElementById("crLoginModal");
  if (m) m.classList.remove("open");
}
function setModalMsg(txt, ok) {
  const m = document.getElementById("crModalMsg");
  if (!m) return;
  m.textContent = txt || "";
  m.classList.toggle("ok", !!ok);
}
function handleAuthError(e) {
  console.error(e);
  const map = {
    "auth/invalid-email": "メールアドレスの形式が正しくありません",
    "auth/missing-password": "パスワードを入力してください",
    "auth/weak-password": "パスワードは6文字以上にしてください",
    "auth/email-already-in-use": "このメールは登録済みです。ログインしてください",
    "auth/invalid-credential": "メールまたはパスワードが違います",
    "auth/wrong-password": "メールまたはパスワードが違います",
    "auth/user-not-found": "アカウントが見つかりません。新規登録してください",
    "auth/too-many-requests": "試行回数が多すぎます。少し待って再試行してください",
    "auth/popup-closed-by-user": "",
  };
  const msg = map[e.code] !== undefined ? map[e.code] : ("エラー: " + (e.message || e.code));
  if (msg) setModalMsg(msg);
}
