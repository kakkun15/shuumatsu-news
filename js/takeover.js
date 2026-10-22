/* 第七管区 緊急放送網：画面の乗っ取り。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 画面の乗っ取り（操作しなくても自動で終わる） ================= */
const takeEl = $('take'), tc = $('takeCam'), tx2 = tc.getContext('2d');
const take = { busy: false, timers: [], mode: '', t0: 0, frame: 0 };
const canTake = () => prefs.take && !reduced && !take.busy;
function T(ms, fn) { take.timers.push(setTimeout(fn, ms)); }
function takeShow(cls, big, sub, top) {
  takeEl.className = 'take ' + cls; takeEl.hidden = false;
  $('takeBig').textContent = big || ''; $('takeSub').textContent = sub || ''; $('takeTop').textContent = top || '';
}
function takeEnd(text) {
  take.timers.forEach(clearTimeout); take.timers = []; take.busy = false; take.mode = '';
  takeEl.hidden = true; clearInterval(take.frame);
  app.classList.remove('mirror');
  if (text) note(text, 9000);
  if (Math.random() < 0.6) { let p; soon(2500, () => { p = post(uniq(() => R(C.REACT.take)())); }); react('takeRe', null, 6000, () => p); }
  setTimeout(takeAuto, ri(240000, 600000));
}
function takeFrames(fn) { clearInterval(take.frame); fn(); take.frame = setInterval(fn, 90); }
function staticFrame() {
  const im = tx2.createImageData(tc.width, tc.height), p = im.data;
  for (let i = 0; i < p.length; i += 4) { const v = 30 + Math.random() * 120; p[i] = v * 0.92; p[i + 1] = v; p[i + 2] = v * 0.9; p[i + 3] = 255; }
  tx2.putImageData(im, 0, 0);
}
function roomFrame() {                                  // 登録のない室内カメラ：画面を見ている人影を、うしろから
  const e = (Date.now() - take.t0) / 1000, w = tc.width, hgt = tc.height;
  tx2.fillStyle = '#12181a'; tx2.fillRect(0, 0, w, hgt);
  tx2.fillStyle = '#1c2426'; tx2.fillRect(0, hgt - 34, w, 34);
  const gl = tx2.createRadialGradient(120, 56, 4, 120, 56, 90); gl.addColorStop(0, 'rgba(120,190,170,.5)'); gl.addColorStop(1, 'rgba(120,190,170,0)');
  tx2.fillStyle = gl; tx2.fillRect(0, 0, w, hgt);
  tx2.fillStyle = '#9fd6c4'; tx2.fillRect(96, 40, 48, 30); tx2.fillStyle = '#0d1414'; tx2.fillRect(99, 43, 42, 24);   // この受信機
  tx2.fillStyle = '#030505';                               // 座っている人（あなた）
  tx2.beginPath(); tx2.ellipse(120, 78, 9, 10, 0, 0, 7); tx2.fill(); tx2.beginPath(); tx2.moveTo(98, hgt); tx2.lineTo(102, 94); tx2.quadraticCurveTo(120, 84, 138, 94); tx2.lineTo(142, hgt); tx2.fill();
  if (e > 2.5) {                                           // うしろに、もうひとり。少しずつ近づく
    const k = Math.min(1, (e - 2.5) / 5), x = 196 - k * 44, s = 0.8 + k * 0.7;
    tx2.globalAlpha = Math.min(1, (e - 2.5) / 1.5);
    tx2.beginPath(); tx2.ellipse(x, hgt - 62 * s, 8 * s, 10 * s, 0, 0, 7); tx2.fill(); tx2.beginPath(); tx2.moveTo(x - 20 * s, hgt); tx2.lineTo(x - 16 * s, hgt - 46 * s); tx2.quadraticCurveTo(x, hgt - 56 * s, x + 16 * s, hgt - 46 * s); tx2.lineTo(x + 20 * s, hgt); tx2.fill();
    tx2.globalAlpha = 1;
  }
  grain(tx2, w, hgt, 40, true);
}
const SCENES = {
  signal() {                                            // 不明信号の割り込み
    const lines = draw1(C.TAKE.signal)(), sec = 3 + lines.length * 1.2;
    takeShow('feed'); takeFrames(staticFrame); sfx('static', 0.8);
    T(800, () => { clearInterval(take.frame); takeShow('', ''); });
    lines.forEach((l, i) => T(1000 + i * 1200, () => { $('takeBig').textContent = lines.slice(0, i + 1).join('\n'); sfx('tick'); }));
    T(1000 + lines.length * 1200 + 2400, () => { takeShow('feed'); takeFrames(staticFrame); sfx('static', 0.4); });
    T(1000 + lines.length * 1200 + 2800, () => takeEnd(C.TAKE.note(Math.round(sec + 1))));
  },
  pink() {                                              // 親切な声による全画面のお知らせ
    const [a, b] = draw1(C.TAKE.pink)();
    takeShow('pink', a, ''); sfx('bells');
    T(2200, () => { $('takeSub').textContent = b; });
    T(9500, () => { takeShow('', ''); });
    T(9800, () => takeEnd('先ほどの全画面表示は、当局のものではありません。指示に従わないでください。'));
  },
  crash() {                                             // 受信機の異常終了と再起動
    const lines = draw1(C.TAKE.crash)();
    takeShow('term', ''); sfx('static', 0.3);
    lines.forEach((l, i) => T(500 + i * 950, () => { $('takeBig').textContent = lines.slice(0, i + 1).join('\n') + ' _'; sfx('tick'); }));
    T(500 + lines.length * 950 + 1200, () => takeShow('', ''));
    T(500 + lines.length * 950 + 1700, () => takeEnd('受信機は再起動しました。再起動中の表示内容について、当局は関知しません。'));
  },
  count() {                                             // 目的の分からないカウントダウン
    const n = ri(8, 14);
    takeShow('count', `00:${pad(n)}`);
    for (let i = 1; i <= n; i++) T(i * 1000, () => { $('takeBig').textContent = `00:${pad(n - i)}`; sfx('tick'); });
    T(n * 1000 + 2600, () => takeEnd(draw1(C.TAKE.countEnd)));
  },
  room() {                                              // 登録のない室内カメラの映像
    take.t0 = Date.now(); takeShow('feed', '', '', draw1(C.TAKE.room)); takeFrames(roomFrame); sfx('static', 0.3);
    T(8200, () => { takeFrames(staticFrame); sfx('static', 0.5); });
    T(8700, () => takeEnd('CAM-00 の映像は確認できなくなりました。設置場所は分かっていません。'));
  },
  doorfull() {                                          // 来訪者が映像を占有する
    for (let i = 0; i < 6 && (!door.v || NOFACE.includes(door.v.fig)); i++) { if (door.v) { door.v = null; } doorRing(); }
    const v = door.v, said = v.said.startsWith('（') ? '開けて' : v.said;
    takeShow('feed', '', '', `${$('doorCam').textContent}　応答禁止`);
    takeFrames(() => { tx2.imageSmoothingEnabled = false; tx2.drawImage(cam, 0, 0, tc.width, tc.height); });
    sfx('knock');
    T(1500, () => { $('takeSub').textContent = `「${said}」`; });
    T(3600, () => { door.forceFace = Date.now() + 2600; $('takeSub').textContent = `「${said}」\n「${said}」`; sfx('knock'); });
    T(5200, () => { $('takeSub').textContent = `「${said}」\n「${said}」\n「見えてるんでしょう」`; });
    T(7000, () => { takeFrames(staticFrame); sfx('static', 0.4); });
    T(7400, () => takeEnd('インターホンの映像を通常表示に戻しました。来訪者は、まだ扉の前にいます。'));
  },
  wallfull() {                                          // 壁外カメラが全画面に。人影が壁の下まで来ている
    outTrigger('walkers', { near: 0.95, dur: 14, quiet: true });
    takeShow('feed', '', '', `CAM-W ${DIR[out.dir]}　動体検知`);
    takeFrames(() => { tx2.imageSmoothingEnabled = false; tx2.drawImage(oc, 0, 0); });
    T(1800, () => { $('takeSub').textContent = '壁の真下に、複数の反応。'; });
    T(4200, () => { $('takeSub').textContent = '壁の真下に、複数の反応。\n全員が、このカメラを見ています。'; sfx('tick'); });
    T(7600, () => { takeFrames(staticFrame); sfx('static', 0.4); });
    T(8000, () => takeEnd('壁外カメラの全画面表示を解除しました。壁の下の反応は、数えられていません。'));
  },
  evac() {                                              // 当局のものではない退去表示
    const [a, b] = draw1(C.TAKE.evac);
    takeShow('red', a, b.replace('{n}', ri(2, 40))); sfx('klaxon');
    T(6000, () => takeShow('', ''));
    T(6400, () => takeEnd(draw1(C.TAKE.evacEnd)));
  },
  mirror() {                                            // 表示が左右逆になる
    take.busy = true; app.classList.add('mirror'); note('表示系統の異常：左右が入れ替わっています', 5200); sfx('static', 0.3);
    T(5200, () => takeEnd('表示は元に戻りました。逆になっていたのがどちらだったのかは、確認できていません。'));
  }
};
const SCENE_IDS = Object.keys(SCENES);
function takeover(id) {
  if (take.busy) return;
  take.busy = true; duckMusic(12);
  SCENES[id || draw1(SCENE_IDS)]();
}
function takeAuto() { if (canTake()) takeover(); else setTimeout(takeAuto, 60000); }
