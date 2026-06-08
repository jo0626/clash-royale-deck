/**
 * CR Deck Builders – 人気デッキ自動更新 (Google Apps Script)
 * トップ層プレイヤーの currentDeck を集計し、頻度上位デッキを
 * decks.json として GitHub リポジトリへコミットする。
 *
 * ★この版の要点：
 *   - 各カードを実データから「進化(evo) / ヒーロー(hero) / チャンピオン(champ) / 通常(norm)」に分類。
 *       champion : rarity === "champion"
 *       evo      : evolutionLevel>0 かつ iconUrls.evolutionMedium あり
 *       hero     : evolutionLevel>0 かつ iconUrls.heroMedium のみ（evolutionMedium なし）
 *     ＝ 進化とヒーローは同じ特殊枠の取り合い。プレイヤーが実際に使った形が出る。
 *   - デッキごとに各カードの形を多数決で確定し、特殊カードを前に並べて
 *     slots[] と forms[]（各スロットの形）を出力。サイトはこの forms 通りに絵柄を表示。
 *   - 取得失敗したプレイヤーを1回リトライして母数を1000に近づける。
 *
 * ★★ 追記（カードメタ／急上昇）：追加APIリクエストなしで、既存集計から
 *   - trending[] … 前回スナップショット比でデッキ使用が伸びたもの（急上昇）
 *   - cards[]    … カード単体の使用率(pop由来)・勝率(win由来)を「3日ローリング」で集計
 *   履歴は cardhist.json としてリポジトリに保存（更新ごとに最古を捨てて巡回）。
 *
 * スクリプトのプロパティ:
 *   CR_TOKEN, GITHUB_TOKEN, GITHUB_REPO("owner/repo"),
 *   GITHUB_PATH("decks.json"), GITHUB_BRANCH("main"),
 *   TOP_PLAYERS("1000"), TOP_DECKS("50"), INTERVAL_HOURS("12")
 */

var PROXY = 'https://proxy.royaleapi.dev/v1';
var WINDOW_DAYS = 3; // カード集計のローリング期間（日）

var SLUG2JP = {
  "skeletons": "スケルトン", "ice-spirit": "アイススピリット", "fire-spirit": "ファイアスピリット",
  "electro-spirit": "エレクトロスピリット", "heal-spirit": "ヒールスピリット", "goblins": "ゴブリン",
  "bomber": "ボンバー", "spear-goblins": "槍ゴブリン", "bats": "コウモリの群れ", "ice-golem": "アイスゴーレム",
  "wall-breakers": "ウォールブレイカー", "berserker": "バーサーカー", "zap": "ザップ", "giant-snowball": "巨大雪玉",
  "barbarian-barrel": "ローリングバーバリアン", "the-log": "ローリングウッド", "rage": "レイジ",
  "suspicious-bush": "ステルスブッシュ", "goblin-curse": "ゴブリンの呪い", "knight": "ナイト", "archers": "アーチャー",
  "minions": "ガーゴイル", "goblin-gang": "ゴブリンギャング", "skeleton-barrel": "スケルトンバレル",
  "firecracker": "ロケット砲士", "mega-minion": "メガガーゴイル", "dart-goblin": "吹き矢ゴブリン",
  "elixir-golem": "エリクサーゴーレム", "ice-wizard": "アイスウィザード", "princess": "プリンセス", "miner": "ディガー",
  "skeleton-army": "スケルトン部隊", "guards": "盾の戦士", "bandit": "アサシン ユーノ", "fisherman": "漁師トリトン",
  "royal-ghost": "ロイヤルゴースト", "arrows": "矢の雨", "tornado": "トルネード", "earthquake": "アースクエイク",
  "royal-delivery": "ロイヤルデリバリー", "goblin-barrel": "ゴブリンバレル", "clone": "クローン", "vines": "ヴァイン",
  "void": "ボイド", "mirror": "ミラー", "cannon": "大砲", "tombstone": "墓石", "valkyrie": "バルキリー",
  "musketeer": "マスケット銃士", "mini-pekka": "ミニペッカ", "hog-rider": "ホグライダー", "battle-ram": "攻城バーバリアン",
  "skeleton-dragons": "スケルトンドラゴン", "zappies": "ザッピー", "flying-machine": "ホバリング砲",
  "battle-healer": "バトルヒーラー", "goblin-demolisher": "ダイナマイトゴブリン", "dark-prince": "ダークプリンス",
  "hunter": "ハンター", "baby-dragon": "ベビードラゴン", "electro-wizard": "エレクトロウィザード",
  "inferno-dragon": "インフェルノドラゴン", "lumberjack": "ランバージャック", "magic-archer": "マジックアーチャー",
  "mother-witch": "マザーネクロマンサー", "night-witch": "ダークネクロ", "golden-knight": "ゴールドナイト",
  "skeleton-king": "スケルトンキング", "mighty-miner": "マイティディガー", "phoenix": "フェニックス",
  "rune-giant": "鍛冶屋ジャイアント", "fireball": "ファイアボール", "freeze": "フリーズ", "poison": "ポイズン",
  "goblin-cage": "ゴブリンの檻", "goblin-drill": "ゴブリンドリル", "goblin-hut": "ゴブリンの小屋",
  "bomb-tower": "ボムタワー", "tesla": "テスラ", "mortar": "迫撃砲", "furnace": "オーブン", "barbarians": "バーバリアン",
  "minion-horde": "ガーゴイルの群れ", "giant": "ジャイアント", "wizard": "ウィザード", "balloon": "エアバルーン",
  "witch": "ネクロマンサー", "bowler": "ボウラー", "executioner": "執行人ファルチェ", "cannon-cart": "60式ムート",
  "royal-hogs": "ロイヤルホグ", "rascals": "アウトロー", "electro-dragon": "ライトニングドラゴン", "prince": "プリンス",
  "ram-rider": "ラムライダー", "little-prince": "リトルプリンス", "monk": "モンク", "goblinstein": "ゴブリンシュタイン",
  "boss-bandit": "ボスアサシン", "archer-queen": "アーチャークイーン", "goblin-machine": "ゴブリンマシン",
  "graveyard": "スケルトンラッシュ", "inferno-tower": "インフェルノタワー", "royal-giant": "ロイヤルジャイアント",
  "elite-barbarians": "エリートバーバリアン", "giant-skeleton": "巨大スケルトン", "goblin-giant": "ゴブジャイアント",
  "sparky": "スパーキー", "spirit-empress": "スピリットエンプレス", "rocket": "ロケット", "lightning": "ライトニング",
  "elixir-collector": "エリクサーポンプ", "barbarian-hut": "バーバリアンの小屋", "x-bow": "巨大クロスボウ",
  "pekka": "ペッカ", "lava-hound": "ラヴァハウンド", "electro-giant": "エレクトロジャイアント", "mega-knight": "メガナイト",
  "royal-recruits": "見習い親衛隊", "golem": "ゴーレム", "three-musketeers": "三銃士"
};

var COST = {
  "スケルトン": 1, "アイススピリット": 1, "ファイアスピリット": 1, "エレクトロスピリット": 1, "ヒールスピリット": 1,
  "ゴブリン": 2, "ボンバー": 2, "槍ゴブリン": 2, "コウモリの群れ": 2, "アイスゴーレム": 2, "ウォールブレイカー": 2,
  "バーサーカー": 2, "ザップ": 2, "巨大雪玉": 2, "ローリングバーバリアン": 2, "ローリングウッド": 2, "レイジ": 2,
  "ステルスブッシュ": 2, "ゴブリンの呪い": 2, "ナイト": 3, "アーチャー": 3, "ガーゴイル": 3, "ゴブリンギャング": 3,
  "スケルトンバレル": 3, "ロケット砲士": 3, "メガガーゴイル": 3, "吹き矢ゴブリン": 3, "エリクサーゴーレム": 3,
  "アイスウィザード": 3, "プリンセス": 3, "ディガー": 3, "スケルトン部隊": 3, "盾の戦士": 3, "アサシン ユーノ": 3,
  "漁師トリトン": 3, "ロイヤルゴースト": 3, "矢の雨": 3, "トルネード": 3, "アースクエイク": 3, "ロイヤルデリバリー": 3,
  "ゴブリンバレル": 3, "クローン": 3, "ヴァイン": 3, "ボイド": 3, "ミラー": 1, "大砲": 3, "墓石": 3,
  "バルキリー": 4, "マスケット銃士": 4, "ミニペッカ": 4, "ホグライダー": 4, "攻城バーバリアン": 4, "スケルトンドラゴン": 4,
  "ザッピー": 4, "ホバリング砲": 4, "バトルヒーラー": 4, "ダイナマイトゴブリン": 4, "ダークプリンス": 4, "ハンター": 4,
  "ベビードラゴン": 4, "エレクトロウィザード": 4, "インフェルノドラゴン": 4, "ランバージャック": 4, "マジックアーチャー": 4,
  "マザーネクロマンサー": 4, "ダークネクロ": 4, "ゴールドナイト": 4, "スケルトンキング": 4, "マイティディガー": 4,
  "フェニックス": 4, "鍛冶屋ジャイアント": 4, "ファイアボール": 4, "フリーズ": 4, "ポイズン": 4, "ゴブリンの檻": 4,
  "ゴブリンドリル": 4, "ゴブリンの小屋": 4, "ボムタワー": 4, "テスラ": 4, "迫撃砲": 4, "オーブン": 4,
  "バーバリアン": 5, "ガーゴイルの群れ": 5, "ジャイアント": 5, "ウィザード": 5, "エアバルーン": 5, "ネクロマンサー": 5,
  "ボウラー": 5, "執行人ファルチェ": 5, "60式ムート": 5, "ロイヤルホグ": 5, "アウトロー": 5, "ライトニングドラゴン": 5,
  "プリンス": 5, "ラムライダー": 5, "リトルプリンス": 3, "モンク": 5, "ゴブリンシュタイン": 5, "ボスアサシン": 6,
  "アーチャークイーン": 5, "ゴブリンマシン": 5, "スケルトンラッシュ": 5, "インフェルノタワー": 5, "ロイヤルジャイアント": 6,
  "エリートバーバリアン": 6, "巨大スケルトン": 6, "ゴブジャイアント": 6, "スパーキー": 6, "スピリットエンプレス": 6,
  "ロケット": 6, "ライトニング": 6, "エリクサーポンプ": 6, "バーバリアンの小屋": 6, "巨大クロスボウ": 6,
  "ペッカ": 7, "ラヴァハウンド": 7, "エレクトロジャイアント": 7, "メガナイト": 7, "見習い親衛隊": 7, "ゴーレム": 8, "三銃士": 9
};

function prop(k, def) {
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === '') ? (def === undefined ? null : def) : v;
}

function normSlug(name) {
  return String(name).toLowerCase()
    .replace(/\./g, '').replace(/'/g, '').replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function apiCardToJp(card) { return SLUG2JP[normSlug(card.name)] || null; }

// 注意：APIの evolutionLevel は「装備中」ではなく「所持している進化レベル」も含めて
// デッキ内のカードに付く（所持してれば付く）。進化枠は2つなので、
// 1プレイヤー分はデッキ順で先頭2枚の特殊カードだけを装備中とみなし、
// さらに全プレイヤーの多数決で「実際によく装備される2枚」に収束させる（updateDecks内）。

function crGet(path, token) {
  var res = UrlFetchApp.fetch(PROXY + path, {
    method: 'get', headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }, muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('CR API ' + code + ' for ' + path + ' :: ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

function deckNameGuess(slots) {
  var wins = ['ホグライダー', 'ロイヤルジャイアント', 'エアバルーン', '巨大クロスボウ', '迫撃砲', 'ゴーレム', 'ラヴァハウンド', 'ペッカ', 'メガナイト', 'ロイヤルホグ', '三銃士', 'スケルトンラッシュ', 'ディガー', 'ゴブリンドリル'];
  for (var i = 0; i < slots.length; i++) { if (wins.indexOf(slots[i]) >= 0) return slots[i] + ' デッキ'; }
  return 'おすすめデッキ';
}

function updateDecks() {
  var token = (prop('CR_TOKEN') || '').replace(/[^A-Za-z0-9._-]/g, '');
  if (!token) throw new Error('CR_TOKEN 未設定');
  var topN = parseInt(prop('TOP_PLAYERS', '1000'), 10);
  var outN = parseInt(prop('TOP_DECKS', '50'), 10);
  var intervalHours = parseInt(prop('INTERVAL_HOURS', '12'), 10);

  var ranking = crGet('/locations/global/pathoflegend/players?limit=' + topN, token);
  var players = (ranking.items || []).slice(0, topN);
  var headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };

  // ---- バトルログから集計（6分制限回避・失敗は1回リトライ）----
  // ★currentDeckのevolutionLevelは「所持」全部に付くが、バトルログのevolutionLevelは
  //   「その試合で実際に進化/ヒーロー装備したカード」にだけ付く＝本物。
  //   pop(使用率)=各プレイヤーの直前デッキ1個 / win(勝率)=決着した全試合の勝敗。
  var pop = {}, win = {}, unmapped = {}, CHUNK = 40;

  function classifyDeck(cards) {
    var jp = [], fm = [], ok = true;
    cards.forEach(function (c) {
      var name = apiCardToJp(c);
      if (!name) { ok = false; unmapped[c.name] = (unmapped[c.name] || 0) + 1; return; }
      jp.push(name);
      var f = 'norm';
      if (c.rarity === 'champion') f = 'champ';
      else if (c.evolutionLevel && c.evolutionLevel > 0) {
        var iu = c.iconUrls || {};
        var hasEvo = !!iu.evolutionMedium, hasHero = !!iu.heroMedium;
        f = (hasEvo && hasHero) ? 'both' : (hasHero ? 'hero' : 'evo');
      }
      fm.push(f);
    });
    return (ok && jp.length === 8) ? { jp: jp, fm: fm } : null;
  }
  function tally(map, cards, won) {
    var d = classifyDeck(cards);
    if (!d) return false;
    var key = d.jp.slice().sort().join('|');
    var e = map[key] || (map[key] = { count: 0, wins: 0, cards: d.jp, votes: {} });
    e.count++;
    if (won === true) e.wins++;
    d.jp.forEach(function (n, idx) {
      var v = e.votes[n] || (e.votes[n] = { evo: 0, hero: 0, both: 0, champ: 0, norm: 0 });
      v[d.fm[idx]]++;
    });
    return true;
  }
  function isStd(b) {
    return b && b.team && b.team.length === 1 && b.opponent && b.opponent.length === 1
      && b.team[0] && b.team[0].cards && b.team[0].cards.length === 8;
  }
  function evoCnt(cards) { var k = 0; for (var j = 0; j < cards.length; j++) if (cards[j].evolutionLevel > 0) k++; return k; }
  function processLog(battles) {
    if (!battles || !battles.length) return;
    var gotPop = false;
    for (var i = 0; i < battles.length; i++) {
      var b = battles[i];
      if (!isStd(b)) continue;
      var cards = b.team[0].cards;
      if (evoCnt(cards) > 2) continue; // 特殊モード除外（進化3枚以上）
      if (!gotPop) { if (tally(pop, cards, null)) gotPop = true; } // 使用率：直前デッキ1個だけ
      var tc = b.team[0].crowns, oc = b.opponent[0].crowns;       // 勝率：決着試合のみ（引き分け除外）
      if (typeof tc === 'number' && typeof oc === 'number' && tc !== oc) tally(win, cards, tc > oc);
    }
  }
  function fetchTags(tags) {
    var got = [];
    for (var off = 0; off < tags.length; off += CHUNK) {
      var slice = tags.slice(off, off + CHUNK);
      var batch = slice.map(function (t) {
        return { url: PROXY + '/players/' + encodeURIComponent(t) + '/battlelog', method: 'get', headers: headers, muteHttpExceptions: true };
      });
      var resps = UrlFetchApp.fetchAll(batch);
      resps.forEach(function (res, i) {
        if (res.getResponseCode() === 200) { got.push(slice[i]); try { processLog(JSON.parse(res.getContentText())); } catch (e) {} }
      });
      Utilities.sleep(300);
    }
    return got;
  }
  var allTags = players.map(function (p) { return p.tag; });
  var got1 = fetchTags(allTags);
  var miss = allTags.filter(function (t) { return got1.indexOf(t) < 0; }); // HTTP失敗のみ再取得（二重集計防止）
  if (miss.length) { Utilities.sleep(1200); fetchTags(miss); }

  var aggregated = Object.keys(pop).reduce(function (s, k) { return s + pop[k].count; }, 0);
  var winBattles = Object.keys(win).reduce(function (s, k) { return s + win[k].count; }, 0);
  Logger.log('ranking ' + players.length + ' / players(pop) ' + aggregated + ' / win-battles ' + winBattles + ' / unmapped ' + JSON.stringify(unmapped));

  // ---- デッキ確定（形＋ゲームと同じスロット配置）。pop/win共通 ----
  //   index0(1枚目)=進化のみ / index1(2枚目)=チャンピオンorヒーロー / index2(3枚目)=進化orチャンピオンorヒーロー
  function finalizeDeck(r) {
    var champName = null, champBest = 0;
    r.cards.forEach(function (n) { var c = (r.votes[n] || {}).champ || 0; if (c > champBest) { champBest = c; champName = n; } });
    var thr = Math.max(1, r.count * 0.25); // 上位2枚かつ25%以上が特殊装備（下限1＝低サンプルの急上昇でも進化/ヒーローを拾う。count≧8の人気デッキは影響なし）
    var scored = r.cards.map(function (n) {
      var v = r.votes[n] || {};
      return { n: n, score: (v.evo || 0) + (v.hero || 0) + (v.both || 0), e: (v.evo || 0), h: (v.hero || 0) };
    }).filter(function (x) { return x.n !== champName && x.score >= thr; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var picked = scored.slice(0, 2);
    var cardForm = {};
    r.cards.forEach(function (n) { cardForm[n] = 'norm'; });
    if (champName) cardForm[champName] = 'champ';
    picked.forEach(function (x) { cardForm[x.n] = (x.e > x.h) ? 'evo' : 'hero'; }); // 同数/判定不可はヒーロー優先
    var groups = { evo: [], hero: [], champ: [], norm: [] };
    r.cards.forEach(function (n) { groups[cardForm[n] || 'norm'].push(n); });
    groups.norm.sort(function (a, b) { return (COST[a] || 0) - (COST[b] || 0); });
    var slots8 = [null, null, null, null, null, null, null, null];
    var evos = groups.evo.slice(), mids = groups.champ.concat(groups.hero);
    if (evos.length) slots8[0] = evos.shift();
    if (evos.length) slots8[2] = evos.shift();
    [1, 2].forEach(function (idx) { if (slots8[idx] === null && mids.length) slots8[idx] = mids.shift(); });
    var rest = groups.norm.concat(evos, mids);
    rest.sort(function (a, b) { return (COST[a] || 0) - (COST[b] || 0); });
    for (var k = 0; k < 8; k++) if (slots8[k] === null) slots8[k] = rest.shift();
    return { name: deckNameGuess(slots8), slots: slots8, forms: slots8.map(function (n) { return cardForm[n] || 'norm'; }) };
  }

  // 使用率：人数の多い順
  var popDecks = Object.keys(pop).map(function (k) { return pop[k]; })
    .sort(function (a, b) { return b.count - a.count; }).slice(0, outN)
    .map(function (r) { var d = finalizeDeck(r); d.count = r.count; return d; });

  // 勝率：最低試合数以上で勝率の高い順（同率は試合数）。統計的にそのまま使えば勝率が良い順。
  var winMin = parseInt(prop('WIN_MIN_GAMES', '30'), 10);
  var winDecks = Object.keys(win).map(function (k) { return win[k]; })
    .filter(function (r) { return r.count >= winMin; })
    .sort(function (a, b) { var wa = a.wins / a.count, wb = b.wins / b.count; return (wb - wa) || (b.count - a.count); }).slice(0, outN)
    .map(function (r) { var d = finalizeDeck(r); d.games = r.count; d.wins = r.wins; d.winRate = Math.round(r.wins / r.count * 1000) / 10; return d; });

  Logger.log('popDecks ' + popDecks.length + ' / winDecks ' + winDecks.length + ' (winMin ' + winMin + ')');
  if (!popDecks.length) throw new Error('集計0件 unmapped=' + JSON.stringify(unmapped));

  // ===== ここから追記：カード単体（使用率/勝率）＋ 急上昇：3日ローリング =====
  // 追加のAPIリクエストはなし。既存の pop / win 集計からカード単位を導出する。
  var now = Date.now();
  var ghPath = prop('GITHUB_PATH', 'decks.json');
  var histPath = ghSiblingPath_(ghPath, 'cardhist.json');

  // カード使用率の素：直前デッキ(pop)にそのカードを入れている人数
  var useNow = {};
  Object.keys(pop).forEach(function (k) {
    var r = pop[k];
    r.cards.forEach(function (n) { useNow[n] = (useNow[n] || 0) + r.count; });
  });
  // カード勝率の素：決着した全試合(win)での出現数・勝ち数
  var batNow = {};
  Object.keys(win).forEach(function (k) {
    var r = win[k];
    r.cards.forEach(function (n) {
      if (!batNow[n]) batNow[n] = [0, 0];
      batNow[n][0] += r.count; batNow[n][1] += r.wins;
    });
  });
  // デッキ使用数のスナップショット（急上昇の差分用）。多い順に200種まで。
  var deckSig = {};
  Object.keys(pop).sort(function (a, b) { return pop[b].count - pop[a].count; }).slice(0, 200)
    .forEach(function (k) { deckSig[k] = pop[k].count; });

  // 履歴に今回ぶんを追加し、3日より古いスナップショットを捨てる
  var hist = ghReadJson_(histPath) || { snaps: [] };
  hist.snaps.push({ t: now, players: aggregated, use: useNow, bat: batNow, decks: deckSig });
  hist.snaps = hist.snaps.filter(function (s) { return s.t >= now - WINDOW_DAYS * 864e5; });

  // カード単体（窓内：使用率は採用率の平均、勝率は合算）
  var cards = aggregateCards_(hist.snaps);

  // 急上昇：今回の pop と「前回スナップショット」の差分（正の伸びだけ）
  var prevSnap = hist.snaps.length >= 2 ? hist.snaps[hist.snaps.length - 2] : null;
  var trending = [];
  if (prevSnap && prevSnap.decks) {
    Object.keys(pop).forEach(function (k) {
      var delta = pop[k].count - (prevSnap.decks[k] || 0);
      if (delta > 0) {
        var d = finalizeDeck(pop[k]);
        trending.push({ name: d.name, slots: d.slots, forms: d.forms, count: pop[k].count, delta: delta });
      }
    });
    trending.sort(function (a, b) { return b.delta - a.delta || b.count - a.count; });
    trending = trending.slice(0, 15);
  }
  Logger.log('cards ' + cards.length + ' / trending ' + trending.length + ' / snaps ' + hist.snaps.length);
  // ===== 追記ここまで =====

  commitToGithub({
    updated: new Date().toISOString(),
    players: aggregated,
    topPlayers: players.length,
    intervalHours: intervalHours,
    cardsWindowDays: WINDOW_DAYS,
    decks: popDecks,
    winDecks: winDecks,
    trending: trending,
    cards: cards
  });
  ghWriteJson_(histPath, hist); // 履歴を更新（別ファイル）
}

// 窓内のスナップショットからカード単体を集計
//   use  : 各スナップの採用率(人数/母数)を平均して % に
//   win  : 窓内の出現数・勝ち数を合算して勝率 %（比率なので重複の影響を受けにくい）
function aggregateCards_(snaps) {
  var keys = {}, n = snaps.length || 1;
  snaps.forEach(function (s) {
    Object.keys(s.use || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(s.bat || {}).forEach(function (k) { keys[k] = 1; });
  });
  var out = [];
  Object.keys(keys).forEach(function (name) {
    var useSum = 0, g = 0, w = 0;
    snaps.forEach(function (s) {
      var pl = s.players || 0;
      if (pl > 0 && s.use && s.use[name]) useSum += s.use[name] / pl;
      if (s.bat && s.bat[name]) { g += s.bat[name][0]; w += s.bat[name][1]; }
    });
    var use = Math.round(useSum / n * 1000) / 10;
    var winr = g > 0 ? Math.round(w / g * 1000) / 10 : null;
    if (use > 0 || g > 0) out.push({ name: name, use: use, win: winr, games: g });
  });
  return out;
}

// GITHUB_PATH と同じディレクトリの別ファイルパスを作る（例: decks.json → cardhist.json）
function ghSiblingPath_(mainPath, name) {
  var i = mainPath.lastIndexOf('/');
  return (i >= 0 ? mainPath.slice(0, i + 1) : '') + name;
}

function ghReadJson_(path) {
  var ghToken = prop('GITHUB_TOKEN'), repo = prop('GITHUB_REPO'), branch = prop('GITHUB_BRANCH', 'main');
  if (!ghToken || !repo) return null;
  var headers = { Authorization: 'token ' + ghToken, Accept: 'application/vnd.github+json' };
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/contents/' + path + '?ref=' + branch,
    { method: 'get', headers: headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  try {
    var j = JSON.parse(res.getContentText());
    return JSON.parse(Utilities.newBlob(Utilities.base64Decode(j.content)).getDataAsString('UTF-8'));
  } catch (e) { return null; }
}

function ghWriteJson_(path, obj) {
  var ghToken = prop('GITHUB_TOKEN'), repo = prop('GITHUB_REPO'), branch = prop('GITHUB_BRANCH', 'main');
  if (!ghToken || !repo) throw new Error('GITHUB_TOKEN / GITHUB_REPO 未設定');
  var headers = { Authorization: 'token ' + ghToken, Accept: 'application/vnd.github+json' };
  var api = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var sha = null;
  var cur = UrlFetchApp.fetch(api + '?ref=' + branch, { method: 'get', headers: headers, muteHttpExceptions: true });
  if (cur.getResponseCode() === 200) sha = JSON.parse(cur.getContentText()).sha;
  var content = Utilities.base64Encode(Utilities.newBlob(JSON.stringify(obj)).getBytes());
  var body = { message: 'chore: update ' + path, content: content, branch: branch };
  if (sha) body.sha = sha;
  var put = UrlFetchApp.fetch(api, {
    method: 'put', headers: headers, contentType: 'application/json',
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = put.getResponseCode();
  if (code !== 200 && code !== 201) throw new Error('GitHub write ' + path + ' ' + code + ' :: ' + put.getContentText().slice(0, 200));
}

function commitToGithub(payload) {
  var ghToken = prop('GITHUB_TOKEN');
  var repo = prop('GITHUB_REPO');
  var path = prop('GITHUB_PATH', 'decks.json');
  var branch = prop('GITHUB_BRANCH', 'main');
  if (!ghToken || !repo) throw new Error('GITHUB_TOKEN / GITHUB_REPO 未設定');

  var api = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var headers = { Authorization: 'token ' + ghToken, Accept: 'application/vnd.github+json' };

  var sha = null;
  var cur = UrlFetchApp.fetch(api + '?ref=' + branch, { method: 'get', headers: headers, muteHttpExceptions: true });
  if (cur.getResponseCode() === 200) sha = JSON.parse(cur.getContentText()).sha;

  var content = Utilities.base64Encode(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  var body = { message: 'chore: update decks.json', content: content, branch: branch };
  if (sha) body.sha = sha;

  var put = UrlFetchApp.fetch(api, {
    method: 'put', headers: headers, contentType: 'application/json',
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = put.getResponseCode();
  if (code !== 200 && code !== 201) throw new Error('GitHub commit ' + code + ' :: ' + put.getContentText().slice(0, 300));
}

function createTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'updateDecks') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('updateDecks').timeBased().everyHours(12).create();
}
