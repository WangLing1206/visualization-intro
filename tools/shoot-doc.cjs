/* ==========================================================================
   shoot-doc.cjs — 为亮点说明文档批量截图

   用 CDP 驱动一个干净的 Chrome，把站点摆到指定状态后逐张截 1600×900 的 PNG。
   输出 <目录>/shot-<名字>.png，供 build-docx.py 插图使用。

   用法：
     set FFMPEG_PATH 不需要；只需要 FF
     node tools/shoot-doc.cjs <输出目录>
   ========================================================================== */
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].find(p => fs.existsSync(p));
const SITE = process.env.SITE_URL || 'https://wangling1206.github.io/visualization-intro/';
const PORT = 9223;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'doc-shots');
const ONLY = (process.env.ONLY_SHOTS || '').split(',').filter(Boolean);   // 只拍指定的几张
const PROFILE = path.join(os.tmpdir(), 'doc-shots-profile');
const W = 1600, H = 900;
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      } else if (m.method) (this.handlers.get(m.method) || []).forEach(f => { try { f(m.params); } catch (e) { } });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 30000);
    });
  }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
}

class Page {
  constructor(cdp) { this.cdp = cdp; }
  async eval(e, aw = false) {
    const r = await this.cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: aw });
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails));
    return r.result.value;
  }
  async goto(hash) { await this.eval(`location.hash=${JSON.stringify(hash)};true`); await sleep(800); }
  async top() { await this.eval('window.scrollTo(0,0);true'); await sleep(300); }
  async scrollTo(sel, block = 'center', extra = 0) {
    await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});
      if(e){e.scrollIntoView({block:${JSON.stringify(block)},behavior:'instant'});window.scrollBy(0,${extra});}return true;})()`);
    await sleep(500);
  }
  async fig(i, block = 'center', extra = 0) {
    await this.eval(`(()=>{const f=document.querySelectorAll('#chapter-body .fig')[${i}];
      if(f)f.scrollIntoView({block:'center',behavior:'instant'});window.scrollBy(0,${extra});return true;})()`);
    await sleep(600);
    return this.eval(`(()=>{const cv=document.querySelectorAll('#chapter-body canvas')[${i}];
      if(!cv)return null;const r=cv.getBoundingClientRect();
      return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),
              left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};})()`);
  }
  async box(sel, nth = 0) {
    return this.eval(`(()=>{const e=document.querySelectorAll(${JSON.stringify(sel)})[${nth}];
      if(!e)return null;const r=e.getBoundingClientRect();
      return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),
              left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};})()`);
  }
  async mouse(type, x, y) {
    await this.cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(x), y: Math.round(y),
      button: type === 'mouseMoved' ? 'none' : 'left',
      buttons: type === 'mousePressed' ? 1 : 0, clickCount: type === 'mouseMoved' ? 0 : 1
    });
  }
  async moveTo(x, y) { await this.mouse('mouseMoved', x, y); await sleep(320); }
  async moveSlow(x0, y0, x1, y1, ms) {
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      await this.mouse('mouseMoved', x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
      await sleep(ms / steps);
    }
  }
  async clickAt(x, y, wait = 400) {
    await this.mouse('mouseMoved', x, y); await sleep(90);
    await this.mouse('mousePressed', x, y); await sleep(70);
    await this.mouse('mouseReleased', x, y); await sleep(wait);
  }
  async click(sel, nth = 0, wait = 500) {
    const b = await this.box(sel, nth);
    if (!b) throw new Error('没有元素 ' + sel + ' #' + nth);
    await this.clickAt(b.x, b.y, wait);
  }
  async drag(x0, y0, x1, y1, ms) {
    await this.mouse('mouseMoved', x0, y0); await sleep(120);
    await this.mouse('mousePressed', x0, y0); await sleep(120);
    await this.moveSlow(x0, y0, x1, y1, ms); await sleep(150);
    await this.mouse('mouseReleased', x1, y1); await sleep(400);
  }
  async setRange(value, nth = 0, ms = 900) {
    const i = await this.eval(`(()=>{const e=document.querySelectorAll('input.kit-range')[${nth}];
      if(!e)return null;const r=e.getBoundingClientRect();
      return {min:+e.min,max:+e.max,left:r.left,top:r.top,w:r.width,h:r.height};})()`);
    if (!i) throw new Error('没有滑杆 #' + nth);
    const y = i.top + i.h / 2;
    const tx = i.left + i.w * ((value - i.min) / (i.max - i.min));
    await this.drag(i.left + i.w * 0.5, y, tx, y, ms);
    await sleep(400);
  }
  async hover() { await sleep(400); }
  async shot(name, clip) {
    const opts = { format: 'png', captureBeyondViewport: false };
    if (clip) opts.clip = Object.assign({ scale: 1 }, clip);
    const r = await this.cdp.send('Page.captureScreenshot', opts);
    fs.writeFileSync(path.join(OUT, 'shot-' + name + '.png'), Buffer.from(r.data, 'base64'));
    console.log('  ✓ shot-' + name + '.png');
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--disable-default-apps',
    '--disable-features=Translate,MediaRouter', '--hide-crash-restore-bubble',
    '--force-device-scale-factor=1', `--window-size=${W},${H + 140}`, '--window-position=40,20',
    '--app=' + SITE
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      if (targets.some(t => t.type === 'page' && t.webSocketDebuggerUrl)) break;
    } catch (e) { }
  }
  const target = targets && targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!target) { console.error('无法连接 Chrome'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new CDP(ws), p = new Page(cdp);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await cdp.send('Page.bringToFront');
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (await p.eval('!!(window.VIZ&&window.VIZ.content&&window.VIZ.content.length===11)').catch(() => false)) break;
  }
  await sleep(1500);
  console.log('就绪：', await p.eval('document.title'));

  /* ---------------- 逐张摆状态并截图 ---------------- */
  const steps = [
    ['anscombe', async () => { await p.goto('#/ch/01'); await p.fig(0);
      await p.click('.fig .kit-btn', 0, 700); await sleep(1200); }],
    ['mantra', async () => { await p.goto('#/ch/04'); await p.fig(2); await sleep(400);
      await p.click('.fig .kit-group .kit-btn', 1, 800); await sleep(2400); }],
    ['cover-globe', async () => { await p.top(); await p.eval('VIZ.hero.show(5)'); await sleep(900); }],
    ['cover-grid', async () => { await p.eval('VIZ.hero.show(1)'); await sleep(900); }],
    ['toc', async () => { await p.scrollTo('#contents', 'start', -40); const b = await p.box('.toc-row', 1);
      await p.moveSlow(700, 400, b.x - 300, b.y, 700); await sleep(700); }],
    ['demo-bubble', async () => { await p.scrollTo('#demo-sec', 'start', -20);
      await p.click('#demo-tabs button', 3, 700); await sleep(2000);
      const cv = await p.box('#demo-canvas'); await p.moveTo(cv.left + cv.w * 0.30, cv.top + cv.h * 0.42); await p.hover(); }],
    ['reading', async () => { await p.goto('#/ch/03'); await p.scrollTo('#sec-1 .code', 'center', -60); await sleep(500); }],
    ['gestalt', async () => { await p.goto('#/ch/02'); await p.fig(0);
      await p.click('.fig .kit-group .kit-btn', 3, 700); await sleep(1200); }],
    ['preattentive', async () => { await p.fig(1); const cb = await p.box('#chapter-body canvas', 1);
      await p.clickAt(cb.x, cb.y, 400); await sleep(600);
      await p.moveSlow(cb.x - 380, cb.y - 120, cb.x + 320, cb.y + 90, 2200);
      const spot = await p.eval(`(()=>{const cv=document.querySelectorAll('#chapter-body canvas')[1];
        const r=cv.getBoundingClientRect();const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
        const dpr=cv.width/r.width;let sx=0,sy=0,n=0;
        for(let y=0;y<cv.height;y+=2)for(let x=0;x<cv.width;x+=2){const i=(y*cv.width+x)*4;
          if(d[i]>130&&d[i]<215&&d[i+1]<80&&d[i+2]<90){sx+=x;sy+=y;n++;}}
        return n?{x:Math.round(r.left+(sx/n)/dpr),y:Math.round(r.top+(sy/n)/dpr)}:null;})()`);
      if (spot) await p.moveTo(spot.x, spot.y); await sleep(500); }],
    ['weber', async () => { await p.fig(2); await p.setRange(2, 1, 700); await sleep(500);
      await p.setRange(26, 1, 1200); await sleep(800); }],
    ['dataclean', async () => { await p.goto('#/ch/03'); await p.fig(1);
      await p.click('.fig .kit-group .kit-btn', 1, 700); await sleep(1800); }],
    ['datashape', async () => { await p.fig(2); await p.click('.fig .kit-group .kit-btn', 1, 700); await sleep(1400); }],
    ['encoding', async () => { await p.goto('#/ch/05'); const enc = await p.fig(0);
      await p.clickAt(enc.left + enc.w * 0.46, enc.top + enc.h * 0.86, 700); await sleep(1500); }],
    ['dataink', async () => { await p.fig(2); await p.setRange(0.55, 0, 900); await sleep(600);
      await p.setRange(0.12, 0, 1200); await sleep(900); }],
    ['parcoords', async () => { await p.goto('#/ch/06'); const pc = await p.fig(0);
      await p.drag(pc.left + pc.w * 0.42, pc.top + pc.h * 0.2, pc.left + pc.w * 0.42, pc.top + pc.h * 0.5, 1400);
      await p.drag(pc.left + pc.w * 0.78, pc.top + pc.h * 0.6, pc.left + pc.w * 0.78, pc.top + pc.h * 0.3, 1200);
      await sleep(700); }],
    ['spm', async () => { await p.fig(1); const sp = await p.box('#chapter-body canvas', 1);
      await p.moveSlow(sp.x - 200, sp.y - 150, sp.left + sp.w * 0.36, sp.top + sp.h * 0.52, 1400); await sleep(700); }],
    ['timeseries', async () => { await p.goto('#/ch/07'); const ts = await p.fig(0);
      await p.drag(ts.left + ts.w * 0.3, ts.top + ts.h * 0.5, ts.left + ts.w * 0.72, ts.top + ts.h * 0.5, 1200);
      await p.moveTo(ts.left + ts.w * 0.55, ts.top + ts.h * 0.4); await sleep(700); }],
    ['stream', async () => { await p.fig(1); await p.click('.fig .kit-group .kit-btn', 1, 700); await sleep(2000); }],
    ['projection', async () => { await p.goto('#/ch/08'); await p.fig(0);
      await p.click('.fig .kit-group .kit-btn', 3, 800); await sleep(1500);
      const gc = await p.box('#chapter-body canvas', 0);
      await p.drag(gc.x, gc.y, gc.x + 200, gc.y + 60, 1500); await sleep(900); }],
    ['choropleth', async () => { await p.fig(1); await p.click('.fig .kit-group .kit-btn', 2, 800); await sleep(1400);
      const cc = await p.box('#chapter-body canvas', 1);
      await p.moveSlow(cc.x - 200, cc.y - 100, cc.left + cc.w * 0.42, cc.top + cc.h * 0.4, 1200); await sleep(700); }],
    ['network', async () => { await p.goto('#/ch/09'); const nc = await p.fig(1);
      await p.drag(nc.left + nc.w * 0.3, nc.top + nc.h * 0.35, nc.left + nc.w * 0.55, nc.top + nc.h * 0.6, 2000);
      await p.moveTo(nc.left + nc.w * 0.5, nc.top + nc.h * 0.45); await sleep(800); }],
    ['sankey', async () => { await p.fig(2); const sc = await p.box('#chapter-body canvas', 2);
      await p.moveSlow(sc.x - 250, sc.y, sc.left + sc.w * 0.12, sc.top + sc.h * 0.34, 1200); await sleep(800); }],
    ['focus', async () => { await p.goto('#/ch/10'); const fc = await p.fig(0);
      await p.moveSlow(fc.left + fc.w * 0.1, fc.top + fc.h * 0.35, fc.left + fc.w * 0.45, fc.top + fc.h * 0.55, 2000);
      await sleep(600); }],
    ['brushlink', async () => { const bc = await p.fig(1);
      await p.drag(bc.left + bc.w * 0.2, bc.top + bc.h * 0.25, bc.left + bc.w * 0.55, bc.top + bc.h * 0.75, 1400);
      await sleep(800); }],
    ['semanticzoom', async () => { await p.fig(2); await p.setRange(1.1, 0, 1200); await sleep(1200); }],
    ['bias', async () => { await p.goto('#/ch/11'); await p.fig(1);
      await p.click('.fig .kit-btn', 1, 700); await sleep(1600); }],
    ['english', async () => { await p.eval("VIZ.i18n.set('en')"); await p.goto('#/ch/06');
      await p.fig(0); await sleep(1200); }],
    ['search', async () => { await p.eval("VIZ.i18n.set('zh')"); await p.goto('#/ch/01'); await sleep(600);
      await p.eval(`document.getElementById('search-open').click();true`); await sleep(300);
      await p.eval(`(()=>{const i=document.getElementById('search-input');i.value='编码';i.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
      await sleep(600); }],
    ['notes', async () => { await p.eval(`document.getElementById('search').classList.remove('is-open');true`);
      await p.goto('#/notes'); await sleep(900); }],
    ['mobile-toc', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 414, height: 860, deviceScaleFactor: 2, mobile: true });
      await p.eval("VIZ.i18n.set('zh')"); await p.eval('window.scrollTo(0,0);true'); await p.goto('#/');
      await p.scrollTo('#contents', 'start', -30); await sleep(900); }],
    ['mobile-reading', async () => { await p.goto('#/ch/05'); await p.fig(0); await sleep(900); }],
    ['desktop-restore', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
      await p.eval('VIZ.hero.show(0)'); await sleep(600); }]
  ];

  for (const [name, fn] of steps) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    try { await fn(); await p.shot(name); }
    catch (e) { console.error('  ✗ ' + name + ': ' + e.message); }
    await sleep(250);
  }

  ws.close(); try { chrome.kill(); } catch (e) { }
  await sleep(500);
  try { execSync('taskkill /IM chrome.exe /F >NUL 2>&1', { stdio: 'ignore' }); } catch (e) { }
  console.log('截图完成 →', OUT);
})();
