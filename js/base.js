/* 第七管区 緊急放送網：共通の道具・架空の固有名詞・設定の保存・闇市相場と配給所の黒板・文面の部品の読み込み。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* 小窓（最前面の小さな窓）：開いている間は画面の本体がそちらの文書へ移るので、両方から探す */
let pipWin = null;
const $ = id => document.getElementById(id) || (pipWin ? pipWin.document.getElementById(id) : null);
/* 「見えていない」：タブが隠れていて、小窓も開いていないとき。音を止める判断に使う */
const unseen = () => document.hidden && !pipWin;
const R = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pad = n => String(n).padStart(2, '0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const soon = (ms, fn) => setTimeout(fn, ms);

/* 山札：使い切るまで同じものを引かない */
const decks = new Map();
function draw1(arr) {
  let d = decks.get(arr);
  if (!d || !d.length) { d = arr.map((_, i) => i).sort(() => Math.random() - 0.5); decks.set(arr, d); }
  return arr[d.pop()];
}
/* 既出の記録：同じ文面を二度出さない。速報と来訪者は端末に覚えさせ、開き直しても繰り返さない */
const seenSets = {};
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
function fresh(key, make, text, persist) {
  let o = seenSets[key];
  if (!o) { let a = []; if (persist) { try { a = JSON.parse(localStorage.getItem('kb7-seen-' + key) || '[]'); } catch (e) {} } o = seenSets[key] = new Set(a); }
  let v;
  for (let i = 0; i < 18; i++) {
    v = make(); const k = hash(text(v));
    if (!o.has(k)) {
      o.add(k); if (o.size > 4000) o.delete(o.values().next().value);
      if (persist) { try { localStorage.setItem('kb7-seen-' + key, JSON.stringify([...o])); } catch (e) {} }
      return v;
    }
  }
  return v;
}

/* ================= 架空の固有名詞 ================= */
const P1 = ['灰', '錆', '朽', '鉛', '煤', '骸', '澱', '燐', '凍', '鳴', '霜', '黒', '裂'];
const P2 = ['ヶ淵', '津原', '見沢', 'ノ瀬', '守野', '渡', '崎台', '沼辺', '降', '枯原', '音谷', '止'];
const place = () => R(P1) + R(P2);
const FAC = [
  () => `第${ri(2, 19)}濾過塔`, () => '旧送電中継所', () => '地下配給庫', () => '気象観測塔',
  () => '浄水プラント', () => '貨物索道駅', () => '種子保管庫', () => `第${ri(2, 9)}冷却池`,
  () => '燃料備蓄基地', () => '遮蔽ドーム管理棟', () => '旧通信局舎', () => `第${ri(3, 40)}検問所`,
  () => '地下貯水槽', () => '焼却処理場', () => '旧庁舎', () => '製塩所', () => `第${ri(2, 6)}換気塔`, () => '車両基地', () => '冷蔵倉庫', () => '旧病院'
];
const fac = () => R(FAC)();
const ORG = ['管区保全局', '臨時統治評議会', '第七管区防災司令部', '配給公社', '放射線監視班', '自警連絡会'];
const org = () => R(ORG);
const DIR = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
const ago = () => { const d = new Date(Date.now() - ri(3, 40) * 60000); return `${d.getHours()}時${pad(d.getMinutes())}分`; };
const later = () => `${(new Date().getHours() + ri(1, 5)) % 24}時`;

/* ================= 設定の保存 ================= */
const PRESETS = {
  worn: { skip: 55, wow: 55, noise: 55, muffle: 50, reverb: 45, speed: 88 },
  mint: { skip: 0, wow: 8, noise: 10, muffle: 15, reverb: 15, speed: 100 },
  dust: { skip: 30, wow: 25, noise: 95, muffle: 60, reverb: 20, speed: 96 },
  warp: { skip: 35, wow: 100, noise: 40, muffle: 40, reverb: 35, speed: 92 },
  wet: { skip: 45, wow: 80, noise: 60, muffle: 95, reverb: 70, speed: 80 },
  motor: { skip: 70, wow: 60, noise: 45, muffle: 50, reverb: 30, speed: 68 },
  far: { skip: 25, wow: 30, noise: 30, muffle: 90, reverb: 100, speed: 94 },
  nightmare: { skip: 95, wow: 100, noise: 80, muffle: 70, reverb: 90, speed: 62 }
};
const prefs = { interval: 30, sound: false, voice: false, scan: true, fx: true, take: true, frame: true, single: false, piece: 'shuffle', timbre: 'auto', vol: 70, preset: 'worn', e: Object.assign({}, PRESETS.worn) };
try { const s = JSON.parse(localStorage.getItem('kb7-prefs2') || '{}'); Object.assign(prefs, s, { e: Object.assign({}, PRESETS.worn, s.e || {}) }); } catch (e) {}
const save = () => {
  try { const o = Object.assign({}, prefs); if (o.piece === 'file') o.piece = 'shuffle'; localStorage.setItem('kb7-prefs2', JSON.stringify(o)); } catch (e) {}
};

/* ================= 闇市相場 ================= */
const PR = [
  { k: 'water', n: '飲料水 1L', p: 38 }, { k: 'bread', n: '乾パン 1袋', p: 120 },
  { k: 'can', n: '缶詰 1個', p: 260 }, { k: 'mask', n: '濾過マスク', p: 540 },
  { k: 'cell', n: '単三電池 1本', p: 95 }, { k: 'oil', n: '灯油 1L', p: 310 },
  { k: 'med', n: '抗生剤 1錠', p: 880 }
];
PR.forEach(x => { x.base = x.p; x.hot = 0; });
const item = k => PR.find(i => i.k === k);
let wage = 40, redenom = 0;
const wageDays = ri(300, 900);
const fmtP = v => v >= 1e8 ? (v / 1e8).toFixed(v >= 1e9 ? 0 : 1) + '億'
  : v >= 1e4 ? (v / 1e4).toFixed(v >= 1e5 ? 0 : 1) + '万'
  : Math.max(1, Math.round(v)).toLocaleString('ja-JP');
const wageText = () => wage >= 1 ? `${Math.round(wage)}券` : '1券未満';
const pending = [];

/* ---- 配給所の黒板：相場／本日の配給／本日の数字 の3面 ---- */
const dayKey = () => { const t = new Date(Date.now() - 5 * 3600e3); return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`; };   // 一日は朝5時に始まる
const band = () => { const hr = new Date().getHours(); return hr < 5 ? 'shinya' : hr < 10 ? 'asa' : hr < 16 ? 'hiru' : hr < 20 ? 'yuu' : 'yoru'; };
let popu = 0, chalkPage = 0, queue0 = 1800;
const stats = { day: '', dead: 0, miss: 0, sag: 0, visit: 0, boom: 0, got: 0, came: 0 };
try { popu = +localStorage.getItem('kb7-pop') || 0; Object.assign(stats, JSON.parse(localStorage.getItem('kb7-day') || '{}')); } catch (e) {}
if (!popu) popu = ri(38000, 44000);
const SHOP = ['water', 'bread', 'cell', 'med', 'mask'];
const SHORT = { water: '水 1L', bread: '乾パン 1袋', cell: '電池 1本', med: '抗生剤 1錠', mask: 'マスク 1枚' };
const RATION = [{ k: 'water', n: '飲料水', amt: '1人 1.0L' }, { k: 'bread', n: '乾パン', amt: '1人 半袋' }, { k: 'can', n: '缶詰', amt: '1世帯 1個' }, { k: 'oil', n: '灯油', amt: '1世帯 0.2L' }];
PR.forEach(x => { x.stock = 0; x.until = 0; });
const saveStats = () => { try { localStorage.setItem('kb7-pop', popu); localStorage.setItem('kb7-day', JSON.stringify(stats)); } catch (e) {} };
function rationDay() {
  queue0 = ri(900, 2600); stats.came = queue0 + ri(200, 900); stats.got = Math.round(stats.came * (0.3 + Math.random() * 0.3));
  RATION.forEach(r => { r.out = ''; r.end = 6.6 + Math.random() * 3.3; });
  if (Math.random() < 0.7) RATION[2].out = '本日なし';
  if (Math.random() < 0.35) RATION[3].out = '本日なし';
}
function rollDay() {
  if (stats.day === dayKey()) return;
  const t = new Date(), h = ((t.getHours() + t.getMinutes() / 60 - 5) + 24) % 24, n = k => Math.round(h * k * (0.7 + Math.random() * 0.6));   // 途中から見はじめた日は、朝5時からの分がすでに書いてある
  Object.assign(stats, { day: dayKey(), dead: n(2.6), miss: n(0.9), sag: n(0.3), visit: n(1.1), boom: n(0.25) }); popu = Math.max(900, popu - stats.dead - stats.miss); rationDay(); saveStats();
}
function bump(k, n) { rollDay(); stats[k] += n; if (k === 'dead' || k === 'miss') popu = Math.max(900, popu - n); saveStats(); }
function shortage(k) {                                  // 速報を受けて、闇市からも配給からも消える
  const x = item(k); x.stock = 2; x.until = Date.now() + ri(8, 25) * 60000;
  const r = RATION.find(q => q.k === k);
  if (r && !r.out) { r.out = '本日なし'; react('chalk', r.n, ri(9000, 16000)); }
}
const stockOut = () => { const x = PR.find(i => i.stock === 2); return x ? x.n.split(' ')[0] : ''; };
const el3 = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function renderChalk() {
  rollDay();
  const box = $('chalkBody'), now = new Date(), hr = now.getHours() + now.getMinutes() / 60;
  box.textContent = '';
  PR.forEach(x => { if (x.stock === 2 && Date.now() > x.until) x.stock = 1; else if (x.stock === 1 && Date.now() > x.until + 600000) x.stock = 0; });
  $('chalkPage').textContent = ['闇市の相場', '本日の配給', '本日の数字'][chalkPage] + ` ${chalkPage + 1}/3`;
  if (chalkPage === 0) {
    const w = item('water'), top = el3('div', 'chalk-top', '日当で買える水'), b = el3('b', '', w.stock === 2 ? '0L' : `${(wage / w.p).toFixed(2)}L`);
    b.append(el3('small', '', w.stock === 2 ? '売る者がいません' : `今朝は ${(wage / w.base).toFixed(2)}L`)); top.append(b); box.append(top);
    const ul = el3('ul', 'rows');
    SHOP.forEach(k => {
      const x = item(k), days = x.p / wage, li = el3('li'), st = [['あり', ''], ['残りわずか', 'w'], ['なし', 'n']][x.stock];
      li.append(el3('span', '', SHORT[k]), el3('span', 'v', x.stock === 2 ? '—' : `${days < 10 ? days.toFixed(1) : fmtP(days)}日分`), el3('span', 's ' + st[1], st[0]));
      ul.append(li);
    });
    box.append(ul, el3('div', 'chalk-foot', `値段は日当の何日分か。日当 ${wageText()}、据え置き ${wageDays}日目`));
  } else if (chalkPage === 1) {
    const open = hr >= 6 && hr < 10, q = Math.max(0, Math.round(queue0 * (1 - (hr - 6) / 4.3) + (Math.random() - 0.5) * 30)), wait = Math.round(q * 0.21);
    box.append(el3('div', 'chalk-top', hr >= 5 && hr < 6 ? '受付は6時から。すでに列ができています' : open ? `受付中　列 ${q.toLocaleString('ja-JP')}人・待ち ${Math.floor(wait / 60)}時間${pad(wait % 60)}分` : '本日は終了しました　次回は朝6時'));
    const ul = el3('ul', 'rows');
    RATION.forEach(r => {
      const endT = `${Math.floor(r.end)}:${pad(Math.floor(r.end % 1 * 60))}`;
      const st = r.out ? [r.out, 'n'] : hr >= 5 && hr < 6 ? ['6時から', ''] : open && hr < r.end ? ['受付中', ''] : open ? [`${endT} 品切れ`, 'w'] : ['終了', ''];
      const li = el3('li'); li.append(el3('span', '', r.n), el3('span', 'v', r.amt), el3('span', 's ' + st[1], st[0])); ul.append(li);
    });
    box.append(ul, el3('div', 'chalk-foot', open || (hr >= 5 && hr < 6) ? '列を離れると最後尾からです。倒れた人の分は繰り上げません。' : `受け取れた人 ${stats.got.toLocaleString('ja-JP')} ／ 並んだ人 ${stats.came.toLocaleString('ja-JP')}`));
  } else {
    const ul = el3('ul', 'rows two');
    [['人口', popu.toLocaleString('ja-JP')], ['死亡届', `+${stats.dead}`], ['行方不明', `+${stats.miss}`], ['出生', '0'], ['来訪（応答 0）', `${stats.visit}`], ['瞬断', `${stats.sag}回`], ['爆発', `${stats.boom}件`]]
      .forEach(([a, b]) => { const li = el3('li'); li.append(el3('span', '', a), el3('span', 'v', b)); ul.append(li); });
    box.append(ul, el3('div', 'chalk-foot', '朝5時に書き直します。人口だけは書き直しません。'));
  }
}
function renderPrices() { renderChalk(); }
function hike(k, lo, hi) { const x = item(k); x.p *= 1 + lo + Math.random() * (hi - lo); x.hot = Date.now(); }
function priceTick() {
  hike(R(PR).k, 0.002, 0.014);
  if (Math.max(...PR.map(i => i.p)) >= 1e9) {
    PR.forEach(x => { x.p /= 1e6; x.base = x.p; });
    wage /= 1e6; redenom++;
    const n = redenom;
    pending.push({ wait: 0, make: () => ({ sev: 1, cat: '経済', where: '管区全域', key: 'econ',
      head: `第${n}次新券へ切り替え　100万旧券を1新券に`,
      body: `配給公社は、桁が増えすぎた券を新しい券に切り替えます。旧券100万枚が新券1枚です。日当も同じ割合で切り替えるため、${wageText()}になります。旧券は焚きつけに使えます。` }) });
  }
  renderPrices();
}

/* ================= 文面の部品を読み込む ================= */
const C = window.KB7_CONTENT({ R, ri, place, fac, org, DIR, ago, later, fmtP, hhmm,
  price: k => item(k).p, base: k => item(k).base, wageText, wageDays: () => wageDays, wage: () => wage });
