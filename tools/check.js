/* 動作確認：ページを Chromium で開き、エラーが出ないか・主な仕掛けが動くかを確かめる。
   使い方：NODE_PATH=$(npm root -g) node tools/check.js [確かめるフォルダ（省略時はこのリポジトリ）]
   エラーが1つでもあれば終了コード1で終わる。フォントの読み込み（外部通信）は止めて確かめる。 */
const path = require('path');
const { chromium } = require('playwright');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '..'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const errors = [];
  const run = async (w, h) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => errors.push(`${w}x${h} ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(`${w}x${h} console: ${m.text()}`); });
    page.on('requestfailed', q => { if (!/fonts\.(googleapis|gstatic)\.com/.test(q.url())) errors.push(`${w}x${h} 読み込み失敗: ${q.url()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto('file://' + path.join(dir, 'index.html'));
    await page.waitForTimeout(1500);
    const r = await page.evaluate(async () => {
      const k = window.__kb7, sleep = ms => new Promise(f => setTimeout(f, ms));
      if (!k) return { ok: false };
      for (const id of k.scenes) { k.takeover(id); await sleep(30); }
      for (const id of k.outIds) { k.outTrigger(id); await sleep(10); }
      for (let i = 0; i < k.things; i++) k.showThing(i);
      k.doorRing(); for (let i = 0; i < 3; i++) k.chalk(i); for (let i = 0; i < 5; i++) k.pane(i);
      for (let i = 0; i < 20; i++) k.chatter(true);
      document.getElementById('openSettings').click();
      const settingsOpens = !document.getElementById('settings').hidden;
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(800);
      const synth = await k.synth(k.pieces[0], 'piano');
      return { ok: settingsOpens && document.getElementById('settings').hidden, scenes: k.scenes.length, outs: k.outIds.length, things: k.things, pieces: k.pieces.length, synth,
        bulletin: document.body.innerText.length };
    });
    await page.close();
    return r;
  };
  const wide = await run(1280, 800), phone = await run(390, 844);
  await browser.close();
  console.log('パソコン幅', JSON.stringify(wide));
  console.log('スマホ幅  ', JSON.stringify(phone));
  if (!wide.ok || !phone.ok) errors.push('window.__kb7 がない（起動の途中で止まっている）');
  if (errors.length) { console.log('エラー:\n' + errors.join('\n')); process.exit(1); }
  console.log('エラーなし');
})();
