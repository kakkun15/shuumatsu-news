/* 第七管区 緊急放送網：小窓（最前面に浮かぶ小さな窓。Document Picture-in-Picture）。
   全画面にしなくても、ほかの作業をしながら放送を流しておける。パソコンの Chrome・Edge のみ。
   開くと画面の本体（#app と、揺れ・乗っ取りの重ね）をそのまま小窓へ移し、閉じたら元へ戻す。
   要素ごと移すので、動いている仕掛けはそのまま続く（$() は両方の文書から探す。js/base.js）。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
const canPip = 'documentPictureInPicture' in window;
const PIP_MOVE = ['app', 'fx', 'take', 'sagnote'];             // 小窓へ移すもの（この順に並べ直す）
let pipBusy = false;

async function openPip() {
  if (!canPip || pipWin || pipBusy) return;
  pipBusy = true;
  try {
    const w = await documentPictureInPicture.requestWindow({ width: 420, height: 380 });
    const d = w.document;
    d.documentElement.lang = 'ja';
    d.title = document.title;
    // 見た目（<style> と読み込み済みのスタイルシート）を写す
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(n => d.head.append(n.cloneNode(true)));
    d.documentElement.classList.toggle('framed', false);       // 小窓に切り欠きはないので枠は出さない
    d.documentElement.classList.add('inpip');                  // 小窓の中では「消音」ボタンを出す
    const els = PIP_MOVE.map(id => document.getElementById(id));
    const marks = els.map(el => { const m = document.createComment('pip'); el.before(m); return m; });   // 戻す場所の目印
    pipWin = w;
    els.forEach(el => d.body.append(el));
    $('pipStub').hidden = false;
    $('ctl').hidden = true;
    toggle(false);
    // 小窓の中でも、← → キー・触れたときの音の復帰が効くように
    d.addEventListener('keydown', paneKey);
    ['pointerdown', 'keydown'].forEach(t => d.addEventListener(t, () => { if (ac && ac.state !== 'running') wake(); }, true));
    w.addEventListener('resize', layout);
    w.addEventListener('pagehide', () => closedPip(els, marks));
    layout();
  } catch (e) {
    pipWin = null;
  }
  pipBusy = false;
}

/* 小窓が閉じられた（× ボタン・「この画面に戻す」）とき：本体を元の位置へ戻す */
function closedPip(els, marks) {
  if (!pipWin) return;
  els.forEach((el, i) => marks[i].replaceWith(el));
  pipWin = null;
  $('pipStub').hidden = true;
  setFrame(prefs.frame);
  layout();
  if (unseen()) hush(); else wake();                            // 元の画面が隠れていれば、ここで音を止める
}
function closePip() { if (pipWin) pipWin.close(); }

if (!canPip) { $('pipBtn').hidden = true; $('ctlPip').hidden = true; $('pipNote').hidden = true; }
$('pipBtn').addEventListener('click', openPip);
$('ctlPip').addEventListener('click', openPip);
$('pipBack').addEventListener('click', closePip);

/* 消音：すぐ音を切りたいときに。小窓を閉じても、もう一度押すまで消音のまま（消音中は元の画面にもボタンが出る） */
function setMute(on) {
  muted = on;
  const b = $('muteBtn'); b.textContent = on ? '消音中' : '消音'; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on);
  if (on) hush(); else wake();
}
$('muteBtn').addEventListener('click', e => { e.stopPropagation(); setMute(!muted); });
