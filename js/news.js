/* 第七管区 緊急放送網：速報（発報と文字送り）・画面演出（揺れ・明滅）。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 速報 ================= */
const SEV = ['情報', '注意', '警報', '緊急', '案内'];
const app = $('app');
let serial = ri(300, 900), current = null, nextAt = 0, typeTimer = 0;
let lastCat = '', sinceLure = 0, sinceChain = 14, lureHot = 0, backFrom = '', first = true;
const CAT_DECK = [];
Object.keys(C.CATS).forEach(k => { for (let i = 0; i < C.CATS[k].w; i++) CAT_DECK.push(k); });

function genCat() {
  let key = draw1(CAT_DECK); if (key === lastCat) key = draw1(CAT_DECK);
  lastCat = key;
  const K = C.CATS[key], c = { p: place(), f: fac(), o: org(), o2: org(), n: ri(2, 9), t: ago(), d: R(DIR), km: ri(2, 14), l: later() };
  const hf = draw1(K.head), tp = hf.tp, head = hf(c);
  /* 状況は必ず見出しと同じ話題から。対応と指示は同じ話題を優先し、ときどき分類共通から */
  const part = (pool, keep) => draw1(pool[tp] && (!pool['*'] || Math.random() < keep) ? pool[tp] : pool['*']);
  const body = draw1(K.a[tp])(c) + part(K.b, 0.7)(c) + part(K.c, 0.6)(c);
  return { sev: R(K.sev), cat: R(K.cat), where: c.p, head, body, key, tp, dose: c.dose, out: c.out || (Math.random() < 0.6 ? K.out : ''), dir: c.d, km: c.km };
}
function makeLure() {
  const l = draw1(C.LURES)(), t = new Date(), n = ri(12, 140), tr = R(C.TRACES);
  pending.push({ wait: ri(2, 4), make: () => ({ sev: 3, cat: '訂正', where: l.where, after: 'lure',
    head: R(C.CORRECT)(l, n, hhmm(t)),
    body: `${hhmm(t)}に流れた案内は、登録のない送信所からのものです。${l.where}に向かった${n}名と連絡が取れていません。現地に残っていたのは、${tr}だけでした。同じ声の放送には従わないでください。` }) });
  return { sev: 4, cat: 'ご案内', where: l.where, head: l.head, body: l.body, lure: true, org: '不明（認証符号なし）' };
}
function startChain() {
  const steps = draw1(C.CHAINS)(); let acc = 0;
  steps.slice(1).forEach(st => { acc += ri(st.wait[0], st.wait[1]); pending.push({ wait: acc, make: st.make, chain: true }); });
  return steps[0].make();
}
function draw() {
  pending.forEach(p => p.wait--);
  const i = pending.findIndex(p => p.wait <= 0);
  if (i >= 0) return pending.splice(i, 1)[0].make();
  sinceLure++; sinceChain++;
  const busy = pending.some(p => p.chain);
  if ((sinceLure > 22 && Math.random() < 0.08 || first && sinceLure > 7) && !pending.some(p => !p.chain)) { sinceLure = 0; first = false; return makeLure(); }   // 開いてしばらくしたら、まず1本
  if (sinceChain > 26 && !busy && Math.random() < 0.08) { sinceChain = 0; return startChain(); }
  return fresh('head', () => Math.random() < 0.07 ? draw1(C.SPECIALS)() : genCat(), b => b.head, true);
}

function typeOut(el, text, instant) {
  clearInterval(typeTimer);
  if (instant || reduced) { el.textContent = text; el.classList.remove('typing'); return; }
  el.textContent = ''; el.classList.add('typing');
  let i = 0;
  typeTimer = setInterval(() => {
    i += 2; el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); el.classList.remove('typing'); }
  }, 40);
}
function issue(instant) {
  const b = draw();
  b.at = new Date(); b.no = ++serial; b.org = b.org || org();
  current = b;
  app.dataset.sev = b.sev;
  $('sev').textContent = SEV[b.sev];
  $('cat').textContent = b.cat;
  $('num').textContent = `第${String(b.no).padStart(4, '0')}報`;
  $('issued').textContent = `${hhmm(b.at)} ${b.lure ? '受信' : '発表'}`;
  $('head').textContent = b.head;
  typeOut($('body'), b.body, instant);
  $('origin').textContent = `発信：${b.org}　／　対象：${b.where}`;
  if (b.dose) { doseTarget = b.dose; $('doseSite').textContent = `${b.where}観測点`; }
  const hk = b.key && C.CATS[b.key] && C.CATS[b.key].hike; if (hk) { hike(hk[0], hk[1], hk[2]); if (Math.random() < 0.6) shortage(hk[0]); renderPrices(); }
  if (!instant) { if (b.key === 'boom') bump('boom', 1); if (b.key === 'missing') bump('miss', ri(1, 6)); if (b.after === 'lure') bump('miss', ri(8, 40)); }
  if (b.out === 'none') { out.near = 0; outEnd(); } else if (b.out) outTrigger(b.out, { near: b.near, dirName: b.dir, km: b.km });
  if (b.back) backFrom = b.back;
  app.classList.toggle('lull', !!b.lure);     // 親切そうな放送のあいだだけ、画面が不自然に明るく、きれいになる
  if (!instant) {
    screenFx(b);
    if (b.lure) lureHot = Date.now();
    chime(b.sev);
    speak(`${b.lure ? 'お知らせします' : SEV[b.sev]}。${b.head}。${b.body}`);
    reactTo(b);
  }
  nextAt = Date.now() + prefs.interval * 1000;
}
function tick() {
  const d = new Date(), ts = `${hhmm(d)}:${pad(d.getSeconds())}`;
  $('clock').textContent = ts; $('camTs').textContent = ts; $('outTs').textContent = ts;
  $('era').textContent = `終暦${d.getFullYear() - 1989}年 ${d.getMonth() + 1}月${d.getDate()}日`;
  if (door.v) { const e = Math.floor((Date.now() - door.t0) / 1000); $('doorFoot').textContent = `${door.v.thing ? '検知' : '呼び出し'}から ${Math.floor(e / 60)}:${pad(e % 60)} ／ 施錠中 ／ ${door.v.thing ? '扉を開けないでください' : '応答しないでください'}`; }
  const total = prefs.interval * 1000, left = Math.max(0, nextAt - Date.now());
  $('bar').style.width = `${Math.min(100, (1 - left / total) * 100)}%`;
  const s = Math.ceil(left / 1000);
  $('remain').textContent = s >= 60 ? `${Math.floor(s / 60)}分${pad(s % 60)}秒` : `${s}秒`;
  if (left <= 0) issue(false);
}

/* ================= 画面演出 ================= */
const fxEl = $('fx');
let fxT = 0, noteT = 0;
const fxOn = () => prefs.fx && !reduced;
function fxShow(cls, ms, text) {
  fxEl.className = 'fx ' + cls; fxEl.textContent = text || '';
  clearTimeout(fxT); fxT = setTimeout(() => { fxEl.className = 'fx'; fxEl.textContent = ''; }, ms);
}
function shake(level, ms) {
  app.classList.remove('shake1', 'shake2'); void app.offsetWidth;
  app.classList.add('shake' + level); setTimeout(() => app.classList.remove('shake' + level), ms + 30);
}
function borderFlash() {
  app.classList.remove('flash'); void app.offsetWidth; app.classList.add('flash');
  setTimeout(() => app.classList.remove('flash'), 3700);
}
function note(text, ms) {                               // 画面の左下に出る短い注記
  const el = $('sagnote'); el.textContent = text; el.hidden = false;
  clearTimeout(noteT); noteT = setTimeout(() => { el.hidden = true; }, ms);
}
function screenFx(b) {
  if (!fxOn() || take.busy) return;
  if (b.sev === 3) {            // 白く飛ぶ → 赤い全画面 → 揺れながら戻る（白い閃光は1回だけ）
    fxShow('white', 90);
    setTimeout(() => { fxShow('slate', 850, b.after ? '訂正' : '緊急'); shake(2, 900); }, 90);
    setTimeout(() => { shake(1, 500); borderFlash(); }, 960);
  } else if (b.sev === 2) {     // 一瞬の暗転
    fxShow('black', 220);
    setTimeout(() => { shake(1, 500); borderFlash(); }, 220);
  }
}
function sag() {                // 主電源の瞬断：画面が落ち、蓄音機の回転も沈む
  if (fxOn() && !take.busy) {
    app.classList.add('sag'); note('主電源 瞬断', 3000);
    rec.forceDroop = true; power = Math.max(12, power - ri(8, 20)); bump('sag', 1);
    if (Math.random() < 0.3) react('sag', null, 2500);
    setTimeout(() => {
      app.classList.remove('sag');
      if (Math.random() < 0.4) setTimeout(() => { app.classList.add('sag'); setTimeout(() => app.classList.remove('sag'), 200); }, 400);
    }, ri(500, 2600));
  }
  setTimeout(sag, ri(70000, 200000));
}
