/* ==========================================================================
   overview.js — 第 1 章配图：可视化流程、Anscombe 四组数据、历史时间线
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* ---------------------------------------------------------------- 1.1 流程 */
  VIZ.figures['fig-pipeline'] = {
    zh: '可视化流程', en: 'The visualization pipeline',
    hint: { zh: '点击阶段查看说明', en: 'click a stage to inspect it' },
    mount: function (host) {
      var stages = [
        { zh: '原始数据', en: 'Raw data', d: { zh: '一堆记录本身不可读：42 个字段、上百万行，人眼无法直接比较。', en: 'Records are unreadable on their own: 42 columns and a million rows cannot be compared by eye.' } },
        { zh: '数据变换', en: 'Data transform', d: { zh: '清洗、去重、分组、聚合。这一步决定了图形里还剩什么。', en: 'Clean, deduplicate, group, aggregate. What survives here is what the figure can say.' } },
        { zh: '视觉映射', en: 'Visual mapping', d: { zh: '把数据字段映射到位置、长度、颜色等视觉通道。', en: 'Map data fields onto visual channels: position, length, colour, size.' } },
        { zh: '视图变换', en: 'View transform', d: { zh: '缩放、平移、排序、筛选——改变的是看的角度，不是数据。', en: 'Zoom, pan, sort, filter — changing the view, not the data.' } },
        { zh: '感知与认知', en: 'Perception', d: { zh: '图形进入人眼，被读成趋势、异常和结构。这一步发生在观看者身上。', en: 'The marks reach the eye and are read as trend, outlier, structure. This step happens in the viewer.' } }
      ];
      var sel = 0;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.36, 240, 340)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var readout = K.ce('span', { class: 'kit-hint' });
      row.appendChild(readout);

      var r = K.rng(88);
      var N = 340, dots = [];
      for (var i = 0; i < N; i++) {
        var cl = Math.floor(r() * 5);
        var ys = [r(), 0.1 + cl * 0.2 + (r() - 0.5) * 0.06, 0, 0, 0];
        ys[2] = 0.08 + (cl * 5 + r() * 5) / 25 * 0.84;
        ys[3] = 0.5 + (ys[2] - 0.5) * 0.34;
        ys[4] = 0.5 + Math.sin(ys[2] * 6.2 + 1.1) * 0.34 + (r() - 0.5) * 0.03;
        dots.push({ ys: ys, p: r() * 5, sp: 0.24 + r() * 0.16, red: r() < 0.06 });
      }

      var hoverStage = -1;
      function geom(w) {
        var padL = 26, padR = 26, iw = w - padL - padR;
        return { padL: padL, iw: iw, step: iw / (stages.length - 1) };
      }

      function draw(dt) {
        var w = st.w, h = st.h, g = geom(w);
        K.clear(st.ctx, w, h);
        var ctx = st.ctx;
        var yTop = 24, yBot = h - 34;

        // 阶段竖线
        for (var k = 0; k < stages.length; k++) {
          var x = g.padL + k * g.step;
          var on = k === sel;
          K.vline(ctx, x, yTop - 10, yBot + 10, on ? K.INK : K.RULE, null);
          K.label(ctx, '0' + (k + 1), x, yTop - 16, { align: 'center', size: 10, mono: true, color: on ? K.SPOT : K.INK4 });
          K.label(ctx, L(stages[k].zh, stages[k].en), x, yBot + 24, { align: 'center', size: 11, color: on ? K.INK : K.INK3 });
        }
        // 流动的点
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          if (dt) d.p += d.sp * dt;
          if (d.p >= 5) d.p -= 5;
          var seg = Math.floor(d.p), fr = d.p - seg;
          var e = K.ease.inOut(fr);
          var y0 = d.ys[seg], y1 = d.ys[Math.min(4, seg + 1)];
          var y = K.lerp(y0, y1, e);
          var x2 = g.padL + d.p * g.step;
          var fade = Math.min(1, (5 - d.p) * 2.2) * Math.min(1, d.p * 3.2 + 0.25);
          var near = Math.abs(d.p - (sel + 0.5)) < 0.55;
          K.dot(ctx, x2, yTop + y * (yBot - yTop), d.red ? 2.1 : 1.5,
            d.red ? K.SPOT : (near ? K.INK : K.INK2), fade * (near ? 0.95 : 0.5));
        }
        // 选区底色
        var sx = g.padL + sel * g.step;
        ctx.save();
        ctx.globalAlpha = 0.05; ctx.fillStyle = K.INK;
        ctx.fillRect(sx - g.step / 2, 0, g.step, h);
        ctx.restore();
        K.hline(ctx, 12, w - 12, yTop - 10, K.RULE);
        K.hline(ctx, 12, w - 12, yBot + 10, K.RULE);
      }

      var ticker = K.ticker(st, function (dt) { draw(dt); });

      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var g = geom(st.w);
        var k = Math.round((e.clientX - r2.left - g.padL) / g.step);
        if (k >= 0 && k < stages.length && k !== hoverStage) {
          hoverStage = k;
          sel = k;
          readout.textContent = L(stages[k].zh, stages[k].en) + ' — ' + L(stages[k].d.zh, stages[k].d.en);
          st.cv.style.cursor = 'pointer';
        }
      });
      st.cv.addEventListener('pointerleave', function () { st.cv.style.cursor = 'crosshair'; });
      readout.textContent = L(stages[0].zh, stages[0].en) + ' — ' + L(stages[0].d.zh, stages[0].d.en);

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------------ 1.2 四组数据 */
  VIZ.figures['fig-anscombe'] = {
    zh: '统计量相同的四组数据', en: 'Four datasets, one set of statistics',
    hint: { zh: '点击切换：加上回归线', en: 'toggle the regression line' },
    mount: function (host) {
      var SETS = [
        [[10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81], [11, 8.33], [14, 9.96], [6, 7.24], [4, 4.26], [12, 10.84], [7, 4.82], [5, 5.68]],
        [[10, 9.14], [8, 8.14], [13, 8.74], [9, 8.77], [11, 9.26], [14, 8.1], [6, 6.13], [4, 3.1], [12, 9.13], [7, 7.26], [5, 4.74]],
        [[10, 7.46], [8, 6.77], [13, 12.74], [9, 7.11], [11, 7.81], [14, 8.84], [6, 6.08], [4, 5.39], [12, 8.15], [7, 6.42], [5, 5.73]],
        [[8, 6.58], [8, 5.76], [8, 7.71], [8, 8.84], [8, 8.47], [8, 7.04], [8, 5.25], [19, 12.5], [8, 5.56], [8, 7.91], [8, 6.89]]
      ];
      var SHOW = [
        { x: 4, y: 3, w: 5, h: 4, zh: '线性，且方差齐', en: 'linear, even spread' },
        { x: 4, y: 3, w: 5, h: 4, zh: '明显的曲线', en: 'clear curvature' },
        { x: 4, y: 3, w: 5, h: 4, zh: '一个离群点带偏了直线', en: 'one outlier tilts the line' },
        { x: 4, y: 3, w: 5, h: 4, zh: 'x 几乎不变，一个点决定一切', en: 'x is constant but for one point' }
      ];
      var showLine = false, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.44, 300, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var b = K.btn(row, L('加上回归线与统计量', 'Add regression line'), function () {
        showLine = !showLine;
        b.setAttribute('aria-pressed', String(showLine));
      });
      b.setAttribute('aria-pressed', 'false');
      var tip = K.tooltip(plate.el);
      var hover = null;

      function panel(i) {
        var cols = st.w > 700 ? 4 : 2, rows = cols === 4 ? 1 : 2;
        var gapX = 18, gapY = 40;
        var pw = (st.w - gapX * (cols - 1) - 8) / cols;
        var ph = (st.h - gapY * (rows - 1) - 52) / rows;
        var cx = (i % cols), cy = Math.floor(i / cols);
        return {
          x: 8 + cx * (pw + gapX), y: 6 + cy * (ph + gapY), w: pw, h: ph,
          sx: K.linear(2.5, 20.5, 0, pw - 26), sy: K.linear(2, 14, ph - 18, 0)
        };
      }

      function draw(dt) {
        var w = st.w, h = st.h, ctx = st.ctx;
        var appear = appe.tick(dt);
        K.clear(ctx, w, h);
        for (var i = 0; i < 4; i++) {
          var p = panel(i);
          var ox = p.x + 26, oy = p.y + 10;
          var yT = [4, 8, 12], xT = [5, 10, 15, 20];
          for (var k = 0; k < yT.length; k++) {
            var py = oy + p.sy(yT[k]);
            K.hline(ctx, ox, ox + p.w - 26, py, K.RULE);
            K.label(ctx, yT[k], ox - 7, py + 3.5, { align: 'right', size: 9.5, mono: true, color: K.INK4 });
          }
          K.hline(ctx, ox, ox + p.w - 26, oy + p.sy(2), K.INK);
          if (i >= 2 || true) for (var m = 0; m < xT.length; m++) {
            K.label(ctx, xT[m], ox + p.sx(xT[m]), oy + p.sy(2) + 14, { align: 'center', size: 9.5, mono: true, color: K.INK4 });
          }
          // 点
          var pts = SETS[i];
          for (var j = 0; j < pts.length; j++) {
            var px = ox + p.sx(pts[j][0]), py2 = oy + p.sy(pts[j][1]);
            var ap = K.clamp((appear - i * 0.08 - j * 0.015) * 3, 0, 1);
            var hi = hover && hover.i === i && hover.j === j;
            K.dot(ctx, px, py2, hi ? 3.6 : 2.6 * ap, hi ? K.SPOT : K.INK, 0.28 + 0.7 * ap);
          }
          // 回归线 y = 0.5x + 3
          if (showLine) {
            ctx.save();
            ctx.globalAlpha = 0.75;
            K.line(ctx, [[ox + p.sx(3), oy + p.sy(4.5)], [ox + p.sx(20), oy + p.sy(13)]], { color: K.SPOT, width: 1.4 });
            ctx.restore();
          }
          K.label(ctx, L(SHOW[i].zh, SHOW[i].en), ox, oy + p.h + 22, { size: 10.5, color: showLine ? K.INK2 : K.INK3 });
        }
        if (showLine) {
          K.label(ctx, 'n = 11 · x̄ = 9.0 · ȳ = 7.5 · r = 0.816 · y = 0.5x + 3',
            8, st.h - 6, { size: 10.5, mono: true, color: K.SPOT });
        }
      }

      var ticker = K.ticker(st, draw);
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        hover = null;
        for (var i = 0; i < 4; i++) {
          var p = panel(i), ox = p.x + 26, oy = p.y + 10;
          for (var j = 0; j < SETS[i].length; j++) {
            var px = ox + p.sx(SETS[i][j][0]), py = oy + p.sy(SETS[i][j][1]);
            if (Math.hypot(px - mx, py - my) < 8) {
              hover = { i: i, j: j };
              tip.show(mx, my, 'x ' + SETS[i][j][0] + ' · y ' + SETS[i][j][1]);
            }
          }
        }
        if (!hover) tip.hide();
        st.cv.style.cursor = hover ? 'pointer' : 'crosshair';
      });
      st.cv.addEventListener('pointerleave', function () { hover = null; tip.hide(); });

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------------ 1.3 时间线 */
  VIZ.figures['fig-history'] = {
    zh: '可视化的关键节点', en: 'Milestones',
    hint: { zh: '悬停或点击查看', en: 'hover or click' },
    mount: function (host) {
      var M = [
        [1786, 'W. Playfair', { zh: '《商业与政治图集》用折线与条形呈现国民财富，图形第一次被当作论证工具。', en: 'The Commercial and Political Atlas used lines and bars to argue about national wealth.' }],
        [1858, 'F. Nightingale', { zh: '用极区图呈现克里米亚战场死亡率，说服了英国国会改善军医条件。', en: 'Polar-area diagrams of wartime mortality convinced Parliament to reform army hospitals.' }],
        [1869, 'C. J. Minard', { zh: '拿破仑东征流量图：在一张图上同时编码兵力、经纬、时间与温度。', en: "Napoleon's march: army size, geography, time and temperature on one sheet." }],
        [1933, 'H. Beck', { zh: '伦敦地铁线路图舍弃地理精度，用拓扑结构换取了可读性。', en: 'The London Tube map traded geographic accuracy for topological clarity.' }],
        [1967, 'J. Bertin', { zh: '《图形符号学》系统提出视觉变量：位置、尺寸、形状、灰度、纹理。', en: 'Semiology of Graphics formalised the visual variables: position, size, shape, value, texture.' }],
        [1977, 'J. Tukey', { zh: '探索性数据分析：先画图看数据，再决定用什么模型。', en: 'Exploratory data analysis: look at the data before choosing a model.' }],
        [1983, 'E. Tufte', { zh: '《定量信息的视觉显示》提出数据墨水比与图形优越大全。', en: 'The Visual Display of Quantitative Information: data-ink ratio and graphical excellence.' }],
        [1985, 'G. Furnas', { zh: '焦点 + 上下文：在有限屏幕上同时保留细节与全局视图。', en: 'Focus + context: keeping detail and overview on one screen.' }],
        [1996, 'B. Shneiderman', { zh: '概览优先、缩放与过滤、按需细节——交互式可视化的基本次序。', en: 'Overview first, zoom and filter, then details on demand.' }],
        [2011, 'D3 / 可视分析', { zh: '浏览器绘制数据成为常态，可视分析与机器学习开始合流。', en: 'Data drawing in the browser became routine; visual analytics met machine learning.' }]
      ];
      var sel = 4;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.2, 190, 230)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('span', { class: 'kit-hint' });
      row.appendChild(read);
      var appe = K.intro(0.9), hoverIdx = -1;
      var y0 = 1786, y1 = 2011;
      function xOf(year) { return 30 + (year - y0) / (y1 - y0) * (st.w - 60); }

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var appear = appe.tick(dt);
        K.clear(ctx, w, h);
        var y = h * 0.52;
        var len = (w - 60) * K.ease.out(appear);
        K.hline(ctx, 30, 30 + len, y, K.INK);
        for (var i = 0; i < M.length; i++) {
          var x = xOf(M[i][0]);
          if (x > 30 + len + 1) continue;
          var on = i === sel || i === hoverIdx;
          var up = i % 2 === 0;
          K.vline(ctx, x, y, y + (up ? -22 : 22), on ? K.SPOT : K.INK4);
          K.dot(ctx, x, y, on ? 3.2 : 2.2, on ? K.SPOT : K.INK);
          if (on) {
            K.label(ctx, String(M[i][0]), x, y + (up ? -30 : 32), { align: 'center', size: 11, mono: true, color: K.SPOT });
            K.label(ctx, M[i][1], x, y + (up ? -44 : 46), { align: 'center', size: 11, color: K.INK });
          }
        }
        K.label(ctx, '1750', 30, y + 30, { size: 10, mono: true, color: K.INK4 });
        K.label(ctx, '2020', w - 30, y + 30, { align: 'right', size: 10, mono: true, color: K.INK4 });
      }

      function paintRead() {
        var m = M[sel];
        read.textContent = m[0] + ' · ' + m[1] + ' — ' + L(m[2].zh, m[2].en);
      }

      var ticker = K.ticker(st, draw);
      paintRead();
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var best = -1, bd = 18;
        for (var i = 0; i < M.length; i++) {
          var x = xOf(M[i][0]), y = st.h * 0.52;
          var hp = Math.hypot(x - mx, y - my);
          if (hp < 22 && hp < bd + 8) { bd = hp; best = i; }
        }
        hoverIdx = best;
        if (best >= 0) { st.cv.style.cursor = 'pointer'; }
        else st.cv.style.cursor = 'crosshair';
      });
      st.cv.addEventListener('pointerdown', function () {
        if (hoverIdx >= 0) { sel = hoverIdx; paintRead(); }
      });
      st.cv.addEventListener('pointerleave', function () { hoverIdx = -1; });

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
