/* ==========================================================================
   perception.js — 第 2 章配图：格式塔分组、前注意搜索、可辨识的差别
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* ------------------------------------------------------------ 2.1 格式塔 */
  VIZ.figures['fig-gestalt'] = {
    zh: '格式塔分组原则', en: 'Gestalt grouping principles',
    hint: { zh: '同一批点，五种分组方式', en: 'one set of points, five groupings' },
    mount: function (host) {
      var N = 54;
      var PR = [
        { id: 'prox', zh: '接近', en: 'Proximity', note: { zh: '点之间的距离决定分组：靠得近的点被读成一组，哪怕它和别的点画得一模一样。', en: 'Distance decides the groups: points that sit close together read as one, even when every mark is identical.' } },
        { id: 'sim', zh: '相似', en: 'Similarity', note: { zh: '形状与大小的差异可以越过距离：同类标记自成一组，读者先看到列，再看到行。', en: 'Shape and size override distance: like goes with like, and the eye reads columns before rows.' } },
        { id: 'cont', zh: '连续', en: 'Continuity', note: { zh: '眼睛沿着平滑的路径前进，两条曲线交叉的地方不会被读成一条折线。', en: 'The eye follows smooth paths: where two curves cross, it does not read them as one zigzag.' } },
        { id: 'conn', zh: '连通', en: 'Connectedness', note: { zh: '连线是最强的分组线索。一条线可以把两个相距很远的点绑定成一组。', en: 'A connecting line is the strongest cue of all: it binds two distant points into one group.' } },
        { id: 'clo', zh: '闭合', en: 'Closure', note: { zh: '轮廓留有缺口时，知觉会自动补全图形，读者看到的仍是完整的圆形与方形。', en: 'When an outline has gaps the viewer completes it: the circle and the square are still seen as whole.' } }
      ];
      var sel = 0, appe = K.intro(0.7), morph = 1, cur = null, from = null, to = null;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.34, 240, 290)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.7';
      row.appendChild(read);

      /* 三种简单封闭轮廓的参数方程，用于闭合原则 */
      function perim(shape, t) {
        if (shape === 0) { var a = -1.5708 + t * 6.2832; return [Math.cos(a), Math.sin(a)]; }
        if (shape === 1) {
          var u = t * 4;
          if (u < 1) return [-1 + 2 * u, -1];
          if (u < 2) return [1, -1 + 2 * (u - 1)];
          if (u < 3) return [1 - 2 * (u - 2), 1];
          return [-1, 1 - 2 * (u - 3)];
        }
        var v = [[0, -1.25], [1, 0.62], [-1, 0.62]], u2 = t * 3, i2 = Math.floor(u2) % 3, f = u2 - Math.floor(u2);
        var A = v[i2], B = v[(i2 + 1) % 3];
        return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
      }

      function layout(id, w, h) {
        var out = [], i, cy = h / 2, cx = w / 2;
        if (id === 'prox') {
          var per = Math.ceil(N / 3);
          for (i = 0; i < N; i++) {
            var c = Math.floor(i / per), k = i % per;
            out.push({
              x: cx + (c - 1) * w * 0.305 + ((k % 3) - 1) * w * 0.033,
              y: cy + (Math.floor(k / 3) - (Math.ceil(per / 3) - 1) / 2) * h * 0.105,
              s: 2.4, kind: 0
            });
          }
        } else if (id === 'sim') {
          var cols = 9, rows = Math.ceil(N / cols);
          for (i = 0; i < N; i++) {
            var c2 = i % cols, r2 = Math.floor(i / cols);
            out.push({
              x: w * 0.09 + c2 * (w * 0.82 / (cols - 1)),
              y: cy + (r2 - (rows - 1) / 2) * h * 0.115,
              s: c2 % 2 === 0 ? 3.6 : 2.2, kind: c2 % 2 === 0 ? 0 : 1
            });
          }
        } else if (id === 'cont') {
          var half = Math.ceil(N / 2);
          for (i = 0; i < N; i++) {
            var onC = i < half, k2 = onC ? i : i - half, t = k2 / (half - 1);
            out.push({
              x: w * 0.07 + t * w * 0.86,
              y: onC ? cy - Math.sin(t * 5.1 - 0.4) * h * 0.36 : cy + (t - 0.5) * h * 0.52,
              s: 2.5, kind: 0
            });
          }
        } else if (id === 'conn') {
          var groups = [[7, 10, 8, 2], [6, 7, 10, 4]];
          var idx = 0;
          for (var rowI = 0; rowI < 2; rowI++) {
            var acc = 0;
            for (var gi = 0; gi < groups[rowI].length; gi++) {
              var gcount = groups[rowI][gi];
              var gx = w * 0.14 + acc / 27 * w * 0.72 + (groups[rowI][gi] / 27) * w * 0.36 * 0;
              for (var kk = 0; kk < gcount; kk++) {
                var t2 = gcount > 1 ? kk / (gcount - 1) : 0.5;
                out.push({
                  x: gx + t2 * (gcount - 1) * Math.min(15, w * 0.022),
                  y: h * (rowI ? 0.68 : 0.32) + Math.cos(t2 * 3.2 + gi * 1.7) * h * 0.045,
                  s: 2.4, kind: 0, grp: rowI * 4 + gi
                });
              }
              acc += gcount + 1;
              idx += gcount;
            }
          }
          while (out.length < N) out.push({ x: cx, y: cy, s: 0, kind: 0 });
        } else {
          var shapes = [[0, 0.23, 0.44, 0.09], [1, 0.55, 0.58, 0.082], [2, 0.84, 0.42, 0.07]];
          var counts = [20, 18, 16];
          for (var s2 = 0; s2 < 3; s2++) {
            var sp = shapes[s2], cnt = counts[s2], R = Math.min(w * 1.1, h * 2.1) * sp[3];
            for (var k3 = 0; k3 < cnt; k3++) {
              var t3 = 0.07 + (k3 / cnt) * 0.86;
              var p = perim(sp[0], t3);
              out.push({ x: sp[1] * w + p[0] * R, y: sp[2] * h + p[1] * R * 0.82, s: 2.4, kind: 0 });
            }
          }
          while (out.length < N) out.push({ x: cx, y: cy, s: 0, kind: 0 });
        }
        return out.slice(0, N);
      }

      function target(id) {
        var t = layout(id, st.w, st.h);
        from = (to || t).map(function (p, i) {
          var c = cur && cur[i];
          return c ? { x: c[0], y: c[1] } : { x: p.x, y: p.y };
        });
        to = t;
        morph = 0;
      }

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        if (dt && morph < 1) morph = Math.min(1, morph + dt / 0.6);
        var e = K.ease.inOut(morph);
        K.clear(ctx, w, h);
        var pos = [];
        for (var i = 0; i < N; i++) {
          var p = to[i], f = from[i] || p;
          var x = K.lerp(f.x, p.x, e), y = K.lerp(f.y, p.y, e);
          pos.push([x, y]);
          if (p.s === 0) continue;
          if (p.kind === 1) K.square(ctx, x, y, p.s * 2, K.INK, 0.2 + 0.75 * a);
          else K.dot(ctx, x, y, p.s, K.INK, 0.2 + 0.75 * a);
        }
        // 连通原则的连线
        if (to[0] && to[0].grp != null) {
          var la = K.clamp((e - 0.2) / 0.8, 0, 1);
          for (var j = 0; j < N - 1; j++) {
            if (to[j].grp != null && to[j + 1] && to[j + 1].grp === to[j].grp) {
              K.line(ctx, [pos[j], pos[j + 1]], { color: K.INK2, width: 1.1, alpha: 0.75 * la });
            }
          }
        }
        cur = pos;
      }

      var ticker = K.ticker(st, draw);
      target(PR[0].id);
      morph = 1;

      function setNote() { read.textContent = L(PR[sel].note.zh, PR[sel].note.en); }
      K.group(row, PR.map(function (p) { return { label: L(p.zh, p.en), value: p.id }; }), function (v) {
        sel = PR.map(function (p) { return p.id; }).indexOf(v);
        setNote(); target(v);
      });
      setNote();
      st.onResize = function () { target(PR[sel].id); };

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------------- 2.2 前注意搜索 */
  VIZ.figures['fig-preattentive'] = {
    zh: '前注意处理与视觉搜索', en: 'Pre-attentive processing',
    hint: { zh: '点一下开始计时，再点中那个不同的点', en: 'click once to start, then click the odd one' },
    mount: function (host) {
      var MODES = [
        { id: 'color', zh: '颜色', en: 'Colour' },
        { id: 'shape', zh: '形状', en: 'Shape' },
        { id: 'size', zh: '大小', en: 'Size' },
        { id: 'conj', zh: '颜色 + 形状', en: 'Colour + shape' }
      ];
      var mode = 'color', n = 700, target = 0, t0 = 0, running = false, last = 0;
      var best = {};
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 290, 400)); }, draw: function () { draw(); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var rs = K.rng(777);

      function newTrial() {
        var cols = Math.max(8, Math.round(Math.sqrt(n * st.w / Math.max(st.h, 1))));
        var rows = Math.ceil(n / cols);
        var pts = [];
        for (var i = 0; i < n; i++) {
          var c = i % cols, r = Math.floor(i / cols);
          pts.push({
            x: (c + 0.5) * (st.w / cols) + (rs() - 0.5) * 1.6,
            y: (r + 0.5) * (st.h / rows) + (rs() - 0.5) * 1.6,
            s: 2.5 + rs() * 0.4, sh: 0
          });
        }
        target = Math.floor(Math.random() * n);
        var p = pts[target];
        if (mode === 'color') p.col = K.SPOT;
        else if (mode === 'shape') { p.sh = 1; p.s = 3.3; }
        else if (mode === 'size') p.s = 6.4;
        else { p.sh = 1; p.s = 3.3; p.col = K.SPOT; }
        pts[target] = p;
        st._pts = pts;
        running = false;
      }
      function mean(id) {
        var a = best[id];
        return a && a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null;
      }
      function paint() {
        var parts = MODES.map(function (m) {
          var mu = mean(m.id);
          return L(m.zh, m.en) + ' <b>' + (mu ? (mu / 1000).toFixed(2) + 's' : '—') + '</b>';
        });
        var cur = running ? L('计时中…', 'timing…') : (last ? L('本次 ', 'last ') + (last / 1000).toFixed(2) + 's' : L('等待开始', 'waiting'));
        statEl.set(cur + ' · ' + parts.join(' · '));
      }

      function draw() {
        var ctx = st.ctx, w = st.w, h = st.h, pts = st._pts || [];
        K.clear(ctx, w, h);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          if (p.sh === 1) K.square(ctx, p.x, p.y, p.s * 2, p.col || K.INK, 0.88);
          else K.dot(ctx, p.x, p.y, p.s, p.col || K.INK, 0.88);
        }
        // 用时条
        var el = running ? performance.now() - t0 : last;
        if (el) {
          var bw = Math.min(w - 130, 40 + el / 22);
          ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = K.SPOT;
          ctx.fillRect(10, h - 7, bw, 3); ctx.restore();
          K.label(ctx, (el / 1000).toFixed(2) + ' s', 10 + bw + 8, h - 5, { size: 10, mono: true, color: K.INK3 });
        }
        // 平均用时小图
        var bw2 = 176, bh2 = 56, bx = w - bw2 - 10, by = 10;
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.fillRect(bx, by, bw2, bh2);
        ctx.strokeStyle = K.RULE; ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by + 0.5, bw2 - 1, bh2 - 1);
        var maxV = 2.4, k;
        for (k = 0; k < MODES.length; k++) maxV = Math.max(maxV, (mean(MODES[k].id) || 0) / 1000);
        for (k = 0; k < MODES.length; k++) {
          var mu = (mean(MODES[k].id) || 0) / 1000;
          var hh = (mu / maxV) * (bh2 - 26);
          var cw = (bw2 - 22) / MODES.length;
          ctx.fillStyle = MODES[k].id === mode ? K.SPOT : K.INK;
          ctx.fillRect(bx + 11 + k * cw, by + bh2 - 15 - hh, cw - 10, hh);
          K.label(ctx, L(MODES[k].zh, MODES[k].en).slice(0, 2), bx + 11 + k * cw, by + bh2 - 4, { size: 9.5, color: K.INK3 });
        }
        K.label(ctx, L('平均用时 / 秒', 'mean time (s)'), bx + bw2 - 9, by + 12, { size: 9.5, align: 'right', color: K.INK4 });
        ctx.restore();
      }

      var ticker = K.ticker(st, function () { draw(); paint(); });
      newTrial();
      paint();

      st.cv.addEventListener('pointerdown', function (e) {
        if (!running) { running = true; last = 0; t0 = performance.now(); return; }
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var p = (st._pts || [])[target];
        if (p && Math.hypot(p.x - mx, p.y - my) < Math.max(11, p.s * 2.4)) {
          last = performance.now() - t0;
          (best[mode] = best[mode] || []).push(last);
          running = false;
          newTrial();
        }
      });
      st.cv.style.cursor = 'crosshair';

      K.group(row, MODES.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) {
        mode = v; newTrial(); draw(); paint();
      });
      K.range(row, L('干扰点数量', 'set size'), 200, 1400, n, 100, function (v) { n = v; newTrial(); draw(); paint(); });
      st.onResize = function () { newTrial(); };

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ---------------------------------------------------------- 2.3 韦伯定律 */
  VIZ.figures['fig-weber'] = {
    zh: '可辨识的差别', en: 'Just-noticeable difference',
    hint: { zh: '拖动差值，看阈值在哪里', en: 'drag the difference to find the threshold' },
    mount: function (host) {
      var WEB = 1 / 42;
      var ref = 200, delta = 4;
      var appe = K.intro(0.7);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.44, 250, 330)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var bs = (w - 96) / 520;
        var x0 = 34, y1 = h * 0.17, y2 = h * 0.33;
        K.label(ctx, L('基准长度', 'reference'), x0, y1 - 10, { size: 10.5, color: K.INK3 });
        ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = K.INK;
        ctx.fillRect(x0, y1 - 5, ref * bs * a, 10); ctx.restore();
        K.label(ctx, ref + ' px', x0 + ref * bs * a + 8, y1 + 3, { size: 10, mono: true, color: K.INK4 });

        var cmp = Math.max(20, ref + delta);
        var ok = Math.abs(delta) >= ref * WEB;
        K.label(ctx, L('比较长度', 'comparison'), x0, y2 - 10, { size: 10.5, color: K.INK3 });
        ctx.save(); ctx.fillStyle = ok ? K.SPOT : K.INK4;
        ctx.fillRect(x0, y2 - 5, cmp * bs * a, 10); ctx.restore();
        K.label(ctx, Math.round(cmp) + ' px', x0 + cmp * bs * a + 8, y2 + 3, { size: 10, mono: true, color: ok ? K.SPOT : K.INK4 });

        var xe = x0 + Math.min(ref, cmp) * bs, xf = x0 + Math.max(ref, cmp) * bs;
        K.vline(ctx, xe, y2 + 9, y2 + 19, K.INK3);
        K.vline(ctx, xf, y2 + 9, y2 + 19, K.INK3);
        K.line(ctx, [[xe, y2 + 14], [xf, y2 + 14]], { color: K.INK3, width: 1 });
        K.label(ctx, 'Δ = ' + Math.round(Math.abs(delta)) + ' px · ' + (Math.abs(delta) / ref * 100).toFixed(1) + '%',
          (xe + xf) / 2, y2 + 30, { align: 'center', size: 10, mono: true, color: K.INK2 });

        // 阈值线
        var gx0 = 52, gy0 = h * 0.56, gw = w - gx0 - 46, gh = h - gy0 - 32;
        var xs = K.linear(0, 420, gx0, gx0 + gw), ys = K.linear(0, 16, gy0 + gh, gy0);
        K.axes(ctx, {
          x0: gx0, y0: gy0, w: gw, h: gh, x: xs, y: ys,
          xTicks: [0, 100, 200, 300, 400], yTicks: [0, 4, 8, 12, 16],
          xFormat: function (v) { return v; }, yFormat: function (v) { return v; },
          xLabel: L('基准长度 / 像素', 'reference length (px)'),
          yLabel: L('刚能分辨的差值 / 像素', 'just-noticeable difference (px)')
        });
        // 阈值以上/以下两块
        ctx.save();
        ctx.globalAlpha = 0.055; ctx.fillStyle = K.INK;
        ctx.beginPath();
        ctx.moveTo(xs(0), ys(0)); ctx.lineTo(xs(420), ys(420 * WEB));
        ctx.lineTo(xs(420), gy0 + gh); ctx.lineTo(xs(0), gy0 + gh); ctx.closePath(); ctx.fill();
        ctx.restore();
        K.line(ctx, [[xs(0), ys(0)], [xs(420), ys(420 * WEB)]], { color: K.INK, width: 1.6 });
        K.label(ctx, L('低于阈值：看不出来', 'below threshold: not discriminable'), gx0 + 10, gy0 + 16, { size: 10.5, color: K.INK3 });
        K.label(ctx, L('高于阈值：可以分辨', 'above threshold: discriminable'), gx0 + gw - 10, gy0 + gh - 10, { align: 'right', size: 10.5, color: K.SPOT });
        var px = xs(K.clamp(ref, 0, 420)), py = ys(Math.abs(delta));
        K.ring(ctx, px, py, 4.5, K.SPOT, 1.2);
        K.dot(ctx, px, py, 1.9, K.SPOT);

        statEl.set('Δ/L = <b>' + (Math.abs(delta) / ref * 100).toFixed(1) + '%</b> · ' +
          L('长度判断的韦伯分数约为 1/42 ≈ 2.4%', 'the Weber fraction for length is about 1/42 ≈ 2.4%'));
      }

      var ticker = K.ticker(st, draw);
      K.range(row, L('基准长度', 'reference'), 60, 400, ref, 5, function (v) { ref = v; draw(); }, 'px');
      K.range(row, L('长度差', 'difference'), -120, 120, delta, 1, function (v) { delta = v; draw(); }, 'px');
      st.onResize = function () { draw(); };

      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
