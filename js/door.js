/* 第七管区 緊急放送網：玄関インターホン（来訪者と描画）。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= インターホン ================= */
const doorEl = $('door'), cam = $('cam'), cx = cam.getContext('2d'), CW = cam.width, CH = cam.height;
const door = { v: null, t0: 0, count: ri(2, 9), stat: 0, jumpAt: 0, seed: 0, n: 4, ghost: 0, timer: 0, forceFace: 0 };
const DARK = '#040605', EYE = '#e8f0e4';
const NOFACE = ['none', 'open', 'bag', 'dog', 'cat', 'chair', 'water', 'box', 'tilt', 'rats', 'ball', 'dark', 'fog', 'crow', 'shoes', 'crack', 'paper', 'swing', 'snow', 'balloon', 'heat', 'hands', 'plant', 'musicbox'];
$('doorCam').textContent = `CAM-${pad(ri(1, 9))} 第${ri(2, 40)}扉`;
function doorIdle(text) {
  doorEl.dataset.state = 'idle';
  $('doorState').textContent = '来訪者なし'; $('doorWho').textContent = '';
  $('doorSaid').textContent = ''; $('doorSeen').textContent = text || '扉の前に動くものはありません。';
  $('doorFoot').textContent = `本日の来訪 ${stats.visit}件 ／ 応答 0件 ／ 施錠中`;
}
function doorLeave() {
  const v = door.v; if (!v) return;
  const o = draw1(C.LEAVES);
  if (o.startsWith('映像')) door.stat = 45;
  door.v = null;
  doorIdle(`${hhmm(new Date())} ${v.who}：${o}`);
  clearTimeout(door.timer); door.timer = setTimeout(doorRing, ri(45000, 130000));
}
function nextVisitor() {
  if (lureHot && Date.now() - lureHot < 300000) { lureHot = 0; return C.PICKUP(); }       // 偽の放送のあとには、迎えが来る
  if (backFrom) { const p = backFrom; backFrom = ''; return C.RETURNED(p); }                // 帰還した調査隊員と同じ顔が、もう1人
  return fresh('visit', () => {
    if (Math.random() < 0.42) return draw1(C.THINGS)();                                       // 4割ほどは、人ではないもの
    const v = draw1(C.VISITORS)();
    if (!NOFACE.includes(v.fig) && Math.random() < 0.55) v.seen += draw1(C.ANOM)();
    return v;
  }, v => v.who + v.said + v.seen, true);
}
function doorRing() {
  clearTimeout(door.timer);
  const v = nextVisitor();
  door.v = v; door.t0 = Date.now(); door.count++; bump('visit', 1); paneByName('door', 26000); door.seed = Math.random(); door.jumpAt = ri(7, 16); door.n = ri(3, 6); door.forceFace = 0;
  doorEl.dataset.state = v.risk === 3 ? 'red' : 'amber';
  $('doorState').textContent = v.thing ? (v.risk === 3 ? '開扉禁止' : '確認中') : v.risk === 3 ? '応答禁止' : '応答非推奨';
  $('doorWho').textContent = v.who;
  $('doorSaid').textContent = v.said.startsWith('（') ? v.said : `「${v.said}」`;
  $('doorSeen').textContent = v.seen;
  doorSound(v);
  if (v.sound === 'knock') { const again = () => { if (door.v !== v) return; doorSound(v); setTimeout(again, ri(6000, 11000)); }; setTimeout(again, 7000); }
  if (fxOn() && !take.busy) {                           // 来訪者が出た瞬間、ほかの表示が沈む
    app.classList.add('doorfocus'); setTimeout(() => app.classList.remove('doorfocus'), 4200);
    if (v.risk === 3) shake(1, 500);
  }
  if (Math.random() < 0.35) { let p; soon(5000, () => { p = post(uniq(() => R(C.REACT.door)())); }); react('doorRe', null, 9000, () => p); }
  if (v.risk === 3 && !NOFACE.includes(v.fig) && canTake() && Math.random() < 0.12) soon(ri(7000, 12000), () => { if (door.v === v) takeover('doorfull'); });
  door.timer = setTimeout(doorLeave, ri(24000, 40000));
}
function fig(x, base, h, o) {                           // 逆光の人影：頭と、裾まで続く胴
  const hw = h * 0.11 * (o.big ? 1.35 : 1), top = base - h;
  cx.fillStyle = DARK;
  cx.beginPath(); cx.ellipse(x, top + hw, hw * 0.85, hw, 0, 0, 7); cx.fill();
  cx.beginPath(); cx.moveTo(x - hw * 2.3, base); cx.lineTo(x - hw * 2, top + hw * 2.9);
  cx.quadraticCurveTo(x, top + hw * 1.5, x + hw * 2, top + hw * 2.9); cx.lineTo(x + hw * 2.3, base); cx.fill();
  if (o.visor) { cx.fillStyle = '#5d6a63'; cx.fillRect(x - hw * 0.6, top + hw * 0.65, hw * 1.2, hw * 0.55); }
  if (o.eyes) { cx.fillStyle = EYE; const s = Math.max(1, hw * 0.16); cx.fillRect(x - hw * 0.42, top + hw * 0.85, s, s); cx.fillRect(x + hw * 0.26, top + hw * 0.85, s, s); }
}
function face(dx) {                                     // レンズのすぐ前の顔。暗視カメラに目だけが光る
  cx.fillStyle = DARK; cx.beginPath(); cx.ellipse(88 + dx, 58, 62, 70, 0, 0, 7); cx.fill();
  cx.fillStyle = EYE; cx.fillRect(66 + dx, 44, 4, 3); cx.fillRect(104 + dx, 44, 4, 3);
}
function corridor(open) {
  cx.fillStyle = '#19201d'; cx.fillRect(0, 0, CW, CH);
  cx.fillStyle = '#28302c'; cx.beginPath(); cx.moveTo(0, CH); cx.lineTo(58, 64); cx.lineTo(118, 64); cx.lineTo(CW, CH); cx.fill();   // 床
  cx.fillStyle = '#3a4640'; cx.fillRect(58, 20, 60, 44);                                                                        // 突き当たりの壁
  cx.fillStyle = open ? '#000' : '#1e2522'; cx.fillRect(80, 34, 16, 30);                                                         // 奥の扉
  if (open) { cx.fillStyle = '#2b3430'; cx.beginPath(); cx.moveTo(96, 34); cx.lineTo(104, 37); cx.lineTo(104, 66); cx.lineTo(96, 64); cx.fill(); }
  cx.strokeStyle = '#4d5a53'; cx.lineWidth = 1; cx.beginPath();
  cx.moveTo(0, 0); cx.lineTo(58, 20); cx.moveTo(CW, 0); cx.lineTo(118, 20); cx.moveTo(0, CH); cx.lineTo(58, 64); cx.moveTo(CW, CH); cx.lineTo(118, 64); cx.stroke();
}
function drawVisitor(v, now) {
  const el = (now - door.t0) / 1000, sway = Math.sin(el * 0.8 + door.seed * 6) * 1.5, near = Math.min(1, el / 30);
  const eyes = v.risk === 3 && door.seed > 0.4, f = v.fig;
  if (f === 'group') {
    for (let i = 0; i < door.n; i++) { const k = (i * 0.618 + door.seed) % 1; fig(20 + k * 136, 72 + (i % 3) * 13 + near * 8, 30 + ((i * 5) % 4) * 9, { eyes: eyes && i % 2 === 0 }); }
    fig(88 + sway, CH + 26, 90 + near * 14, { eyes });
  } else if (f === 'many') {
    for (let i = 0; i < 14; i++) { const k = (i * 0.618 + door.seed) % 1; fig(8 + k * 160, 68 + (i % 5) * 9, 26 + (i % 5) * 9, { eyes: i % 3 === 0 }); }
  } else if (f === 'pair') {
    fig(116 - sway, CH + 14, 96, { eyes: true }); fig(74 + sway, CH + 26, 90 + near * 10, {});
  } else if (f === 'tall') {
    fig(88 + sway, CH + 30, 215, {});
    cx.strokeStyle = DARK; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(62, 26); cx.lineTo(26, 0); cx.moveTo(114, 26); cx.lineTo(152, 0); cx.stroke();
  } else if (f === 'close') face(sway);
  else if (f === 'small') {
    cx.fillStyle = 'rgba(0,0,0,.55)'; cx.beginPath(); cx.ellipse(66, 100, 28, 5, -0.3, 0, 7); cx.fill(); cx.beginPath(); cx.ellipse(114, 101, 32, 5, 0.25, 0, 7); cx.fill();
    fig(88 + sway, 100, 40, { eyes });
  } else if (f === 'none') {
    cx.fillStyle = 'rgba(0,0,0,.6)';
    for (let i = 0; i < 7; i++) { cx.beginPath(); cx.ellipse(88 + (i % 2 ? 1 : -1) * (5 + i * 1.6), 67 + i * i * 0.85, 1.5 + i * 0.7, 1 + i * 0.4, 0, 0, 7); cx.fill(); }
  } else if (f === 'far') fig(88, 64 + near * 34, 22 + near * 40, { eyes: near > 0.5 });             // 見るたびに少し手前にいる
  else if (f === 'crawl') {
    const x = 60 + near * 30; cx.fillStyle = DARK;
    cx.beginPath(); cx.ellipse(x + 26, 95, 28, 7, 0.05, 0, 7); cx.fill(); cx.beginPath(); cx.ellipse(x - 4, 92, 7, 6, 0, 0, 7); cx.fill();
    cx.strokeStyle = DARK; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x + 2, 96); cx.lineTo(x - 20 + sway * 2, 103); cx.stroke();
  } else if (f === 'ceiling') { cx.save(); cx.translate(0, 44); cx.scale(1, -1); fig(88 + sway, 76, 84, { eyes: true }); cx.restore(); }
  else if (f === 'hand') {
    cx.fillStyle = DARK;
    for (let i = 0; i < 5; i++) { cx.beginPath(); cx.ellipse(18 + i * 36 + sway, 50, 16, 80, 0.06 * (i - 2), 0, 7); cx.fill(); }
    cx.fillStyle = EYE; cx.fillRect(105 + sway, 40, 3, 2);
  } else if (f === 'light') {
    fig(88 + sway, CH + 26, 92, {});
    const g = cx.createRadialGradient(88 + sway * 2, 52, 2, 88, 52, 95); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(240,250,235,.85)'); g.addColorStop(1, 'rgba(200,220,200,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, CW, CH);
  } else if (f === 'sit') fig(88 + sway * 0.3, CH + 14, 58, { big: true, eyes });
  else if (f === 'bag') {
    cx.fillStyle = '#0c100e'; cx.fillRect(58, 96, 60, 5); cx.fillRect(62, 101, 4, 8); cx.fillRect(110, 101, 4, 8);
    cx.fillStyle = '#2f3833'; cx.beginPath(); cx.ellipse(88, 92, 27, 11 + Math.sin(el * 1.3) * 1.6, 0, Math.PI, 0); cx.fill();
  } else if (!drawThing(v, el, near) && f !== 'open') fig(88 + sway, CH + 26, 92 + near * 16, { eyes: eyes && f !== 'back', visor: f === 'suit', big: f === 'suit' });
}
function drawThing(v, el, near) {                      // 人ではないもの
  const f = v.fig, D = DARK;
  if (f === 'dog' || f === 'cat') {
    const n = v.n, s = f === 'cat' ? 0.6 : 1;
    for (let i = 0; i < n; i++) {
      const x = 88 + (i - (n - 1) / 2) * 36, y = 102 - (i % 2) * 6; cx.fillStyle = D;
      cx.beginPath(); cx.ellipse(x, y - 13 * s, 9 * s, 13 * s, 0, 0, 7); cx.fill();
      cx.beginPath(); cx.ellipse(x, y - 30 * s, 6 * s, 6 * s, 0, 0, 7); cx.fill();
      cx.beginPath(); cx.moveTo(x - 6 * s, y - 33 * s); cx.lineTo(x - 4 * s, y - 42 * s); cx.lineTo(x - 1, y - 34 * s); cx.fill();
      cx.beginPath(); cx.moveTo(x + 6 * s, y - 33 * s); cx.lineTo(x + 4 * s, y - 42 * s); cx.lineTo(x + 1, y - 34 * s); cx.fill();
      if (!/背/.test(v.seen)) { cx.fillStyle = EYE; cx.fillRect(x - 3 * s, y - 31 * s, 1.5, 1.5); cx.fillRect(x + 2 * s, y - 31 * s, 1.5, 1.5); }
    }
  } else if (f === 'chair') {                           // 奥から転がってくる車椅子
    const y = 66 + near * 36, s = 0.5 + near * 0.9;
    cx.strokeStyle = D; cx.lineWidth = 2 * s; cx.beginPath(); cx.arc(88 - 9 * s, y - 8 * s, 8 * s, 0, 7); cx.stroke(); cx.beginPath(); cx.arc(88 + 9 * s, y - 8 * s, 8 * s, 0, 7); cx.stroke();
    cx.fillStyle = D; cx.fillRect(88 - 9 * s, y - 31 * s, 18 * s, 16 * s); cx.fillRect(88 - 10 * s, y - 16 * s, 20 * s, 3 * s);
  } else if (f === 'water') { cx.fillStyle = 'rgba(0,0,0,.82)'; cx.beginPath(); cx.ellipse(88, CH + 2, 28 + near * 70, 6 + near * 28, 0, 0, 7); cx.fill(); }
  else if (f === 'box') {
    const n = Math.min(8, 1 + Math.floor(el / 5));
    for (let i = 0; i < n; i++) { const col = i % 3, row = (i / 3) | 0; cx.fillStyle = '#0b0f0d'; cx.fillRect(61 + col * 18, 95 - row * 14, 16, 13); cx.strokeStyle = '#3f4b45'; cx.lineWidth = 1; cx.strokeRect(61.5 + col * 18, 95.5 - row * 14, 15, 12); }
  } else if (f === 'rats') {
    cx.fillStyle = D;
    for (let i = 0; i < 18; i++) { const k = (i * 0.37 + el * 0.45) % 1; cx.beginPath(); cx.ellipse(94 - k * 118 + (i % 3) * 7, 66 + k * 44 + (i % 4) * 2, 2 + k * 3.4, 1 + k * 1.6, 0, 0, 7); cx.fill(); }
  } else if (f === 'ball') { const k = Math.min(1, el / 6), r = 2 + k * 5; cx.fillStyle = '#b9c4ba'; cx.beginPath(); cx.arc(88 + Math.sin(el * 2) * (1 - k) * 8, 66 + k * 36 - r, r, 0, 7); cx.fill(); }
  else if (f === 'dark') { const k = Math.min(1, el / 24); cx.fillStyle = '#000'; cx.fillRect(58 - k * 58, 20 - k * 20, 60 + k * 116, 44 + k * 60); }   // 奥から近づいてくる暗がり
  else if (f === 'fog') {
    for (let i = 0; i < 10; i++) { cx.fillStyle = `rgba(200,212,204,${0.09 + near * 0.06})`; cx.beginPath(); cx.ellipse(88 + Math.sin(el * 0.3 + i * 1.7) * 62, 102 - i * 4 + Math.sin(el * 0.5 + i) * 3, 46, 9, 0, 0, 7); cx.fill(); }
  } else if (f === 'crow') {
    const x = 98, y = 54, peck = Math.sin(el * 5) > 0.6 ? 4 : 0; cx.fillStyle = D;
    cx.beginPath(); cx.ellipse(x, y, 16, 22, 0.3, 0, 7); cx.fill(); cx.beginPath(); cx.ellipse(x - 12 - peck, y - 22 + peck, 9, 8, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.moveTo(x - 20 - peck, y - 22 + peck); cx.lineTo(x - 35 - peck, y - 17 + peck); cx.lineTo(x - 19 - peck, y - 16 + peck); cx.fill();
    cx.fillStyle = EYE; cx.fillRect(x - 15 - peck, y - 25 + peck, 2, 2);
  } else if (f === 'shoes') {
    const n = Math.min(9, 2 + Math.floor(el / 5)); cx.fillStyle = D;
    for (let i = 0; i < n; i++) { const x = 42 + i * 11; cx.beginPath(); cx.ellipse(x, 102, 3, 6, 0, 0, 7); cx.fill(); cx.beginPath(); cx.ellipse(x + 5, 102, 3, 6, 0, 0, 7); cx.fill(); }
  } else if (f === 'paper') {
    const n = Math.min(16, 2 + Math.floor(el / 2.2));
    for (let i = 0; i < n; i++) { cx.save(); cx.translate(58 + (i * 37 % 62), 97 + (i * 13 % 10)); cx.rotate((i * 0.7 % 1) - 0.5); cx.fillStyle = '#aab5ab'; cx.fillRect(-7, -4, 14, 9); cx.restore(); }
  } else if (f === 'swing') {
    const a = Math.sin(el * 1.8) * (0.3 + near * 0.7), lx = 88 + Math.sin(a) * 32, ly = Math.cos(a) * 30;
    cx.strokeStyle = D; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(88, 0); cx.lineTo(lx, ly); cx.stroke(); cx.fillStyle = '#d6dfd6'; cx.beginPath(); cx.arc(lx, ly, 4, 0, 7); cx.fill();
    const g = cx.createRadialGradient(88 + Math.sin(a) * 70, 62, 2, 88 + Math.sin(a) * 70, 62, 64); g.addColorStop(0, 'rgba(220,235,220,.3)'); g.addColorStop(1, 'rgba(220,235,220,0)'); cx.fillStyle = g; cx.fillRect(0, 0, CW, CH);
  } else if (f === 'snow') {
    cx.fillStyle = '#c9d2c9'; for (let i = 0; i < 70; i++) cx.fillRect((i * 53 + el * 30 * (1 + i % 3)) % CW, (i * 29 + el * 12) % CH, 1.5, 1.5);
    cx.fillStyle = 'rgba(200,210,200,.5)'; cx.beginPath(); cx.ellipse(88, CH + 4, 92, 6 + near * 13, 0, 0, 7); cx.fill();
  } else if (f === 'balloon') {
    const y = 16 + Math.sin(el * 0.9) * 2; cx.fillStyle = '#7d8a80'; cx.beginPath(); cx.ellipse(104, y, 9, 11, 0, 0, 7); cx.fill();
    cx.strokeStyle = '#9aa69c'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(104, y + 11); cx.quadraticCurveTo(99, y + 30, 104, y + 46); cx.stroke(); cx.fillStyle = '#c9d2c9'; cx.fillRect(100, y + 46, 8, 5);
  } else if (f === 'heat') {                            // 映像には誰もいない。熱の検知だけが人の形を示す
    cx.globalAlpha = 0.3 + Math.sin(el * 3) * 0.1; cx.fillStyle = '#dbe6db'; cx.beginPath(); cx.ellipse(88, 56, 9, 11, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.moveTo(66, CH); cx.lineTo(70, 76); cx.quadraticCurveTo(88, 64, 106, 76); cx.lineTo(110, CH); cx.fill(); cx.globalAlpha = 1;
  } else if (f === 'hands') {
    const n = Math.min(13, 1 + Math.floor(el / 2));
    for (let i = 0; i < n; i++) { const x = 18 + (i % 2) * 9 + (i * 3 % 5), y = 102 - i * 8; cx.fillStyle = 'rgba(0,0,0,.72)'; cx.beginPath(); cx.ellipse(x, y, 4, 5, 0, 0, 7); cx.fill(); for (let k = 0; k < 4; k++) cx.fillRect(x - 4 + k * 2.4, y - 10, 1.6, 6); }
  } else if (f === 'plant') {
    const hgt = 10 + near * 50; cx.strokeStyle = D; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(88, CH); cx.bezierCurveTo(78, CH - hgt * 0.4, 99, CH - hgt * 0.7, 88 + Math.sin(el) * 3, CH - hgt); cx.stroke();
    for (let i = 1; i < 5; i++) { const y = CH - hgt * i / 5; cx.beginPath(); cx.moveTo(88, y); cx.lineTo(88 + (i % 2 ? 10 : -10), y - 5); cx.stroke(); }
  } else if (f === 'musicbox') {
    cx.fillStyle = '#0b0f0d'; cx.fillRect(78, 96, 20, 10); cx.save(); cx.translate(78, 96); cx.rotate(-0.9); cx.fillRect(0, -2, 20, 2); cx.restore();
    cx.fillStyle = '#c9d2c9'; cx.fillRect(86 + Math.sin(el * 6) * 2, 91, 2, 5);
  } else return f === 'crack' || f === 'tilt';
  return true;
}
function grain(g, w, hgt, amp, tint) {                  // カメラのざらつきと色味
  const im = g.getImageData(0, 0, w, hgt), p = im.data;
  for (let i = 0; i < p.length; i += 4) {
    const n = (Math.random() - 0.5) * amp, row = (i / 4 / w) | 0, k = row % 2 ? 0.88 : 1;
    if (tint) { const val = (p[i] + n) * k; p[i] = val * 0.9; p[i + 1] = val; p[i + 2] = val * 0.88; }
    else { p[i] = (p[i] + n) * k; p[i + 1] = (p[i + 1] + n) * k; p[i + 2] = (p[i + 2] + n) * k * 0.94; }
  }
  g.putImageData(im, 0, 0);
}
function drawCam() {
  const now = Date.now(), v = door.v;
  let jump = false;
  if (door.stat > 0) { door.stat--; cx.fillStyle = '#39413d'; cx.fillRect(0, 0, CW, CH); }
  else {
    if (v && v.fig === 'tilt') {                           // 誰かがカメラの向きを変えている
      const k = Math.min(1, (now - door.t0) / 9000);
      cx.fillStyle = '#222a27'; cx.fillRect(0, 0, CW, CH); cx.save(); cx.translate(88, 55); cx.rotate(k * 0.95); cx.scale(1 + k * 0.9, 1 + k * 0.9); cx.translate(-88 + k * 70, -55 - k * 10); corridor(false); cx.restore();
    } else corridor(v && v.fig === 'open');
    if (v) {
      const el = (now - door.t0) / 1000;
      jump = now < door.forceFace || (fxOn() && !NOFACE.includes(v.fig) && el > door.jumpAt && el < door.jumpAt + 0.35);   // 一瞬だけ、すぐ目の前に来ている
      drawVisitor(v, now);
      if (jump) face(0);
    } else if (door.ghost > 0) { door.ghost--; fig(88, 64, 22, {}); }                       // 来訪者なしのはずの廊下の奥に、数コマだけ
    else if (Math.random() < 0.0015) door.ghost = 7;
  }
  grain(cx, CW, CH, door.stat > 0 ? 190 : 44, true);
  if (v && v.fig === 'crack' && door.stat <= 0) {         // レンズのひび。少しずつ伸びる
    const r = mulberry(Math.floor(door.seed * 99999) + 7), n = Math.min(9, 2 + Math.floor((now - door.t0) / 2500));
    cx.strokeStyle = 'rgba(225,235,225,.85)'; cx.lineWidth = 1;
    for (let i = 0; i < n; i++) { let x = 124, y = 30; cx.beginPath(); cx.moveTo(x, y); const a = r() * 6.28; for (let k = 0; k < 4; k++) { x += Math.cos(a + (r() - 0.5)) * (8 + r() * 14); y += Math.sin(a + (r() - 0.5)) * (8 + r() * 14); cx.lineTo(x, y); } cx.stroke(); }
  }
  if (jump || Math.random() < 0.07) { const y = ri(0, CH - 14); cx.drawImage(cam, 0, y, CW, 12, ri(-14, 14), y, CW, 12); }   // 映像の横ずれ
}
