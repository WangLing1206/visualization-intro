/* ==========================================================================
   geo.js — 第 8 章配图：投影变形、分级设色与符号、流场与轨迹
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }
  var LAND = window.VIZ_LAND || [];

  /* ------------------------------------------------------------ 8.1 投影 */
  VIZ.figures['fig-projection'] = {
    zh: '投影的取舍', en: 'The cost of a projection',
    hint: { zh: '切换投影，拖动可旋转球体', en: 'switch projections; drag to spin the globe' },
    mount: function (host) {
      var PROJ = [
        { id: 'equi', zh: '等距圆柱', en: 'Equirectangular', note: { zh: '经纬度按等比例铺开：角度不歪，但高纬度地区被横向拉长。', en: 'Longitude and latitude scaled equally: angles stay true, high latitudes are stretched sideways.' } },
        { id: 'merc', zh: '墨卡托', en: 'Mercator', note: { zh: '保持方向与局部形状，代价是面积随纬度剧增——格陵兰看起来比非洲还大。', en: 'Preserves direction and local shape, at the price of runaway area — Greenland looks larger than Africa.' } },
        { id: 'area', zh: '等面积', en: 'Equal-area', note: { zh: '面积严格成比例，代价是形状被压扁，方向不再可靠。', en: 'Areas stay proportional, at the cost of squashed shapes and unreliable directions.' } },
        { id: 'globe', zh: '正射（球面）', en: 'Orthographic', note: { zh: '从太空看地球，只看到半个球面；它是唯一不产生投影变形的显示方式。', en: 'The globe as seen from space: only one hemisphere, and the only view free of projection distortion.' } }
      ];
      var proj = 'equi', morph = 1, prevProj = 'equi', rotY = -0.35, rotX = 0.22, dragging = false, px0 = 0, py0 = 0;
      var appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.56, 300, 460)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      function project(lon, lat, id) {
        var la = K.clamp(lat, -85, 85) * Math.PI / 180, lo = lon * Math.PI / 180;
        if (id === 'equi') return [lo / Math.PI, la / (Math.PI / 2)];
        if (id === 'merc') return [lo / Math.PI, Math.log(Math.tan(Math.PI / 4 + la / 2)) / 2.4];
        if (id === 'area') return [lo / Math.PI * Math.cos(la * 0.5) * 1.15 * 0.86, Math.sin(la)];
        // 正射：绕 y 轴旋转
        var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
        var x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
        var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        return [x1, y1, z2];
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        if (dt && morph < 1) morph = Math.min(1, morph + dt / 0.7);
        if (dt && !dragging) rotY += dt * 0.06;
        var e = K.ease.inOut(morph);
        K.clear(ctx, w, h);
        var R = Math.min(w * 0.42, h * 0.44);
        var cx = w * 0.36, cy = h / 2;
        K.label(ctx, L('陆地轮廓：Natural Earth 110m 简化', 'land outlines: Natural Earth 110m, simplified'), 12, 16, { size: 10, color: K.INK4 });
        // 右侧：该投影在各纬度圈上的面积放大倍数（现算）
        var px0 = w * 0.72, panelW = w - px0 - 16;
        if (panelW > 120) {
          K.label(ctx, L('面积放大倍数', 'area inflation'), px0, 40, { size: 10.5, color: K.INK3 });
          [0, 40, 60, 80].forEach(function (lat, i) {
            var la = lat * Math.PI / 180, k;
            if (proj === 'merc') k = 1 / (Math.cos(la) * Math.cos(la));
            else if (proj === 'equi') k = 1 / Math.cos(la);
            else k = 1;
            var y = 64 + i * 32;
            var maxW = panelW - 78;
            var bwid = K.clamp(k / 33 * maxW * 3.2, 1.5, maxW);
            K.label(ctx, lat + '°', px0, y + 4, { size: 10.5, mono: true, color: K.INK3 });
            ctx.save();
            ctx.globalAlpha = 0.85 * a;
            ctx.fillStyle = k > 1.4 ? K.SPOT : K.INK;
            ctx.fillRect(px0 + 36, y - 5, bwid, 8);
            ctx.restore();
            K.label(ctx, (k < 10 ? k.toFixed(2) : k.toFixed(0)) + '×', px0 + 42 + bwid, y + 4,
              { size: 10.5, mono: true, color: k > 1.4 ? K.SPOT : K.INK4 });
          });
          K.label(ctx, proj === 'globe' ? L('球面上没有平面放大', 'on the sphere nothing is inflated')
            : proj === 'area' ? L('等面积投影这一栏恒为 1', 'equal-area: always 1')
              : L('纬度越高，横向拉得越开', 'the higher the latitude, the wider the stretch'),
            px0, 64 + 4 * 32 + 8, { size: 10.5, color: K.INK3 });
        }
        var behind = 0;
        LAND.forEach(function (ring) {
          var pts = [], back = [];
          for (var i = 0; i < ring.length; i++) {
            var p0 = project(ring[i][0], ring[i][1], prevProj);
            var p1 = project(ring[i][0], ring[i][1], proj);
            var mnx = K.lerp(p0[0], p1[0], e), mny = K.lerp(p0[1], p1[1], e);
            var z = (proj === 'globe' || prevProj === 'globe') ? K.lerp(p0[2] == null ? 1 : p0[2], p1[2] == null ? 1 : p1[2], e) : 1;
            var px = cx + mnx * R, py = cy - mny * R * (proj === 'globe' ? 1 : 0.92);
            if (z < 0) { back.push([px, py]); behind++; } else pts.push([px, py]);
          }
          var alpha = a * (proj === 'globe' ? 0.62 : 0.78);
          var closed = pts.length > 2;
          K.line(ctx, closed ? pts.concat([pts[0]]) : pts, {
            color: proj === 'globe' ? K.INK2 : K.INK, width: proj === 'globe' ? 0.9 : 1,
            alpha: alpha
          });
          // 反面的点名
          if (back.length && proj === 'globe') {
            back.forEach(function (p, i) { if (i % 3 === 0) K.dot(ctx, p[0], p[1], 0.9, K.INK4, 0.18 * a); });
          }
        });
        if (proj === 'globe') {
          K.ring(ctx, cx, cy, R, K.RULE, 1, 0.9);
          // 经纬网
          for (var la = -60; la <= 60; la += 30) {
            var par = [];
            for (var lo = -180; lo <= 180; lo += 4) {
              var p = project(lo, la, 'globe');
              if (p[2] >= 0) par.push([cx + p[0] * R, cy - p[1] * R]);
            }
            K.line(ctx, par, { color: K.RULE, width: 0.8, alpha: 0.7 });
          }
          for (var lo2 = 0; lo2 < 360; lo2 += 30) {
            var mer = [];
            for (var la2 = -85; la2 <= 85; la2 += 4) {
              var p2 = project(lo2, la2, 'globe');
              if (p2[2] >= 0) mer.push([cx + p2[0] * R, cy - p2[1] * R]);
            }
            K.line(ctx, mer, { color: K.RULE, width: 0.8, alpha: 0.7 });
          }
        } else {
          var bh = (proj === 'merc' ? 1.55 : 1) * R * 0.92;
          ctx.save();
          ctx.setLineDash([4, 4]); ctx.strokeStyle = K.RULE; ctx.lineWidth = 1;
          ctx.strokeRect(cx - R, cy - bh, R * 2, bh * 2);
          ctx.restore();
          K.label(ctx, L('赤道', 'equator'), cx + R + 6, cy + 3, { size: 9.5, color: K.INK4 });
        }
        statEl.set(L('投影：', 'projection: ') + '<b>' + K.esc(L(PROJ.filter(function (p) { return p.id === proj; })[0].zh,
          PROJ.filter(function (p) { return p.id === proj; })[0].en)) + '</b>');
      }
      st.cv.addEventListener('pointerdown', function (e) {
        dragging = true; px0 = e.clientX; py0 = e.clientY;
        try { st.cv.setPointerCapture(e.pointerId); } catch (err) { }
      });
      st.cv.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        rotY += (e.clientX - px0) * 0.006;
        rotX = K.clamp(rotX + (e.clientY - py0) * 0.005, -1.1, 1.1);
        px0 = e.clientX; py0 = e.clientY;
        if (proj !== 'globe') { prevProj = proj; proj = 'globe'; sync(); }
        draw();
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () { dragging = false; });
      });
      function sync() {
        read.textContent = L(PROJ.filter(function (p) { return p.id === proj; })[0].note.zh,
          PROJ.filter(function (p) { return p.id === proj; })[0].note.en);
      }
      K.group(row, PROJ.map(function (p) { return { label: L(p.zh, p.en), value: p.id }; }), function (v) {
        prevProj = proj; proj = v; morph = 0; sync(); draw(0.001);
      });
      sync();
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------- 8.2 分级设色与符号 */
  VIZ.figures['fig-choropleth'] = {
    zh: '分级设色与符号', en: 'Choropleth and symbols',
    hint: { zh: '切换分级方法与两种画法', en: 'switch classification and symbol type' },
    mount: function (host) {
      var cities = K.data.cities;
      var MODES = [
        { id: 'chor', zh: '分级设色', en: 'Choropleth' },
        { id: 'sym', zh: '比例符号', en: 'Symbols' }
      ];
      var CLS = [
        { id: 'cont', zh: '连续', en: 'Continuous' },
        { id: 'eqi', zh: '等距分级', en: 'Equal interval' },
        { id: 'qua', zh: '等分位分级', en: 'Quantile' }
      ];
      var mode = 'chor', cls = 'cont', hover = -1, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.42, 290, 350)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      var COLS = 24, ROWS = 12;
      function cells() {
        var grid = new Array(COLS * ROWS).fill(0);
        cities.forEach(function (c) {
          var cx = Math.floor((c.lon + 180) / 360 * COLS);
          var cy = Math.floor((90 - c.lat) / 180 * ROWS);
          var i = K.clamp(cy, 0, ROWS - 1) * COLS + K.clamp(cx, 0, COLS - 1);
          grid[i] += c.pop;
        });
        return grid;
      }
      function breaks(vals, n) {
        var out = [], v = vals.filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
        if (!v.length) return [0, 1];
        if (cls === 'qua') {
          for (var i = 0; i <= n; i++) out.push(v[Math.min(v.length - 1, Math.round(i / n * (v.length - 1)))]);
        } else {
          var mn = v[0], mx = v[v.length - 1];
          for (var j = 0; j <= n; j++) out.push(mn + (mx - mn) * j / n);
        }
        return out;
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var R = Math.min(w * 0.44, h * 0.5);
        var cx = w / 2 - 30, cy = h / 2;
        var gw = (w - 150) / COLS, gh = (h - 70) / ROWS;
        var grid = cells();
        var vals = grid.filter(function (v) { return v > 0; });
        var brk = breaks(vals, 5);
        // 陆地轮廓作底
        LAND.forEach(function (ring) {
          var pts = ring.map(function (p) { return [cx + p[0] / 180 * (w - 150) / 2, cy - p[1] / 90 * (h - 70) / 2]; });
          K.line(ctx, pts.concat([pts[0]]), { color: K.RULE, width: 0.8, alpha: a * 0.9 });
        });
        if (mode === 'chor') {
          var bi = 0;
          for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++, bi++) {
              var v = grid[bi];
              if (!v) continue;
              var t = cls === 'cont' ? Math.sqrt(v / 28.5) : (v > brk[5] ? 1 : (v - brk[0]) / ((brk[5] - brk[0]) || 1));
              var x0 = cx + (c * COLS ? 0 : 0);
              var px = (w - 150) / 2 - (w - 150) / 2 + c * gw + 14;
              var py = cy - (h - 70) / 2 + r * gh;
              ctx.save();
              ctx.globalAlpha = a * 0.9;
              ctx.fillStyle = K.ramp('#f4f4f4', '#141414')(K.clamp(t, 0, 1));
              ctx.fillRect(px, py, gw + 0.6, gh + 0.6);
              ctx.restore();
            }
          }
        }
        cities.forEach(function (ct, i) {
          var px = cx + ct.lon / 180 * (w - 150) / 2, py = cy - ct.lat / 90 * (h - 70) / 2;
          var on = i === hover;
          if (mode === 'sym') {
            var rad = Math.sqrt(ct.pop) * 3.2;
            K.dot(ctx, px, py, rad, on ? K.SPOT : K.withAlpha(K.INK, 0.34), a);
            K.ring(ctx, px, py, rad, K.INK, 0.8, a * 0.7);
          } else {
            K.ring(ctx, px, py, 3, K.INK, 1, a);
            if (on) K.ring(ctx, px, py, 7, K.SPOT, 1.4, a);
          }
        });
        // 图例
        var lx = w - 122, ly = h / 2 - 60;
        K.label(ctx, mode === 'sym' ? L('面积 ∝ 人口', 'area ∝ population') : L('灰度 = 人口', 'grey = population'),
          lx, ly - 14, { size: 10.5, color: K.INK3 });
        if (mode === 'sym') {
          [5, 15, 28].forEach(function (v, i) {
            var rad = Math.sqrt(v) * 3.2;
            K.ring(ctx, lx + 16, ly + 26 + i * 46, rad, K.INK, 1, 0.9);
            K.label(ctx, v + ' M', lx + 40, ly + 28 + i * 46, { size: 10, mono: true, color: K.INK4 });
          });
        } else {
          for (var k = 0; k < 40; k++) {
            ctx.save(); ctx.globalAlpha = a;
            ctx.fillStyle = K.ramp('#f4f4f4', '#141414')(k / 39);
            ctx.fillRect(lx, ly + k * 3, 26, 3); ctx.restore();
          }
          K.label(ctx, K.fmt(brk[5], 0), lx + 32, ly + 8, { size: 10, mono: true, color: K.INK4 });
          K.label(ctx, K.fmt(brk[0], 0), lx + 32, ly + 117, { size: 10, mono: true, color: K.INK4 });
          if (cls !== 'cont') {
            for (var b = 1; b < 5; b++) {
              var yy = ly + (1 - (brk[b] - brk[0]) / ((brk[5] - brk[0]) || 1)) * 117;
              K.hline(ctx, lx, lx + 26, yy, K.SPOT);
              K.label(ctx, K.fmt(brk[b], 0), lx + 32, yy + 4, { size: 9.5, mono: true, color: K.SPOT });
            }
          }
        }
        if (hover >= 0) {
          var ct2 = cities[hover];
          read.innerHTML = '<b>' + K.esc(L(ct2.zh, ct2.en)) + '</b>　' + ct2.pop.toFixed(1) + ' M　' +
            ct2.lon.toFixed(1) + '°, ' + ct2.lat.toFixed(1) + '°　·　' +
            K.esc(L(K.data.regions[ct2.region][0], K.data.regions[ct2.region][1]));
        } else {
          read.textContent = mode === 'chor'
            ? L('分级设色按区域着色，读者读的是“位置里的总量”；换一种分级方法，同一份数据会呈现不同的深浅故事。',
              'A choropleth colour-codes regions, so the reader reads a total per location; changing the classification retells the same data.')
            : L('比例符号把数值编码为面积，必须用平方根映射，否则大值会被夸大。',
              'Proportional symbols encode value as area, which requires a square-root mapping — otherwise large values are exaggerated.');
        }
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var w = st.w, h = st.h;
        var R = Math.min(w * 0.44, h * 0.5), cx = w / 2 - 30, cy = h / 2;
        var best = -1, bd = 22;
        cities.forEach(function (ct, i) {
          var px = cx + ct.lon / 180 * (w - 150) / 2, py = cy - ct.lat / 90 * (h - 70) / 2;
          var d = Math.hypot(px - mx, py - my);
          if (d < bd) { bd = d; best = i; }
        });
        if (best !== hover) { hover = best; draw(); }
        st.cv.style.cursor = best >= 0 ? 'pointer' : 'default';
      });
      st.cv.addEventListener('pointerleave', function () { hover = -1; draw(); });
      K.group(row, MODES.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { mode = v; draw(); });
      K.group(row, CLS.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { cls = v; mode = 'chor'; draw(); });
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ---------------------------------------------------------- 8.3 流场 */
  VIZ.figures['fig-flow'] = {
    zh: '流场与轨迹', en: 'Flow fields and trajectories',
    hint: { zh: '切换流场，粒子会重新排队', en: 'switch the field and the particles re-route' },
    mount: function (host) {
      var MODES = [
        { id: 'uniform', zh: '均匀流', en: 'Uniform' },
        { id: 'vortex', zh: '旋涡', en: 'Vortex' },
        { id: 'cities', zh: '城市之间', en: 'Between cities' }
      ];
      var mode = 'uniform', appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 280, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      var r = K.rng(6180);
      var N = 260, P = [];
      for (var i = 0; i < N; i++) {
        P.push({ x: r(), y: r(), a: r(), life: r(), speed: 0.5 + r() * 0.8, from: Math.floor(r() * 8), to: Math.floor(r() * 8) });
      }
      function field(x, y, t) {
        if (mode === 'uniform') return [1, 0.18 * Math.sin(y * 6.28 * 1.2)];
        if (mode === 'vortex') {
          var dx = x - 0.5, dy = y - 0.5;
          var d = Math.hypot(dx, dy) + 0.02;
          return [-dy / d * (1 - d), dx / d * (1 - d)];
        }
        return [0, 0];
      }
      var hubs = [[0.18, 0.62], [0.72, 0.34], [0.42, 0.7], [0.86, 0.66], [0.3, 0.24], [0.58, 0.5], [0.12, 0.3], [0.9, 0.24]];
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var pad = 20, iw = w - pad * 2, ih = h - pad * 2;
        // 底图
        LAND.forEach(function (ring) {
          var pts = ring.map(function (p) { return [pad + (p[0] + 180) / 360 * iw, pad + (90 - p[1]) / 180 * ih]; });
          K.line(ctx, pts.concat([pts[0]]), { color: K.RULE, width: 0.8, alpha: a * 0.75 });
        });
        if (mode === 'cities') {
          var HOT = [[116.4, 39.9], [-74.0, 40.7], [2.35, 48.86], [139.69, 35.69], [151.21, -33.87], [-46.63, -23.55], [37.62, 55.75], [31.24, 30.04]];
          HOT.forEach(function (c) {
            var px = pad + (c[0] + 180) / 360 * iw, py = pad + (90 - c[1]) / 180 * ih;
            K.dot(ctx, px, py, 2.6, K.INK, a * 0.9);
          });
        }
        P.forEach(function (p2) {
          if (dt) {
            if (mode === 'cities') {
              p2.life += dt * 0.28 * p2.speed;
              if (p2.life > 1) { p2.life = 0; p2.from = Math.floor(Math.random() * hubs.length); p2.to = Math.floor(Math.random() * hubs.length); }
            } else {
              var f = field(p2.x, p2.y, 0);
              p2.x += f[0] * dt * 0.055 * p2.speed;
              p2.y += f[1] * dt * 0.055 * p2.speed;
              if (p2.x > 1.02) p2.x = -0.02;
              if (p2.x < -0.03) p2.x = 1.01;
              if (p2.y > 1.02) p2.y = -0.02;
              if (p2.y < -0.03) p2.y = 1.01;
            }
          }
          var px2, py2, alpha = 0.75 * a;
          if (mode === 'cities') {
            var A0 = hubs[p2.from % hubs.length], B0 = hubs[p2.to % hubs.length];
            var tt = p2.life;
            var lon = K.lerp(A0[0], B0[0], tt), lat = K.lerp(A0[1], B0[1], tt);
            px2 = pad + lon * iw; py2 = pad + lat * ih;
            var lift = Math.sin(Math.PI * tt) * 0.16;
            py2 -= lift * ih;
            alpha = Math.sin(Math.PI * tt) * 0.85 * a;
          } else {
            px2 = pad + p2.x * iw; py2 = pad + p2.y * ih;
          }
          K.dot(ctx, px2, py2, 1.1 + p2.speed * 0.7, p2.a > 0.94 ? K.SPOT : K.INK, alpha);
          if (dt && mode !== 'cities') {
            // 短尾迹
            var f2 = field(p2.x, p2.y, 0);
            K.line(ctx, [[px2, py2], [px2 - f2[0] * 9, py2 - f2[1] * 9]], { color: K.INK, width: 0.8, alpha: alpha * 0.35 });
          }
        });
        K.label(ctx, mode === 'uniform' ? L('方向一致，用线条长度或颜色编码强度', 'one direction; length or colour carries magnitude')
          : mode === 'vortex' ? L('速度场：靠近中心的点走得快', 'a velocity field: particles near the centre move fastest')
            : L('起点与终点固定，中间是插值出来的弧线', 'fixed origins and destinations, interpolated arcs between them'),
          pad, h - 6, { size: 10.5, color: K.INK3 });
        statEl.set(L('粒子 ', 'particles ') + '<b>' + N + '</b>　·　' + L('场类型 ', 'field ') + '<b>' + K.esc(L(MODES.filter(function (m) { return m.id === mode; })[0].zh, MODES.filter(function (m) { return m.id === mode; })[0].en)) + '</b>');
      }
      K.group(row, MODES.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { mode = v; draw(); });
      read.textContent = L('场是一种“处处有值”的数据：它没有记录，只有位置与值。粒子是让它可见的最直接手段。',
        'A field is data with a value everywhere: no records, only positions and values. Particles are the most direct way to show it.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
