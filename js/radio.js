/* 第七管区 緊急放送網：外の音（ほかのタブの音を拾って、蓄音機の加工で歪ませて流す）。
   Chrome の「タブを共有」で受け取る。共有したタブの元の音は、手元では鳴らないように頼む（suppressLocalAudioPlayback）。
   拾った音はその場で加工して流すだけで、録音も保存も送信もしない。パソコンの Chrome・Edge のみ。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
const canRadio = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !/iPhone|iPad|Android/.test(navigator.userAgent);
const radio = { on: false, stream: null, src: null, gain: null, timer: 0 };

async function startRadio() {
  if (radio.on || !canRadio) return;
  if (!ensureAudio()) { gramState('この端末では音を出せません'); return; }
  if (rec.playing) stopRec();
  gramState('共有するタブを選んでください…');
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,                                       // 映像も要求しないと共有の画面が出ない（映像は使わない）
      audio: { suppressLocalAudioPlayback: true, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      preferCurrentTab: false, selfBrowserSurface: 'exclude', surfaceSwitching: 'include', systemAudio: 'exclude', monitorTypeSurfaces: 'exclude'
    });
  } catch (e) { gramState('停止中'); return; }
  const a = stream.getAudioTracks()[0];
  if (!a) {                                              // 「タブの音声も共有する」が外れていた
    stream.getTracks().forEach(t => t.stop());
    gramState('音が届いていません。共有の画面で「タブの音声も共有する」をオンにしてください');
    return;
  }
  stream.getVideoTracks().forEach(t => { t.enabled = false; });
  radio.stream = stream;
  radio.gain = ac.createGain(); radio.gain.gain.value = 1;
  radio.src = ac.createMediaStreamSource(new MediaStream([a]));
  radio.src.connect(radio.gain); radio.gain.connect(G.recBus);
  radio.on = true;
  stream.getTracks().forEach(t => t.addEventListener('ended', stopRadio));   // Chrome の「共有を停止」を押されたとき
  applyTone();
  $('radioBtn').textContent = '外の音 止める'; $('radioBtn').classList.add('on'); $('gramBox').classList.add('on');
  gramState('外の音を受信中');
  radio.timer = setTimeout(radioGlitch, ri(4000, 9000));
}

/* 電波が途切れる：「針飛び」のつまみが大きいほど、よく途切れる */
function radioGlitch() {
  if (!radio.on) return;
  const d = prefs.e.skip / 100;
  if (d > 0.03 && ac && ac.state === 'running') {
    const t = ac.currentTime, g = radio.gain.gain, len = 0.08 + Math.random() * (0.25 + 0.9 * d);
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(Math.random() < 0.5 ? 0 : 0.15, t + 0.02);   // 消える、またはほとんど聞こえなくなる
    g.setValueAtTime(g.value < 0.1 ? 0 : 0.15, t + len); g.linearRampToValueAtTime(1, t + len + 0.05);
    pop(t); if (Math.random() < 0.5) pop(t + len);
  }
  radio.timer = setTimeout(radioGlitch, ri(2500, 9000) * (1.6 - 1.2 * d));
}

function stopRadio() {
  if (!radio.on) return;
  radio.on = false; clearTimeout(radio.timer);
  try { radio.src.disconnect(); radio.gain.disconnect(); } catch (e) {}
  radio.stream.getTracks().forEach(t => { t.removeEventListener('ended', stopRadio); t.stop(); });
  radio.stream = radio.src = radio.gain = null;
  applyTone();
  $('radioBtn').textContent = '外の音を拾う'; $('radioBtn').classList.remove('on');
  if (!rec.playing) { $('gramBox').classList.remove('on'); gramState('停止中'); }
}

if (!canRadio) { $('radioRow').hidden = true; $('radioNote').hidden = true; }
$('radioBtn').addEventListener('click', () => { radio.on ? stopRadio() : startRadio(); });
