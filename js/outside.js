/* 第七管区 緊急放送網：壁外監視カメラ（壁の外の出来事と描画）。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 壁外監視カメラ ================= */
const oc = $('outCam'), ox = oc.getContext('2d'), OW = oc.width, OH = oc.height, HZ = 84;
const out = { dir: ri(0, 7), ev: null, stat: 0, weather: 1, parts: [], towers: {}, log: [], timer: 0, near: 0, seed: ri(1, 999999), vis: 9.4 };
const OUT_IDS = ['walkers', 'convoy', 'fire', 'searchlight', 'flare', 'giant', 'birds', 'tower', 'blink', 'base', 'car', 'balloon', 'glow', 'storm', 'figure',
  'herd', 'dogs', 'train', 'ship', 'kite', 'windows', 'twister', 'meteor', 'crane', 'aurora', 'moons', 'train', 'herd', 'windows'];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function setParts() {
  const n = out.weather === 2 ? 240 : out.weather === 3 ? 120 : out.weather === 1 ? 60 : 22;
  out.parts = Array.from({ length: n }, () => ({ x: Math.random() * OW, y: Math.random() * OH, v: 0.3 + Math.random() }));
}
function outInfo(cap, alert) {
  $('outDir').textContent = `CAM-W ${DIR[out.dir]}`;
  $('outCap').textContent = cap;
  $('out').dataset.alert = alert ? '1' : '0';
  out.vis = out.weather === 2 ? ri(1, 8) / 10 : out.weather === 3 ? ri(8, 30) / 10 : ri(60, 140) / 10;
  $('outVis').textContent = `${out.vis.toFixed(1)}km`;
  const ev = out.ev;
  $('outMov').textContent = ev && !['storm', 'glow', 'fire', 'tower', 'blast', 'aurora', 'moons', 'meteor', 'windows', 'ship', 'twister', 'crane', 'kite', 'train'].includes(ev.id) ? (ev.id === 'herd' ? ev.n * 4 : ev.n) : 0;
  $('outNear').textContent = ev && !['storm', 'birds', 'balloon', 'aurora', 'moons', 'meteor', 'kite'].includes(ev.id) ? (ev.id === 'base' ? '0m' : `${ev.km}km`) : '—';
}
function outLogAdd(text) {
  out.log.unshift(`${hhmm(new Date())} ${text}`); if (out.log.length > 2) out.log.pop();
  const ul = $('outLog'); ul.textContent = '';
  out.log.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
}
function outEnd() {
  if (out.ev && out.ev.id === 'storm') { out.weather = 1; setParts(); }
  out.ev = null; outInfo(draw1(C.OUT.idle), false);
  clearTimeout(out.timer); out.timer = setTimeout(outAuto, ri(18000, 55000));
}
function outTrigger(id, o) {
  o = o || {};
  if (!C.OUT[id]) return;
  clearTimeout(out.timer);
  if (o.dirName && DIR.indexOf(o.dirName) >= 0 && DIR.indexOf(o.dirName) !== out.dir) { out.dir = DIR.indexOf(o.dirName); out.stat = 5; }
  if (out.ev && out.ev.id === 'storm') { out.weather = 1; setParts(); }
  const ev = { id, t0: Date.now(), dur: o.dur || ri(20, 42), x: ri(34, OW - 34), n: ri(3, 12), km: o.km || ri(1, 9), seed: ri(1, 99999) };
  if (id === 'walkers') {
    out.near = o.near != null ? o.near : Math.min(0.8, out.near + 0.12);
    ev.near = out.near; ev.n = ri(12, 60); ev.km = Math.max(0.2, +(6 * (1 - out.near)).toFixed(1));
    if (out.near > 0.85) { ev.id = 'base'; id = 'base'; }
  }
  if (id === 'tower') { const t = out.towers[out.dir] || { x: ev.x, near: 0 }; if (o.near) t.near = o.near; out.towers[out.dir] = t; ev.km = Math.round(9 - t.near * 5); }
  if (id === 'storm') { out.weather = 2; setParts(); }
  if (id === 'base') ev.n = ri(5, 9);
  out.ev = ev;
  const cap = draw1(C.OUT[id])(DIR[out.dir], ev.km, ev.n);
  outInfo(cap, true); outLogAdd(cap);
  if (!o.quiet && Math.random() < 0.22) react('outev', null, ri(3000, 7000));
  if (Date.now() > paneHold) paneByName('out', 14000);
  out.timer = setTimeout(outEnd, ev.dur * 1000);
}
function outAuto() {
  if (Math.random() < 0.45) { out.dir = (out.dir + R([1, 7, 2, 6])) % 8; out.stat = 5; }
  outTrigger(draw1(OUT_IDS));
}
function sky() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  if (h < 5.5 || h >= 20.5) return ['#090d10', '#172024', 0.34];
  if (h < 7.5 || h >= 17) return ['#1a1f24', '#5d4634', 0.6];
  return ['#454e4f', '#7b7d70', 1];
}
function smoke(x, e, big) {
  for (let k = 0; k < (big ? 9 : 6); k++) {
    ox.fillStyle = `rgba(7,8,8,${0.5 - k * 0.04})`;
    ox.beginPath(); ox.arc(x + Math.sin(k * 1.3 + e * 0.6) * (2 + k), HZ - 5 - k * 7 - (e * 3 % 7), 4 + k * (big ? 2.2 : 1.5), 0, 7); ox.fill();
  }
}
function drawOut(target) {
  const now = Date.now(), ev = out.ev, [c1, c2, L] = sky(), e = ev ? (now - ev.t0) / 1000 : 0, prog = ev ? e / ev.dur : 0;
  if (out.stat > 0) { out.stat--; ox.fillStyle = '#3a3f3b'; ox.fillRect(0, 0, OW, OH); grain(ox, OW, OH, 190, false); return; }
  let g = ox.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ox.fillStyle = g; ox.fillRect(0, 0, OW, HZ);
  let light = 0;                                         // 画面全体を照らす光（信号弾・爆発・探照灯）
  if (ev) {
    if (ev.id === 'fire' || ev.id === 'blast') {
      const fl = 0.75 + Math.sin(e * 9) * 0.12 + Math.sin(e * 23) * 0.08, a = ev.id === 'blast' ? Math.max(0, 0.5 - e * 0.06) : 0.5;
      g = ox.createRadialGradient(ev.x, HZ, 1, ev.x, HZ, 34 * fl); g.addColorStop(0, `rgba(255,140,50,${a})`); g.addColorStop(1, 'rgba(255,90,30,0)');
      ox.fillStyle = g; ox.fillRect(0, 0, OW, HZ + 6);
      if (ev.id === 'blast' && e < 0.5) light = (1 - e * 2) * 0.75;
    }
    if (ev.id === 'giant') {                             // 廃墟の向こうを通る大きな影
      const x = -34 + prog * (OW + 68), bob = Math.sin(e * 1.1) * 2;
      ox.fillStyle = 'rgba(5,7,8,.92)'; ox.beginPath(); ox.ellipse(x, HZ - 4 + bob, 22, 38, 0, Math.PI, 0); ox.fill();
      ox.beginPath(); ox.ellipse(x + 15, HZ - 30 + bob, 9, 12, 0.3, 0, 7); ox.fill();
    }
    if (ev.id === 'flare' && e < 11) {
      const k = Math.min(1, e / 11), fx = ev.x + k * 18, fy = HZ - 8 - Math.sin(k * Math.PI) * 62;
      light = Math.sin(k * Math.PI) * 0.16;
      ox.fillStyle = '#ffd0c0'; ox.fillRect(fx - 1, fy - 1, 3, 3); ox.fillStyle = 'rgba(255,120,90,.35)'; ox.beginPath(); ox.arc(fx, fy, 6, 0, 7); ox.fill();
    }
    if (ev.id === 'balloon') {
      const x = -10 + prog * (OW + 20), y = 22 + Math.sin(e * 0.4) * 4;
      ox.fillStyle = 'rgba(6,8,8,.9)'; ox.beginPath(); ox.ellipse(x, y, 5, 6.5, 0, 0, 7); ox.fill(); ox.fillRect(x, y + 6, 1, 7); ox.fillRect(x - 1, y + 13, 3, 3);
    }
    if (ev.id === 'birds') {
      ox.fillStyle = L > 0.5 ? 'rgba(8,10,10,.9)' : 'rgba(190,200,190,.6)';
      for (let i = 0; i < 34; i++) ox.fillRect(ev.x + Math.cos(i * 1.7 + e * 1.3) * (16 + (i % 7) * 4), 38 + Math.sin(i * 2.3 + e * 1.7) * (8 + (i % 5) * 3), 2, 1);
    }
    if (ev.id === 'meteor') {
      for (let i = 0; i < ev.n; i++) { const k = (e * 0.5 + i * 0.37) % 1.7; if (k < 1) { const x = (ev.seed * (i + 3)) % OW + k * 40, y = k * 62; ox.strokeStyle = `rgba(255,240,210,${1 - k})`; ox.lineWidth = 1; ox.beginPath(); ox.moveTo(x, y); ox.lineTo(x - 10, y - 14); ox.stroke(); } }
    }
    if (ev.id === 'aurora') {
      for (let i = 0; i < 5; i++) { const g2 = ox.createLinearGradient(0, 6, 0, 62); g2.addColorStop(0, 'rgba(90,255,170,0)'); g2.addColorStop(0.5, `rgba(90,255,170,${0.12 + Math.sin(e * 0.7 + i) * 0.06})`); g2.addColorStop(1, 'rgba(90,255,170,0)'); ox.fillStyle = g2; ox.fillRect(18 + i * 44 + Math.sin(e * 0.4 + i * 2) * 14, 6, 26, 56); }
    }
    if (ev.id === 'moons') { ox.fillStyle = 'rgba(225,228,210,.85)'; ox.beginPath(); ox.arc(ev.x, 24, 6, 0, 7); ox.fill(); ox.beginPath(); ox.arc(ev.x + 26, 31, 3.5, 0, 7); ox.fill(); }
    if (ev.id === 'kite') {
      const kx = ev.x + Math.sin(e * 0.9) * 10, ky = 30 + Math.cos(e * 1.3) * 5;
      ox.strokeStyle = 'rgba(10,12,12,.8)'; ox.lineWidth = 1; ox.beginPath(); ox.moveTo(ev.x - 12, HZ - 8); ox.quadraticCurveTo(ev.x, 52, kx, ky); ox.stroke();
      ox.fillStyle = 'rgba(8,10,10,.95)'; ox.beginPath(); ox.moveTo(kx, ky - 6); ox.lineTo(kx + 5, ky); ox.lineTo(kx, ky + 7); ox.lineTo(kx - 5, ky); ox.fill();
    }
  }
  /* 廃墟の輪郭（方角ごとに決まった形） */
  const rnd = mulberry(out.seed + out.dir * 977);
  ox.fillStyle = 'rgba(9,13,14,.9)';
  const wins = [];
  for (let x = -4; x < OW;) {
    const w = 4 + rnd() * 11, hgt = 3 + rnd() * rnd() * 42;
    ox.fillRect(x, HZ - hgt, w, hgt + 1);
    if (rnd() < 0.28) ox.fillRect(x + w / 2, HZ - hgt - 3 - rnd() * 9, 1, 12);
    if (hgt > 14) wins.push([x + 1 + rnd() * (w - 3), HZ - 4 - rnd() * (hgt - 8)]);
    x += w + rnd() * 6;
  }
  const tw = out.towers[out.dir];
  if (tw) { const th = 44 + tw.near * 22, w = 3 + tw.near * 4; ox.fillRect(tw.x, HZ - th, w, th); if ((now / 900 | 0) % 3 === 0) { ox.fillStyle = '#ffb090'; ox.fillRect(tw.x + w / 2 - 1, HZ - th - 2, 2, 2); } }
  if (ev && ev.id === 'blink' && wins.length) {
    const wv = wins[ev.seed % wins.length], pat = [1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0];
    if (pat[(e * 2.5 | 0) % pat.length]) { ox.fillStyle = '#ffe9a8'; ox.fillRect(wv[0], wv[1], 2, 2); ox.fillStyle = 'rgba(255,233,168,.25)'; ox.fillRect(wv[0] - 2, wv[1] - 2, 6, 6); }
  }
  if (ev && ev.id === 'windows' && e > 2 && e < ev.dur - 3) { ox.fillStyle = '#ffe9a8'; wins.forEach((wv, i) => { if (e > 4 || i % 2 === ev.seed % 2) ox.fillRect(wv[0], wv[1], 2, 2); }); }
  if (ev && ev.id === 'crane') {
    const bx = ev.x, a = Math.sin(e * 0.25) * 0.9, hx = bx + Math.cos(a) * 30;
    ox.fillStyle = 'rgba(9,13,14,.95)'; ox.fillRect(bx, HZ - 50, 2, 50); ox.strokeStyle = 'rgba(9,13,14,.95)'; ox.lineWidth = 2;
    ox.beginPath(); ox.moveTo(bx - Math.cos(a) * 10, HZ - 50 + Math.sin(a) * 2); ox.lineTo(bx + Math.cos(a) * 34, HZ - 50 - Math.sin(a) * 6); ox.stroke();
    ox.lineWidth = 1; ox.beginPath(); ox.moveTo(hx, HZ - 50 - Math.sin(a) * 5); ox.lineTo(hx, HZ - 28); ox.stroke(); ox.fillRect(hx - 2, HZ - 28, 5, 5);
  }
  if (ev && ev.id === 'ship') {
    const sx = ev.x; ox.fillStyle = 'rgba(9,13,14,.96)'; ox.beginPath(); ox.moveTo(sx - 30, HZ - 6); ox.lineTo(sx + 34, HZ - 11); ox.lineTo(sx + 26, HZ + 3); ox.lineTo(sx - 22, HZ + 4); ox.fill();
    ox.fillRect(sx - 6, HZ - 21, 14, 12); ox.fillRect(sx + 1, HZ - 31, 3, 10);
  }
  if (ev && ev.id === 'searchlight') {
    const a = Math.PI / 2 + Math.sin(e * 0.55) * 1.15, tx = ev.x, ty = HZ - 22;
    ox.fillStyle = 'rgba(9,13,14,.9)'; ox.fillRect(tx - 1, ty, 3, 22);
    ox.fillStyle = 'rgba(232,238,214,.17)'; ox.beginPath(); ox.moveTo(tx, ty); ox.lineTo(tx + Math.cos(a - 0.09) * 260, ty + Math.sin(a - 0.09) * 260); ox.lineTo(tx + Math.cos(a + 0.09) * 260, ty + Math.sin(a + 0.09) * 260); ox.fill();
    if (Math.abs(Math.sin(e * 0.55)) < 0.12) light = 0.22;
    ox.fillStyle = '#f4f6e0'; ox.fillRect(tx, ty - 1, 2, 2);
  }
  /* 地面 */
  g = ox.createLinearGradient(0, HZ, 0, OH); g.addColorStop(0, `rgb(${42 * L + 14 | 0},${47 * L + 16 | 0},${44 * L + 15 | 0})`); g.addColorStop(1, `rgb(${20 * L + 6 | 0},${24 * L + 8 | 0},${22 * L + 7 | 0})`);
  ox.fillStyle = g; ox.fillRect(0, HZ, OW, OH - HZ);
  ox.fillStyle = 'rgba(6,8,8,.5)'; for (let i = 0; i < 46; i++) { const y = HZ + 2 + rnd() * 30; ox.fillRect(rnd() * OW, y, 1 + rnd() * (y - HZ) * 0.2, 1); }
  ox.strokeStyle = 'rgba(8,10,10,.55)'; ox.lineWidth = 1; ox.beginPath(); ox.moveTo(OW * 0.5 - 2, HZ); ox.lineTo(OW * 0.5 - 46, OH); ox.moveTo(OW * 0.5 + 2, HZ); ox.lineTo(OW * 0.5 + 46, OH); ox.stroke();
  if (ev) {
    if (ev.id === 'fire' || ev.id === 'blast') smoke(ev.x, e, ev.id === 'blast');
    if (ev.id === 'glow') { g = ox.createRadialGradient(ev.x, HZ + 4, 1, ev.x, HZ + 4, 40); g.addColorStop(0, `rgba(120,255,220,${0.2 + Math.sin(e * 1.3) * 0.07})`); g.addColorStop(1, 'rgba(120,255,220,0)'); ox.fillStyle = g; ox.fillRect(0, HZ - 30, OW, 60); }
    if (ev.id === 'convoy') for (let i = 0; i < ev.n; i++) { const x = (prog * 1.35 - i * 0.055) * OW; if (x > 0 && x < OW) { ox.fillStyle = 'rgba(255,217,160,.3)'; ox.fillRect(x - 2, HZ, 5, 4); ox.fillStyle = '#ffd9a0'; ox.fillRect(x, HZ + 1, 2, 1); } }
    if (ev.id === 'walkers') {
      const k = ev.near || 0, y = HZ + 3 + k * 24, n = Math.min(ev.n, 26), r2 = mulberry(ev.seed);
      ox.fillStyle = '#050707';
      for (let i = 0; i < n; i++) {
        const hgt = (3 + k * 12) * (0.82 + r2() * 0.3), x = 14 + (i + 0.2 + r2() * 0.6) * (OW - 28) / n, w = Math.max(1, hgt * 0.24), yy = y + r2() * 2;
        ox.fillRect(x, yy - hgt * 0.8, w, hgt * 0.8); ox.fillRect(x - 0.4, yy - hgt - 0.5, w + 0.8, hgt * 0.17 + 0.6);
      }
    }
    if (ev.id === 'figure') {
      const y = HZ + 18; ox.fillStyle = '#050707'; ox.fillRect(ev.x, y - 10, 3, 10); ox.fillRect(ev.x - 0.5, y - 13, 4, 3.5);
      if (Math.sin(e * 2.2) > 0) { ox.strokeStyle = '#050707'; ox.lineWidth = 1.4; ox.beginPath(); ox.moveTo(ev.x + 2, y - 9); ox.lineTo(ev.x + 6, y - 15); ox.stroke(); }
    }
    if (ev.id === 'car') {
      const y = HZ + 15, on = e > 3;
      ox.fillStyle = '#060808'; ox.fillRect(ev.x - 4, y - 3, 13, 4);
      if (on) { ox.fillStyle = 'rgba(255,240,200,.14)'; ox.beginPath(); ox.moveTo(ev.x, y); ox.lineTo(ev.x - 40, OH); ox.lineTo(ev.x + 46, OH); ox.lineTo(ev.x + 5, y); ox.fill(); ox.fillStyle = '#fff3cf'; ox.fillRect(ev.x - 1, y - 1, 2, 2); ox.fillRect(ev.x + 4, y - 1, 2, 2); }
    }
    if (ev.id === 'train') { const x0 = OW - prog * (OW + 120); ox.fillStyle = '#060808'; ox.fillRect(x0, HZ - 1, 110, 4); ox.fillStyle = '#ffd9a0'; for (let i = 0; i < 12; i++) ox.fillRect(x0 + 6 + i * 8.5, HZ, 3, 1); }
    if (ev.id === 'herd' || ev.id === 'dogs') {
      const r2 = mulberry(ev.seed), dg = ev.id === 'dogs', n = dg ? 9 : 14; ox.fillStyle = '#050707';
      for (let i = 0; i < n; i++) {
        const k = dg ? Math.min(1, prog * 1.3) : 0.3, x = dg ? 30 + r2() * 180 : ((prog * 1.3 + r2()) % 1.2) * OW - 10, y = HZ + 4 + k * 22 + r2() * 8, s = 1 + k * 2.2 + (dg ? 0 : 1);
        ox.fillRect(x, y - s * 1.6, s * 3.2, s * 1.4); ox.fillRect(x + s * 2.8, y - s * 2.4, s, s); ox.fillRect(x + 0.3, y - s * 0.4, 0.8, s); ox.fillRect(x + s * 2.4, y - s * 0.4, 0.8, s + Math.sin(e * 8 + i) * 0.8);
      }
    }
    if (ev.id === 'twister') { const x = ev.x + Math.sin(e * 0.2) * 30; for (let i = 0; i < 14; i++) { ox.fillStyle = `rgba(60,60,54,${0.5 - i * 0.02})`; ox.beginPath(); ox.ellipse(x + Math.sin(e * 3 + i * 0.8) * (1 + i * 0.5), HZ - i * 5, 2 + i * 0.9, 3, 0, 0, 7); ox.fill(); } }
    if (ev.id === 'base') {                              // 壁のすぐ下から見上げている頭
      const r2 = mulberry(ev.seed); ox.fillStyle = '#030404';
      for (let i = 0; i < ev.n; i++) { const x = 14 + r2() * (OW - 28), y = OH - 15 + Math.sin(e * 0.9 + i) * 0.8; ox.beginPath(); ox.arc(x, y, 4 + r2() * 1.5, Math.PI, 0); ox.fill(); ox.fillStyle = 'rgba(232,240,228,.8)'; ox.fillRect(x - 2, y - 2.5, 1, 1); ox.fillRect(x + 1, y - 2.5, 1, 1); ox.fillStyle = '#030404'; }
    }
  }
  /* 手前：壁の上端と鉄条網 */
  ox.fillStyle = '#06080a'; ox.fillRect(0, OH - 15, OW, 15);
  for (let x = 6; x < OW; x += 34) ox.fillRect(x, OH - 24, 2, 10);
  ox.strokeStyle = '#06080a'; ox.lineWidth = 1; ox.beginPath();
  for (let x = 6; x < OW; x += 34) { ox.moveTo(x, OH - 23); ox.quadraticCurveTo(x + 17, OH - 19, x + 34, OH - 23); ox.moveTo(x, OH - 19); ox.quadraticCurveTo(x + 17, OH - 16, x + 34, OH - 19); }
  ox.stroke();
  /* 天気 */
  const wv = out.weather;
  if (wv === 2) { ox.fillStyle = 'rgba(96,94,84,.5)'; ox.fillRect(0, 0, OW, OH); }
  ox.fillStyle = wv === 3 ? 'rgba(4,5,5,.7)' : `rgba(${150 * L + 60 | 0},${150 * L + 60 | 0},${140 * L + 55 | 0},.6)`;
  for (const p of out.parts) {
    if (wv === 2) { p.x += 3 + p.v * 4; p.y += p.v * 0.6; } else if (wv === 3) { p.x += 0.8; p.y += 5 + p.v * 3; } else { p.x += 0.2 + p.v * 0.3; p.y += 0.25 + p.v * 0.35; }
    if (p.x > OW) p.x -= OW; if (p.y > OH) { p.y -= OH; p.x = Math.random() * OW; }
    if (wv === 3) ox.fillRect(p.x, p.y, 1, 5); else ox.fillRect(p.x, p.y, wv === 2 ? 2 : 1, 1);
  }
  if (light > 0) { ox.fillStyle = `rgba(255,244,226,${light})`; ox.fillRect(0, 0, OW, OH); }
  grain(ox, OW, OH, 26, false);
  if (Math.random() < 0.03) { const y = ri(0, OH - 10); ox.drawImage(oc, 0, y, OW, 8, ri(-8, 8), y, OW, 8); }
}
