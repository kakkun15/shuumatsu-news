/* 第七管区 緊急放送網：館内蓄音機（盤と音色・壊れた盤の再生）・画面を消灯させない。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 音：盤（曲）と音色 ================= */
const TIMBRES = {
  piano: { name: 'ピアノ', h: [1, .55, .3, .16, .09, .05, .03], a: 0.004 },
  strings: { name: '弦', h: [1, .62, .48, .32, .22, .14, .09, .05], a: 0.07, sus: true, vib: 1, rel: 0.14 },
  organ: { name: 'オルガン', h: [1, .75, .1, .5, 0, .28, 0, .16], a: 0.018, sus: true, vib: 0, rel: 0.07 },
  musicbox: { name: 'オルゴール', h: [1, 0, .12, .34, 0, .08], a: 0.002, box: true, up: 12 },
  ghost: { name: '声のようなもの', h: [1, .18, .05], a: 0.22, sus: true, vib: 1.6, rel: 0.5 }
};
const TICK = 0.008;
/* 予備の盤：手で打ち込んだカノン（低音8音の上で、3声が1周ずつ遅れて同じ旋律を追う） */
function handCanon() {
  const parse = (str, base) => str.trim().split(/\s+/).map(tok => { const [n, m] = tok.split(':'); return [midi(n), base * (m ? +m : 1)]; });
  const bass = parse('D3 A2 B2 F#2 G2 D2 G2 A2', 1), V = [
    parse('F#5 E5 D5 C#5 B4 A4 B4 C#5', 1), parse('D5 C#5 B4 A4 G4 F#4 G4 E4', 1),
    parse('D4 F#4 A4 G4 F#4 D4 F#4 E4 D4 B3 D4 A4 G4 B4 A4 G4', 0.5), parse('F#4 D4 E4 C#5 D5 F#5 A5 A4 B4 G4 A4 F#4 D4 D5 D5 C#5', 0.5),
    parse('D5 C#5 D5 D4 C#4 A4 E4 F#4 D4 D5 C#5 B4 C#5 F#5 A5 B5 G5 F#5 E5 G5 F#5 E5 D5 C#5 B4 A4 G4 F#4 E4 G4 F#4 E4', 0.25),
    parse('D4 E4 F#4 G4 A4 E4 A4 G4 F#4 B4 A4 G4 A4 G4 F#4 E4 D4 B3 B4 C#5 D5 C#5 B4 A4 G4 F#4 E4 B4 A4 B4 A4 G4', 0.25),
    parse('A5:2 F#5 G5 A5:2 F#5 G5 A5 A4 B4 C#5 D5 E5 F#5 G5 F#5:2 D5 E5 F#5:2 F#4 G4 A4 B4 A4 G4 A4 F#4 G4 A4 G4:2 B4 A4 G4:2 F#4 E4 F#4 E4 D4 E4 F#4 G4 A4 B4 G4:2 B4 A4 B4:2 C#5 D5 A4 B4 C#5 D5 E5 F#5 G5 A5', 0.125)
  ], seq = [0, 1, 2, 3, 4, 5, 6, 0, 1], u = 1.2, cycles = seq.length + 3, notes = [];
  const line = (arr, t0) => { let t = t0; for (const [p, d] of arr) { notes.push({ t, d: d * u * 0.96, p }); t += d * u; } };
  for (let c = 0; c < cycles; c++) { line(bass, c * 8 * u); for (let v = 0; v < 3; v++) { const i = c - 1 - v; if (i >= 0 && i < seq.length) line(V[seq[i]], c * 8 * u); } }
  [62, 66, 69, 74, 38].forEach(p => notes.push({ t: cycles * 8 * u, d: 4 * u, p }));
  return notes.sort((a, b) => a.t - b.t);
}
const PIECES = (window.KB7_MUSIC || []).map(m => ({ id: m.id, title: m.t, comp: m.c, inst: m.i, raw: m.n }));
PIECES.push({ id: 'canon', title: 'パッヘルベルのカノン', comp: 'パッヘルベル', inst: 'strings', make: handCanon });
function notesOf(piece) {
  if (piece.make) return piece.make();
  const bin = atob(piece.raw), out2 = []; let i = 0, t = 0;
  const vi = () => { let v = 0, s = 0, b; do { b = bin.charCodeAt(i++); v |= (b & 127) << s; s += 7; } while (b & 128); return v; };
  while (i < bin.length) { t += vi(); const d = vi(), p = bin.charCodeAt(i++); out2.push({ t: t * TICK, d: d * TICK, p }); }
  return out2;
}
let synthSR = 0;
const tableCache = {};
function tables(key) {
  if (tableCache[key]) return tableCache[key];
  const h = TIMBRES[key].h, mk = n => { const t = new Float32Array(2048); let pk = 0; for (let i = 0; i < 2048; i++) { let v = 0; for (let k = 0; k < Math.min(n, h.length); k++) v += h[k] * Math.sin(2 * Math.PI * (k + 1) * i / 2048); t[i] = v; pk = Math.max(pk, Math.abs(v)); } for (let i = 0; i < 2048; i++) t[i] /= pk; return t; };
  return (tableCache[key] = [mk(8), mk(4), mk(2)]);
}
/* 音符の並びから、その場で音を合成する（録音は使わない） */
async function renderPiece(piece, key) {
  if (!synthSR) { synthSR = 16000; try { ac.createBuffer(1, 16, 16000); } catch (e) { synthSR = 22050; try { ac.createBuffer(1, 16, 22050); } catch (e2) { synthSR = ac.sampleRate; } } }
  const SR = synthSR, T = TIMBRES[key], tabs = tables(key), notes = notesOf(piece);
  const end = notes.reduce((m, n) => Math.max(m, n.t + n.d), 0), total = Math.ceil((end + 3.5) * SR), o = new Float32Array(total);
  let done = 0;
  for (const nt of notes) {
    let p = nt.p + (T.up || 0); if (p > 103) p -= 12;
    const f = hzOf(p) * (1 + (Math.random() - 0.5) * 0.007);                 // わずかに調子外れ
    const tab = p < 55 ? tabs[0] : p < 76 ? tabs[1] : tabs[2], inc = f * 2048 / SR;
    const i0 = Math.floor((nt.t + 0.3) * SR), vol = 0.2 * Math.min(1.3, Math.max(0.45, 1 - (p - 60) * 0.009));
    let ph = Math.random() * 2048;
    if (T.sus) {                                                             // 鳴らし続ける音（弦・オルガン・声）
      const aN = T.a * SR, dN = Math.max(nt.d, T.a * 0.6) * SR, rN = T.rel * SR, n = Math.min(total - i0, Math.floor(dN + rN)), vd = 0.0045 * T.vib, vw = 2 * Math.PI * 5.5 / SR;
      for (let i = 0; i < n; i++) {
        const env = i < aN ? i / aN : i < dN ? 1 : 1 - (i - dN) / rN;
        o[i0 + i] += tab[ph | 0] * env * vol;
        ph += inc * (1 + (i > aN * 2 ? vd * Math.sin(vw * i) : 0)); if (ph >= 2048) ph -= 2048;
      }
    } else {                                                                 // 叩いて減衰する音（ピアノ・オルゴール）
      const tau = T.box ? 0.6 : Math.min(1.7, Math.max(0.22, 1.7 - (p - 36) * 0.024));
      const k = Math.exp(-1 / (tau * SR)), kr = Math.exp(-1 / (0.07 * SR)), aN = T.a * SR, dN = T.box ? 1e12 : nt.d * SR;
      const n = Math.min(total - i0, Math.floor((T.box ? 2.2 : Math.min(nt.d + 0.4, tau * 6)) * SR));
      let g = vol * 1.5;
      for (let i = 0; i < n; i++) {
        let env; if (i < aN) env = g * i / aN; else { g *= i < dN ? k : kr; env = g; }
        o[i0 + i] += tab[ph | 0] * env;
        ph += inc; if (ph >= 2048) ph -= 2048;
      }
    }
    if (++done % 260 === 0) await new Promise(r => setTimeout(r, 0));        // 画面を止めないよう、ときどき手を離す
  }
  let pk = 0; for (let i = 0; i < total; i += 3) { const a = Math.abs(o[i]); if (a > pk) pk = a; }
  const gn = 0.85 / Math.max(pk, 0.25); for (let i = 0; i < total; i++) o[i] *= gn;
  const buf = ac.createBuffer(1, total, SR);
  if (buf.copyToChannel) buf.copyToChannel(o, 0); else buf.getChannelData(0).set(o);
  return buf;
}

/* ================= 音：壊れた盤の再生 ================= */
const rec = { playing: false, piece: null, buf: null, fileBuf: null, fileName: '自分の曲', tk: 'piano', pos: 0, endAt: 0, timer: 0, rate: 0.88, skips: 0, srcs: new Set(), busy: false, changing: false, spin: false, forceDroop: false };
const REV = 1.8;                                        // 33 1/3回転：針が1周するのに1.8秒
const gramState = t => { $('gram').textContent = t; };
function pickPiece() {
  if (prefs.piece === 'file' && rec.fileBuf) return { id: 'file', title: rec.fileName, comp: '', file: true };
  if (prefs.piece !== 'shuffle' && prefs.piece !== 'file') { const p = PIECES.find(x => x.id === prefs.piece); if (p) return p; }
  return draw1(PIECES);
}
function pickTimbre(piece) {
  if (prefs.timbre === 'own') return piece.inst;
  if (prefs.timbre !== 'auto') return prefs.timbre;
  return Math.random() < 0.68 ? piece.inst : draw1(['piano', 'strings', 'organ', 'musicbox', 'ghost']);   // ときどき別の音色で鳴る
}
async function loadNext() {
  const piece = pickPiece();
  if (piece.file) { rec.buf = rec.fileBuf; rec.tk = ''; }
  else { rec.tk = pickTimbre(piece); gramState(`盤を替えています… ${piece.title}`); rec.buf = await renderPiece(piece, rec.tk); }
  rec.piece = piece; rec.pos = 0;
  if (Math.random() < 0.3) react('track', piece.title, ri(6000, 14000));
}
function track(s, t0) { s._t0 = t0; rec.srcs.add(s); s.onended = () => rec.srcs.delete(s); }
function seg(off, len, t) {
  const s = ac.createBufferSource(); s.buffer = rec.buf; s.playbackRate.value = rec.rate;
  s.connect(G.recBus); s.start(t, off, len); track(s, t);
}
function ramp(off, t, steps) {                          // 回転数が変わる区間。steps = [[秒, 倍率], …]
  const s = ac.createBufferSource(), r = rec.rate, pr = s.playbackRate;
  s.buffer = rec.buf;
  let at = t, prev = steps[0][1], used = 0;
  pr.setValueAtTime(r * prev, t);
  for (const [sec, mul] of steps.slice(1)) { at += sec; pr.linearRampToValueAtTime(r * mul, at); used += (prev + mul) / 2 * sec * r; prev = mul; }
  s.connect(G.recBus); s.start(t, off); s.stop(at); track(s, t);
  return [used, at - t];
}
function pop(t) {
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = G.popBuf; g.gain.value = 0.3 + 0.55 * prefs.e.noise / 100;
  s.connect(g); g.connect(G.vol); s.start(t);
}
function scheduleEvent() {
  const buf = rec.buf, dur = buf.duration, d = prefs.e.skip / 100, r = rec.rate, groove = REV * r;
  if (rec.spin) {                                       // 針を落とす → 導入溝のノイズ → 回転が上がりながら曲が始まる
    rec.spin = false;
    thud(rec.endAt, 0.5); pop(rec.endAt + 0.02); rec.endAt += 1.5;
    const [used, took] = ramp(rec.pos, rec.endAt, [[0, 0.3], [1.5, 1]]);
    rec.pos += used; rec.endAt += took; return;
  }
  if (rec.pos >= dur - 0.3) {                           // 盤の終わり：最内周の溝を回っているあいだに、次の盤を用意する
    for (let k = 0; k < 3; k++) pop(rec.endAt + k * REV + 0.3);
    rec.endAt += 3 * REV; rec.changing = true;
    loadNext().then(() => { rec.changing = false; rec.spin = true; rec.endAt = Math.max(rec.endAt, ac.currentTime + 0.3); }).catch(() => { rec.changing = false; rec.pos = 0; });
    return;
  }
  let L = d < 0.03 ? dur - rec.pos : (3 + Math.random() * 12) * (1.7 - 1.5 * d);
  L = Math.min(L, dur - rec.pos);
  seg(rec.pos, L, rec.endAt); rec.endAt += L / r; rec.pos += L;
  if ((d < 0.03 && !rec.forceDroop) || rec.pos >= dur - 0.3) return;
  rec.skips++;
  const x = rec.forceDroop ? 0.99 : Math.random(); rec.forceDroop = false;
  if (x < 0.5) {                                        // 同じ溝を、ちょうど1周ぶんずつ繰り返す
    const g = Math.min(rec.pos, groove), n = 3 + Math.floor(Math.random() * (2 + 7 * d));
    for (let i = 0; i < n; i++) { pop(rec.endAt); seg(rec.pos - g, g, rec.endAt); rec.endAt += g / r; }
    pop(rec.endAt);
  } else if (x < 0.64) { pop(rec.endAt); rec.pos = Math.min(dur - 0.4, rec.pos + groove * ri(1, 3)); }   // 隣の溝へ飛ぶ
  else if (x < 0.72) { pop(rec.endAt); rec.pos = Math.max(0, rec.pos - groove * ri(2, 3)); }             // 手前の溝へ戻る
  else if (x < 0.86) {                                  // 盤が手で逆に回されたように、数秒ぶん巻き戻る
    const g = Math.min(rec.pos, 1.2 + Math.random() * 1.6), sr = buf.sampleRate, n = Math.floor(g * sr), i0 = Math.floor((rec.pos - g) * sr);
    if (n > 800) {
      const rb = ac.createBuffer(1, n, sr), src = buf.getChannelData(0), dst = rb.getChannelData(0);
      for (let i = 0; i < n; i++) dst[i] = src[i0 + n - 1 - i] || 0;
      const s = ac.createBufferSource(); s.buffer = rb; s.playbackRate.value = r * 1.7; s.connect(G.recBus); s.start(rec.endAt); track(s, rec.endAt);
      pop(rec.endAt); rec.endAt += g / (r * 1.7); rec.pos -= g; pop(rec.endAt);
    }
  } else {                                              // 回転が落ちて、また持ち直す
    const [used, took] = ramp(rec.pos, rec.endAt, [[0, 1], [2.4, 0.25], [0.6, 0.25], [1.6, 1]]);
    rec.pos += used; rec.endAt += took;
  }
}
function pump() {
  if (!rec.playing) return;
  if (!rec.changing) {
    if (rec.endAt < ac.currentTime) rec.endAt = ac.currentTime + 0.1;
    let guard = 0;
    while (!rec.changing && rec.endAt < ac.currentTime + 1.2 && guard++ < 40) scheduleEvent();
    if (!rec.changing && rec.piece) {
      const p = rec.piece;
      gramState(`${p.title}${p.comp ? `（${p.comp}）` : ''}${rec.tk ? ` ／ ${TIMBRES[rec.tk].name}` : ''}　針飛び ${rec.skips}回`);
    }
  }
  rec.timer = setTimeout(pump, 400);
}
function haltSources() {
  const now = ac.currentTime;
  rec.srcs.forEach(s => {
    try {
      if (s._t0 > now) s.stop();
      else {                                            // 回転が落ちながら止まる
        const pr = s.playbackRate; pr.cancelScheduledValues(now);
        pr.setValueAtTime(Math.max(0.05, pr.value), now); pr.linearRampToValueAtTime(0.03, now + 1.1); s.stop(now + 1.15);
      }
    } catch (e) {}
  });
  rec.srcs.clear();
}
function stopRec() {
  rec.playing = false; clearTimeout(rec.timer);
  if (ac) haltSources();
  applyTone(); $('gramBtn').textContent = '音楽 再生'; $('gramBtn').classList.remove('on'); $('gramBox').classList.remove('on'); gramState('停止中');
}
async function startRec() {
  if (rec.busy) return;
  if (!ensureAudio()) { gramState('この端末では音を出せません'); return; }
  rec.busy = true; gramState('盤を準備中…'); $('gramBox').classList.add('on'); $('gramBtn').textContent = '音楽 停止'; $('gramBtn').classList.add('on');
  try {
    await loadNext();
    rec.playing = true; rec.changing = false; rec.spin = true;
    rec.endAt = ac.currentTime + 0.25;
    applyTone(); pump();
  } catch (e) { gramState('盤を読めませんでした'); $('gramBox').classList.remove('on'); $('gramBtn').textContent = '音楽 再生'; $('gramBtn').classList.remove('on'); }
  rec.busy = false;
}
async function restartRec() { if (rec.playing || rec.busy) { stopRec(); await new Promise(r => setTimeout(r, 60)); } startRec(); }
$('gramBtn').addEventListener('click', () => { rec.playing ? stopRec() : startRec(); });
$('gramNext').addEventListener('click', () => restartRec());

/* ================= 画面を消灯させない ================= */
async function keepAwake() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') await navigator.wakeLock.request('screen'); } catch (e) {}
}
document.addEventListener('visibilitychange', keepAwake);
/* ページが見えなくなったら（ホームに戻る・別のアプリやタブ・画面を消す）、音をすべて止める。戻ったら黙って再開する */
function hush() { try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} }
function wake() {
  if (!ac || document.hidden) return;
  try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); else wake(); });
addEventListener('pagehide', hush); addEventListener('pageshow', wake); addEventListener('focus', wake);
['pointerdown', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, () => { if (ac && ac.state !== 'running') wake(); }, true));   // 自動で戻らなかったときは、次に触れた瞬間に戻す
document.addEventListener('pointerdown', keepAwake, { once: true });
