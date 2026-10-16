/* ==========================================================================
   record-tour.cjs — 演示视频录屏脚本

   用 CDP 启动一个干净的 Chrome，逐场景驱动站点，把 Page.screencastFrame
   的帧序列连同时间戳写下来，再按真实帧间距编码成 mp4（每场景一个文件，
   编码后立即删除 JPEG，磁盘占用只保留一个场景的帧）。

   用法：
     set FFMPEG_PATH=<ffmpeg.exe>
     node tools/record-tour.cjs <输出目录> [场景编号...]

   随后由 tools/assemble-video.sh 按旁白时长裁切对齐、拼接并混音。
   ========================================================================== */
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const SITE = process.env.SITE_URL || 'https://wangling1206.github.io/visualization-intro/';
const PORT = 9222;
const VW = 1600, VH = 900;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'vid', 'scenes');
const ONLY = process.argv.slice(3).map(Number);
const PROFILE = path.join(os.tmpdir(), 'vid-chrome-profile');

const SCENES = [
  { id: 1, target: 27.9, title: '封面 · 同一批数据点的六种组织方式', script: s1 },
  { id: 2, target: 26.0, title: '目录 · 十一章与微缩图', script: s2 },
  { id: 3, target: 21.8, title: '首页演示 · 同一份数据的四种画法', script: s3 },
  { id: 4, target: 41.8, title: '第 2 章 · 感知：分组、搜索、阈值', script: s4 },
  { id: 5, target: 39.6, title: '第 3–5 章 · 清洗、编码、数据墨水比', script: s5 },
  { id: 6, target: 45.5, title: '第 6–9 章 · 高维、时序、地理、网络', script: s6 },
  { id: 7, target: 27.9, title: '第 10–11 章 · 交互与评估', script: s7 },
  { id: 8, target: 14.8, title: '中英文切换 · 全部图形实时绘制', script: s8 }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------------------- CDP 客户端 */
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        (this.handlers.get(msg.method) || []).forEach(f => { try { f(msg.params); } catch (e) { } });
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)); } }, 30000);
    });
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
}

/* ---------------------------------------------------------------- 页面操作 */
class Page {
  constructor(cdp) { this.cdp = cdp; this.mx = 800; this.my = 450; }

  async eval(expr, awaitPromise = false) {
    const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails));
    return r.result.value;
  }
  async box(sel, nth = 0) {
    return this.eval(`(() => {
      const els = document.querySelectorAll(${JSON.stringify(sel)});
      const e = els[${nth}];
      if (!e) return null;
      e.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
               left: Math.round(r.left), top: Math.round(r.top),
               w: Math.round(r.width), h: Math.round(r.height) };
    })()`);
  }
  /* 滚动到第 i 张图，返回其画布位置 */
  async fig(i) {
    await this.eval(`(() => { const f = document.querySelectorAll('#chapter-body .fig')[${i}];
      if (f) f.scrollIntoView({ block: 'center', behavior: 'instant' }); return true; })()`);
    await sleep(800);
    const b = await this.eval(`(() => {
      const cv = document.querySelectorAll('#chapter-body canvas')[${i}];
      if (!cv) return null;
      const r = cv.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
               left: Math.round(r.left), top: Math.round(r.top),
               w: Math.round(r.width), h: Math.round(r.height) };
    })()`);
    if (!b) throw new Error('第 ' + i + ' 张图的画布不存在');
    return b;
  }
  async scrollTo(sel, block = 'center', extra = 0) {
    await this.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)});
      if (e) { e.scrollIntoView({ block: ${JSON.stringify(block)}, behavior: 'instant' }); window.scrollBy(0, ${extra}); }
      return true; })()`);
  }
  async mouse(type, x, y) {
    await this.cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(x), y: Math.round(y),
      button: type === 'mouseMoved' ? 'none' : 'left',
      buttons: type === 'mousePressed' ? 1 : 0,
      clickCount: type === 'mouseMoved' ? 0 : 1
    });
    this.mx = x; this.my = y;
  }
  async moveSmooth(x0, y0, x1, y1, ms, steps = 22) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      await this.mouse('mouseMoved', x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
      await sleep(ms / steps);
    }
  }
  async clickAt(x, y, settle = 240) {
    await this.mouse('mouseMoved', x, y);
    await sleep(90);
    await this.mouse('mousePressed', x, y);
    await sleep(70);
    await this.mouse('mouseReleased', x, y);
    await sleep(settle);
  }
  async click(sel, nth = 0, settle = 300) {
    const b = await this.box(sel, nth);
    if (!b) throw new Error('没有元素 ' + sel + ' #' + nth);
    await this.clickAt(b.x, b.y, settle);
    return b;
  }
  async drag(x0, y0, x1, y1, ms) {
    await this.mouse('mouseMoved', x0, y0);
    await sleep(120);
    await this.mouse('mousePressed', x0, y0);
    await sleep(120);
    await this.moveSmooth(x0, y0, x1, y1, ms);
    await sleep(150);
    await this.mouse('mouseReleased', x1, y1);
  }
  /* 拖动第 nth 个滑杆到指定值 */
  async setRange(value, nth = 0, ms = 1200) {
    const info = await this.eval(`(() => {
      const e = document.querySelectorAll('input.kit-range')[${nth}];
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { min: +e.min, max: +e.max, left: r.left, top: r.top, w: r.width, h: r.height };
    })()`);
    if (!info) throw new Error('没有滑杆 #' + nth);
    const y = info.top + info.h / 2;
    const tx = info.left + info.w * ((value - info.min) / (info.max - info.min));
    await this.drag(info.left + info.w * 0.5, y, tx, y, ms);
  }
  async goto(hash) {
    await this.eval(`location.hash = ${JSON.stringify(hash)}; true`);
    await sleep(800);
  }
  /* 在画布上找出印红像素的中心——用来点中搜索游戏里的那个点 */
  async findSpot(canvasIndex) {
    return this.eval(`(() => {
      const cv = document.querySelectorAll('#chapter-body canvas')[${canvasIndex}];
      if (!cv) return null;
      const r = cv.getBoundingClientRect();
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      const dpr = cv.width / r.width;
      let sx = 0, sy = 0, n = 0;
      for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) {
        const i = (y * cv.width + x) * 4;
        if (d[i] > 130 && d[i] < 215 && d[i + 1] < 80 && d[i + 2] < 90) { sx += x; sy += y; n++; }
      }
      if (!n) return null;
      return { x: Math.round(r.left + (sx / n) / dpr), y: Math.round(r.top + (sy / n) / dpr), n };
    })()`);
  }
  /* 把画面撑满到 targetSec：循环调用 fn 直到时间用完 */
  async fillTo(t0, targetSec, fn) {
    let guard = 0;
    while ((Date.now() - t0) / 1000 < targetSec && guard++ < 60) await fn();
  }
}

/* ---------------------------------------------------------------- 场景脚本 */
async function s1(p, t0) {                       // 封面
  await p.eval('window.scrollTo(0,0); true');
  await p.moveSmooth(300, 700, 900, 320, 5200);
  await p.click('.cover-stages button', 2, 400);           // 柱群
  await sleep(1200);
  await p.click('.cover-stages button', 3, 400);           // 平行轴
  await sleep(900);
  await p.click('.cover-stages button', 5, 400);           // 地球
  await sleep(1000);
  await p.drag(1020, 450, 620, 380, 3600);                 // 拖动旋转球体
  await sleep(400);
  await p.moveSmooth(620, 380, 1150, 520, 3000);
  let k = 0;
  await p.fillTo(t0, 29.2, async () => {                   // 继续轮换状态
    await p.click('.cover-stages button', [4, 2, 0, 3, 5][k++ % 5], 350);
    await sleep(2400);
  });
}
async function s2(p, t0) {                       // 目录
  await p.scrollTo('#contents', 'start', -40);
  await sleep(1000);
  let y = 400;
  for (const i of [0, 1, 2, 3, 4]) {
    const b = await p.box('.toc-row', i);
    await p.moveSmooth(760, y, b.x - 280, b.y, 900);
    y = b.y;
    await sleep(2200);
  }
  let k = 5;
  await p.fillTo(t0, 26.8, async () => {
    const row = await p.box('.toc-row', k % 11);
    await p.moveSmooth(760, row.y, row.x, row.y, 900);
    await sleep(2100);
    k++;
  });
}
async function s3(p, t0) {                       // 四种画法
  await p.scrollTo('#demo-sec', 'start', -20);
  await sleep(1200);
  for (let i = 0; i < 4; i++) {
    await p.click('#demo-tabs button', i, 380);
    await sleep(3300);
  }
  const cv = await p.box('#demo-canvas');
  const y0 = cv.top + cv.h * 0.5;
  await p.moveSmooth(cv.left + cv.w * 0.2, y0 + 90, cv.left + cv.w * 0.5, y0 - 40, 2400);
  let k = 0;
  await p.fillTo(t0, 22.6, async () => {
    const tx = cv.left + cv.w * [0.24, 0.42, 0.6, 0.72][k++ % 4];
    await p.moveSmooth(p.mx, p.my, tx, y0 - 20, 1000);
    await sleep(1300);
  });
}
async function s4(p, t0) {                       // 第 2 章
  await p.goto('#/ch/02');
  await p.fig(0);                                            // 格式塔
  await p.click('.fig .kit-group .kit-btn', 3, 380);          // 连通
  await sleep(2400);
  await p.click('.fig .kit-group .kit-btn', 4, 380);          // 闭合
  await sleep(2400);
  await p.click('.fig .kit-group .kit-btn', 2, 380);          // 连续
  await sleep(1600);
  // 搜索游戏：开始计时 → 扫视 → 点中目标
  const cb = await p.fig(1);
  await p.clickAt(cb.x, cb.y, 400);
  await sleep(800);
  await p.moveSmooth(cb.x - 380, cb.y - 130, cb.x + 360, cb.y + 100, 2800);
  const spot = await p.findSpot(1);
  if (spot) { await p.moveSmooth(cb.x, cb.y, spot.x, spot.y, 800); await p.clickAt(spot.x, spot.y, 800); }
  await sleep(1200);
  // 换成「颜色 + 形状」再玩一次，用时会明显更长
  await p.click('.fig .kit-group .kit-btn', 3, 380);
  await sleep(500);
  await p.clickAt(cb.x, cb.y, 400);
  await p.moveSmooth(cb.x - 300, cb.y - 90, cb.x + 320, cb.y + 110, 2400);
  const spot2 = await p.findSpot(1);
  if (spot2) { await p.moveSmooth(cb.x + 320, cb.y + 110, spot2.x, spot2.y, 1200); await p.clickAt(spot2.x, spot2.y, 800); }
  await sleep(900);
  // 韦伯定律
  await p.fig(2);
  await p.setRange(2, 1, 800);
  await sleep(1300);
  await p.setRange(22, 1, 1400);
  await sleep(1300);
  await p.setRange(200, 0, 1600);
  await sleep(700);
  let k = 0;
  await p.fillTo(t0, 43.2, async () => {
    await p.setRange([4, 30, 200][k % 3], k % 3 === 2 ? 0 : 1, 1300);
    await sleep(1700);
    k++;
  });
}
async function s5(p, t0) {                       // 第 3–5 章
  await p.goto('#/ch/03');
  await p.fig(1);                                            // 清洗
  for (let i = 0; i < 4; i++) {
    await p.click('.fig .kit-group .kit-btn', i, 380);
    await sleep(3500);
  }
  await p.goto('#/ch/05');
  const enc = await p.fig(0);                                // 标记 × 通道
  const cells = [
    [enc.left + enc.w * 0.46, enc.top + enc.h * 0.86],
    [enc.left + enc.w * 0.74, enc.top + enc.h * 0.74],
    [enc.left + enc.w * 0.18, enc.top + enc.h * 0.86]
  ];
  for (const c of cells) { await p.clickAt(c[0], c[1], 600); await sleep(2200); }
  await p.fig(2);                                            // 数据墨水比
  await p.setRange(0.62, 0, 1200);
  await sleep(1300);
  await p.setRange(0.3, 0, 1400);
  await sleep(1300);
  await p.setRange(0, 0, 1500);
  await sleep(600);
  let k = 0;
  await p.fillTo(t0, 41.0, async () => {
    await p.setRange([0.15, 0.5, 0.28][k % 3], 0, 2000);
    await sleep(1800);
    k++;
  });
}
async function s6(p, t0) {                       // 第 6–9 章
  await p.goto('#/ch/06');
  const pc = await p.fig(0);                                 // 平行坐标刷选
  await p.drag(pc.left + pc.w * 0.42, pc.top + pc.h * 0.18, pc.left + pc.w * 0.42, pc.top + pc.h * 0.52, 1700);
  await sleep(1500);
  await p.drag(pc.left + pc.w * 0.78, pc.top + pc.h * 0.55, pc.left + pc.w * 0.78, pc.top + pc.h * 0.25, 1500);
  await sleep(900);
  await p.goto('#/ch/07');
  await p.fig(1);                                            // 流图基线
  await p.click('.fig .kit-group .kit-btn', 1, 450);
  await sleep(2600);
  await p.eval(`(() => { const g = document.querySelectorAll('#chapter-body .fig')[1].querySelectorAll('.kit-group');
    const b = g[1] && g[1].querySelectorAll('.kit-btn')[2]; if (b) b.click(); return true; })()`);
  await sleep(2000);
  await p.goto('#/ch/08');
  await p.fig(0);                                            // 投影
  await p.click('.fig .kit-group .kit-btn', 1, 550);          // 墨卡托
  await sleep(3200);
  await p.click('.fig .kit-group .kit-btn', 3, 550);          // 正射
  await sleep(1200);
  const gc = await p.fig(0);
  await p.drag(gc.x, gc.y, gc.x + 240, gc.y + 80, 3400);
  await sleep(700);
  await p.goto('#/ch/09');
  const nc = await p.fig(1);                                 // 力导向
  await p.drag(nc.left + nc.w * 0.3, nc.top + nc.h * 0.35, nc.left + nc.w * 0.52, nc.top + nc.h * 0.6, 3400);
  await sleep(1200);
  const sc = await p.fig(2);                                 // 桑基
  const nodes = [[0.12, 0.3], [0.12, 0.72], [0.5, 0.25], [0.5, 0.6], [0.88, 0.35], [0.88, 0.75]];
  let k = 0;
  await p.moveSmooth(sc.x, sc.y, sc.left + sc.w * nodes[0][0], sc.top + sc.h * nodes[0][1], 1600);
  await p.fillTo(t0, 46.8, async () => {
    const t = nodes[k++ % nodes.length];
    await p.moveSmooth(p.mx, p.my, sc.left + sc.w * t[0], sc.top + sc.h * t[1], 1100);
    await sleep(1700);
  });
}
async function s7(p, t0) {                       // 第 10–11 章
  await p.goto('#/ch/10');
  const fc = await p.fig(0);                                 // 鱼眼
  await p.moveSmooth(fc.left + fc.w * 0.12, fc.top + fc.h * 0.28, fc.left + fc.w * 0.6, fc.top + fc.h * 0.6, 3200);
  await sleep(500);
  await p.moveTo ? null : null;
  await p.mouse('mouseMoved', fc.left + fc.w * 0.34, fc.top + fc.h * 0.44);
  await sleep(700);
  await p.fig(2);                                            // 语义缩放
  await p.setRange(1.1, 0, 1300);
  await sleep(1400);
  await p.setRange(2, 0, 1500);
  await sleep(1200);
  await p.goto('#/ch/11');
  await p.fig(1);                                            // 正确但误导
  await p.click('.fig .kit-btn', 1, 550);                     // 改用面积
  await sleep(2400);
  await p.click('.fig .kit-btn', 2, 550);                     // 改用折线
  await sleep(1800);
  await p.click('.fig .kit-btn', 0, 550);                     // 关掉截断轴
  await sleep(1000);
  let k = 0;
  await p.fillTo(t0, 29.0, async () => {
    await p.click('.fig .kit-btn', [2, 1, 0][k++ % 3], 550);
    await sleep(2000);
  });
}
async function s8(p, t0) {                       // 双语与收尾
  await p.goto('#/');
  await p.eval('window.scrollTo(0,0); true');
  await sleep(700);
  await p.click('.lang-toggle button', 1, 800);               // EN
  await sleep(1200);
  await p.scrollTo('#contents', 'start', -40);
  await sleep(1000);
  const b = await p.box('.toc-row', 5);
  await p.moveSmooth(700, 400, b.x, b.y, 1200);
  await sleep(1300);
  await p.click('.toc-row', 5, 800);                          // 进入英文章节
  await sleep(1500);
  await p.click('.lang-toggle button', 0, 800);               // 切回中文
  await sleep(600);
  await p.goto('#/');
  await p.eval('window.scrollTo(0,0); true');
  await p.fillTo(t0, 15.6, async () => {                      // 收在封面
    await p.moveSmooth(500, 300, 1150, 620, 2100);
    await p.moveSmooth(1150, 620, 480, 320, 2100);
  });
}

/* ---------------------------------------------------------------- 主流程 */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--disable-default-apps',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    '--autoplay-policy=no-user-gesture-required', '--hide-crash-restore-bubble',
    '--force-device-scale-factor=1', `--window-size=${VW},${VH + 140}`, '--window-position=40,20',
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
  const page = targets && targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) { console.error('无法连接 Chrome'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new CDP(ws);
  const p = new Page(cdp);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await cdp.send('Page.bringToFront');

  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const ok = await p.eval('!!(window.VIZ && window.VIZ.content && window.VIZ.content.length === 11)').catch(() => false);
    if (ok) break;
  }
  await p.eval('document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>true) : true', true).catch(() => { });
  await sleep(1200);
  console.log('页面就绪：', await p.eval('document.title'));

  const manifest = [];
  for (const sc of SCENES) {
    if (ONLY.length && !ONLY.includes(sc.id)) continue;
    const dir = path.join(OUT, 's' + sc.id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    let n = 0, recording = true, stamps = [];
    cdp.on('Page.screencastFrame', ev => {
      cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }).catch(() => { });
      if (!recording) return;
      try {
        const name = 'f' + String(++n).padStart(5, '0') + '.jpg';
        fs.writeFileSync(path.join(dir, name), Buffer.from(ev.data, 'base64'));
        // 用本地时钟做时间戳：Chrome 的 screencast 时间戳在画面静止时不推进，
        // 会让静态场景被压缩掉一大段时长
        stamps.push({ f: name, ts: Date.now() / 1000 });
      } catch (e) { recording = false; }
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: VW, maxHeight: VH, everyNthFrame: 1 });
    const t0 = Date.now();
    try { await sc.script(p, t0); } catch (e) { console.error('  场景 ' + sc.id + ' 动作异常：' + e.message); }
    const elapsed = (Date.now() - t0) / 1000;
    await cdp.send('Page.stopScreencast');
    recording = false;
    await sleep(700);

    // 把「到达时间不均匀」的帧重采样成 30fps 定帧率序列：
    // 输出第 k 帧使用时间 k/30 处仍在显示的那一帧，用硬链接复用原文件，不占额外空间。
    const mp4 = path.join(OUT, 'scene' + sc.id + '.mp4');
    if (stamps.length) {
      const fps = 30;
      const nOut = Math.max(1, Math.round(elapsed * fps));
      // 时间戳是绝对时钟，必须先转成相对场景起点的偏移再比较，
      // 否则每一帧都会落到第一帧上，整段视频变成一张静止画面
      const base = stamps[0].ts;
      let src = 0, distinct = 1;
      for (let k = 0; k < nOut; k++) {
        const t = k / fps;
        while (src + 1 < stamps.length && stamps[src + 1].ts - base <= t) { src++; distinct = Math.max(distinct, src + 1); }
        try {
          fs.linkSync(path.join(dir, stamps[src].f), path.join(dir, 'c' + String(k).padStart(5, '0') + '.jpg'));
        } catch (e) {
          // 跨卷或链接失败时退回复制
          fs.copyFileSync(path.join(dir, stamps[src].f), path.join(dir, 'c' + String(k).padStart(5, '0') + '.jpg'));
        }
      }
      if (distinct < nOut * 0.02) console.error(`  ⚠ 场景 ${sc.id} 画面几乎没有变化（用到 ${distinct} 个源帧），请检查录屏`);
      try {
        execSync(`"${FFMPEG}" -y -hide_banner -loglevel error -start_number 0 -framerate ${fps} ` +
          `-i "${path.join(dir, 'c%05d.jpg')}" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p ` +
          `-movflags +faststart "${mp4}"`, { stdio: 'inherit' });
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) { console.error('  编码失败：' + e.message); }
    }
    const meta = { id: sc.id, title: sc.title, target: sc.target, frames: stamps.length,
                   elapsed: +elapsed.toFixed(2), fps: +(stamps.length / Math.max(0.5, elapsed)).toFixed(2), file: mp4 };
    manifest.push(meta);
    console.log(`场景 ${sc.id}  ${meta.frames} 帧 / ${meta.elapsed}s = ${meta.fps}fps  →  scene${sc.id}.mp4  （旁白 ${sc.target}s）`);
    await sleep(300);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  ws.close();
  try { chrome.kill(); } catch (e) { }
  await sleep(600);
  try { execSync('taskkill /IM chrome.exe /F >NUL 2>&1', { stdio: 'ignore' }); } catch (e) { }
  console.log('完成，输出目录：', OUT);
})();
