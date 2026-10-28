/* 第七管区 緊急放送網：設定シート・操作バー・全画面・パネルの切り替え。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 設定 ================= */
const panel = $('settings'), settingsOpener = $('openSettings');
const toggle = show => { panel.hidden = !show; settingsOpener.setAttribute('aria-expanded', String(show)); };
settingsOpener.addEventListener('click', () => toggle(panel.hidden));
$('closeSettings').addEventListener('click', () => toggle(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

const sel = $('interval');
if (![...sel.options].some(o => +o.value === +prefs.interval)) prefs.interval = 30;
sel.value = String(prefs.interval);
sel.addEventListener('change', () => { prefs.interval = +sel.value; nextAt = Date.now() + prefs.interval * 1000; save(); });

$('optSound').checked = false; prefs.sound = false;   /* 音は操作してからでないと鳴らせない */
$('optSound').addEventListener('change', e => {
  prefs.sound = e.target.checked; if (prefs.sound && ensureAudio()) chime(1);
  $('ctlSound').textContent = prefs.sound ? '警報音：オン' : '警報音：オフ'; $('ctlSound').classList.toggle('on', prefs.sound);
});
if (!('speechSynthesis' in window)) $('voiceRow').hidden = true;
$('optVoice').checked = false; prefs.voice = false;
$('optVoice').addEventListener('change', e => {
  prefs.voice = e.target.checked;
  if (prefs.voice && current) speak(current.head); else { try { speechSynthesis.cancel(); } catch (err) {} }
});

/* 盤の一覧（作曲者ごとにまとめる） */
const pieceSel = $('piece');
const opt = (v, t, dis) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (dis) o.disabled = true; return o; };
pieceSel.append(opt('shuffle', `全${PIECES.length}枚を順不同で`), opt('file', '自分の曲（未読み込み）', true));
const byComp = new Map();
PIECES.forEach(p => { if (!byComp.has(p.comp)) byComp.set(p.comp, []); byComp.get(p.comp).push(p); });
byComp.forEach((list, comp) => { const g = document.createElement('optgroup'); g.label = comp; list.forEach(p => g.append(opt(p.id, p.title))); pieceSel.append(g); });
if (![...pieceSel.options].some(o => o.value === prefs.piece && !o.disabled)) prefs.piece = 'shuffle';
pieceSel.value = prefs.piece;
pieceSel.addEventListener('change', () => { prefs.piece = pieceSel.value; save(); if (rec.playing) restartRec(); });
$('timbre').value = prefs.timbre in TIMBRES || prefs.timbre === 'own' ? prefs.timbre : 'auto';
$('timbre').addEventListener('change', e => { prefs.timbre = e.target.value; save(); if (rec.playing) restartRec(); });
$('songFile').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (!ensureAudio()) { gramState('この端末では音を出せません'); return; }
  gramState('曲を読み込み中…');
  const fr = new FileReader();
  fr.onerror = () => gramState('ファイルを読めませんでした');
  fr.onload = () => {
    new Promise((res, rej) => { const p = ac.decodeAudioData(fr.result, res, rej); if (p && p.catch) p.catch(rej); })
      .then(buf => {
        rec.fileBuf = buf; rec.fileName = f.name.replace(/\.[^.]+$/, '');
        const o = pieceSel.querySelector('option[value="file"]'); o.disabled = false; o.textContent = `自分の曲：${rec.fileName}`;
        pieceSel.value = 'file'; prefs.piece = 'file';
        restartRec();
      })
      .catch(() => gramState('この形式の音声は読めませんでした'));
  };
  fr.readAsArrayBuffer(f);
});
const SL = { eSkip: 'skip', eWow: 'wow', eNoise: 'noise', eMuffle: 'muffle', eReverb: 'reverb', eSpeed: 'speed' };
const syncSliders = () => { for (const id in SL) $(id).value = prefs.e[SL[id]]; };
$('preset').value = prefs.preset in PRESETS ? prefs.preset : 'custom'; syncSliders();
$('preset').addEventListener('change', e => {
  prefs.preset = e.target.value;
  if (PRESETS[prefs.preset]) { prefs.e = Object.assign({}, PRESETS[prefs.preset]); syncSliders(); applyTone(); }
  save();
});
for (const id in SL) $(id).addEventListener('input', e => { prefs.e[SL[id]] = +e.target.value; prefs.preset = 'custom'; $('preset').value = 'custom'; applyTone(); save(); });
$('optVol').value = prefs.vol;
$('optVol').addEventListener('input', e => { prefs.vol = +e.target.value; applyTone(); save(); });

$('optScan').checked = !!prefs.scan;
app.classList.toggle('scan', !!prefs.scan);
$('optScan').addEventListener('change', e => { prefs.scan = e.target.checked; app.classList.toggle('scan', prefs.scan); save(); });
$('optFx').checked = !!prefs.fx;
$('optFx').addEventListener('change', e => { prefs.fx = e.target.checked; save(); });
$('optTake').checked = !!prefs.take;
$('optTake').addEventListener('change', e => { prefs.take = e.target.checked; save(); });
/* 両端の枠：iPhoneを横にしたときの切り欠き・角の丸み対策 */
const setFrame = on => document.documentElement.classList.toggle('framed', on);
$('optFrame').checked = !!prefs.frame; setFrame(!!prefs.frame);
$('optFrame').addEventListener('change', e => { prefs.frame = e.target.checked; setFrame(prefs.frame); save(); drawSpark(); });
/* 1枚ずつ表示：大きな画面でもスマホと同じ切り替え方式にする */
$('optSingle').checked = !!prefs.single;
$('optSingle').addEventListener('change', e => { prefs.single = e.target.checked; save(); layout(); });
$('nowBtn').addEventListener('click', () => issue(false));
$('doorBtn').addEventListener('click', () => { if (door.v) doorLeave(); doorRing(); toggle(false); });
$('takeBtn').addEventListener('click', () => { toggle(false); takeover(); });
const canFs = !!document.documentElement.requestFullscreen;      // iPhoneのSafariには、ページを全画面にする機能がない
function goFs() {
  try {
    const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
  toggle(false);
}
if (!canFs) { $('fsBtn').hidden = true; $('ctlFs').hidden = true; }
if (navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) { $('homeNote').hidden = true; $('ctlFs').hidden = true; $('fsBtn').hidden = true; }
$('fsBtn').addEventListener('click', goFs);
$('ctlFs').addEventListener('click', goFs);
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.id === b.dataset.tab));
}));

/* ---- 操作バー：画面をタップすると下に出る ---- */
const ctl = $('ctl'); let ctlT = 0;
function showCtl(ms) { ctl.hidden = false; clearTimeout(ctlT); ctlT = setTimeout(() => { ctl.hidden = true; }, ms || 6000); }
app.addEventListener('click', e => { if (e.target.closest('button, a, input, select, label')) return; if (pipWin) return; if (ctl.hidden) showCtl(); else ctl.hidden = true; });
ctl.addEventListener('click', () => showCtl());
$('optBg').checked = !!prefs.bgPlay;
$('optBg').addEventListener('change', e => { prefs.bgPlay = e.target.checked; save(); if (unseen()) hush(); else wake(); });
$('ctlSound').addEventListener('click', () => { const c = $('optSound'); c.checked = !c.checked; c.dispatchEvent(new Event('change')); });
$('ctlSet').addEventListener('click', () => { ctl.hidden = true; toggle(true); });

/* ---- スマホ：下半分は1枚ずつ。自動で切り替わり、タップで次へ ---- */
const PANES = [...document.querySelectorAll('.pane')], dots = $('dots');
let paneI = 0, paneHold = 0;
PANES.forEach(() => dots.append(document.createElement('i')));
function showPane(i, hold) {
  paneI = (i + PANES.length) % PANES.length;
  PANES.forEach((p, k) => p.classList.toggle('on', k === paneI));
  [...dots.children].forEach((x, k) => x.classList.toggle('on', k === paneI));
  if (hold) paneHold = Date.now() + hold;
  drawSpark();
}
function paneByName(n, hold) { const i = PANES.findIndex(p => p.dataset.pane === n); if (i >= 0 && app.classList.contains('carousel')) showPane(i, hold); }
function layout() {
  const w = pipWin || window, small = w.innerWidth <= 600 || w.innerHeight <= 520;
  app.classList.toggle('carousel', small || !!prefs.single);
  w.document.documentElement.classList.toggle('big', !small && !!prefs.single);     // 大きな画面で1枚ずつ：文字も大きく
  if (app.classList.contains('carousel')) showPane(paneI);
  drawSpark();
}
function paneKey(e) {                                   // パソコン：← → でパネルを送る（小窓の中でも）
  if (!app.classList.contains('carousel') || !panel.hidden || e.target.closest('input, select, textarea')) return;
  if (e.key === 'ArrowRight') showPane(paneI + 1, 20000); else if (e.key === 'ArrowLeft') showPane(paneI - 1, 20000);
}
document.addEventListener('keydown', paneKey);
PANES.forEach(p => p.addEventListener('click', e => { if (app.classList.contains('carousel') && !e.target.closest('button')) { showPane(paneI + 1, 20000); e.stopPropagation(); } }));
setInterval(() => { if (app.classList.contains('carousel') && Date.now() > paneHold) showPane(paneI + 1); }, 11000);
addEventListener('resize', layout);
