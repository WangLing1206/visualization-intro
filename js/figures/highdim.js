/* ==========================================================================
   highdim.js — 第 6 章配图：平行坐标、散点图矩阵、线性投影
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  var DIMS = [
    { k: 'hp', zh: '马力', en: 'horsepower' },
    { k: 'weight', zh: '重量', en: 'weight' },
    { k: 'mpg', zh: '油耗', en: 'fuel use' },
    { k: 'disp', zh: '排量', en: 'displacement' },
    { k: 'acc', zh: '加速', en: 'acceleration' }
  ];
  var CLS = [{ zh: '小型车', en: 'Compact' }, { zh: '中型车', en: 'Mid-size' }, { zh: 'SUV', en: 'SUV' }];

  /* -------------------------------------------------------- 6.1 平行坐标 */
  VIZ.figures['fig-parcoords'] = {
    zh: '平行坐标与刷选', en: 'Parallel coordinates',
    hint: { zh: '在任意轴上按住拖动即可筛选', en: 'drag on any axis to filter' },
    mount: function (host) {
      var rows = K.data.multi;
      var filters = DIMS.map(function () { return null; });
      var ext = DIMS.map(function (d) { return K.extent(rows, function (r) { return r[d.k]; }); });
      var hover = -1, drag = null, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function geom() {
        var padL = 62, padT = 44, padR = 40, padB = 40;
        var w = st.w, h = st.h;
        var ih = h - padT - padB;
        var step = (w - padL - padR) / (DIMS.length - 1);
        return { padL: padL, padT: padT, ih: ih, step: step, axisX: DIMS.map(function (d, i) { return padL + i * step; }) };
      }
      function yOf(v, i, g) {
        var e = ext[i];
        return g.padT + (1 - (v - e[0]) / ((e[1] - e[0]) || 1)) * g.ih;
      }
      function passes(r) {
        for (var i = 0; i < DIMS.length; i++) {
          var f = filters[i];
          if (f && (r[DIMS[i].k] < f[0] || r[DIMS[i].k] > f[1])) return false;
        }
        return true;
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var sel = rows.filter(passes);
        // 轴线
        DIMS.forEach(function (d, i) {
          var x = g.axisX[i];
          K.vline(ctx, x, g.padT, g.padT + g.ih, K.INK4);
          K.label(ctx, L(d.zh, d.en), x, g.padT - 26, { align: 'center', size: 11, color: K.INK });
          K.label(ctx, K.fmt(ext[i][0]), x, g.padT - 10, { align: 'center', size: 9.5, mono: true, color: K.INK4 });
          K.label(ctx, K.fmt(ext[i][1]), x, g.padT + g.ih + 16, { align: 'center', size: 9.5, mono: true, color: K.INK4 });
          for (var t = 1; t < 4; t++) {
            var yy = g.padT + (g.ih * t) / 4;
            K.label(ctx, K.fmt(K.lerp(ext[i][1], ext[i][0], t / 4)), x + 5, yy + 3, { size: 9, mono: true, color: K.INK4, alpha: 0.8 });
          }
          if (filters[i]) {
            var y0 = yOf(filters[i][1], i, g), y1 = yOf(filters[i][0], i, g);
            ctx.save();
            ctx.globalAlpha = 0.07; ctx.fillStyle = K.SPOT;
            ctx.fillRect(x - g.step * 0.5, Math.min(y0, y1), g.step, Math.abs(y1 - y0));
            ctx.restore();
            K.vline(ctx, x, Math.min(y0, y1), Math.max(y0, y1), K.SPOT);
          }
        });
        // 折线
        rows.forEach(function (r, idx) {
          var on = passes(r);
          var pts = DIMS.map(function (d, i) { return [g.axisX[i], yOf(r[d.k], i, g)]; });
          var isHover = idx === hover;
          K.line(ctx, pts, {
            color: isHover ? K.SPOT : (on ? K.INK : K.INK4),
            width: isHover ? 2 : (on ? 1.1 : 0.8),
            alpha: (isHover ? 1 : (on ? 0.55 : 0.12)) * a
          });
        });
        if (hover >= 0) {
          var r2 = rows[hover];
          DIMS.forEach(function (d, i) {
            K.label(ctx, K.fmt(r2[d.k]), g.axisX[i], yOf(r2[d.k], i, g) - 8, { align: 'center', size: 10, mono: true, color: K.SPOT });
          });
          K.label(ctx, L(CLS[r2.cls].zh, CLS[r2.cls].en), g.axisX[0] - 8, yOf(r2[DIMS[0].k], 0, g) + 3,
            { align: 'right', size: 10, color: K.SPOT });
        }
        var clsCount = [0, 0, 0];
        sel.forEach(function (r) { clsCount[r.cls]++; });
        statEl.set(L('选中 ', 'selected ') + '<b>' + sel.length + '</b> / ' + rows.length + '　·　' +
          clsCount.map(function (c, i) { return L(CLS[i].zh, CLS[i].en) + ' ' + c; }).join(' · '));
        read.textContent = L('在同一根轴上选一段，折线被过滤；多根轴同时筛选就是多维查询。',
          'Select a range on one axis to filter the lines; ranges on several axes make a multi-dimensional query.');
      }
      function axisAt(mx) {
        var g = geom();
        var best = -1, bd = 1e9;
        g.axisX.forEach(function (x, i) {
          var d = Math.abs(x - mx);
          if (d < bd) { bd = d; best = i; }
        });
        return bd < Math.max(22, g.step * 0.4) ? best : -1;
      }
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var ai = axisAt(mx);
        if (ai < 0) return;
        drag = { i: ai, y0: my };
        filters[ai] = null;
      });
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top, g = geom();
        if (drag) {
          var i = drag.i;
          var v0 = K.lerp(ext[i][1], ext[i][0], K.clamp((drag.y0 - g.padT) / g.ih, 0, 1));
          var v1 = K.lerp(ext[i][1], ext[i][0], K.clamp((my - g.padT) / g.ih, 0, 1));
          filters[i] = [Math.min(v0, v1), Math.max(v0, v1)];
          if (i === 0 && mx > g.axisX[0] + g.step * 0.5) drag = null;
          draw();
          return;
        }
        // 悬停最近折线
        var nh = -1;
        for (var k = 0; k < rows.length; k++) {
          var pts = DIMS.map(function (d, j) { return [g.axisX[j], yOf(rows[k][d.k], j, g)]; });
          for (var j = 0; j < pts.length - 1; j++) {
            var t = K.clamp((mx - pts[j][0]) / ((pts[j + 1][0] - pts[j][0]) || 1), 0, 1);
            var y = K.lerp(pts[j][1], pts[j + 1][1], t);
            if (mx >= pts[j][0] - 2 && mx <= pts[j + 1][0] + 2 && Math.abs(y - my) < 5) { nh = k; break; }
          }
          if (nh >= 0) break;
        }
        if (nh !== hover) { hover = nh; draw(); st.cv.style.cursor = nh >= 0 ? 'pointer' : (axisAt(mx) >= 0 ? 'ns-resize' : 'default'); }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () { drag = null; });
      });
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------ 6.2 散点图矩阵 */
  VIZ.figures['fig-spm'] = {
    zh: '散点图矩阵', en: 'Scatterplot matrix',
    hint: { zh: '悬停一个点，五张子图同时响应', en: 'hover one point; all five panels respond' },
    mount: function (host) {
      var rows = K.data.multi;
      var hover = -1, appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, {
        h: function (w) { return Math.round(K.clamp(w * 0.86, 340, 560)); },
        draw: function (dt) { draw(dt); }
      });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var ext = DIMS.map(function (d) { return K.extent(rows, function (r) { return r[d.k]; }); });

      function geom() {
        var padL = 54, padT = 30;
        var size = Math.min((st.w - padL - 16) / DIMS.length, (st.h - padT - 12) / DIMS.length);
        return { padL: padL, padT: padT, size: size };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        for (var rI = 0; rI < DIMS.length; rI++) {
          for (var cI = 0; cI < DIMS.length; cI++) {
            var x0 = g.padL + cI * g.size, y0 = g.padT + rI * g.size;
            var s = g.size - 4;
            K.hline(ctx, x0, x0 + s, y0 + s, K.RULE);
            K.vline(ctx, x0, y0, y0 + s, K.RULE);
            var X = K.linear(ext[cI][0], ext[cI][1], x0 + 4, x0 + s - 4);
            var Y = K.linear(ext[rI][0], ext[rI][1], y0 + s - 4, y0 + 4);
            if (rI === cI) {
              K.label(ctx, L(DIMS[rI].zh, DIMS[rI].en), x0 + s / 2, y0 + s / 2 + 4, { align: 'center', size: 11, color: K.INK3 });
            } else {
              rows.forEach(function (r, i) {
                var on = i === hover;
                K.dot(ctx, X(r[DIMS[cI].k]), Y(r[DIMS[rI].k]), on ? 3.6 : 1.9,
                  on ? K.SPOT : K.INK, (on ? 1 : 0.42) * a);
              });
            }
          }
        }
        DIMS.forEach(function (d, i) {
          K.label(ctx, L(d.zh, d.en), g.padL + i * g.size + g.size / 2 - 2, g.padT - 12, { align: 'center', size: 10.5, color: K.INK2 });
          K.label(ctx, L(d.zh, d.en), g.padL - 8, g.padT + i * g.size + g.size / 2 + 4, { align: 'right', size: 10.5, color: K.INK2 });
        });
        if (hover >= 0) {
          var r = rows[hover];
          read.innerHTML = '<b>' + K.esc(L(CLS[r.cls].zh, CLS[r.cls].en)) + '</b>　' +
            DIMS.map(function (d) { return K.esc(L(d.zh, d.en)) + ' ' + K.fmt(r[d.k]); }).join(' · ');
        }
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top, g = geom();
        var cI = Math.floor((mx - g.padL) / g.size), rI = Math.floor((my - g.padT) / g.size);
        if (cI < 0 || cI >= DIMS.length || rI < 0 || rI >= DIMS.length || cI === rI) {
          if (hover >= 0) { hover = -1; draw(); }
          return;
        }
        var x0 = g.padL + cI * g.size, y0 = g.padT + rI * g.size, s = g.size - 4;
        var X = K.linear(ext[cI][0], ext[cI][1], x0 + 4, x0 + s - 4);
        var Y = K.linear(ext[rI][0], ext[rI][1], y0 + s - 4, y0 + 4);
        var best = -1, bd = 9;
        rows.forEach(function (r, i) {
          var d = Math.hypot(X(r[DIMS[cI].k]) - mx, Y(r[DIMS[rI].k]) - my);
          if (d < bd) { bd = d; best = i; }
        });
        if (best !== hover) { hover = best; draw(); if (best < 0) read.textContent = L('悬停任一子图中的点，五个维度的同一记录会同时高亮。', 'Hover a point in any panel; the same record lights up across all five dimensions.'); }
        st.cv.style.cursor = best >= 0 ? 'pointer' : 'default';
      });
      read.textContent = L('悬停任一子图中的点，五个维度的同一记录会同时高亮。', 'Hover a point in any panel; the same record lights up across all five dimensions.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------------- 6.3 线性投影 */
  VIZ.figures['fig-pca'] = {
    zh: '主成分投影', en: 'Principal component projection',
    hint: { zh: '播放旋转，看方差被谁解释', en: 'play the rotation and watch the variance' },
    mount: function (host) {
      var rows = K.data.multi;
      var ang = 0, target = 0, playing = true, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 290, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      // 用两个真实字段构造二维点云：马力与重量
      var raw = rows.map(function (r) { return [r.hp, r.weight]; });
      var mx0 = raw.reduce(function (a, r) { return a + r[0]; }, 0) / raw.length;
      var my0 = raw.reduce(function (a, r) { return a + r[1]; }, 0) / raw.length;
      var sx = Math.sqrt(raw.reduce(function (a, r) { return a + (r[0] - mx0) * (r[0] - mx0); }, 0) / raw.length);
      var sy = Math.sqrt(raw.reduce(function (a, r) { return a + (r[1] - my0) * (r[1] - my0); }, 0) / raw.length);
      var Z = raw.map(function (r) { return [(r[0] - mx0) / sx, (r[1] - my0) / sy]; });
      var sxx = Z.reduce(function (a, p) { return a + p[0] * p[0]; }, 0) / Z.length;
      var syy = Z.reduce(function (a, p) { return a + p[1] * p[1]; }, 0) / Z.length;
      var sxy = Z.reduce(function (a, p) { return a + p[0] * p[1]; }, 0) / Z.length;
      var tr = sxx + syy, det = sxx * syy - sxy * sxy;
      var l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);     // 主轴方向
      var ratio = l1 / (l1 + l2);

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        if (dt && playing) ang += dt * 0.5;
        ang += (target - ang) * Math.min(1, dt ? dt * 3 : 1);
        var cx = w * 0.42, cy = h * 0.54, R = Math.min(w * 0.3, h * 0.38);
        var ca = Math.cos(ang), sa = Math.sin(ang);
        // 坐标轴
        K.hline(ctx, cx - R * 1.25, cx + R * 1.25, cy, K.RULE);
        K.vline(ctx, cx, cy - R * 1.1, cy + R * 1.1, K.RULE);
        // 点云（旋转后）
        Z.forEach(function (p, i) {
          var px = cx + (p[0] * ca - p[1] * sa) * R * 0.9;
          var py = cy - (p[0] * sa + p[1] * ca) * R * 0.9;
          var on = rows[i].cls === 0;
          K.dot(ctx, px, py, 3, on ? K.INK : K.INK3, (on ? 0.9 : 0.55) * a);
        });
        // 主成分轴（在当前旋转下指向水平方向）
        var ax = cx + Math.cos(-ang) * R * 1.15, ay = cy - Math.sin(-ang) * R * 1.15;
        var bx = cx - Math.cos(-ang) * R * 1.15, by = cy + Math.sin(-ang) * R * 1.15;
        K.line(ctx, [[bx, by], [ax, ay]], { color: K.SPOT, width: 1.4, dash: [5, 4] });
        K.label(ctx, L('第一主成分', 'first component'), ax, ay - 8, { align: 'center', size: 10.5, color: K.SPOT });
        // 投影到水平轴的“影子”
        Z.forEach(function (p, i) {
          var px = cx + (p[0] * ca - p[1] * sa) * R * 0.9;
          var py = cy - (p[0] * sa + p[1] * ca) * R * 0.9;
          var proj = cx + (p[0] * ca - p[1] * sa) * R * 0.9;
          ctx.save(); ctx.globalAlpha = 0.16 * a;
          ctx.strokeStyle = K.INK4; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(proj, cy); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
          K.dot(ctx, proj, cy, 1.9, K.SPOT, 0.85 * a);
        });
        // 方差条
        var barX = w * 0.78, barW = 34, barY = h * 0.22, barH = h * 0.56;
        K.label(ctx, L('方差', 'variance'), barX + barW / 2, barY - 12, { align: 'center', size: 10.5, color: K.INK3 });
        ctx.save();
        ctx.fillStyle = K.INK; ctx.fillRect(barX, barY, barW, barH * ratio * a);
        ctx.fillStyle = K.INK4; ctx.fillRect(barX, barY + barH * ratio * a, barW, barH * (1 - ratio) * a);
        ctx.restore();
        K.label(ctx, 'λ₁ ' + ratio.toFixed(3), barX + barW + 7, barY + barH * ratio * a - 4, { size: 10.5, mono: true, color: K.SPOT });
        K.label(ctx, 'λ₂ ' + (1 - ratio).toFixed(3), barX + barW + 7, barY + barH * ratio * a + 12, { size: 10.5, mono: true, color: K.INK3 });
        statEl.set(L('主轴方向 ', 'principal direction ') + '<b>' + (theta * 180 / Math.PI).toFixed(1) + '°</b>　·　' +
          L('第一主成分解释方差 ', 'variance explained ') + '<b>' + (ratio * 100).toFixed(1) + '%</b>');
        read.textContent = L('把坐标轴旋转到主轴方向，点云最“扁”的方向就是第一主成分；投影到它上面的影子保留了最多的差异。',
          'Rotate the axes onto the principal direction: the flattest direction is the first component, and the shadow cast on it keeps the most variation.');
      }
      st.cv.addEventListener('pointerdown', function () {
        playing = !playing;
        if (!playing) target = Math.round(ang / (Math.PI * 2)) * Math.PI * 2 - theta;
        else target = ang;
      });
      K.btn(row, L('对准主轴', 'align to axis'), function () {
        playing = false; target = Math.round(ang / (Math.PI * 2)) * Math.PI * 2 - theta; draw();
      });
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
