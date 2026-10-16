/* ==========================================================================
   kit.js — 图形工具库：画布、比例尺、坐标轴、动画、控件、数据集
   所有交互图都由 VIZ.figures 注册，并用这里的工具绘制。
   ========================================================================== */
(function () {
  'use strict';

  var VIZ = window.VIZ = window.VIZ || {};
  VIZ.figures = VIZ.figures || {};
  VIZ.content = VIZ.content || [];

  var SERIES = ['#141414', '#6f6f6f', '#a9a9a9', '#d4d4d4'];
  var SPOT = '#b4232a';
  var INK = '#141414', INK2 = '#454545', INK3 = '#767676', INK4 = '#a6a6a6', RULE = '#e5e5e5';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 小工具 ---------- */
  function ce(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  /* ---------- 比例尺 ---------- */
  function linear(d0, d1, r0, r1) {
    var f = function (x) { return r0 + (r1 - r0) * ((x - d0) / ((d1 - d0) || 1)); };
    f.invert = function (y) { return d0 + (d1 - d0) * ((y - r0) / ((r1 - r0) || 1)); };
    f.domain = [d0, d1]; f.range = [r0, r1];
    return f;
  }
  function logScale(d0, d1, r0, r1) {
    var l0 = Math.log(Math.max(d0, 1e-9)), l1 = Math.log(Math.max(d1, 1e-9));
    var f = function (x) { return r0 + (r1 - r0) * ((Math.log(Math.max(x, 1e-9)) - l0) / ((l1 - l0) || 1)); };
    f.invert = function (y) { return Math.exp(l0 + (l1 - l0) * ((y - r0) / ((r1 - r0) || 1))); };
    return f;
  }
  function band(n, r0, r1, padInner, padOuter) {
    padInner = padInner == null ? 0.16 : padInner;
    padOuter = padOuter == null ? 0.3 : padOuter;
    var span = r1 - r0, step = span / Math.max(n, 1);
    var pw = step * padInner, ow = step * padOuter / 2;
    var f = function (i) { return r0 + ow + i * step + pw / 2; };
    f.bandwidth = Math.max(1, step - pw);
    f.step = step;
    f.center = function (i) { return f(i) + f.bandwidth / 2; };
    return f;
  }
  function extent(arr, acc) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < arr.length; i++) {
      var v = acc ? acc(arr[i]) : arr[i];
      if (v == null || isNaN(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return [lo, hi];
  }
  function ticks(lo, hi, n) {
    n = n || 5;
    if (!isFinite(lo) || !isFinite(hi)) return [];
    if (lo === hi) return [lo];
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : +v.toFixed(10));
    return out;
  }
  function fmt(v, digits) {
    if (v == null || isNaN(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
    if (a >= 1e4 && digits !== 0) return (v / 1e3).toFixed(1) + 'k';
    if (a >= 100) return String(Math.round(v));
    if (a >= 1) return String(+(+v).toFixed(digits == null ? 1 : digits));
    if (a === 0) return '0';
    return String(+(+v).toFixed(digits == null ? 2 : digits));
  }

  /* ---------- 颜色 ---------- */
  function ramp(from, to) {
    var a = hex(from), b = hex(to);
    return function (t) {
      t = clamp(t, 0, 1);
      return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' +
        Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
    };
  }
  function hex(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function withAlpha(h, a) {
    var c = hex(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  /* ---------- 画布 ---------- */
  function useCanvas(host, opts) {
    opts = opts || {};
    var cv = ce('canvas');
    host.appendChild(cv);
    var st = {
      cv: cv, ctx: cv.getContext('2d'), w: 0, h: 0, dpr: 1,
      host: host, opts: opts, onResize: null, onDraw: opts.draw || null
    };
    var first = true;
    function resize() {
      var w = Math.max(140, Math.round(host.clientWidth || 320));
      var h = typeof opts.h === 'function' ? opts.h(w) : (opts.h || 260);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      // 尺寸没变就不动画布：既省一次清屏重绘，也避免 ResizeObserver 回环告警
      if (!first && w === st.w && h === st.h && dpr === st.dpr) return;
      st.w = w; st.h = h; st.dpr = dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);   // 这一行会清空画布
      cv.style.width = '100%'; cv.style.height = h + 'px';
      st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (st.onResize) st.onResize();
      // 尺寸变化后立即补画一帧，避免出现空白；首次由挂载方自己触发
      if (st.onDraw && !first) st.onDraw();
    }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(host);
      st._ro = ro;
    } else {
      window.addEventListener('resize', resize);
    }
    resize();
    first = false;
    st.resize = resize;
    return st;
  }

  /* ---------- 动画：全局单循环 ---------- */
  var ticking = new Set();
  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    ticking.forEach(function (f) { try { f(dt, ts / 1000); } catch (e) { ticking.delete(f); console.error(e); } });
    if (ticking.size) requestAnimationFrame(frame);
  }
  var raf = {
    add: function (f) {
      ticking.add(f);
      if (ticking.size === 1) { last = performance.now(); requestAnimationFrame(frame); }
      return f;
    },
    remove: function (f) { ticking.delete(f); },
    clear: function () { ticking.clear(); }
  };

  function ticker(st, draw) {
    // 只在该画布可见时运行动画
    var active = false, id = null;
    function run(dt, t) { draw(dt, t); }
    function start() { if (!active) { active = true; id = raf.add(run); } }
    function stop() { if (active) { active = false; raf.remove(id); } }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting && e.intersectionRatio > 0.05 ? start() : stop(); });
      }, { threshold: [0, 0.06, 0.4] });
      io.observe(st.cv);
      st._io = io;
    } else start();
    if (document.hidden) stop();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    return { start: start, stop: stop, get active() { return active; } };
  }

  /* 缓动与补间 */
  var ease = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    outBack: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    inOutSine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  };

  function tween(dur, onUpdate, onDone, easeFn) {
    if (reduced) dur = Math.min(dur, 0.001);
    var t0 = null, id = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / (dur * 1000), 0, 1);
      onUpdate((easeFn || ease.inOut)(p), p);
      if (p < 1) id = requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    id = requestAnimationFrame(step);
    return { cancel: function () { if (id) cancelAnimationFrame(id); } };
  }

  /* 入场进度：首次同步绘制（无 dt）直接给出终态，动画循环启动后从 0 播放一次。
     这样在后台标签页、禁用动画或动画循环不可用时，图形仍然是完整可读的。 */
  function intro(dur) {
    var s = { v: 1, armed: true, dur: dur || 0.9 };
    s.tick = function (dt) {
      if (dt == null || dt <= 0) return s.v;
      if (s.armed) { s.armed = false; if (!reduced) s.v = 0; }
      if (s.v < 1) s.v = Math.min(1, s.v + dt / (reduced ? 0.001 : s.dur));
      return s.v;
    };
    return s;
  }

  /* 值稳定器：让数值平滑逼近目标（用于连续动画） */
  function spring(init) {
    var s = { v: init, target: init, k: 7 };
    s.to = function (v) { s.target = v; return s; };
    s.jump = function (v) { s.v = s.target = v; return s; };
    s.step = function (dt) { s.v += (s.target - s.v) * Math.min(1, s.k * dt); return s.v; };
    return s;
  }

  /* ---------- 绘图辅助 ---------- */
  function clear(ctx, w, h) { ctx.clearRect(0, 0, w, h); }
  function hline(ctx, x0, x1, y, color, dash) {
    ctx.save(); ctx.beginPath();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = color || RULE; ctx.lineWidth = 1;
    ctx.moveTo(x0, Math.round(y) + 0.5); ctx.lineTo(x1, Math.round(y) + 0.5); ctx.stroke(); ctx.restore();
  }
  function vline(ctx, x, y0, y1, color, dash) {
    ctx.save(); ctx.beginPath();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = color || RULE; ctx.lineWidth = 1;
    ctx.moveTo(Math.round(x) + 0.5, y0); ctx.lineTo(Math.round(x) + 0.5, y1); ctx.stroke(); ctx.restore();
  }
  function line(ctx, pts, opts) {
    opts = opts || {};
    ctx.save();
    ctx.beginPath();
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.strokeStyle = opts.color || INK;
    ctx.lineWidth = opts.width || 1.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!isFinite(p[0]) || !isFinite(p[1])) continue;
      i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke(); ctx.restore();
  }
  function dot(ctx, x, y, r, color, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = color || INK;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  function ring(ctx, x, y, r, color, width, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.strokeStyle = color || INK; ctx.lineWidth = width || 1.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke(); ctx.restore();
  }
  function square(ctx, x, y, s, color, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = color || INK;
    ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.restore();
  }
  function label(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = (opts.weight || 400) + ' ' + (opts.size || 11) + 'px ' +
      (opts.mono ? 'IBM Plex Mono, ui-monospace, monospace' : 'IBM Plex Sans, Segoe UI, "Microsoft YaHei", sans-serif');
    ctx.fillStyle = opts.color || INK3;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    if (opts.rotate) { ctx.translate(x, y); ctx.rotate(opts.rotate); x = 0; y = 0; }
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function fitText(ctx, text, maxWidth, size, opts) {
    // 按需缩小字号以适配宽度
    var s = size;
    while (s > 8) {
      ctx.font = (opts && opts.weight || 400) + ' ' + s + 'px ' + (opts && opts.font || 'IBM Plex Sans, sans-serif');
      if (ctx.measureText(text).width <= maxWidth) break;
      s -= 0.5;
    }
    return s;
  }
  function frameAxes(ctx, g) {
    // g: {x0, y0, w, h, x (scale), y (scale), xTicks, yTicks, xFormat, yFormat, grid, yGrid, xLabel, yLabel}
    var i, v, px, py;
    var x0 = g.x0, y0 = g.y0, w = g.w, h = g.h;
    ctx.save();
    if (g.yTicks) for (i = 0; i < g.yTicks.length; i++) {
      v = g.yTicks[i];
      py = g.y(v);
      if (g.yGrid !== false) hline(ctx, x0, x0 + w, py, RULE);
      label(ctx, g.yFormat ? g.yFormat(v) : fmt(v), x0 - 8, py + 3.5, { align: 'right', size: 10.5, mono: true, color: INK4 });
    }
    if (g.xTicks) for (i = 0; i < g.xTicks.length; i++) {
      v = g.xTicks[i];
      px = g.x(v);
      if (g.grid) vline(ctx, px, y0, y0 + h, RULE);
      label(ctx, g.xFormat ? g.xFormat(v) : fmt(v), px, y0 + h + 15, { align: 'center', size: 10.5, mono: true, color: INK4 });
    }
    if (g.xAxis !== false) hline(ctx, x0, x0 + w, y0 + h, INK, null);
    if (g.yAxis) vline(ctx, x0, y0, y0 + h, INK, null);
    if (g.xLabel) label(ctx, g.xLabel, x0 + w, y0 + h + 30, { align: 'right', size: 10.5 });
    if (g.yLabel) label(ctx, g.yLabel, x0, y0 - 13, { align: 'left', size: 10.5 });
    ctx.restore();
  }

  /* ---------- 控件 ---------- */
  function row(host) { var r = ce('div', { class: 'kit-row' }); host.appendChild(r); return r; }
  function btn(parent, text, onClick, opts) {
    opts = opts || {};
    var b = ce('button', { class: 'kit-btn' + (opts.accent ? ' is-accent' : ''), type: 'button', text: text });
    if (opts.pressed) b.setAttribute('aria-pressed', 'true');
    if (opts.title) b.title = opts.title;
    b.addEventListener('click', function () { onClick(b); });
    (parent || document.body).appendChild(b);
    return b;
  }
  function group(parent, items, onChange, opts) {
    opts = opts || {};
    var g = ce('div', { class: 'kit-group' });
    var btns = items.map(function (it, i) {
      var b = ce('button', { class: 'kit-btn', type: 'button', text: it.label || it });
      b.dataset.val = it.value != null ? it.value : it;
      b.addEventListener('click', function () { select(b.dataset.val); onChange(b.dataset.val); });
      if (opts.title) b.title = opts.title;
      g.appendChild(b);
      return b;
    });
    function select(v) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.val === String(v))); });
    }
    (parent || document.body).appendChild(g);
    select(opts.value != null ? opts.value : (items[0].value != null ? items[0].value : items[0]));
    g.select = select;
    return g;
  }
  function rangeField(parent, labelText, min, max, value, step, onInput, unit) {
    var f = ce('label', { class: 'kit-field' });
    f.appendChild(ce('span', { text: labelText }));
    var inp = ce('input', { class: 'kit-range', type: 'range', min: min, max: max, step: step || 1, value: value });
    var v = ce('span', { class: 'v', text: value + (unit || '') });
    inp.addEventListener('input', function () {
      v.textContent = inp.value + (unit || '');
      onInput(parseFloat(inp.value));
    });
    f.appendChild(inp); f.appendChild(v);
    (parent || document.body).appendChild(f);
    return { input: inp, set: function (x) { inp.value = x; v.textContent = x + (unit || ''); } };
  }
  function stat(parent, html) {
    var s = ce('span', { class: 'kit-stat', html: html });
    (parent || document.body).appendChild(s);
    return { el: s, set: function (h) { s.innerHTML = h; } };
  }
  function legend(parent, items) {
    var l = ce('div', { class: 'kit-legend' });
    items.forEach(function (it) {
      l.appendChild(ce('span', null, [
        ce('i', { class: it.round ? 'rd' : (it.shape === 'line' ? '' : 'sq') }),
        ce('span', { text: it.label })
      ]));
    });
    (parent || document.body).appendChild(l);
    return l;
  }
  function tooltip(plate) {
    var tip = ce('div', { class: 'kit-tip' });
    plate.appendChild(tip);
    return {
      el: tip,
      show: function (x, y, html) {
        tip.innerHTML = html;
        var w = tip.offsetWidth, h = tip.offsetHeight;
        var pw = plate.clientWidth, ph = plate.clientHeight;
        var tx = clamp(x + 14, 4, Math.max(4, pw - w - 4));
        var ty = y - h - 12;
        if (ty < 4) ty = y + 16;
        ty = clamp(ty, 4, Math.max(4, ph - h - 4));
        tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
        tip.classList.add('is-on');
      },
      hide: function () { tip.classList.remove('is-on'); }
    };
  }
  function plate(host) {
    var p = ce('div', { class: 'fig-plate' });
    var t = ce('div', { class: 'fig-ticks', html: '<i></i><i></i><i></i><i></i>' });
    host.appendChild(p);
    p.appendChild(t);
    var inner = ce('div', { style: 'position:relative' });
    p.insertBefore(inner, t);
    return { el: p, inner: inner };
  }

  /* ---------- 数据 ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v);
  }

  var data = {};

  var REG = { asia: ['亚洲', 'Asia'], europe: ['欧洲', 'Europe'], america: ['美洲', 'Americas'], africa: ['非洲', 'Africa'], oceania: ['大洋洲', 'Oceania'] };
  data.regions = REG;
  data.cities = [
    ['北京', 'Beijing', 116.4, 39.9, 21.7, 'asia'], ['上海', 'Shanghai', 121.47, 31.23, 28.5, 'asia'],
    ['广州', 'Guangzhou', 113.26, 23.13, 13.9, 'asia'], ['深圳', 'Shenzhen', 114.06, 22.54, 12.8, 'asia'],
    ['成都', 'Chengdu', 104.07, 30.57, 9.5, 'asia'], ['香港', 'Hong Kong', 114.17, 22.32, 7.5, 'asia'],
    ['重庆', 'Chongqing', 106.55, 29.56, 17.0, 'asia'], ['天津', 'Tianjin', 117.2, 39.13, 13.9, 'asia'],
    ['武汉', 'Wuhan', 114.3, 30.59, 8.5, 'asia'], ['西安', "Xi'an", 108.94, 34.34, 8.0, 'asia'],
    ['东京', 'Tokyo', 139.69, 35.69, 37.0, 'asia'], ['首尔', 'Seoul', 126.98, 37.57, 9.9, 'asia'],
    ['新德里', 'New Delhi', 77.21, 28.61, 32.0, 'asia'], ['孟买', 'Mumbai', 72.88, 19.08, 21.3, 'asia'],
    ['曼谷', 'Bangkok', 100.5, 13.75, 10.9, 'asia'], ['新加坡', 'Singapore', 103.82, 1.35, 6.0, 'asia'],
    ['雅加达', 'Jakarta', 106.85, -6.21, 10.9, 'asia'], ['马尼拉', 'Manila', 120.98, 14.6, 14.6, 'asia'],
    ['迪拜', 'Dubai', 55.27, 25.2, 3.6, 'asia'], ['莫斯科', 'Moscow', 37.62, 55.75, 12.6, 'europe'],
    ['伊斯坦布尔', 'Istanbul', 28.98, 41.01, 15.6, 'europe'], ['开罗', 'Cairo', 31.24, 30.04, 21.8, 'africa'],
    ['拉各斯', 'Lagos', 3.38, 6.52, 15.4, 'africa'], ['内罗毕', 'Nairobi', 36.82, -1.29, 5.3, 'africa'],
    ['约翰内斯堡', 'Johannesburg', 28.05, -26.2, 6.2, 'africa'], ['巴黎', 'Paris', 2.35, 48.86, 11.1, 'europe'],
    ['伦敦', 'London', -0.13, 51.51, 9.5, 'europe'], ['柏林', 'Berlin', 13.4, 52.52, 3.6, 'europe'],
    ['马德里', 'Madrid', -3.7, 40.42, 6.7, 'europe'], ['罗马', 'Rome', 12.5, 41.9, 4.3, 'europe'],
    ['纽约', 'New York', -74.01, 40.71, 18.9, 'america'], ['芝加哥', 'Chicago', -87.63, 41.88, 8.9, 'america'],
    ['多伦多', 'Toronto', -79.38, 43.65, 6.3, 'america'], ['洛杉矶', 'Los Angeles', -118.24, 34.05, 12.5, 'america'],
    ['墨西哥城', 'Mexico City', -99.13, 19.43, 21.8, 'america'], ['波哥大', 'Bogotá', -74.07, 4.71, 11.3, 'america'],
    ['圣保罗', 'São Paulo', -46.63, -23.55, 22.4, 'america'], ['利马', 'Lima', -77.04, -12.05, 11.0, 'america'],
    ['布宜诺斯艾利斯', 'Buenos Aires', -58.38, -34.6, 15.4, 'america'], ['温哥华', 'Vancouver', -123.12, 49.28, 2.6, 'america'],
    ['悉尼', 'Sydney', 151.21, -33.87, 5.3, 'oceania'], ['奥克兰', 'Auckland', 174.76, -36.85, 1.7, 'oceania']
  ].map(function (c, i) {
    return { id: i, zh: c[0], en: c[1], lon: c[2], lat: c[3], pop: c[4], region: c[5] };
  });

  data.gapminder = (function () {
    var seeds = [
      ['中国', 'China', 1960, 89, 1050, 667, 2020, 77, 10500, 1411],
      ['印度', 'India', 1960, 41, 330, 445, 2020, 70, 1930, 1380],
      ['美国', 'United States', 1960, 70, 15400, 181, 2020, 79, 63500, 331],
      ['巴西', 'Brazil', 1960, 54, 2100, 73, 2020, 76, 8800, 213],
      ['尼日利亚', 'Nigeria', 1960, 38, 800, 45, 2020, 55, 2100, 206],
      ['日本', 'Japan', 1960, 68, 4800, 93, 2020, 84, 40200, 126]
    ];
    var rows = [];
    seeds.forEach(function (s) {
      for (var y = 1960; y <= 2020; y += 2) {
        var t = (y - 1960) / 60;
        rows.push({
          zh: s[0], en: s[1], year: y,
          lifeExp: +lerp(s[3], s[6], ease.inOutSine(t) * 0.86 + t * 0.14).toFixed(1),
          gdp: Math.round(lerp(s[4], s[7], Math.pow(t, 0.86))),
          pop: Math.round(lerp(s[5], s[8], Math.pow(t, 0.62)))
        });
      }
    });
    return rows;
  })();

  data.multi = (function () {
    var r = rng(20240516);
    var rows = [];
    var classes = ['小型车', '中型车', 'SUV'];
    for (var c = 0; c < 3; c++) {
      var base = [34, 26, 19][c], w = [900, 1400, 1900][c], hp = [78, 130, 175][c];
      for (var i = 0; i < 14; i++) {
        var j = gauss(r);
        rows.push({
          cls: c,
          hp: Math.max(50, Math.round(hp + j * hp * 0.14 + gauss(r) * 8)),
          weight: Math.max(700, Math.round(w + j * w * 0.11 + gauss(r) * 60)),
          mpg: Math.max(8, +(base - (w / 1900) * 6 + gauss(r) * 2.4).toFixed(1)),
          disp: +(0.9 + c * 1.5 + Math.abs(j) * 0.9 + r() * 0.7).toFixed(1),
          acc: +(19 - c * 3.2 + gauss(r) * 1.1).toFixed(1),
          year: Math.round(2004 + r() * 18)
        });
      }
    }
    return rows;
  })();

  data.series = (function () {
    var r = rng(77003);
    var out = [];
    var cities = [['北京', 'Beijing'], ['上海', 'Shanghai'], ['广州', 'Guangzhou'], ['成都', 'Chengdu']];
    cities.forEach(function (c, ci) {
      var base = [6, 12, 18, 10][ci], amp = [14, 10, 7, 9][ci];
      var arr = [];
      for (var m = 0; m < 48; m++) {
        var season = Math.sin((m % 12 - 3) / 12 * 2 * Math.PI);
        arr.push({
          m: m,
          v: +(base + amp * season + (ci === 3 ? 1 : 0) + (r() - 0.5) * 1.6 + m / 48 * (ci === 0 ? 1.2 : 0.6)).toFixed(1)
        });
      }
      out.push({ zh: c[0], en: c[1], values: arr });
    });
    return out;
  })();

  data.matrix = (function () {
    var r = rng(919);
    var rows = [], cats = ['搜索', '推荐', '社交', '视频', '电商', '资讯', '工具', '游戏'];
    for (var d = 0; d < 28; d++) {
      var row = { d: d, zh: '第' + (d + 1) + '日', en: 'Day ' + (d + 1), v: [] };
      for (var c = 0; c < cats.length; c++) {
        var base = 40 + 26 * Math.sin((d / 28) * 6.28 + c * 0.8) + (c === 3 ? 18 : 0);
        row.v.push(Math.max(4, Math.round(base + r() * 22)));
      }
      rows.push(row);
    }
    return { rows: rows, cats: { zh: cats, en: ['Search', 'Feed', 'Social', 'Video', 'Shop', 'News', 'Tools', 'Games'] } };
  })();

  data.network = (function () {
    var r = rng(31337), nodes = [], links = [];
    var clusters = 5, per = 11;
    for (var c = 0; c < clusters; c++) {
      var ca = (c / clusters) * Math.PI * 2;
      for (var i = 0; i < per; i++) {
        nodes.push({
          id: nodes.length, c: c,
          r: 0.34 + 0.4 * Math.sqrt(i / per) + r() * 0.06,
          a: ca + (i / per) * 1.5 + r() * 0.25,
          deg: 1 + Math.round(r() * 3),
          label: 'N' + (nodes.length + 1)
        });
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      for (var m = k + 1; m < nodes.length; m++) {
        if (nodes[k].c === nodes[m].c) {
          if (r() < 0.24) links.push({ s: k, t: m, w: 0.4 + r() });
        } else if (r() < 0.016) links.push({ s: k, t: m, w: 0.3 + r() * 0.5 });
      }
    }
    for (var q = 0; q < nodes.length - 1; q++) if (r() < 0.35) links.push({ s: q, t: q + 1, w: 0.5 });
    return { nodes: nodes, links: links };
  })();

  /* 章节层级：用真实课程内容生成，用于矩形树图 / 旭日图 */
  function bookTree(lang) {
    var root = { name: lang === 'en' ? 'Visualization' : '可视化导论', children: [] };
    (VIZ.content || []).forEach(function (ch) {
      var node = { name: ch.num + ' ' + ch[lang].title, children: [] };
      var total = 0;
      (ch.sections || []).forEach(function (s) {
        var len = 0;
        (s.blocks || []).forEach(function (b) {
          if (typeof b[lang] === 'string') len += b[lang].length;
          else if (Array.isArray(b[lang])) len += b[lang].join('').length;
          else if (b[lang] && b[lang].rows) len += 40;
        });
        var w = Math.max(60, Math.round(len / 6));
        total += w;
        node.children.push({ name: s[lang].title, value: w });
      });
      node.value = total;
      root.children.push(node);
    });
    return root;
  }

  /* ---------- 代码高亮（灰阶 + 一点红） ---------- */
  var KW = {
    python: 'def|return|import|from|as|for|in|if|elif|else|while|with|class|None|True|False|and|or|not|lambda|print|yield|try|except|pass|break|continue|global|assert|raise|is|del|async|await',
    javascript: 'const|let|var|function|return|if|else|for|of|in|while|new|class|extends|import|export|from|default|await|async|try|catch|finally|throw|typeof|instanceof|null|undefined|true|false|this|=>|yield|delete|switch|case|break|continue|do|static|get|set',
    js: 'const|let|var|function|return|if|else|for|of|in|while|new|class|extends|import|export|from|default|await|async|try|catch|finally|throw|typeof|instanceof|null|undefined|true|false|this|=>|yield|delete|switch|case|break|continue|do|static|get|set',
    sql: 'SELECT|FROM|WHERE|GROUP|BY|ORDER|HAVING|JOIN|LEFT|RIGHT|INNER|ON|AS|AND|OR|NOT|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|COUNT|SUM|AVG|MIN|MAX|DISTINCT|CASE|WHEN|THEN|END|WITH',
    bash: 'cd|ls|npm|pip|python|node|git|install|run|echo|curl|make|source|export|if|then|fi|for|do|done',
    r: 'function|library|if|else|for|in|return|TRUE|FALSE|NULL|<-|c|print|data|frame|ggplot|aes|geom|library'
  };
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function highlight(code, lang) {
    var kw = KW[(lang || '').toLowerCase()] || KW.javascript;
    var tokens = [];
    var re = new RegExp([
      '(#[^\\n]*|//[^\\n]*|/\\*[\\s\\S]*?\\*/)',          // 1 comment
      '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)', // 2 string
      '(\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b)',       // 3 number
      '(\\b(?:' + kw + ')\\b)',                           // 4 keyword
      '([A-Za-z_$][\\w$]*)(?=\\s*\\()',                   // 5 call
      '([{}()\\[\\];,.:=+\\-*/%<>!&|?~^]+)'               // 6 operator
    ].join('|'), 'g');
    var out = '', lastI = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(lastI, m.index));
      var cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-num' : m[4] ? 'tok-kw' : m[5] ? 'tok-fn' : 'tok-op';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      lastI = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    out += esc(code.slice(lastI));
    return out;
  }

  VIZ.kit = {
    SERIES: SERIES, SPOT: SPOT, INK: INK, INK2: INK2, INK3: INK3, INK4: INK4, RULE: RULE,
    reduced: reduced,
    ce: ce, clamp: clamp, lerp: lerp, dist: dist, rng: rng, gauss: gauss,
    linear: linear, log: logScale, band: band, extent: extent, ticks: ticks, fmt: fmt,
    ramp: ramp, hex: hex, withAlpha: withAlpha, gray: ramp('#f0f0f0', '#141414'), deep: ramp('#d9d9d9', '#141414'),
    useCanvas: useCanvas, clear: clear, hline: hline, vline: vline, line: line,
    dot: dot, ring: ring, square: square, label: label, fitText: fitText, axes: frameAxes,
    raf: raf, ticker: ticker, tween: tween, ease: ease, spring: spring, intro: intro,
    row: row, btn: btn, group: group, range: rangeField, stat: stat, legend: legend,
    tooltip: tooltip, plate: plate, highlight: highlight, esc: esc,
    data: data, bookTree: bookTree
  };
})();
