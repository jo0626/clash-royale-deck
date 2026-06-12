/* =============================================================
 *  デッキ診断チェックリスト（§8.11 D1）
 *  - 入力: strategy.html?deck=<日本語名8つカンマ区切り>&f=<形態8文字 n/e/h>
 *  - 材料: card-stats.json(Lv16ステータス+自動タグ) / card-tags.json(タグ表v2・オーナー監修)
 *  - 原則: ユーザーが読むのは静的JSONだけ（dataブランチ）
 *  ★WINCONS は GASのARCH_WINCONS / decks.jsのME_ARCH_WINCONS と同一に保つこと（変えたら3箇所同期）
 * ============================================================= */
const WINCONS = ['ラヴァハウンド', 'ゴーレム', 'エレクトロジャイアント', 'エリクサーゴーレム', '三銃士',
  'ゴブジャイアント', 'ジャイアント', '巨大スケルトン', 'スパーキー', '見習い親衛隊', 'ペッカ', 'メガナイト',
  'ボスアサシン', 'ロイヤルジャイアント', '巨大クロスボウ', '迫撃砲', 'エアバルーン', 'スケルトンバレル',
  'ホグライダー', 'ロイヤルホグ', 'ラムライダー', '攻城バーバリアン', 'エリートバーバリアン', 'プリンス',
  'ゴブリンマシン', 'ゴブリンシュタイン', 'モンク', 'アーチャークイーン', 'ゴールドナイト', 'スケルトンラッシュ',
  'ゴブリンバレル', 'ゴブリンドリル', 'ウォールブレイカー', 'マイティディガー', 'ディガー', 'ロケット'];

const RAW = 'https://raw.githubusercontent.com/rea-fi-lia/clash-royale-deck/data/';
const SPELL_ZONES = ['ログ圏内', 'ザップ圏内', '矢の雨圏内', 'ファイボ圏内', 'ポイズン圏内', 'ライトニング圏内', 'ロケット圏内'];
function _t(k, v) { return window.CRI18N ? CRI18N.t(k, v) : k; }
function _tr(s) { return window.CRI18N ? CRI18N.tr(s) : s; }

let STATS = null, TAGS = null, DECK = null;

function parseDeck() {
  const q = new URLSearchParams(location.search);
  const names = (q.get('deck') || '').split(',').map(s => s.trim()).filter(Boolean);
  const f = (q.get('f') || '').split('');
  if (names.length !== 8) return null;
  const deck = [];
  for (let i = 0; i < 8; i++) {
    const info = CARD_INFO[names[i]];
    if (!info) return null;
    const fm = (f[i] === 'e' && info.iv) ? 'e' : (f[i] === 'h' && info.ih) ? 'h' : 'n';
    deck.push({ name: names[i], f: fm, info });
  }
  return deck;
}
function mark(c) { return c.f === 'e' ? '⚡' : c.f === 'h' ? '👑' : ''; }
function tagsOf(c) { // タグ表v2（形態行優先→ベース行）
  if (!TAGS) return [];
  const e = TAGS[c.name + mark(c)] || TAGS[c.name];
  return (e && e.tags) || [];
}
function statOf(c) { return (STATS && STATS[c.name]) || null; }
function has(c, key) { return tagsOf(c).indexOf(key) >= 0; }
function isSpell(c) { const s = statOf(c); return s && s.n && s.n.type === 'Spell'; }
function chip(c) {
  const img = c.f === 'e' ? c.info.iv : c.f === 'h' ? c.info.ih : c.info.i;
  return '<span class="dg-chip"><img src="' + img + '" alt="' + c.name + '">' + c.name + mark(c) + '</span>';
}

function buildChecks(deck) {
  const units = deck.filter(c => !isSpell(c));
  const spells = deck.filter(c => isSpell(c));
  const checks = [];
  function add(grade, title, detail, cards) {
    checks.push({ grade, title, detail, cards: cards || [] });
  }
  // 1) 勝ち筋
  const wins = deck.filter(c => WINCONS.indexOf(c.name) >= 0);
  add(wins.length ? 'ok' : 'bad', _tr('勝ち筋'),
    wins.length ? _t('diag.winconN', { n: wins.length }) : _tr('タワーへの明確なダメージ源がありません'), wins);
  // 2) 対空ユニット
  const airU = units.filter(c => has(c, 'air') || (statOf(c) && statOf(c).n && statOf(c).n.air));
  add(airU.length >= 3 ? 'good' : airU.length === 2 ? 'ok' : airU.length === 1 ? 'warn' : 'bad',
    _tr('対空'), _t('diag.airN', { n: airU.length }), airU);
  // 3) 群れ対策（範囲攻撃＋ダメージ呪文）
  const splashU = units.filter(c => has(c, 'splash') || (statOf(c) && statOf(c).n && statOf(c).n.splash));
  const dmgSp = spells.filter(c => { const s = statOf(c); return s && (s.tags || []).some(t => t === '小呪文' || t === '中呪文' || t === '大呪文'); });
  const swarmN = splashU.length + dmgSp.length;
  add(swarmN >= 3 ? 'good' : swarmN === 2 ? 'ok' : swarmN === 1 ? 'warn' : 'bad',
    _tr('群れ対策'), _t('diag.swarmN', { a: splashU.length, b: dmgSp.length }), splashU.concat(dmgSp));
  // 4) タンク処理
  const tk = deck.filter(c => has(c, 'tankKiller'));
  const hiDps = units.filter(c => { const s = statOf(c); return s && s.dps16 >= 400; });
  add(tk.length ? 'good' : hiDps.length ? 'ok' : 'bad', _tr('タンク処理'),
    tk.length ? _t('diag.tankKillerN', { n: tk.length }) : hiDps.length ? _tr('専任はいませんが高DPSで代用できます') : _tr('ジャイアント級に苦戦します'),
    tk.length ? tk : hiDps);
  // 5) 防衛建物
  const bld = deck.filter(c => has(c, 'defBuilding'));
  add(bld.length ? 'good' : 'info', _tr('防衛建物'),
    bld.length ? _t('diag.bldN', { n: bld.length }) : _tr('なし。ホグ・攻城系の受けはユニットで工夫を'), bld);
  // 6) 呪文構成
  const spSmall = spells.filter(c => (statOf(c).tags || []).indexOf('小呪文') >= 0);
  const spBig = spells.filter(c => { const t = statOf(c).tags || []; return t.indexOf('中呪文') >= 0 || t.indexOf('大呪文') >= 0; });
  const spGrade = spells.length === 0 ? 'bad' : spells.length === 1 ? 'warn' : spells.length <= 3 ? 'good' : 'warn';
  add(spGrade, _tr('呪文構成'),
    _t('diag.spellsN', { n: spells.length, s: spSmall.length, b: spBig.length }), spells);
  // 7) リセット・妨害
  const ctrl = deck.filter(c => ['stun', 'stop', 'knockback', 'pull', 'slow'].some(k => has(c, k)));
  add(ctrl.length ? 'good' : 'warn', _tr('リセット・妨害'),
    ctrl.length ? _t('diag.ctrlN', { n: ctrl.length }) : _tr('なし。インフェルノ系・チャージ系・ランプ系に注意'), ctrl);
  // 8) 呪文圏内（被弾リスク）
  SPELL_ZONES.forEach(z => {
    const inZone = units.filter(c => { const s = statOf(c); return s && (s.tags || []).indexOf(z) >= 0; });
    const cheap = (z === 'ログ圏内' || z === 'ザップ圏内' || z === '矢の雨圏内');
    if (inZone.length >= (cheap ? 3 : 4)) add('warn', _tr(z), _t('diag.zoneN', { n: inZone.length }), inZone);
  });
  // 9) コストカーブ
  const costs = deck.map(c => c.info.c).sort((a, b) => a - b);
  const avg = (costs.reduce((s, v) => s + v, 0) / 8).toFixed(1);
  const cyc = costs.slice(0, 4).reduce((s, v) => s + v, 0);
  const hvy = costs.slice(4).reduce((s, v) => s + v, 0);
  const curve = avg < 3.1 ? _tr('高速サイクル型') : avg < 3.8 ? _tr('バランス型') : avg < 4.4 ? _tr('やや重め') : _tr('重量級（序盤の受けに注意）');
  add('info', _tr('コストカーブ'), _t('diag.curve', { avg: avg, cyc: cyc, hvy: hvy, t: curve }), []);
  return checks;
}

const GICON = { good: '◎', ok: '○', warn: '⚠', bad: '❌', info: 'ℹ️' };
function render() {
  const wrap = document.getElementById('diagResult');
  if (!wrap || !DECK) return;
  const checks = buildChecks(DECK);
  const bads = checks.filter(c => c.grade === 'bad').length;
  const warns = checks.filter(c => c.grade === 'warn').length;
  const verdict = bads === 0 && warns <= 1 ? ['good', _tr('合格ライン！バランスの良い構成です')]
    : bads === 0 ? ['ok', _tr('おおむね良好。⚠の項目を意識して立ち回ろう')]
    : ['warn', _tr('課題あり。❌の項目を見直すと安定します')];
  let html = '<div class="dg-deck">' + DECK.map(c => {
    const img = c.f === 'e' ? c.info.iv : c.f === 'h' ? c.info.ih : c.info.i;
    const badge = c.f === 'e' ? '<span class="slot-badge">⚡</span>' : c.f === 'h' ? '<span class="slot-badge">👑</span>' : '';
    return '<div class="mini-card' + (c.f === 'e' ? ' is-evo' : c.f === 'h' ? ' is-hero' : '') + '"><span class="pip">' + c.info.c + '</span>' + badge + '<img src="' + img + '" alt="' + c.name + '"></div>';
  }).join('') + '</div>';
  html += '<div class="dg-verdict dg-' + verdict[0] + '">' + GICON[verdict[0] === 'good' ? 'good' : verdict[0] === 'ok' ? 'ok' : 'warn'] + ' ' + verdict[1] + '</div>';
  html += checks.map(ch =>
    '<div class="dg-row dg-' + ch.grade + '">'
    + '<span class="dg-ico">' + GICON[ch.grade] + '</span>'
    + '<div class="dg-body"><div class="dg-title">' + ch.title + '</div>'
    + '<div class="dg-detail">' + ch.detail + '</div>'
    + (ch.cards.length ? '<div class="dg-chips">' + ch.cards.map(chip).join('') + '</div>' : '')
    + '</div></div>').join('');
  html += '<p class="note" style="margin-top:14px">' + _tr('※ 診断はLv16換算の理論値とオーナー監修タグに基づく参考情報です') + '</p>';
  wrap.innerHTML = html;
}

async function init() {
  DECK = parseDeck();
  const empty = document.getElementById('diagEmpty');
  const wrap = document.getElementById('diagResult');
  if (!DECK) { if (empty) empty.style.display = ''; return; }
  if (empty) empty.style.display = 'none';
  wrap.innerHTML = '<div class="coming-soon"><div class="big">🔬</div>' + _tr('診断中…') + '</div>';
  try {
    const [st, tg] = await Promise.all([
      fetch(RAW + 'card-stats.json', { cache: 'no-store' }).then(r => r.json()),
      fetch(RAW + 'card-tags.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null)
    ]);
    STATS = {}; (st.cards || []).forEach(c => STATS[c.jp] = c);
    TAGS = (tg && tg.cards) || {};
    render();
  } catch (e) {
    wrap.innerHTML = '<div class="coming-soon"><div class="big">📡</div>' + _tr('データの取得に失敗しました。時間をおいて再読み込みしてください') + '</div>';
  }
}
window.addEventListener('crlangchange', () => { try { render(); } catch (e) {} });
if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
