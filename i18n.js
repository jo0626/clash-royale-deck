/* =============================================================
 *  CR Deck Builders – 多言語化(i18n) フェーズ1：日本語(原文)→各言語
 *  方針：HTMLは書き換えず、読み込み時にDOMの日本語テキスト/属性を辞書で置換する。
 *        ・既存のJSロジック（特に index のカード処理）には一切触れない＝安全
 *        ・MutationObserver等の毎フレーム監視はしない＝重くならない/落ちない
 *        ・読み込み時＋言語切替時＋少し遅れて1回、の有限回だけDOMを走査
 *  追加言語：LANGS と DICT に足すだけ。RTL(ar/fa)は dir=rtl を自動設定。
 *  ※ カード名や動的に描画される文言は次フェーズ（公式ロケールデータで対応）。
 * ============================================================= */
(function () {
  // 利用可能な言語（順次追加。CRプレイヤー規模順：en→es→pt→…）
  const LANGS = ['ja', 'en'];
  const LANG_NAMES = { ja: '日本語', en: 'English', es: 'Español', 'pt-br': 'Português', 'zh-cn': '简体中文', fr: 'Français', de: 'Deutsch', ru: 'Русский', ko: '한국어', ar: 'العربية', tr: 'Türkçe', it: 'Italiano', id: 'Indonesia', th: 'ไทย', vi: 'Tiếng Việt', 'zh-tw': '繁體中文', fa: 'فارسی', nl: 'Nederlands' };

  // 原文(日本語) → 各言語。キーは画面に出る日本語テキスト（前後の空白はtrimして照合）。
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
      // 支援(support)
      "支援・寄付": "Support",
      "開発者にエリクサーを供給する": "Supply Elixir to the developer",
      "OFUSEで応援する": "Support via OFUSE",
      "クレジットカード / Google Pay 対応": "Credit card / Google Pay",
      "ひとことメッセージを添えて応援できる": "Cheer with a short message",
      "エリクサー供給メニュー": "Elixir Supply Menu",
      "おすすめ": "Recommended",
      "人気": "Popular",
      "特典の内容": "What you get",
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

  function pickLang() {
    try { const s = localStorage.getItem('cr_lang'); if (s && LANGS.includes(s)) return s; } catch (e) {}
    try { const u = (new URLSearchParams(location.search).get('lang') || '').toLowerCase(); if (u && LANGS.includes(u)) return u; } catch (e) {}
    const n = (navigator.language || 'ja').toLowerCase();
    if (n.indexOf('ja') === 0) return 'ja';
    return LANGS.includes('en') ? 'en' : 'ja'; // 日本語以外のブラウザは（あれば）英語に
  }

  let lang = pickLang();
  const origText = new WeakMap();
  const RTL = { ar: 1, fa: 1 };

  function tr(src) {
    if (lang === 'ja') return src;
    const d = DICT[lang];
    return (d && d[src] != null) ? d[src] : src; // 未訳はそのまま（壊さない）
  }

  function walk() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
    if (!document.body) return;
    // テキストノード
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
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
    // 属性（title / placeholder / aria-label / alt）
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

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    lang = l; try { localStorage.setItem('cr_lang', l); } catch (e) {}
    walk();
  }

  function injectSwitcher() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('crLangSel')) return;
    const sel = document.createElement('select');
    sel.id = 'crLangSel'; sel.setAttribute('data-no-i18n', '');
    sel.setAttribute('aria-label', 'Language');
    sel.style.cssText = 'margin-left:8px;background:var(--surface2,#1e2230);color:var(--text,#e8eaf0);border:1px solid var(--border-hi,rgba(255,255,255,.15));border-radius:8px;font-size:12px;padding:4px 6px;cursor:pointer;flex:0 0 auto;';
    LANGS.forEach(l => {
      const o = document.createElement('option'); o.value = l; o.textContent = LANG_NAMES[l] || l;
      if (l === lang) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', () => setLang(sel.value));
    header.appendChild(sel);
  }

  // 公開API（将来：描画後に CRI18N.apply() を呼べばカード名等も訳せる）
  window.CRI18N = { setLang: setLang, apply: walk, get lang() { return lang; }, langs: LANGS };

  function init() { injectSwitcher(); walk(); setTimeout(walk, 800); }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
