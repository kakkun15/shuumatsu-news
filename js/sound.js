/* 第七管区 緊急放送網：音：共通の配線・効果音・警報・呼び鈴・読み上げ。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 音：共通の配線 ================= */
let ac = null, G = null;
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) { const m = /^([A-G])(#|b)?(\d)$/.exec(n); return SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12; }
const hzOf = p => 440 * Math.pow(2, (p - 69) / 12);
function noiseBuf(ctx, sec, fn) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = fn(i, n, ctx.sampleRate);
  return b;
}
function shaperCurve(k) {
  const c = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}
function crackleBuf() {
  const rev = 1.8, turns = 4, sr = ac.sampleRate, n = Math.floor(rev * turns * sr);   // 33 1/3回転：1周1.8秒
  const b = ac.createBuffer(1, n, sr), d = b.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, w = Math.random() * 2 - 1;
    brown = (brown + 0.02 * w) / 1.02;                                   // モーターのゴロゴロ
    const swish = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / rev);           // 反った盤：1周ごとに「サー…サー…」と強弱がつく
    d[i] = w * 0.035 * swish + brown * 0.7 + Math.sin(2 * Math.PI * 100 * t) * 0.006;
  }
  const tickAt = (at, amp, tau) => { const s = Math.floor(at * sr); for (let i = 0; i < tau * sr * 6 && s + i < n; i++) d[s + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (tau * sr)); };
  for (let k = 0; k < 240; k++) tickAt(Math.random() * rev * turns, 0.1 + Math.pow(Math.random(), 3) * 0.9, 0.0003 + Math.random() * 0.001);   // 細かいパチパチ
  for (let k = 0; k < 7; k++) { const at = Math.random() * (rev * turns - 0.1); for (let j = 0; j < 14; j++) tickAt(at + Math.random() * 0.06, 0.3, 0.0005); }   // ほこりの塊
  for (let t = 0; t < turns; t++) { tickAt(t * rev + 0.31, 1.0, 0.0016); tickAt(t * rev + 1.12, 0.6, 0.001); tickAt(t * rev + 1.47, 0.35, 0.0008); }   // 毎周同じ場所の傷
  return b;
}
function ensureAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const g = {};
    g.master = ac.createGain();
    g.comp = ac.createDynamicsCompressor(); g.comp.threshold.value = -12; g.comp.ratio.value = 12; g.comp.attack.value = 0.003; g.comp.release.value = 0.25;
    g.master.connect(g.comp); g.comp.connect(ac.destination);
    g.conv = ac.createConvolver();
    g.conv.buffer = noiseBuf(ac, 3.4, (i, n) => (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6));
    g.wet = ac.createGain(); g.wet.gain.value = 0.42; g.conv.connect(g.wet); g.wet.connect(g.master);
    /* 蓄音機：盤 → 回転むら → ラッパの帯域 → 歪み → 1周ごとの音量の揺れ → 音量 */
    g.recBus = ac.createGain();
    g.wow = ac.createDelay(0.2); g.wow.delayTime.value = 0.045;
    g.trem = ac.createGain();
    const lfo = (f, param) => { const o = ac.createOscillator(), a = ac.createGain(); o.frequency.value = f; a.gain.value = 0; o.connect(a); a.connect(param); o.start(); return a; };
    g.wowDepth = lfo(0.556, g.wow.delayTime); g.flutDepth = lfo(7.1, g.wow.delayTime); g.warpDepth = lfo(0.11, g.wow.delayTime);
    g.tremDepth = lfo(0.556, g.trem.gain);
    g.hp = ac.createBiquadFilter(); g.hp.type = 'highpass'; g.hp.frequency.value = 230;
    g.lp = ac.createBiquadFilter(); g.lp.type = 'lowpass'; g.lp.frequency.value = 3000;
    g.pk = ac.createBiquadFilter(); g.pk.type = 'peaking'; g.pk.frequency.value = 1100; g.pk.Q.value = 0.9; g.pk.gain.value = 6;
    g.pk2 = ac.createBiquadFilter(); g.pk2.type = 'peaking'; g.pk2.frequency.value = 2300; g.pk2.Q.value = 1.4; g.pk2.gain.value = 4;   // ラッパの鳴り
    g.sh = ac.createWaveShaper(); g.sh.curve = shaperCurve(2.4);
    g.vol = ac.createGain(); g.duck = ac.createGain(); g.send = ac.createGain();
    g.recBus.connect(g.wow); g.wow.connect(g.hp); g.hp.connect(g.lp); g.lp.connect(g.pk); g.pk.connect(g.pk2); g.pk2.connect(g.sh); g.sh.connect(g.trem); g.trem.connect(g.vol);
    g.vol.connect(g.duck); g.duck.connect(g.master); g.duck.connect(g.send); g.send.connect(g.conv);
    g.crackle = ac.createGain(); g.crackle.gain.value = 0;
    const cs = ac.createBufferSource(); cs.buffer = crackleBuf(); cs.loop = true; cs.connect(g.crackle); g.crackle.connect(g.vol); cs.start();
    g.popBuf = noiseBuf(ac, 0.03, (i, n, sr) => (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.004)));
    /* 警報：無線機の帯域 → 歪み → 残響 */
    g.alertBus = ac.createGain();
    g.bp = ac.createBiquadFilter(); g.bp.type = 'bandpass'; g.bp.frequency.value = 1500; g.bp.Q.value = 0.8;
    g.shA = ac.createWaveShaper(); g.shA.curve = shaperCurve(4);
    g.alertOut = ac.createGain(); g.alertOut.gain.value = 0.8; g.alertSend = ac.createGain(); g.alertSend.gain.value = 0.5;
    g.alertBus.connect(g.bp); g.bp.connect(g.shA); g.shA.connect(g.alertOut); g.alertOut.connect(g.master); g.alertOut.connect(g.alertSend); g.alertSend.connect(g.conv);
    g.white = noiseBuf(ac, 1.5, () => Math.random() * 2 - 1);
    G = g;
    applyTone();
    return true;
  } catch (e) { ac = null; G = null; return false; }
}
function applyTone() {                                  // つまみの値を音に反映する
  if (!G) return;
  const E = prefs.e, t = ac.currentTime, w = E.wow / 100, m = E.muffle / 100;
  G.wowDepth.gain.setTargetAtTime(0.0004 + 0.0135 * w, t, 0.2);          // 1周ごとの音程のうねり
  G.flutDepth.gain.setTargetAtTime(0.00002 + 0.00016 * w, t, 0.2);
  G.warpDepth.gain.setTargetAtTime(0.012 * w, t, 0.2);
  G.tremDepth.gain.setTargetAtTime(0.02 + 0.24 * w, t, 0.2);
  G.lp.frequency.setTargetAtTime(5600 - 4100 * m, t, 0.2);
  G.hp.frequency.setTargetAtTime(110 + 260 * m, t, 0.2);
  G.send.gain.setTargetAtTime(1.6 * E.reverb / 100, t, 0.2);
  G.vol.gain.setTargetAtTime(prefs.vol / 100 * 0.9, t, 0.05);
  G.crackle.gain.cancelScheduledValues(t);
  G.crackle.gain.setTargetAtTime(rec.playing ? 0.015 + 0.55 * E.noise / 100 : 0, t + (rec.playing ? 0 : 1.0), 0.1);
  rec.rate = E.speed / 100;
}

/* ---- 警報音・呼び鈴 ---- */
function staticBurst(t, dur, vol) {
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = G.white; s.loop = true;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.setValueAtTime(vol, t + dur - 0.06); g.gain.linearRampToValueAtTime(0, t + dur);
  s.connect(g); g.connect(G.alertBus); s.start(t); s.stop(t + dur + 0.05);
}
function boom(t) {                                    // 腹に来る衝撃：落ちていく低音＋叩きつけるノイズ
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.3);
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  o.connect(g); g.connect(G.master); o.start(t); o.stop(t + 1.6);
  const s = ac.createBufferSource(), ng = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = G.white; f.type = 'lowpass'; f.frequency.setValueAtTime(7000, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.35);
  ng.gain.setValueAtTime(0.8, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  s.connect(f); f.connect(ng); ng.connect(G.master); ng.connect(G.conv); s.start(t); s.stop(t + 0.45);
}
function thud(t, vol) {                               // 扉を叩く音／針を落とす音
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(g); g.connect(G.master); g.connect(G.conv); o.start(t); o.stop(t + 0.25);
  const s = ac.createBufferSource(), ng = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = G.white; f.type = 'lowpass'; f.frequency.value = 700;
  ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  s.connect(f); f.connect(ng); ng.connect(G.master); s.start(t); s.stop(t + 0.1);
}
function blast(t, dur, freqs, vol) {                  // 半音でぶつかり合う警笛。最後に音程が垂れる
  freqs.forEach(f => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.setValueAtTime(f, t + dur * 0.7); o.frequency.linearRampToValueAtTime(f * 0.88, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, t + dur - 0.04); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(G.alertBus); o.start(t); o.stop(t + dur + 0.02);
  });
}
function siren(t, dur, f1, f2, vol) {                 // 下でうなり上がるサイレン
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.55); o.frequency.exponentialRampToValueAtTime(f1 * 0.8, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.2);
  g.gain.setValueAtTime(vol, t + dur - 0.4); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g); g.connect(G.alertBus); g.connect(G.conv); o.start(t); o.stop(t + dur + 0.05);
}
function bells(t0) {                                  // やさしい鐘。最後の1音だけ少し低い
  [88, 84, 79, 84].forEach((p, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.42;
    o.frequency.value = hzOf(p) * (i === 3 ? 0.985 : 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.8);
    o.connect(g); g.connect(G.master); g.connect(G.conv); o.start(t); o.stop(t + 1.9);
  });
}
function duck(t, hold) {
  G.duck.gain.cancelScheduledValues(t); G.duck.gain.setTargetAtTime(0.25, t, 0.08); G.duck.gain.setTargetAtTime(1, t + hold, 0.7);
}
function duckMusic(hold) { if (ac && G) { try { duck(ac.currentTime, hold); } catch (e) {} } }
function chime(sev) {
  if (!prefs.sound || !ac || take.busy || unseen()) return;
  try {
    const t0 = ac.currentTime + 0.05;
    if (sev === 4) { duck(t0, 4.5); staticBurst(t0, 0.4, 0.2); bells(t0 + 0.5); return; }
    if (sev === 3) {
      duck(t0, 6.5); boom(t0); staticBurst(t0, 0.22, 0.6);
      for (let i = 0; i < 4; i++) blast(t0 + 0.28 + i * 0.64, 0.5, [466, 494, 233], 0.4);
      siren(t0 + 0.28, 2.9, 230, 720, 0.16);
      staticBurst(t0 + 2.9, 0.6, 0.22);
      return;
    }
    if (sev === 2) {
      duck(t0, 4.5); staticBurst(t0, 0.3, 0.4); thud(t0, 0.8);
      blast(t0 + 0.35, 0.55, [392, 415], 0.4); blast(t0 + 1.05, 0.55, [392, 415], 0.4);
      staticBurst(t0 + 1.7, 0.3, 0.15);
      return;
    }
    duck(t0, 3.5); staticBurst(t0, 0.3, 0.25);
    const n = sev === 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const o = ac.createOscillator(), g = ac.createGain(), t = t0 + 0.4 + i * 0.3;
      o.type = sev === 1 ? 'square' : 'sine'; o.frequency.setValueAtTime(sev === 1 ? 740 : 880, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28, t + 0.02); g.gain.linearRampToValueAtTime(0, t + 0.2);
      o.connect(g); g.connect(G.alertBus); o.start(t); o.stop(t + 0.25);
    }
  } catch (e) {}
}
function sfx(kind, len) {                             // 乗っ取り演出の効果音
  if (!prefs.sound || !ac || unseen()) return;
  try {
    const t = ac.currentTime + 0.03;
    if (kind === 'static') staticBurst(t, len || 0.5, 0.45);
    else if (kind === 'tick') thud(t, 0.35);
    else if (kind === 'knock') { for (let i = 0; i < 4; i++) thud(t + i * 0.3, 0.85); }
    else if (kind === 'bells') bells(t + 0.2);
    else if (kind === 'klaxon') { for (let i = 0; i < 5; i++) blast(t + i * 1.1, 0.8, [311, 330, 155], 0.4); }
  } catch (e) {}
}
function dingdong(t, sick) {
  [[659.3, 0], [523.3, 0.6]].forEach(([f, dt]) => {
    [1, 2.76].forEach((m, k) => {                     // 金属板の鐘：基音と、整数倍でない倍音
      const o = ac.createOscillator(), g = ac.createGain(), at = t + dt;
      o.frequency.setValueAtTime(f * m * (sick ? 0.97 : 1), at);
      if (sick) o.frequency.exponentialRampToValueAtTime(f * m * 0.9, at + 1.6);   // 電池の切れかけた呼び鈴
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(k ? 0.05 : 0.28, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0005, at + (k ? 0.5 : 1.7));
      o.connect(g); g.connect(G.master); g.connect(G.conv); o.start(at); o.stop(at + 1.8);
    });
  });
}
function doorSound(v) {
  if (!prefs.sound || !ac || take.busy || unseen()) return;
  try {
    const t = ac.currentTime + 0.05; duck(t, 3);
    if (v.sound === 'knock') { for (let i = 0; i < 5; i++) thud(t + i * 0.34, 0.8); }
    else if (v.sound === 'none') staticBurst(t, 0.5, 0.12);
    else { dingdong(t, v.risk === 3); if (v.risk === 3 && Math.random() < 0.5) dingdong(t + 1.5, true); }
  } catch (e) {}
}
function speak(text) {
  if (!prefs.voice || !('speechSynthesis' in window) || unseen()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 0.92; u.pitch = 0.7;
    speechSynthesis.speak(u);
  } catch (e) {}
}
