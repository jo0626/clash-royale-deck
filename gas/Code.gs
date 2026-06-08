/**
 * CR Deck Builders – 集計GAS（currentDeck ＋ battlelog → decks.json）
 *
 * 出力（decks.json）:
 *   decks[]    使用率デッキ（currentDeck頻度）          {name,sub,slots,count,evo}
 *   winDecks[] 勝率デッキ（battlelogから算出）          {name,slots,winRate,games,evo}
 *   trending[] 急上昇デッキ（前回スナップショット比の伸び）{name,slots,count,delta,evo}
 *   cards[]    カード単体（3日ローリング集計）           {name,use,win,games}
 *   players,topPlayers,intervalHours,updated,cardsWindowDays
 *
 * 履歴は cardhist.json としてリポジトリにコミット（3日ぶんのスナップショットを巡回保存）。
 *
 * スクリプトプロパティ（プロジェクトの設定 → スクリプト プロパティ）:
 *   CR_TOKEN, GITHUB_TOKEN, GITHUB_REPO(owner/repo), GITHUB_PATH(例: decks.json), GITHUB_BRANCH(例: main)
 *
 * トリガー: main を 6 時間おき。
 */

var PROXY = 'https://proxy.royaleapi.dev/v1';
var TOP_N = 120;          // 集計する世界上位プレイヤー数（増やすほどAPIリクエスト増）
var INTERVAL_HOURS = 6;   // トリガー間隔（表示用）
var WINDOW_DAYS = 3;      // カード集計のローリング期間
var DECK_WIN_MIN = 15;    // デッキ勝率の最低対戦数
var MAX_SNAP_DECKS = 200; // スナップショットに残すデッキ種類の上限

var SLUG2JP = {
  "archer-queen":"アーチャークイーン",
  "archers":"アーチャー",
  "arrows":"矢の雨",
  "baby-dragon":"ベビードラゴン",
  "balloon":"エアバルーン",
  "bandit":"アサシン ユーノ",
  "barbarian-barrel":"ローリングバーバリアン",
  "barbarian-hut":"バーバリアンの小屋",
  "barbarians":"バーバリアン",
  "bats":"コウモリの群れ",
  "battle-healer":"バトルヒーラー",
  "battle-ram":"攻城バーバリアン",
  "berserker":"バーサーカー",
  "bomb-tower":"ボムタワー",
  "bomber":"ボンバー",
  "boss-bandit":"ボスアサシン",
  "bowler":"ボウラー",
  "cannon":"大砲",
  "cannon-cart":"60式ムート",
  "clone":"クローン",
  "dark-prince":"ダークプリンス",
  "dart-goblin":"吹き矢ゴブリン",
  "earthquake":"アースクエイク",
  "electro-dragon":"ライトニングドラゴン",
  "electro-giant":"エレクトロジャイアント",
  "electro-spirit":"エレクトロスピリット",
  "electro-wizard":"エレクトロウィザード",
  "elite-barbarians":"エリートバーバリアン",
  "elixir-collector":"エリクサーポンプ",
  "elixir-golem":"エリクサーゴーレム",
  "executioner":"執行人ファルチェ",
  "fire-spirit":"ファイアスピリット",
  "fireball":"ファイアボール",
  "firecracker":"ロケット砲士",
  "fisherman":"漁師トリトン",
  "flying-machine":"ホバリング砲",
  "freeze":"フリーズ",
  "furnace":"オーブン",
  "giant":"ジャイアント",
  "giant-skeleton":"巨大スケルトン",
  "giant-snowball":"巨大雪玉",
  "goblin-barrel":"ゴブリンバレル",
  "goblin-cage":"ゴブリンの檻",
  "goblin-curse":"ゴブリンの呪い",
  "goblin-demolisher":"ダイナマイトゴブリン",
  "goblin-drill":"ゴブリンドリル",
  "goblin-gang":"ゴブリンギャング",
  "goblin-giant":"ゴブジャイアント",
  "goblin-hut":"ゴブリンの小屋",
  "goblin-machine":"ゴブリンマシン",
  "goblins":"ゴブリン",
  "goblinstein":"ゴブリンシュタイン",
  "golden-knight":"ゴールドナイト",
  "golem":"ゴーレム",
  "graveyard":"スケルトンラッシュ",
  "guards":"盾の戦士",
  "heal-spirit":"ヒールスピリット",
  "hog-rider":"ホグライダー",
  "hunter":"ハンター",
  "ice-golem":"アイスゴーレム",
  "ice-spirit":"アイススピリット",
  "ice-wizard":"アイスウィザード",
  "inferno-dragon":"インフェルノドラゴン",
  "inferno-tower":"インフェルノタワー",
  "knight":"ナイト",
  "lava-hound":"ラヴァハウンド",
  "lightning":"ライトニング",
  "little-prince":"リトルプリンス",
  "lumberjack":"ランバージャック",
  "magic-archer":"マジックアーチャー",
  "mega-knight":"メガナイト",
  "mega-minion":"メガガーゴイル",
  "mighty-miner":"マイティディガー",
  "miner":"ディガー",
  "mini-pekka":"ミニペッカ",
  "minion-horde":"ガーゴイルの群れ",
  "minions":"ガーゴイル",
  "mirror":"ミラー",
  "monk":"モンク",
  "mortar":"迫撃砲",
  "mother-witch":"マザーネクロマンサー",
  "musketeer":"マスケット銃士",
  "night-witch":"ダークネクロ",
  "pekka":"ペッカ",
  "phoenix":"フェニックス",
  "poison":"ポイズン",
  "prince":"プリンス",
  "princess":"プリンセス",
  "rage":"レイジ",
  "ram-rider":"ラムライダー",
  "rascals":"アウトロー",
  "rocket":"ロケット",
  "royal-delivery":"ロイヤルデリバリー",
  "royal-ghost":"ロイヤルゴースト",
  "royal-giant":"ロイヤルジャイアント",
  "royal-hogs":"ロイヤルホグ",
  "royal-recruits":"見習い親衛隊",
  "rune-giant":"鍛冶屋ジャイアント",
  "skeleton-army":"スケルトン部隊",
  "skeleton-barrel":"スケルトンバレル",
  "skeleton-dragons":"スケルトンドラゴン",
  "skeleton-king":"スケルトンキング",
  "skeletons":"スケルトン",
  "sparky":"スパーキー",
  "spear-goblins":"槍ゴブリン",
  "spirit-empress":"スピリットエンプレス",
  "suspicious-bush":"ステルスブッシュ",
  "tesla":"テスラ",
  "the-log":"ローリングウッド",
  "three-musketeers":"三銃士",
  "tombstone":"墓石",
  "tornado":"トルネード",
  "valkyrie":"バルキリー",
  "vines":"ヴァイン",
  "void":"ボイド",
  "wall-breakers":"ウォールブレイカー",
  "witch":"ネクロマンサー",
  "wizard":"ウィザード",
  "x-bow":"巨大クロスボウ",
  "zap":"ザップ",
  "zappies":"ザッピー"
};
var COST = {"archer-queen":5,"archers":3,"arrows":3,"baby-dragon":4,"balloon":5,"bandit":3,"barbarian-barrel":2,"barbarian-hut":6,"barbarians":5,"bats":2,"battle-healer":4,"battle-ram":4,"berserker":2,"bomb-tower":4,"bomber":2,"boss-bandit":6,"bowler":5,"cannon":3,"cannon-cart":5,"clone":3,"dark-prince":4,"dart-goblin":3,"earthquake":3,"electro-dragon":5,"electro-giant":7,"electro-spirit":1,"electro-wizard":4,"elite-barbarians":6,"elixir-collector":6,"elixir-golem":3,"executioner":5,"fire-spirit":1,"fireball":4,"firecracker":3,"fisherman":3,"flying-machine":4,"freeze":4,"furnace":4,"giant":5,"giant-skeleton":6,"giant-snowball":2,"goblin-barrel":3,"goblin-cage":4,"goblin-curse":2,"goblin-demolisher":4,"goblin-drill":4,"goblin-gang":3,"goblin-giant":6,"goblin-hut":4,"goblin-machine":5,"goblins":2,"goblinstein":5,"golden-knight":4,"golem":8,"graveyard":5,"guards":3,"heal-spirit":1,"hog-rider":4,"hunter":4,"ice-golem":2,"ice-spirit":1,"ice-wizard":3,"inferno-dragon":4,"inferno-tower":5,"knight":3,"lava-hound":7,"lightning":6,"little-prince":3,"lumberjack":4,"magic-archer":4,"mega-knight":7,"mega-minion":3,"mighty-miner":4,"miner":3,"mini-pekka":4,"minion-horde":5,"minions":3,"mirror":1,"monk":5,"mortar":4,"mother-witch":4,"musketeer":4,"night-witch":4,"pekka":7,"phoenix":4,"poison":4,"prince":5,"princess":3,"rage":2,"ram-rider":5,"rascals":5,"rocket":6,"royal-delivery":3,"royal-ghost":3,"royal-giant":6,"royal-hogs":5,"royal-recruits":7,"rune-giant":4,"skeleton-army":3,"skeleton-barrel":3,"skeleton-dragons":4,"skeleton-king":4,"skeletons":1,"sparky":6,"spear-goblins":2,"spirit-empress":6,"suspicious-bush":2,"tesla":4,"the-log":2,"three-musketeers":9,"tombstone":3,"tornado":3,"valkyrie":4,"vines":3,"void":3,"wall-breakers":2,"witch":5,"wizard":5,"x-bow":6,"zap":2,"zappies":4};

/* ============ エントリ ============ */
function main() {
  var props = PropertiesService.getScriptProperties();
  var token = clean_(props.getProperty('CR_TOKEN'));
  if (!token) throw new Error('CR_TOKEN 未設定');

  var tags = topPlayerTags_(token, TOP_N);
  var now = Date.now();

  var hist = ghReadJson_(histPath_()) || { snaps: [], lastRun: 0 };
  var lastRun = Number(hist.lastRun || 0);

  var useNow = {};   // slug -> 現在その構築を使っている人数
  var deckUse = {};  // sig  -> { count, slugs[], evo[] }
  var bat = {};      // slug -> [games, wins]（今回の新規バトルのみ）
  var deckBat = {};  // sig  -> { g, w, slugs[], evo[] }

  tags.forEach(function (tag) {
    var p = crGet_(PROXY + '/players/' + encodeURIComponent(tag), token);
    if (p && p.currentDeck && p.currentDeck.length) tallyCurrentDeck_(p.currentDeck, useNow, deckUse);
    var bl = crGet_(PROXY + '/players/' + encodeURIComponent(tag) + '/battlelog', token);
    if (bl && bl.length) tallyBattles_(bl, lastRun, bat, deckBat);
    Utilities.sleep(40);
  });

  var players = tags.length;

  // --- スナップショットを追加 → 3日より古いものを捨てる ---
  var snap = { t: now, players: players, use: useNow, bat: bat, decks: compactDecks_(deckUse, MAX_SNAP_DECKS) };
  hist.snaps.push(snap);
  var cutoff = now - WINDOW_DAYS * 24 * 3600 * 1000;
  hist.snaps = hist.snaps.filter(function (s) { return s.t >= cutoff; });

  // --- 集計 ---
  var cards = aggregateCards_(hist.snaps);
  var prevSnap = hist.snaps.length >= 2 ? hist.snaps[hist.snaps.length - 2] : null;
  var trending = trendingDecks_(deckUse, prevSnap, 15);
  var decks = topUsageDecks_(deckUse, players, 30);
  var winDecks = topWinDecks_(deckBat, DECK_WIN_MIN, 30);

  var out = {
    updated: new Date().toISOString(),
    intervalHours: INTERVAL_HOURS,
    topPlayers: TOP_N,
    players: players,
    cardsWindowDays: WINDOW_DAYS,
    decks: decks,
    winDecks: winDecks,
    trending: trending,
    cards: cards
  };

  ghWriteJson_(mainPath_(), out);
  hist.lastRun = now;
  ghWriteJson_(histPath_(), hist);
}

/* ============ 集計ロジック ============ */
function tallyCurrentDeck_(deck, useNow, deckUse) {
  var slugs = [], evo = [];
  deck.forEach(function (c) {
    var s = slugify_(c.name);
    slugs.push(s);
    if (c.evolutionLevel && c.evolutionLevel > 0) evo.push(s);
    useNow[s] = (useNow[s] || 0) + 1;
  });
  if (slugs.length !== 8) return;
  var sig = slugs.slice().sort().join(',');
  if (!deckUse[sig]) deckUse[sig] = { count: 0, slugs: slugs, evo: evo };
  deckUse[sig].count++;
}

function tallyBattles_(bl, lastRun, bat, deckBat) {
  bl.forEach(function (b) {
    var t = parseBattleTime_(b.battleTime);
    if (t <= lastRun) return;                 // 既集計ぶんは飛ばす（重複防止）
    if (!b.team || b.team.length !== 1) return; // 1v1のみ
    var me = b.team[0], opp = (b.opponent && b.opponent[0]) || null;
    if (!me || !me.cards || me.cards.length !== 8 || !opp) return;
    var win = (me.crowns || 0) > (opp.crowns || 0) ? 1 : 0;
    var slugs = [], evo = [];
    me.cards.forEach(function (c) {
      var s = slugify_(c.name); slugs.push(s);
      if (c.evolutionLevel && c.evolutionLevel > 0) evo.push(s);
      if (!bat[s]) bat[s] = [0, 0];
      bat[s][0]++; if (win) bat[s][1]++;
    });
    var sig = slugs.slice().sort().join(',');
    if (!deckBat[sig]) deckBat[sig] = { g: 0, w: 0, slugs: slugs, evo: evo };
    deckBat[sig].g++; deckBat[sig].w += win;
  });
}

function aggregateCards_(snaps) {
  var slugs = {};
  snaps.forEach(function (s) {
    Object.keys(s.use || {}).forEach(function (k) { slugs[k] = 1; });
    Object.keys(s.bat || {}).forEach(function (k) { slugs[k] = 1; });
  });
  var n = snaps.length || 1;
  var out = [];
  Object.keys(slugs).forEach(function (slug) {
    var useSum = 0, games = 0, wins = 0;
    snaps.forEach(function (s) {
      var pl = s.players || 0;
      if (pl > 0 && s.use && s.use[slug]) useSum += s.use[slug] / pl;
      if (s.bat && s.bat[slug]) { games += s.bat[slug][0]; wins += s.bat[slug][1]; }
    });
    var use = r1_(useSum / n * 100);
    var win = games > 0 ? r1_(wins / games * 100) : null;
    if (use > 0 || games > 0) out.push({ name: jp_(slug), use: use, win: win, games: games });
  });
  return out;
}

function trendingDecks_(deckUse, prevSnap, limit) {
  if (!prevSnap || !prevSnap.decks) return [];   // 初回は出さない（フロントがサンプル表示）
  var prev = prevSnap.decks;
  var arr = [];
  Object.keys(deckUse).forEach(function (sig) {
    var cur = deckUse[sig].count;
    var was = (prev[sig] && prev[sig].c) || 0;
    var delta = cur - was;
    if (delta > 0) arr.push({ name: deckName_(deckUse[sig].slugs), slots: jpArr_(deckUse[sig].slugs), evo: jpArr_(deckUse[sig].evo), count: cur, delta: delta });
  });
  arr.sort(function (a, b) { return b.delta - a.delta || b.count - a.count; });
  return arr.slice(0, limit);
}

function topUsageDecks_(deckUse, players, limit) {
  var arr = Object.keys(deckUse).map(function (sig) {
    var d = deckUse[sig];
    return { name: deckName_(d.slugs), sub: 'トップ層で使用 ' + d.count + '人', slots: jpArr_(d.slugs), evo: jpArr_(d.evo), count: d.count };
  });
  arr.sort(function (a, b) { return b.count - a.count; });
  return arr.slice(0, limit);
}

function topWinDecks_(deckBat, minGames, limit) {
  var arr = [];
  Object.keys(deckBat).forEach(function (sig) {
    var d = deckBat[sig];
    if (d.g < minGames) return;
    arr.push({ name: deckName_(d.slugs), slots: jpArr_(d.slugs), evo: jpArr_(d.evo), winRate: r1_(d.w / d.g * 100), games: d.g });
  });
  arr.sort(function (a, b) { return b.winRate - a.winRate || b.games - a.games; });
  return arr.slice(0, limit);
}

function compactDecks_(deckUse, max) {
  var sigs = Object.keys(deckUse).sort(function (a, b) { return deckUse[b].count - deckUse[a].count; }).slice(0, max);
  var o = {};
  sigs.forEach(function (sig) { var d = deckUse[sig]; o[sig] = { c: d.count, slugs: d.slugs, evo: d.evo }; });
  return o;
}

/* ============ API / GitHub ============ */
function topPlayerTags_(token, n) {
  var j = crGet_(PROXY + '/locations/global/pathoflegend/players?limit=' + n, token);
  if (!j || !j.items) return [];
  return j.items.slice(0, n).map(function (it) { return it.tag; }).filter(Boolean);
}

function crGet_(url, token) {
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return null;
  try { return JSON.parse(res.getContentText()); } catch (e) { return null; }
}

function ghReadJson_(path) {
  var p = ghProps_();
  var url = 'https://api.github.com/repos/' + p.repo + '/contents/' + path + '?ref=' + p.branch;
  var res = UrlFetchApp.fetch(url, { method: 'get', headers: ghHeaders_(p.token), muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  try {
    var j = JSON.parse(res.getContentText());
    var txt = Utilities.newBlob(Utilities.base64Decode(j.content)).getDataAsString('UTF-8');
    return JSON.parse(txt);
  } catch (e) { return null; }
}

function ghWriteJson_(path, obj) {
  var p = ghProps_();
  var base = 'https://api.github.com/repos/' + p.repo + '/contents/' + path;
  // 既存のsha取得
  var sha = null;
  var g = UrlFetchApp.fetch(base + '?ref=' + p.branch, { method: 'get', headers: ghHeaders_(p.token), muteHttpExceptions: true });
  if (g.getResponseCode() === 200) { try { sha = JSON.parse(g.getContentText()).sha; } catch (e) {} }
  var payload = {
    message: 'update ' + path + ' ' + new Date().toISOString(),
    content: Utilities.base64Encode(JSON.stringify(obj), Utilities.Charset.UTF_8),
    branch: p.branch
  };
  if (sha) payload.sha = sha;
  var res = UrlFetchApp.fetch(base, { method: 'put', headers: ghHeaders_(p.token), contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  if (res.getResponseCode() >= 300) throw new Error('GitHub write ' + path + ' 失敗: ' + res.getResponseCode() + ' ' + res.getContentText());
}

function ghProps_() {
  var pr = PropertiesService.getScriptProperties();
  return {
    token: pr.getProperty('GITHUB_TOKEN'),
    repo: pr.getProperty('GITHUB_REPO'),
    branch: pr.getProperty('GITHUB_BRANCH') || 'main',
    path: pr.getProperty('GITHUB_PATH') || 'decks.json'
  };
}
function ghHeaders_(token) { return { Authorization: 'token ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'cr-deck-gas' }; }
function mainPath_() { return ghProps_().path; }
function histPath_() { var pth = ghProps_().path; var i = pth.lastIndexOf('/'); return (i >= 0 ? pth.slice(0, i + 1) : '') + 'cardhist.json'; }

/* ============ ユーティリティ ============ */
function slugify_(name) { return String(name || '').toLowerCase().replace(/[.’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function jp_(slug) { return SLUG2JP[slug] || slug; }
function jpArr_(slugs) { return (slugs || []).map(jp_); }
function deckName_(slugs) { var best = null, bc = -1; (slugs || []).forEach(function (s) { var c = COST[s] || 0; if (c > bc) { bc = c; best = s; } }); return (best ? jp_(best) : 'デッキ') + ' デッキ'; }
function r1_(x) { return Math.round(x * 10) / 10; }
function clean_(s) { return String(s || '').replace(/[^A-Za-z0-9._-]/g, ''); }
function parseBattleTime_(s) { var m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/); if (!m) return 0; return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]); }
