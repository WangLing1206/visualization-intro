/* ==========================================================================
   interaction.js — 第 10 章配图：焦点与上下文、刷选联动、语义缩放、可视分析循环
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* ------------------------------------------------------ 10.1 焦点与上下文 */
  VIZ.figures['fig-focus'] = {
    zh: '焦点与上下文', en: 'Focus and context',
    hint: { zh: '在图上移动指针，或用滑块控制放大', en: 'move the pointer, or use the slider' },
    mount: function (host) {
      var cities = K.data.cities;
      var lens = null, strength = 0.62, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 290, 390)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      // 城市作为一张“密集的图”：位置 = 经纬，标签容易互相遮挡
      function geom() {
        var padL = 40, padT = 26, padR = 18, padB = 30;
        return { padL: padL, padT: padT, iw: st.w - padL - padR, ih: st.h - padT - padB };
      }
      function posOf(c, g, focus) {
        var X = K.linear(-180, 180, 0, g.iw), Y = K.linear(-60, 70, g.ih, 0);
        var x = g.padL + X(c.lon), y = g.padT + Y(c.lat);
        if (!lens || !focus) return [x, y, 1];
        var d = Math.hypot(x - lens[0], y - lens[1]);
        var R = Math.min(g.iw, g.ih) * 0.28;
        var m = K.clamp(1 - d / (R * 1.8), 0, 1);
        var mag = 1 + strength * m * 2.2;
        return [lens[0] + (x - lens[0]) * mag, lens[1] + (y - lens[1]) * mag, m];
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        K.axes(ctx, {
          x0: g.padL, y0: g.padT, w: g.iw, h: g.ih,
          x: K.linear(-180, 180, 0, g.iw), y: K.linear(-60, 70, g.ih, 0),
          xTicks: [-150, -100, -50, 0, 50, 100, 150], yTicks: [-40, -20, 0, 20, 40, 60],
          xFormat: function (v) { return v + '°'; }, yFormat: function (v) { return v + '°'; },
          yLabel: L('纬度', 'latitude'), xLabel: L('经度', 'longitude')
        });
        LAND_(ctx, g, a);
        // 放大区域
        if (lens) {
          var R = Math.min(g.iw, g.ih) * 0.28;
          ctx.save();
          ctx.setLineDash([4, 4]); ctx.strokeStyle = K.SPOT; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(lens[0], lens[1], R, 0, 6.2832); ctx.stroke();
          ctx.restore();
        }
        cities.forEach(function (c) {
          var p = posOf(c, g, true);
          var mag = p[2];
          K.dot(ctx, p[0], p[1], (2 + mag * 2.2) * a, mag > 0.5 ? K.INK : K.INK3, (0.35 + mag * 0.6) * a);
          if (mag > 0.45) {
            K.label(ctx, L(c.zh, c.en), p[0] + 6 + mag * 3, p[1] + 3, { size: 9.5 + mag * 2, color: K.INK2, alpha: (mag - 0.45) * 1.6 * a });
          }
        });
        K.label(ctx, lens ? L('焦点区域被放大，周围保持原位', 'the focus area is magnified, everything else stays put')
          : L('指针移进图内开始放大', 'move the pointer in to magnify'),
          g.padL, g.padT + g.ih + 22, { size: 10.5, color: K.INK3 });
        statEl.set(L('放大倍率上限 ', 'max magnification ') + '<b>' + (1 + strength * 2.2).toFixed(2) + '×</b>　·　' +
          L('可见标签 ', 'labels shown ') + '<b>' + cities.filter(function (c) { return posOf(c, g, true)[2] > 0.45; }).length + '</b>');
      }
      function LAND_(ctx, g, a) {
        var X = K.linear(-180, 180, 0, g.iw), Y = K.linear(-60, 70, g.ih, 0);
        (window.VIZ_LAND || []).forEach(function (ring) {
          var pts = ring.map(function (p) { return posOf({ lon: p[0], lat: p[1] }, g, true).slice(0, 2); });
          K.line(ctx, pts.concat([pts[0]]), { color: K.RULE, width: 0.8, alpha: a * 0.8 });
        });
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        lens = [e.clientX - r2.left, e.clientY - r2.top];
        draw();
      });
      st.cv.addEventListener('pointerleave', function () { lens = null; draw(); });
      K.range(row, L('放大强度', 'magnification'), 0.2, 1, strength, 0.02, function (v) { strength = v; draw(); });
      read.textContent = L('鱼眼把“放大”限制在一个区域里，因此细节与全局可以同屏：代价是周围的形状被扭曲，位置不再精确。',
        'A fisheye confines magnification to one region, so detail and overview share the screen — at the cost of distorting positions outside it.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------------- 10.2 刷选联动 */
  VIZ.figures['fig-brushlink'] = {
    zh: '刷选与联动', en: 'Brushing and linking',
    hint: { zh: '在左图框选，右图同步高亮', en: 'brush on the left; the right view follows' },
    mount: function (host) {
      var rows = K.data.multi;
      var brush = null, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 260, 340)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function geom() {
        var gap = 26, padL = 46, padT = 28, padB = 40;
        var w = (st.w - padL - 24 - gap) / 2;
        var h = st.h - padT - padB;
        return { padL: padL, padT: padT, w: w, h: h, gap: gap, right: padL + w + gap, padB: padB };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        // 左：散点 马力 × 重量
        var extX = K.extent(rows, function (r) { return r.hp; }), extY = K.extent(rows, function (r) { return r.weight; });
        var X1 = K.linear(extX[0], extX[1], 0, g.w), Y1 = K.linear(extY[0], extY[1], g.h, 0);
        K.axes(ctx, {
          x0: g.padL, y0: g.padT, w: g.w, h: g.h, x: X1, y: Y1,
          xTicks: K.ticks(extX[0], extX[1], 4), yTicks: K.ticks(extY[0], extY[1], 4), grid: true,
          xFormat: function (v) { return K.fmt(v); }, yFormat: function (v) { return K.fmt(v); },
          xLabel: L('马力', 'horsepower'), yLabel: L('重量', 'weight')
        });
        K.label(ctx, L('① 散点：每个点是一辆车', '① scatter: one point per car'), g.padL, g.padT - 12, { size: 10.5, color: K.INK3 });
        // 右：油耗的直方图
        var mpgExt = K.extent(rows, function (r) { return r.mpg; });
        var X2 = K.linear(mpgExt[0] - 1, mpgExt[1] + 1, 0, g.w);
        var bins = 9, cw = (mpgExt[1] - mpgExt[0] + 2) / bins;
        var sel = [];
        var counts = new Array(bins).fill(0), countsSel = new Array(bins).fill(0);
        rows.forEach(function (r) {
          var b = K.clamp(Math.floor((r.mpg - (mpgExt[0] - 1)) / cw), 0, bins - 1);
          counts[b]++;
          var inB = !brush || (r.hp >= brush[0] && r.hp <= brush[1] && r.weight >= brush[2] && r.weight <= brush[3]);
          if (inB) { countsSel[b]++; sel.push(r); }
        });
        var cmax = Math.max.apply(null, counts);
        var Y2 = K.linear(0, cmax * 1.15, g.h, 0);
        K.axes(ctx, {
          x0: g.right, y0: g.padT, w: g.w, h: g.h, x: X2, y: Y2,
          xTicks: K.ticks(mpgExt[0], mpgExt[1], 4), yTicks: [], grid: false,
          xFormat: function (v) { return K.fmt(v); },
          xLabel: L('油耗', 'fuel use')
        });
        K.label(ctx, L('② 直方：油耗分布随选择变化', '② histogram: the distribution follows the selection'), g.right, g.padT - 12, { size: 10.5, color: K.INK3 });
        for (var b2 = 0; b2 < bins; b2++) {
          var bx = g.right + X2(mpgExt[0] - 1 + b2 * cw);
          var bw = X2(mpgExt[0] - 1 + (b2 + 1) * cw) - X2(mpgExt[0] - 1 + b2 * cw);
          var hAll = g.h - Y2(counts[b2]), hSel = g.h - Y2(countsSel[b2]);
          ctx.save();
          ctx.globalAlpha = 0.16 * a; ctx.fillStyle = K.INK;
          ctx.fillRect(bx, g.padT + Y2(counts[b2]), Math.max(1, bw - 2), hAll);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = 0.9 * a; ctx.fillStyle = K.SPOT;
          ctx.fillRect(bx, g.padT + Y2(countsSel[b2]), Math.max(1, bw - 2), hSel);
          ctx.restore();
        }
        // 左图的点
        rows.forEach(function (r) {
          var inB = !brush || (r.hp >= brush[0] && r.hp <= brush[1] && r.weight >= brush[2] && r.weight <= brush[3]);
          K.dot(ctx, g.padL + X1(r.hp), g.padT + Y1(r.weight), inB ? 3.2 : 2, inB ? K.INK : K.INK4, (inB ? 0.9 : 0.3) * a);
        });
        if (brush) {
          ctx.save();
          ctx.globalAlpha = 0.07; ctx.fillStyle = K.SPOT;
          ctx.fillRect(g.padL + X1(brush[0]), g.padT + Y1(brush[3]), X1(brush[1]) - X1(brush[0]), Y1(brush[2]) - Y1(brush[3]));
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = K.SPOT; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
          ctx.strokeRect(g.padL + X1(brush[0]), g.padT + Y1(brush[3]), X1(brush[1]) - X1(brush[0]), Y1(brush[2]) - Y1(brush[3]));
          ctx.restore();
        }
        var muSel = sel.length ? sel.reduce(function (p, q) { return p + q.mpg; }, 0) / sel.length : 0;
        statEl.set(L('选中 ', 'selected ') + '<b>' + sel.length + '</b> / ' + rows.length +
          (sel.length ? '　·　' + L('平均油耗 ', 'mean fuel use ') + '<b>' + muSel.toFixed(1) + '</b>' : ''));
      }
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var g = geom();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        if (mx < g.padL || mx > g.padL + g.w || my < g.padT || my > g.padT + g.h) return;
        var extX = K.extent(rows, function (r) { return r.hp; }), extY = K.extent(rows, function (r) { return r.weight; });
        var X1 = K.linear(extX[0], extX[1], 0, g.w), Y1 = K.linear(extY[0], extY[1], g.h, 0);
        brush = [X1.invert(mx - g.padL), X1.invert(mx - g.padL), Y1.invert(my - g.padT), Y1.invert(my - g.padT)];
        st._brushStart = [mx, my];
        draw();
      });
      st.cv.addEventListener('pointermove', function (e) {
        if (brush && st._brushStart) {
          var r2 = st.cv.getBoundingClientRect();
          var g = geom();
          var mx = e.clientX - r2.left, my = e.clientY - r2.top;
          var extX = K.extent(rows, function (r) { return r.hp; }), extY = K.extent(rows, function (r) { return r.weight; });
          var X1 = K.linear(extX[0], extX[1], 0, g.w), Y1 = K.linear(extY[0], extY[1], g.h, 0);
          var a0 = X1.invert(st._brushStart[0] - g.padL), a1 = X1.invert(mx - g.padL);
          var b0 = Y1.invert(st._brushStart[1] - g.padT), b1 = Y1.invert(my - g.padT);
          brush = [Math.min(a0, a1), Math.max(a0, a1), Math.min(b0, b1), Math.max(b0, b1)];
          draw();
        }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () {
          if (!brush) return;
          if (Math.abs(brush[1] - brush[0]) < 6 || Math.abs(brush[3] - brush[2]) < 25) brush = null;
          st._brushStart = null;
          draw();
        });
      });
      K.btn(row, L('清除选择', 'clear'), function () { brush = null; draw(); });
      read.textContent = L('两个视图共享同一份记录：在一个视图里选择，另一个视图立刻按同一批记录重新计算。这就是联动比“再画一张图”有用的地方。',
        'Both views share the same records: a selection made in one is re-aggregated by the other immediately. That is why linking beats drawing one more chart.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------------- 10.3 语义缩放 */
  VIZ.figures['fig-semanticzoom'] = {
    zh: '语义缩放', en: 'Semantic zoom',
    hint: { zh: '拖动滑块或滚轮，看表示法换层', en: 'drag or scroll: the representation changes level' },
    mount: function (host) {
      var level = 0;             // 0 概览 1 城市 2 街区
      var t = 0;
      var appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 280, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      var cities = K.data.cities.filter(function (c) { return c.region === 'asia'; });
      var r = K.rng(5150);
      var blocks = [];
      for (var i = 0; i < 90; i++) blocks.push({ x: r(), y: r(), v: 0.3 + r() });
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        if (dt) t += (level - t) * Math.min(1, dt * 4);
        var lv = t;
        if (lv < 0.5) {
          // 概览：全部城市
          var alpha = 1 - lv * 2;
          cities.forEach(function (c) {
            K.dot(ctx, 60 + (c.lon - 90) / 60 * (w - 140), h - 60 - (c.lat - 10) / 30 * (h - 120),
              2.6, K.INK, alpha * 0.85);
            K.label(ctx, L(c.zh, c.en), 60 + (c.lon - 90) / 60 * (w - 140) + 6, h - 57 - (c.lat - 10) / 30 * (h - 120),
              { size: 9.5, color: K.INK3, alpha: alpha });
          });
          K.label(ctx, L('第一层：城市点阵，标签只给出一部分', 'level 1: a dot per city, only some labelled'), 20, 24, { size: 11, color: K.INK2, alpha: alpha });
        }
        if (lv > 0.35 && lv < 1.15) {
          // 城市：网格与统计
          var alpha2 = K.clamp(1 - Math.abs(lv - 0.75) * 3, 0, 1);
          var gw = 42, gh = 30;
          for (var gx = 0; gx < Math.floor((w - 80) / gw); gx++) {
            for (var gy = 0; gy < Math.floor((h - 90) / gh); gy++) {
              var v = Math.abs(Math.sin(gx * 1.7 + gy * 2.3)) * 0.8 + 0.2;
              ctx.save();
              ctx.globalAlpha = v * 0.5 * alpha2;
              ctx.fillStyle = K.INK;
              ctx.fillRect(40 + gx * gw, 50 + gy * gh, gw - 3, gh - 3);
              ctx.restore();
            }
          }
          K.label(ctx, L('第二层：网格聚合，格子里的深浅代表密度', 'level 2: aggregated into cells, shading is density'), 20, 24, { size: 11, color: K.INK2, alpha: alpha2 });
        }
        if (lv > 1) {
          var alpha3 = K.clamp((lv - 1) * 2.5, 0, 1);
          blocks.forEach(function (b, i) {
            K.dot(ctx, 60 + b.x * (w - 120), 70 + b.y * (h - 140), 1.6 + b.v * 1.6, K.INK, alpha3 * 0.8);
            if (i % 11 === 0) {
              K.hline(ctx, 40, w - 40, 70 + b.y * (h - 140), K.RULE);
              K.vline(ctx, 60 + b.x * (w - 120), 50, h - 50, K.RULE);
            }
          });
          K.label(ctx, L('第三层：单条记录与它的坐标', 'level 3: individual records and their coordinates'), 20, 24, { size: 11, color: K.INK2, alpha: alpha3 });
        }
        var names = [L('概览', 'Overview'), L('聚合', 'Aggregated'), L('单条记录', 'Records')];
        names.forEach(function (n, i) {
          K.label(ctx, n, 20 + i * 96, h - 14, { size: 10.5, color: Math.round(t) === i ? K.SPOT : K.INK4 });
          if (i < 2) K.label(ctx, '—', 20 + i * 96 + 34, h - 14, { size: 10.5, color: K.INK4 });
        });
        statEl.set(L('当前层级 ', 'level ') + '<b>' + names[K.clamp(Math.round(t), 0, 2)] + '</b>　·　' +
          L('几何缩放只是放大像素，语义缩放会换掉表示法', 'geometric zoom magnifies pixels; semantic zoom replaces the representation'));
      }
      K.range(row, L('缩放层级', 'zoom level'), 0, 2, 0, 0.01, function (v) {
        var prev = Math.round(t);
        level = v;
        if (Math.round(v) !== prev) draw();
      });
      st.cv.addEventListener('wheel', function (e) {
        e.preventDefault();
        level = K.clamp(level + (e.deltaY > 0 ? 0.34 : -0.34), 0, 2);
        draw();
      }, { passive: false });
      read.textContent = L('换层的时候，屏幕上被替换的不是分辨率，而是数据本身：点变成格子，格子再变回点。',
        'When the level changes, what gets replaced is not the resolution but the data: dots become cells, cells become dots again.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ----------------------------------------------------- 10.4 可视分析循环 */
  VIZ.figures['fig-valoop'] = {
    zh: '从图到知识的循环', en: 'The loop from figure to knowledge',
    hint: { zh: '看一轮迭代如何走完', en: 'watch one iteration run' },
    mount: function (host) {
      var STEPS = [
        { zh: '数据', en: 'Data', d: { zh: '一份还没被理解的记录集', en: 'a record set nobody understands yet' } },
        { zh: '模型', en: 'Model', d: { zh: '自动方法给出候选：聚类、异常、投影', en: 'automated methods propose: clusters, outliers, projections' } },
        { zh: '可视化', en: 'Visualise', d: { zh: '把模型与数据一起画出来', en: 'draw the model and the data together' } },
        { zh: '交互', en: 'Interact', d: { zh: '人给出判断：这个分组不对、这个点可疑', en: 'a person judges: this grouping is wrong, this point is suspicious' } },
        { zh: '知识', en: 'Knowledge', d: { zh: '结论写回模型，开始下一轮', en: 'the conclusion goes back into the model; the next round starts' } }
      ];
      var stage = 0, prog = 0, playing = true;
      var appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.42, 250, 330)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');
      var playBtn;

      function geom() {
        var pad = 40;
        var n = STEPS.length;
        var w = st.w, h = st.h;
        var cw = (w - pad * 2) / n;
        return { pad: pad, cw: cw, y: h * 0.52 };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        if (dt && playing) {
          prog += dt * 0.55;
          if (prog >= 1) { prog = 0; stage = (stage + 1) % STEPS.length; }
        }
        // 连线
        for (var i = 0; i < STEPS.length; i++) {
          var x0 = g.pad + i * g.cw + g.cw / 2, x1 = g.pad + ((i + 1) % STEPS.length) * g.cw + g.cw / 2;
          var y0 = g.y;
          if (i === STEPS.length - 1) {
            // 回流弧线
            ctx.save();
            ctx.globalAlpha = 0.6 * a;
            ctx.strokeStyle = K.RULE; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x0, y0 - 26);
            ctx.bezierCurveTo(x0, 26, x1, 26, x1, y0 - 26);
            ctx.stroke();
            ctx.restore();
            K.label(ctx, L('下一轮', 'next round'), (x0 + x1) / 2, 22, { align: 'center', size: 10, color: K.INK4 });
          } else {
            K.line(ctx, [[x0 + 16, y0], [x1 - 16, y0]], { color: K.RULE, width: 1, alpha: a });
            var mx = K.lerp(x0 + 16, x1 - 16, i === stage ? prog : (i < stage ? 1 : 0));
            K.dot(ctx, mx, y0, 2.6, i === stage ? K.SPOT : K.INK4, a);
          }
          // 节点
          var on = i === stage;
          K.ring(ctx, g.pad + i * g.cw + g.cw / 2, y0, on ? 15 : 11, on ? K.SPOT : K.INK, on ? 1.6 : 1, a);
          K.dot(ctx, g.pad + i * g.cw + g.cw / 2, y0, on ? 5 : 3, on ? K.SPOT : K.INK, a);
          K.label(ctx, L(STEPS[i].zh, STEPS[i].en), g.pad + i * g.cw + g.cw / 2, y0 + 32,
            { align: 'center', size: 11.5, color: on ? K.INK : K.INK3 });
        }
        K.label(ctx, L(STEPS[stage].zh, STEPS[stage].en) + ' — ' + L(STEPS[stage].d.zh, STEPS[stage].d.en),
          g.pad, h - 14, { size: 11, color: K.INK2 });
        K.label(ctx, L('自动方法', 'automated'), g.pad + g.cw * 0.4, 62, { align: 'center', size: 10.5, color: K.INK4 });
        K.label(ctx, L('人的判断', 'human judgement'), g.pad + g.cw * 3.1, 62, { align: 'center', size: 10.5, color: K.INK4 });
        statEl.set(L('第 ', 'round ') + '<b>' + (Math.floor(performance.now() / 11000) + 1) + '</b> ' + L('轮', '') +
          '　·　' + L('当前环节 ', 'current step ') + '<b>' + K.esc(L(STEPS[stage].zh, STEPS[stage].en)) + '</b>');
      }
      playBtn = K.btn(row, L('暂停', 'pause'), function (b) {
        playing = !playing;
        b.textContent = playing ? L('暂停', 'pause') : L('播放', 'play');
      });
      K.btn(row, L('下一步', 'next step'), function () {
        playing = false; playBtn.textContent = L('播放', 'play');
        prog = 0; stage = (stage + 1) % STEPS.length; draw();
      });
      read.textContent = L('可视分析不是“画一张图然后看图”，而是模型与人在四五个环节之间来回迭代；每一轮的输出都会变成下一轮的输入。',
        'Visual analytics is not "draw a chart, then look at it": model and person alternate across a handful of steps, and each round feeds the next.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
