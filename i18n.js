/* =============================================================
 *  CR Deck Builders – 多言語化(i18n)
 *  方針：HTMLは書き換えず、DOMの日本語テキスト/属性を辞書で各言語へ置換。
 *   ・UI文言は読み込み時＋言語切替時にDOM全体を1回走査。
 *   ・カード名など動的描画は #cardList / #deckSlots だけを限定監視（childListのみ＝
 *     ユーザー操作の再描画時だけ発火。毎フレームではないので軽い／落ちない）。
 *  追加言語：LANGS と DICT に足すだけ。RTL(ar/fa)は dir=rtl を自動設定。
 * ============================================================= */
(function () {
  const LANGS = ['ja', 'en'];
  const LANG_NAMES = { ja: '日本語', en: 'English', es: 'Español', 'pt-br': 'Português', 'zh-cn': '简体中文', fr: 'Français', de: 'Deutsch', ru: 'Русский', ko: '한국어', ar: 'العربية', tr: 'Türkçe', it: 'Italiano', id: 'Indonesia', th: 'ไทย', vi: 'Tiếng Việt', 'zh-tw': '繁體中文', fa: 'فارسی', nl: 'Nederlands' };

  // 原文(日本語) → 各言語。キーは画面に出る日本語テキスト（trimして照合）。
  const DICT = {
    en: {
      // ヘッダー / ナビ
      "クラロワデッキ作成・診断ツール": "Clash Royale Deck Builder & Analyzer",
      "デッキ作成": "Deck Builder",
      "人気デッキ・デッキ探求": "Popular Decks",
      "支援・寄付": "Support",
      "リクエスト・お問い合わせ": "Requests & Contact",
      "お気に入りを上に表示": "Show favorites first",
      "コスト順に並べ替え": "Sort by cost",
      "進化": "Evolution",
      "英雄": "Hero",
      "ヒーロー/チャンピオン": "Hero / Champion",
      "お気に入り追加": "Add to favorites",
      "お気に入り解除": "Remove from favorites",
      "クリックで外す": "Click to remove",
      "タップで使い方／長押しでスロット切替": "Tap for help / hold to switch slots",
      // ビルダー(index)
      "クリア": "Clear",
      "保存": "Save",
      "平均コスト": "Avg Elixir",
      "デッキ分析へ": "Analyze deck",
      "人気デッキから作る": "Start from a popular deck",
      "カード名か略称で検索...": "Search cards by name…",
      "全て": "All",
      "ユニット": "Units",
      "呪文": "Spells",
      "建物": "Buildings",
      "限界突破": "Evolution",
      "ヒーロー": "Hero",
      "チャンピオン": "Champion",
      "コスト": "Cost",
      // 支援(support)
      "支援・寄付": "Support",
      "開発者にエリクサーを供給する": "Supply Elixir to the developer",
      "OFUSEで応援する": "Support via OFUSE",
      "クレジットカード / Google Pay 対応": "Credit card / Google Pay",
      "ひとことメッセージを添えて応援できる": "Cheer with a short message",
      "エリクサー供給メニュー": "Elixir Supply Menu",
      "おすすめ": "Recommended",
      "人気": "Popular",
      "開発者からのメッセージ": "A message from the developer",
      "閉じる": "Close",
      // 問い合わせ(contact)
      "種類": "Type",
      "お名前（任意）": "Name (optional)",
      "内容": "Message",
      "送信する": "Send",
      "機能リクエスト": "Feature request",
      "カード追加・修正の要望": "Card add / fix request",
      "不具合の報告": "Bug report",
      "その他・ご感想": "Other / Feedback",
      "ニックネームでOK": "A nickname is fine",
      "ご要望・ご意見をご記入ください": "Write your request or feedback",
      "SNSでも受け付けています": "Also available on social media",
      // アカウント
      "🔑 ログイン": "🔑 Sign in",
      "ログアウト": "Sign out",
      "✨ ドラッグの軌跡": "✨ Drag trail"
    }
  };

  // カード名（日本語 → 公式英名）。動的描画されるので限定監視で随時置換。
  const CARD_EN = {
    "スケルトン": "Skeletons", "アイススピリット": "Ice Spirit", "ファイアスピリット": "Fire Spirit", "エレクトロスピリット": "Electro Spirit", "ヒールスピリット": "Heal Spirit",
    "ゴブリン": "Goblins", "ボンバー": "Bomber", "槍ゴブリン": "Spear Goblins", "コウモリの群れ": "Bats", "アイスゴーレム": "Ice Golem", "ウォールブレイカー": "Wall Breakers",
    "バーサーカー": "Berserker", "ザップ": "Zap", "巨大雪玉": "Giant Snowball", "ローリングバーバリアン": "Barbarian Barrel", "ローリングウッド": "The Log", "レイジ": "Rage",
    "ステルスブッシュ": "Suspicious Bush", "ゴブリンの呪い": "Goblin Curse", "ナイト": "Knight", "アーチャー": "Archers", "ガーゴイル": "Minions", "ゴブリンギャング": "Goblin Gang",
    "スケルトンバレル": "Skeleton Barrel", "ロケット砲士": "Firecracker", "メガガーゴイル": "Mega Minion", "吹き矢ゴブリン": "Dart Goblin", "エリクサーゴーレム": "Elixir Golem",
    "アイスウィザード": "Ice Wizard", "プリンセス": "Princess", "ディガー": "Miner", "スケルトン部隊": "Skeleton Army", "盾の戦士": "Guards", "アサシン ユーノ": "Bandit",
    "漁師トリトン": "Fisherman", "ロイヤルゴースト": "Royal Ghost", "矢の雨": "Arrows", "トルネード": "Tornado", "アースクエイク": "Earthquake", "ロイヤルデリバリー": "Royal Delivery",
    "ゴブリンバレル": "Goblin Barrel", "クローン": "Clone", "ヴァイン": "Vines", "ボイド": "Void", "ミラー": "Mirror", "大砲": "Cannon", "墓石": "Tombstone",
    "バルキリー": "Valkyrie", "マスケット銃士": "Musketeer", "ミニペッカ": "Mini P.E.K.K.A", "ホグライダー": "Hog Rider", "攻城バーバリアン": "Battle Ram", "スケルトンドラゴン": "Skeleton Dragons",
    "ザッピー": "Zappies", "ホバリング砲": "Flying Machine", "バトルヒーラー": "Battle Healer", "ダイナマイトゴブリン": "Goblin Demolisher", "ダークプリンス": "Dark Prince",
    "ハンター": "Hunter", "ベビードラゴン": "Baby Dragon", "エレクトロウィザード": "Electro Wizard", "インフェルノドラゴン": "Inferno Dragon", "ランバージャック": "Lumberjack",
    "マジックアーチャー": "Magic Archer", "マザーネクロマンサー": "Mother Witch", "ダークネクロ": "Night Witch", "ゴールドナイト": "Golden Knight", "スケルトンキング": "Skeleton King",
    "マイティディガー": "Mighty Miner", "フェニックス": "Phoenix", "鍛冶屋ジャイアント": "Rune Giant", "ファイアボール": "Fireball", "フリーズ": "Freeze", "ポイズン": "Poison",
    "ゴブリンの檻": "Goblin Cage", "ゴブリンドリル": "Goblin Drill", "ゴブリンの小屋": "Goblin Hut", "ボムタワー": "Bomb Tower", "テスラ": "Tesla", "迫撃砲": "Mortar", "オーブン": "Furnace",
    "バーバリアン": "Barbarians", "ガーゴイルの群れ": "Minion Horde", "ジャイアント": "Giant", "ウィザード": "Wizard", "エアバルーン": "Balloon", "ネクロマンサー": "Witch", "ボウラー": "Bowler",
    "執行人ファルチェ": "Executioner", "60式ムート": "Cannon Cart", "ロイヤルホグ": "Royal Hogs", "アウトロー": "Rascals", "ライトニングドラゴン": "Electro Dragon", "プリンス": "Prince",
    "ラムライダー": "Ram Rider", "リトルプリンス": "Little Prince", "モンク": "Monk", "ゴブリンシュタイン": "Goblinstein", "ボスアサシン": "Boss Bandit", "アーチャークイーン": "Archer Queen",
    "ゴブリンマシン": "Goblin Machine", "スケルトンラッシュ": "Graveyard", "インフェルノタワー": "Inferno Tower", "ロイヤルジャイアント": "Royal Giant", "エリートバーバリアン": "Elite Barbarians",
    "巨大スケルトン": "Giant Skeleton", "ゴブジャイアント": "Goblin Giant", "スパーキー": "Sparky", "スピリットエンプレス": "Spirit Empress", "ロケット": "Rocket", "ライトニング": "Lightning",
    "エリクサーポンプ": "Elixir Collector", "バーバリアンの小屋": "Barbarian Hut", "巨大クロスボウ": "X-Bow", "ペッカ": "P.E.K.K.A", "ラヴァハウンド": "Lava Hound", "エレクトロジャイアント": "Electro Giant",
    "メガナイト": "Mega Knight", "見習い親衛隊": "Royal Recruits", "ゴーレム": "Golem", "三銃士": "Three Musketeers"
  };
  if (DICT.en) Object.assign(DICT.en, CARD_EN);

  function pickLang() {
    try { const s = localStorage.getItem('cr_lang'); if (s && LANGS.includes(s)) return s; } catch (e) {}
    try { const u = (new URLSearchParams(location.search).get('lang') || '').toLowerCase(); if (u && LANGS.includes(u)) return u; } catch (e) {}
    const n = (navigator.language || 'ja').toLowerCase();
    if (n.indexOf('ja') === 0) return 'ja';
    return LANGS.includes('en') ? 'en' : 'ja';
  }

  let lang = pickLang();
  const origText = new WeakMap();
  const RTL = { ar: 1, fa: 1 };

  function tr(src) {
    if (lang === 'ja') return src;
    const d = DICT[lang];
    return (d && d[src] != null) ? d[src] : src;
  }

  function translateText(root) {
    if (!root) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let nn; while ((nn = tw.nextNode())) nodes.push(nn);
    nodes.forEach(n => {
      let o = origText.get(n); if (o == null) { o = n.nodeValue; origText.set(n, o); }
      const t = (o || '').trim(); if (!t) return;
      const rep = tr(t);
      if (lang === 'ja') { if (n.nodeValue !== o) n.nodeValue = o; }
      else if (rep !== t) { n.nodeValue = o.replace(t, rep); }
    });
  }

  function translateAttrs() {
    ['title', 'placeholder', 'aria-label', 'alt'].forEach(attr => {
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        if (el.closest('[data-no-i18n]')) return;
        const dk = 'i18no_' + attr.replace('-', '_');
        let o = el.dataset[dk]; if (o == null) { o = el.getAttribute(attr) || ''; el.dataset[dk] = o; }
        const t = o.trim(); if (!t) return;
        el.setAttribute(attr, lang === 'ja' ? o : tr(t));
      });
    });
  }

  function walk() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
    translateText(document.body);
    translateAttrs();
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    lang = l; try { localStorage.setItem('cr_lang', l); } catch (e) {}
    walk();
  }

  // 動的描画コンテナだけを限定監視（childListのみ＝再描画時だけ。毎フレームではない）
  function observe(id) {
    const el = document.getElementById(id); if (!el) return;
    let q = false;
    const mo = new MutationObserver(() => {
      if (lang === 'ja') return;   // 日本語は何もしない＝ゼロ負荷
      if (q) return; q = true;
      requestAnimationFrame(() => { q = false; translateText(el); });
    });
    mo.observe(el, { childList: true, subtree: true });
  }

  function injectSwitcher() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('crLangSel')) return;
    const sel = document.createElement('select');
    sel.id = 'crLangSel'; sel.setAttribute('data-no-i18n', '');
    sel.setAttribute('aria-label', 'Language');
    sel.style.cssText = 'margin-left:auto;background:var(--surface2,#1e2230);color:var(--text,#e8eaf0);border:1px solid var(--border-hi,rgba(255,255,255,.15));border-radius:8px;font-size:12px;padding:4px 6px;cursor:pointer;flex:0 0 auto;max-width:34vw;';
    LANGS.forEach(l => {
      const o = document.createElement('option'); o.value = l; o.textContent = LANG_NAMES[l] || l;
      if (l === lang) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', () => setLang(sel.value));
    const acct = document.getElementById('cr-account');
    if (acct && acct.parentNode === header) header.insertBefore(sel, acct);
    else header.appendChild(sel);
    if (!document.getElementById('crI18nStyle')) {
      const st = document.createElement('style'); st.id = 'crI18nStyle';
      st.textContent =
        'header{flex-wrap:nowrap !important;align-items:center !important;gap:10px}' +
        '.logo{flex:0 0 auto}' +
        '#crLangSel{flex:0 0 auto}' +
        '#cr-account{margin-left:8px;min-width:0;flex:0 1 auto}' +
        '#cr-account .cr-avatar-btn{max-width:100%;align-items:center}' +
        '#cr-account #crAvatarName{white-space:normal;line-height:1.12;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-align:left;max-width:14ch}';
      document.head.appendChild(st);
    }
  }

  window.CRI18N = { setLang: setLang, apply: walk, get lang() { return lang; }, langs: LANGS };

  function init() {
    injectSwitcher();
    walk();
    observe('cardList');
    observe('deckSlots');
    setTimeout(walk, 800);   // 初期描画の取りこぼし対策（1回だけ）
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
