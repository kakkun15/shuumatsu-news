/* 第七管区 緊急放送網：起動（タイマー開始）と動作確認用の入口 window.__kb7。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 起動 ================= */
rollDay(); if (!stats.came) rationDay();
layout(); renderPrices(); setTitle(false); setParts();
for (let i = 0; i < 6; i++) chatter(false);
issue(true);
fillTicker(); instruments(); tick(); keepAwake();
doorIdle(); drawCam(); outInfo(draw1(C.OUT.idle), false); drawOut();
setInterval(tick, 250);
setInterval(instruments, 1000);
setInterval(priceTick, 5000);
setInterval(() => { chalkPage = (chalkPage + 1) % 3; renderChalk(); }, 18000);
setInterval(() => { if (Math.random() < ({ shinya: 0.03, yoru: 0.02 }[band()] || 0.011)) bump('dead', 1); }, 20000);
setInterval(drawCam, 110);
setInterval(drawOut, 125);
setInterval(() => setTitle(true), ri(480000, 900000));
setTimeout(loopChatter, 4000);
door.timer = setTimeout(doorRing, ri(18000, 30000));
out.timer = setTimeout(outAuto, ri(9000, 16000));
setTimeout(sag, ri(40000, 90000));
setTimeout(takeAuto, ri(150000, 300000));
/* 初回だけ：架空であること、警報音の大きさは変えられないこと、明滅のこと を先に伝える */
let seenIntro = false; try { seenIntro = localStorage.getItem('kb7-intro') === '1'; } catch (e) {}
if (seenIntro) showCtl(9000);
else {
  $('intro').hidden = false; $('introOk').focus();
  $('introOk').addEventListener('click', e => {
    e.stopPropagation(); $('intro').hidden = true; try { localStorage.setItem('kb7-intro', '1'); } catch (err) {}
    showCtl(9000);
  });
}
/* 動作確認用の入口（画面からは使わない） */
window.__kb7 = { takeover, scenes: SCENE_IDS, outTrigger, doorRing, pieces: PIECES.map(p => p.id), outIds: OUT_IDS, things: C.THINGS.length, chatter,
  chalk(i) { chalkPage = i; renderChalk(); }, pane(i) { showPane(i, 600000); }, band, stats, shortage, hush, wake, get acState() { return ac ? ac.state : 'none'; }, get acTime() { return ac ? ac.currentTime : -1; },
  showThing(i) { clearTimeout(door.timer); door.v = C.THINGS[i](); door.t0 = Date.now() - 9000; door.seed = Math.random(); doorEl.dataset.state = 'red'; $('doorSeen').textContent = door.v.seen; $('doorWho').textContent = door.v.who; },
  async synth(id, tk) {
    ensureAudio(); const t0 = performance.now(), b = await renderPiece(PIECES.find(p => p.id === id), tk), d = b.getChannelData(0);
    let s2 = 0, pk = 0; for (let i = 0; i < d.length; i += 5) { s2 += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); }
    return { sec: Math.round(b.duration), rms: +Math.sqrt(s2 / (d.length / 5)).toFixed(3), peak: +pk.toFixed(2), ms: Math.round(performance.now() - t0), sr: b.sampleRate };
  } };
