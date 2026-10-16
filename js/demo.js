/* ==========================================================================
   demo.js — 首页演示：同一份数据的四种画法
   位置 / 长度 / 顺序 / 面积，四种编码之间连续变形。
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit, I = VIZ.i18n;

  var ENC = [
    { id: 'bar', zh: ['条形图', '长度 = 人口'], en: ['Bars', 'length = population'] },
    { id: 'scatter', zh: ['散点图', '位置 = 经纬度'], en: ['Scatter', 'position = coordinates'] },
    { id: 'line', zh: ['折线图', '顺序 = 经度'], en: ['Line', 'order = longitude'] },
    { id: 'bubble', zh: ['气泡图', '面积 = 人口'], en: ['Bubbles', 'area = population'] }
  ];

  var PAD = { l: 56, r: 26, t: 34, b: 38 };
  var cities, env = null;

  function prep() {
    cities = K.data.cities.slice().sort(function (a, b) { return b.pop - a.pop; });
    cities.forEach(function (c, i) { c.rank = i; });
  }
  function isHi(c) { return c.region === 'africa'; }

  /* 每种编码给出：标记中心、宽高、圆角、坐标轴与文字 */
  function layout(enc, w, h) {
    var iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;
    var out = { marks: [], axes: null };
    var i;
    if (enc === 'bar') {
      var xb = K.band(cities.length, 0, iw, 0.22, 0.2);
      var yb = K.linear(0, 40, ih, 0);
      for (i = 0; i < cities.length; i++) {
        var bh = ih - yb(cities[i].pop);
        out.marks.push({ c: cities[i], x: PAD.l + xb(i) + xb.bandwidth / 2, y: PAD.t + yb(cities[i].pop) + bh / 2, w: xb.bandwidth, h: Math.max(1, bh), r: 0 });
      }
      out.axes = { x: null, y: K.linear(0, 40, PAD.t + ih, PAD.t), yTicks: [0, 10, 20, 30, 40], yf: function (v) { return v; }, yLabel: '人口 / 百万', xLabel: null, labels: cities.slice(0, 4).map(function (c) { return { t: short(c), m: out.marks[c.rank] }; }) };
    } else if (enc === 'scatter' || enc === 'line') {
      var lon = K.linear(-170, 180, 0, iw);
      var ys = K.linear(0, 40, ih, 0);
      var sorted = cities.slice().sort(function (a, b) { return a.lon - b.lon; });
      sorted.forEach(function (c, k) { c.order = k; });
      cities.forEach(function (c) {
        var cx = PAD.l + (enc === 'line' ? (c.order + 0.5) / cities.length * iw : lon(c.lon));
        var cy = PAD.t + ys(c.pop);
        var d = enc === 'line' ? 5 : 6;
        out.marks.push({ c: c, x: cx, y: cy, w: d, h: d, r: d / 2, line: enc === 'line' });
      });
      out.axes = {
        x: enc === 'line' ? K.linear(0, cities.length, PAD.l, PAD.l + iw) : lon,
        y: K.linear(0, 40, PAD.t + ih, PAD.t),
        yTicks: [0, 10, 20, 30, 40], yf: function (v) { return v; },
        xTicks: enc === 'line' ? null : [-150, -100, -50, 0, 50, 100, 150],
        xf: function (v) { return v + '°'; },
        xLabel: enc === 'line' ? '按经度排序的城市' : '经度', yLabel: '人口 / 百万'
      };
      out.path = enc === 'line' ? sorted.map(function (c) { return [PAD.l + (c.order + 0.5) / cities.length * iw, PAD.t + ys(c.pop)]; }) : null;
    } else {
      var lx = K.linear(-170, 180, 0, iw);
      var ly = K.linear(-40, 62, ih, 0);
      var rmax = Math.sqrt(28.5);
      cities.forEach(function (c) {
        var rr = Math.sqrt(c.pop) / rmax * Math.min(34, ih * 0.13);
        out.marks.push({ c: c, x: PAD.l + lx(c.lon), y: PAD.t + ly(c.lat), w: rr * 2, h: rr * 2, r: rr });
      });
      var land = landDots(iw, ih, lx, ly);
      out.landPts = land;
      out.axes = {
        x: lx, y: ly, yTicks: [-20, 0, 20, 40, 60], yf: function (v) { return v + '°'; },
        xTicks: [-150, -100, -50, 0, 50, 100, 150], xf: function (v) { return v + '°'; },
        xLabel: '经度', yLabel: '纬度'
      };
    }
    return out;
  }

  /* 气泡图的底图：用陆地轮廓点出淡淡的点阵 */
  function landDots(iw, ih, lx, ly) {
    var pts = [], land = window.VIZ_LAND || [];
    for (var p = 0; p < land.length; p += 2) {
      var ring = land[p];
      for (var i = 0; i < ring.length; i += 4) {
        var x = lx(ring[i][0]), y = ly(ring[i][1]);
        if (x > -5 && x < iw + 5 && y > -5 && y < ih + 5) pts.push([x, y]);
      }
    }
    return pts;
  }

  function short(c) { return I.lang === 'zh' ? c.zh : c.en; }
  function num(v) { return v.toFixed(1); }

  function draw(ctx, w, h, from, to, t, hover) {
    K.clear(ctx, w, h);
    var A = PAD.l, B = PAD.t, iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;

    // 底图
    if (to.landPts || from.landPts) {
      var alpha = to.landPts ? t : (1 - t);
      var pts = to.landPts || from.landPts;
      ctx.save(); ctx.globalAlpha = alpha * 0.3; ctx.fillStyle = K.INK4;
      for (var q = 0; q < pts.length; q++) ctx.fillRect(A + pts[q][0], B + pts[q][1], 1.4, 1.4);
      ctx.restore();
    }

    // 坐标轴（旧的淡出、新的淡入）
    drawAxis(ctx, from.axes, w, h, A, B, iw, ih, 1 - t);
    drawAxis(ctx, to.axes, w, h, A, B, iw, ih, t);

    // 折线
    if (from.path || to.path) {
      var path = to.path || from.path, pa = to.path ? t : 1 - t;
      K.line(ctx, path.map(function (p) { return [A + p[0], B + p[1]]; }), { color: K.INK, width: 1.2, alpha: pa * 0.5 });
    }

    // 标记：位置/尺寸/圆角都在变形
    var accent = to.id === 'bubble' || from.id === 'bubble' ? K.SPOT : K.INK;
    for (var i = 0; i < from.marks.length; i++) {
      var m0 = from.marks[i], m1 = to.marks[i];
      var x = K.lerp(m0.x, m1.x, t), y = K.lerp(m0.y, m1.y, t);
      var ww = K.lerp(m0.w, m1.w, t), hh = K.lerp(m0.h, m1.h, t), rr = K.lerp(m0.r, m1.r, t);
      var c = m1.c;
      var isHover = hover === c.id;
      var fill = isHi(c) ? K.SPOT : (to.id === 'bubble' ? K.withAlpha(K.INK, 0.42) : K.INK);
      ctx.save();
      ctx.globalAlpha = (to.id === 'bubble' ? 0.92 : 1) * (isHover ? 1 : 0.92);
      ctx.fillStyle = isHover ? K.SPOT : fill;
      rrect(ctx, A + x - ww / 2, B + y - hh / 2, Math.max(1.2, ww), Math.max(1.2, hh), rr);
      ctx.fill();
      ctx.restore();
    }

    // 高亮标记的环与标注
    if (hover != null) {
      var hm = to.marks[cities.findIndex(function (c) { return c.id === hover; })];
      if (hm) {
        ctx.save();
        ctx.strokeStyle = K.SPOT; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(A + hm.x, B + hm.y, Math.max(hm.w, hm.h) / 2 + 4, 0, 6.2832);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 少量直接标注
    var lab = to.axes.labels;
    if (lab) {
      ctx.save();
      ctx.globalAlpha = t;
      lab.forEach(function (L, k) {
        var m = to.marks[cities.findIndex(function (c) { return c.id === L.m.c.id; })];
        K.label(ctx, L.t, A + m.x, B + m.y - m.h / 2 - 7 - (k % 2 ? 0 : 11), { size: 11, align: 'center', color: K.INK2 });
      });
      ctx.restore();
    }
    if (to.id === 'bubble') {
      ctx.save(); ctx.globalAlpha = t;
      var big = cities[0], bm = to.marks[0];
      K.label(ctx, short(big), A + bm.x, B + bm.y - bm.h / 2 - 7, { size: 11, align: 'center', color: K.INK2 });
      ctx.restore();
    }
  }

  function drawAxis(ctx, ax, w, h, A, B, iw, ih, alpha) {
    if (!ax || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    var i, v;
    for (i = 0; i < ax.yTicks.length; i++) {
      v = ax.yTicks[i];
      var py = ax.y(v);
      K.hline(ctx, A, A + iw, py, K.RULE);
      K.label(ctx, ax.yf(v), A - 8, py + 3.5, { align: 'right', size: 10.5, mono: true, color: K.INK4 });
    }
    if (ax.xTicks) for (i = 0; i < ax.xTicks.length; i++) {
      v = ax.xTicks[i];
      K.label(ctx, ax.xf(v), A + ax.x(v), B + ih + 15, { align: 'center', size: 10.5, mono: true, color: K.INK4 });
    }
    K.hline(ctx, A, A + iw, B + ih, K.INK);
    if (ax.yLabel) K.label(ctx, ax.yLabel, A - 8 - 0, B - 14, { align: 'left', size: 10.5, color: K.INK3 });
    if (ax.xLabel) K.label(ctx, ax.xLabel, A + iw, B + ih + 30, { align: 'right', size: 10.5, color: K.INK3 });
    ctx.restore();
  }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (r < 0.6) { ctx.rect(x, y, w, h); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var demo = {
    init: function () {
      if (env) return;
      var canvas = document.getElementById('demo-canvas');
      var frame = canvas && canvas.parentNode;
      if (!canvas) return;
      prep();

      env = { i: 0, t: 1, from: null, to: null, hover: null, auto: true, last: 0, layouts: {} };
      var st = { w: 0, h: 0 };
      var ctx = canvas.getContext('2d');

      function size() {
        var r = frame.getBoundingClientRect();
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        st.w = Math.max(200, Math.round(r.width)); st.h = Math.round(r.height);
        canvas.width = Math.round(st.w * dpr); canvas.height = Math.round(st.h * dpr);
        canvas.style.width = '100%'; canvas.style.height = '100%';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        env.layouts = {};
        env.from = lay(ENC[env.i]); env.to = env.from; env.t = 1;
        draw(ctx, st.w, st.h, env.from, env.to, 1, null);
      }
      function lay(e) {
        if (!env.layouts[e.id]) env.layouts[e.id] = layout(e.id, st.w, st.h);
        return env.layouts[e.id];
      }

      // 标签页
      var tabs = document.getElementById('demo-tabs');
      tabs.innerHTML = '';
      ENC.forEach(function (e, i) {
        var b = K.ce('button', { type: 'button', text: I.lang === 'zh' ? e.zh[0] : e.en[0] });
        b.dataset.enc = e.id;
        b.addEventListener('click', function () { env.auto = false; go(i); });
        tabs.appendChild(b);
      });
      var leg = document.getElementById('demo-legend');
      leg.innerHTML = '<span><i class="demo-swatch-1"></i>' + (I.lang === 'zh' ? '其余城市' : 'other cities') + '</span>' +
        '<span><i class="demo-swatch-4"></i>' + (I.lang === 'zh' ? '非洲城市' : 'African cities') + '</span>';

      function go(i) {
        if (i === env.i && env.t >= 1) return;
        env.from = env.to || lay(ENC[env.i]);
        env.from = cloneLayout(env.from);
        env.i = i;
        env.to = lay(ENC[i]);
        env.t = 0;
        Array.prototype.forEach.call(tabs.children, function (b, k) {
          b.setAttribute('aria-pressed', String(k === i));
        });
        updateHint();
      }
      function cloneLayout(L) {
        return { marks: L.marks.map(function (m) { return { c: m.c, x: m.x, y: m.y, w: m.w, h: m.h, r: m.r, line: m.line }; }), axes: L.axes, path: L.path, landPts: L.landPts, id: L.id };
      }
      env.go = go;

      function updateHint() {
        var e = ENC[env.i];
        var note = document.getElementById('demo-note');
        if (note) note.textContent = I.lang === 'zh' ? e.zh[1] : e.en[1];
      }
      env.updateHint = updateHint;

      // 悬停提示
      var tip = K.ce('div', { class: 'kit-tip' });
      frame.appendChild(tip);
      canvas.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        var mx = e.clientX - r.left, my = e.clientY - r.top;
        var best = null, bd = 1e9;
        env.to.marks.forEach(function (m) {
          var d = Math.hypot(A0() + m.x - mx, B0() + m.y - my) - Math.max(m.w, m.h) / 2;
          if (d < bd) { bd = d; best = m; }
        });
        if (best && bd < 14) {
          env.hover = best.c.id;
          tip.innerHTML = '<b>' + short(best.c) + '</b><br>' + best.c.pop.toFixed(1) + ' M · ' + best.c.lon.toFixed(1) + '°, ' + best.c.lat.toFixed(1) + '°';
          tip.style.left = Math.min(mx + 14, st.w - tip.offsetWidth - 6) + 'px';
          tip.style.top = (my - tip.offsetHeight - 12) + 'px';
          tip.classList.add('is-on');
          canvas.style.cursor = 'pointer';
        } else {
          env.hover = null; tip.classList.remove('is-on'); canvas.style.cursor = 'crosshair';
        }
      });
      canvas.addEventListener('pointerleave', function () { env.hover = null; tip.classList.remove('is-on'); });
      function A0() { return PAD.l; }
      function B0() { return PAD.t; }

      go(0);
      if (window.ResizeObserver) new ResizeObserver(size).observe(frame);
      else window.addEventListener('resize', size);
      size();

      var last = 0;
      K.ticker({ cv: canvas }, function (dt, tt) {
        if (env.t < 1) env.t = Math.min(1, env.t + dt / 0.95);
        if (env.auto && tt - last > 5.6) { last = tt; go((env.i + 1) % ENC.length); }
        draw(ctx, st.w, st.h, env.from, env.to, K.ease.inOut(env.t), env.hover);
      });
      // 首帧同步绘制
      draw(ctx, st.w, st.h, env.from, env.to, 1, null);
      updateHint();

      I.onChange(function () {
        ENC.forEach(function (e, i) {
          var b = tabs.children[i];
          if (b) b.textContent = I.lang === 'zh' ? e.zh[0] : e.en[0];
        });
        leg.innerHTML = '<span><i class="demo-swatch-1"></i>' + (I.lang === 'zh' ? '其余城市' : 'other cities') + '</span>' +
          '<span><i class="demo-swatch-4"></i>' + (I.lang === 'zh' ? '非洲城市' : 'African cities') + '</span>';
        env.layouts = {};
        env.from = lay(ENC[env.i]); env.to = env.from; env.t = 1;
        updateHint();
      });

      var note = K.ce('span', { id: 'demo-note', class: 'mono-label' });
      document.getElementById('demo-legend').appendChild(note);
      updateHint();
    }
  };

  VIZ.demo = demo;
})();
