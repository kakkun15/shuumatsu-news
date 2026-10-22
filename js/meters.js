/* 第七管区 緊急放送網：計器（線量・気温など）と画面下の通達。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 計器 ================= */
const DOSE_BASE = 1.2;
let dose = DOSE_BASE, doseTarget = DOSE_BASE;
const trace = Array.from({ length: 90 }, () => DOSE_BASE + (Math.random() - 0.5) * 0.3);
let temp = -9.4, windDir = 7, windSp = 6, water = 41, power = 63;
{ const t0 = new Date(); temp = -11.5 + 6.5 * Math.cos((t0.getHours() + t0.getMinutes() / 60 - 14) / 24 * 2 * Math.PI); }
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function drawSpark() {
  const c = $('spark'), dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (!w) return;
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const max = Math.max(5, Math.max(...trace) * 1.15);
  const x = i => (i / (trace.length - 1)) * (w - 6);
  const y = v => h - 2 - (v / max) * (h - 8);
  g.strokeStyle = css('--line'); g.lineWidth = 1;
  for (let k = 1; k <= 3; k++) { const yy = Math.round(h * k / 4) + .5; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
  const col = dose < 5 ? css('--teal') : dose < 20 ? css('--amber') : css('--flare');
  g.beginPath(); g.moveTo(x(0), y(trace[0]));
  trace.forEach((v, i) => g.lineTo(x(i), y(v)));
  g.strokeStyle = col; g.lineWidth = 1.6; g.stroke();
  g.lineTo(x(trace.length - 1), h); g.lineTo(0, h); g.closePath();
  g.globalAlpha = .14; g.fillStyle = col; g.fill(); g.globalAlpha = 1;
  g.fillStyle = col; g.fillRect(x(trace.length - 1) - 3, y(trace[trace.length - 1]) - 3, 6, 6);
}
function instruments() {
  doseTarget += (DOSE_BASE - doseTarget) * 0.012;
  dose += (doseTarget - dose) * 0.15 + (Math.random() - 0.5) * 0.1 * Math.max(1, dose * 0.12);
  dose = Math.max(0.3, dose);
  trace.push(dose); trace.shift();
  const el = $('dose');
  el.textContent = dose < 10 ? dose.toFixed(2) : dose.toFixed(1);
  const lvl = dose < 5 ? ['--teal', '屋外活動 可'] : dose < 20 ? ['--amber', '屋外 30分以内'] : ['--flare', '屋内退避'];
  el.parentElement.parentElement.style.setProperty('--dose', `var(${lvl[0]})`);
  $('doseState').textContent = lvl[1];
  if (doseTarget < DOSE_BASE + 0.5 && dose < 2 && $('doseSite').textContent !== 'KB-7 屋上観測点') $('doseSite').textContent = 'KB-7 屋上観測点';
  drawSpark();
  { const t0 = new Date(), hr = t0.getHours() + t0.getMinutes() / 60, goal = -11.5 + 6.5 * Math.cos((hr - 14) / 24 * 2 * Math.PI);   // 昼すぎが一番ましで、夜明け前が一番冷える
    temp = Math.max(-26, Math.min(-2, temp + (goal - temp) * 0.01 + (Math.random() - 0.5) * 0.3)); }
  $('temp').textContent = temp.toFixed(1);
  if (Math.random() < 0.05) windDir = (windDir + R([-1, 1]) + 8) % 8;
  windSp = Math.max(1, Math.min(24, windSp + R([-1, 0, 0, 1])));
  $('wind').textContent = `${DIR[windDir]} ${windSp}`;
  if (Math.random() < 0.03) water = water <= 6 ? ri(35, 55) : water - 1;
  power = Math.max(12, Math.min(88, power + R([-1, 0, 0, 1])));
  $('water').textContent = water; $('power').textContent = power;
  $('waterBar').style.width = water + '%'; $('waterBar').className = water < 20 ? 'low' : '';
  $('powerBar').style.width = power + '%'; $('powerBar').className = power < 25 ? 'low' : '';
}
function fillTicker() {
  const tk = $('tk'); tk.textContent = '';
  const items = Array.from({ length: 12 }, () => draw1(C.NOTICES)());
  [...items, ...items].forEach(t => { const s = document.createElement('span'); s.textContent = t; tk.append(s); });
}
$('tk').addEventListener('animationiteration', fillTicker);
