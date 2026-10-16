/* ==========================================================================
   time.js — 第 7 章配图：折线查询、流图、动画轨迹
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* -------------------------------------------------------- 7.1 折线图与查询 */
  VIZ.figures['fig-timeseries'] = {
    zh: '折线图上的读数', en: 'Reading a line chart',
    hint: { zh: '移动指针读数，横向拖动选区间', en: 'move to read, drag to select a span' },
    mount: function (host) {
      var series = K.data.series;
      var on = [true, true, true, true];
      var range = null, hoverX = null, dragFrom = null, appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 280, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var mkG;

      function geom() {
        var w = st.w, h = st.h;
        var padL = 48, padT = 26, padR = 16, padB = 52;
        var iw = w - padL - padR, ih = h - padT - padB;
        return { padL: padL, padT: padT, iw: iw, ih: ih };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var X = K.linear(0, 47, 0, g.iw), Y = K.linear(0, 32, g.ih, 0);
        K.axes(ctx, {
          x0: g.padL, y0: g.padT, w: g.iw, h: g.ih, x: X, y: Y,
          xTicks: [0, 12, 24, 36, 47], yTicks: [0, 10, 20, 30], grid: true,
          xFormat: function (v) { return v % 12 === 0 ? L((v / 12 + 1) + ' 年', 'yr ' + (v / 12 + 1)) : ''; },
          yFormat: function (v) { return v; },
          yLabel: L('月均气温 / ℃', 'mean temperature / °C'), xLabel: L('月份', 'month')
        });
        // 选区
        if (range) {
          var x0 = g.padL + X(Math.min(range[0], range[1])), x1 = g.padL + X(Math.max(range[0], range[1]));
          ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = K.SPOT;
          ctx.fillRect(x0, g.padT, x1 - x0, g.ih); ctx.restore();
          K.vline(ctx, x0, g.padT, g.padT + g.ih, K.SPOT);
          K.vline(ctx, x1, g.padT, g.padT + g.ih, K.SPOT);
        }
        series.forEach(function (s, si) {
          if (!on[si]) return;
          var pts = s.values.map(function (v, i) { return [g.padL + X(i), g.padT + Y(v.v)]; });
          K.line(ctx, pts, { color: si === 0 ? K.INK : K.INK3, width: si === 0 ? 1.6 : 1.2, alpha: a * (si === 0 ? 0.95 : 0.7) });
          // 极值
          var lo = 0, hi = 0;
          s.values.forEach(function (v, i) { if (v.v < s.values[lo].v) lo = i; if (v.v > s.values[hi].v) hi = i; });
          K.dot(ctx, g.padL + X(lo), g.padT + Y(s.values[lo].v), 2.6, K.SPOT, a);
          K.label(ctx, L(s.zh, s.en), g.padL + g.iw - 4, g.padT + (12 + si * 16), { align: 'right', size: 10.5, color: si === 0 ? K.INK : K.INK3, alpha: a });
        });
        // 十字准星
        if (hoverX != null) {
          var v = Math.round(K.clamp(hoverX, 0, 47));
          K.vline(ctx, g.padL + X(v), g.padT, g.padT + g.ih, K.INK, [3, 3]);
          var nParts = 0;
          series.forEach(function (s, si) {
            if (!on[si]) return;
            K.dot(ctx, g.padL + X(v), g.padT + Y(s.values[v].v), 2.8, si === 0 ? K.SPOT : K.INK, 1);
            nParts++;
          });
          var lx = g.padL + X(v) + 8;
          if (lx > g.padL + g.iw - 120) lx = g.padL + X(v) - 128;
          ctx.save();
          ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.95;
          ctx.fillRect(lx - 6, g.padT + 4, 122, nParts * 15 + 16);
          ctx.strokeStyle = K.RULE; ctx.lineWidth = 1;
          ctx.strokeRect(lx - 6.5, g.padT + 3.5, 123, nParts * 15 + 17);
          ctx.restore();
          K.label(ctx, L('第 ' + (v + 1) + ' 月', 'month ' + (v + 1)), lx, g.padT + 18, { size: 10, mono: true, color: K.INK3 });
          var li = 0;
          series.forEach(function (s2, si) {
            if (!on[si]) return;
            K.label(ctx, L(s2.zh, s2.en), lx, g.padT + 34 + li * 15, { size: 10.5, color: K.INK2 });
            K.label(ctx, s2.values[v].v.toFixed(1) + '°', lx + 96, g.padT + 34 + li * 15,
              { align: 'right', size: 10.5, mono: true, color: si === 0 ? K.SPOT : K.INK });
            li++;
          });
        }
        // 区间统计
        if (range) {
          var lo2 = Math.round(Math.min(range[0], range[1])), hi2 = Math.round(Math.max(range[0], range[1]));
          var vals = series[0].values.slice(lo2, hi2 + 1).map(function (x) { return x.v; });
          var mu = vals.reduce(function (p, q) { return p + q; }, 0) / vals.length;
          var mn2 = Math.min.apply(null, vals), mx2 = Math.max.apply(null, vals);
          statEl.set(L('区间 ', 'span ') + '<b>' + (lo2 + 1) + '–' + (hi2 + 1) + '</b> ' + L('月', 'mo') +
            '　·　' + L(series[0].zh, series[0].en) + ' ' + L('均值 ', 'mean ') + '<b>' + mu.toFixed(1) + '</b>' +
            '　·　' + L('最低 ', 'min ') + mn2.toFixed(1) + '　·　' + L('最高 ', 'max ') + mx2.toFixed(1));
        } else {
          statEl.set(L('未选区间：显示全年 48 个月', 'no span selected: all 48 months shown'));
        }
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var g = geom();
        var mx = e.clientX - r2.left;
        if (dragFrom != null) {
          range = [dragFrom, K.clamp(X.invert(mx - g.padL), 0, 47)];
          draw();
          return;
        }
        if (mx < g.padL - 6 || mx > g.padL + g.iw + 6) { if (hoverX != null) { hoverX = null; draw(); } return; }
        hoverX = X.invert(mx - g.padL);
        draw();
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var g = geom();
        dragFrom = K.clamp(X.invert(e.clientX - r2.left - g.padL), 0, 47);
        range = null;
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () {
          if (dragFrom == null) return;
          if (range && Math.abs(range[1] - range[0]) < 1.2) range = null;
          dragFrom = null; hoverX = null; draw();
        });
      });
      mkG = K.group(row, series.map(function (s, i) { return { label: L(s.zh, s.en), value: String(i) }; }),
        function (v) { var i = parseInt(v, 10); on[i] = !on[i]; draw(); });
      K.btn(row, L('清除区间', 'clear span'), function () { range = null; draw(); });
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* -------------------------------------------------------------- 7.2 流图 */
  VIZ.figures['fig-stream'] = {
    zh: '流图与基线漂移', en: 'Streamgraph and baseline drift',
    hint: { zh: '切换排序与基线方式', en: 'switch ordering and baseline' },
    mount: function (host) {
      var series = K.data.series;
      var order = [0, 1, 2, 3], offsetMode = 'wiggle', mor = 1;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 280, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function stacks() {
        var n = series[0].values.length;
        var out = [];
        for (var i = 0; i < n; i++) out.push({ i: i, vals: series.map(function (s) { return s.values[i].v; }) });
        return out;
      }
      function baseline(rows) {
        // 三种基线：零基线（堆叠面积）、对称居中、wiggle 最小斜率
        return rows.map(function (r, i) {
          var total = r.vals.reduce(function (a, b) { return a + b; }, 0);
          if (offsetMode === 'zero') return 0;
          if (offsetMode === 'center') return -total / 2;
          var prev = rows[Math.max(0, i - 1)].vals.reduce(function (a, b) { return a + b; }, 0);
          var next = rows[Math.min(rows.length - 1, i + 1)].vals.reduce(function (a, b) { return a + b; }, 0);
          return -(prev + total * 1.6 + next) / 3.4;
        });
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        if (dt && mor < 1) mor = Math.min(1, mor + dt / 0.6);
        var a = mor;
        K.clear(ctx, w, h);
        var padL = 44, padT = 30, padR = 96, padB = 34;
        var iw = w - padL - padR, ih = h - padT - padB;
        var rows = stacks(), base = baseline(rows);
        var totalMax = 0, totalMin = 0;
        rows.forEach(function (r, i) {
          var t = r.vals.reduce(function (x, y) { return x + y; }, 0);
          totalMax = Math.max(totalMax, base[i] + t);
          totalMin = Math.min(totalMin, base[i]);
        });
        var Y = K.linear(totalMin - 3, totalMax + 3, ih, 0);
        var X = K.linear(0, rows.length - 1, 0, iw);
        K.axes(ctx, {
          x0: padL, y0: padT, w: iw, h: ih, x: X, y: Y,
          xTicks: [0, 12, 24, 36, 47], yTicks: null, grid: false,
          xFormat: function (v) { return v % 12 === 0 ? L((v / 12 + 1) + ' 年', 'yr ' + (v / 12 + 1)) : ''; },
          yLabel: L('气温 / ℃（堆叠）', 'temperature / °C (stacked)'), xLabel: L('月份', 'month')
        });
        // 依次堆叠四个城市
        var bottom = rows.map(function (r, i) { return base[i]; });
        order.forEach(function (si, k) {
          var top = rows.map(function (r, i) { return bottom[i] + r.vals[si]; });
          var upper = rows.map(function (r, i) { return [padL + X(i), padT + Y(top[i]) * a]; });
          var lower = rows.map(function (r, i) { return [padL + X(i), padT + Y(bottom[i]) * a]; }).reverse();
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(upper[0][0], upper[0][1]);
          upper.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
          lower.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
          ctx.closePath();
          ctx.globalAlpha = si === 0 ? 0.92 : 0.16 + (3 - k) * 0.06;
          ctx.fillStyle = si === 0 ? K.INK : K.INK;
          ctx.fill();
          ctx.restore();
          var mid = rows[Math.floor(rows.length * 0.5)];
          K.label(ctx, L(series[si].zh, series[si].en), padL + iw + 10, padT + Y((bottom[24] + top[24]) / 2) * a + 3,
            { size: 10.5, color: K.INK2 });
          bottom = top;
        });
        K.label(ctx, L('轮廓的形状由排序与基线共同决定', 'the outline is decided by ordering and baseline'),
          padL, padT + ih + 26, { size: 10.5, color: K.INK3 });
        var vol = 0, mnv = 1e9, mxv = -1e9;
        rows.forEach(function (r) {
          var t = r.vals.reduce(function (x, y) { return x + y; }, 0);
          vol += t; mnv = Math.min(mnv, t); mxv = Math.max(mxv, t);
        });
        statEl.set(L('总量 ', 'total ') + '<b>' + vol.toFixed(0) + '</b> °C · ' +
          L('最薄 ', 'thinnest ') + mnv.toFixed(1) + ' · ' + L('最厚 ', 'thickest ') + mxv.toFixed(1) + '　·　' +
          L('基线 ', 'baseline ') + '<b>' + (offsetMode === 'zero' ? L('零基线', 'zero') : offsetMode === 'center' ? L('居中', 'centre') : L('wiggle', 'wiggle')) + '</b>');
      }
      K.group(row, [
        { label: L('按总量排序', 'by total'), value: 'total' },
        { label: L('按波动排序', 'by variance'), value: 'var' },
        { label: L('保持原顺序', 'as given'), value: 'asis' }
      ], function (v) {
        if (v === 'asis') order = [0, 1, 2, 3];
        else {
          var score = series.map(function (s, i) {
            var mu = s.values.reduce(function (x, y) { return x + y.v; }, 0) / s.values.length;
            if (v === 'total') return mu;
            return Math.sqrt(s.values.reduce(function (x, y) { return x + (y.v - mu) * (y.v - mu); }, 0) / s.values.length);
          });
          order = series.map(function (s, i) { return i; }).sort(function (a, b) { return score[b] - score[a]; });
        }
        mor = 0; draw(0.001);
      });
      K.group(row, [
        { label: L('零基线', 'zero'), value: 'zero' },
        { label: L('居中', 'centre'), value: 'center' },
        { label: L('wiggle', 'wiggle') }
      ], function (v) { offsetMode = v; mor = 0; draw(0.001); });
      read.textContent = L('零基线回答“总量的变化”，居中与 wiggle 基线让每一层的形状本身更容易读，代价是纵轴不再从零开始。',
        'A zero baseline answers "how the total changed". Centred and wiggle baselines make each layer readable, at the price of losing the zero.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------ 7.3 动画与轨迹 */
  VIZ.figures['fig-bubble'] = {
    zh: '动画气泡图', en: 'Animated bubble chart',
    hint: { zh: '播放年份，看轨迹连成的路径', en: 'play the years and follow the trails' },
    mount: function (host) {
      var data = K.data.gapminder;
      var years = [];
      data.forEach(function (d) { if (years.indexOf(d.year) < 0) years.push(d.year); });
      years.sort(function (a, b) { return a - b; });
      var yi = Math.floor(years.length * 0.35), playing = true, trail = true;
      var appe = K.intro(0.8), last = 0;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var playBtn;
      var COLS = ['#141414', '#6f6f6f', '#a9a9a9', '#d4d4d4', '#b4232a', '#2b2b2b'];

      function byCountry() {
        var m = {};
        data.forEach(function (d) {
          var key = d.zh;
          (m[key] = m[key] || []).push(d);
        });
        return Object.keys(m).map(function (k) { return m[k]; });
      }
      var groups = byCountry();
      function geom() {
        var padL = 56, padT = 30, padR = 22, padB = 46;
        return { padL: padL, padT: padT, iw: st.w - padL - padR, ih: st.h - padT - padB };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        if (dt && playing) {
          last += dt;
          if (last > 0.55) { last = 0; yi = (yi + 1) % years.length; }
        }
        var X = K.log(300, 70000, 0, g.iw), Y = K.linear(30, 90, g.ih, 0);
        var R = K.linear(0, 1450, 2, Math.min(30, g.ih * 0.16));
        K.axes(ctx, {
          x0: g.padL, y0: g.padT, w: g.iw, h: g.ih, x: X, y: Y,
          xTicks: [500, 1000, 2000, 5000, 10000, 20000, 50000],
          yTicks: [30, 45, 60, 75, 90], grid: true,
          xFormat: function (v) { return K.fmt(v); }, yFormat: function (v) { return v; },
          xLabel: L('人均收入（对数轴）', 'income per person (log)'), yLabel: L('预期寿命 / 岁', 'life expectancy (years)')
        });
        var yr = years[yi];
        groups.forEach(function (grp, gi) {
          if (!grp.length) return;
          var d = grp[0];
          var cur = grp.reduce(function (best, p2) { return Math.abs(p2.year - yr) < Math.abs(best.year - yr) ? p2 : best; }, grp[0]);
          // 轨迹
          if (trail) {
            K.line(ctx, grp.filter(function (p2) { return p2.year <= cur.year; }).map(function (p2) {
              return [g.padL + X(p2.gdp), g.padT + Y(p2.lifeExp)];
            }), { color: COLS[gi % COLS.length], width: 1, alpha: 0.35 * a });
          }
          var r = R(cur.pop);
          K.dot(ctx, g.padL + X(cur.gdp), g.padT + Y(cur.lifeExp), r, COLS[gi % COLS.length], 0.28 * a);
          K.ring(ctx, g.padL + X(cur.gdp), g.padT + Y(cur.lifeExp), r, COLS[gi % COLS.length], 1, 0.8 * a);
          K.label(ctx, L(d.zh, d.en), g.padL + X(cur.gdp) + r + 4, g.padT + Y(cur.lifeExp) + 3, { size: 10.5, color: K.INK2 });
        });
        K.label(ctx, yr + '', g.padL + g.iw - 4, g.padT + 6, { align: 'right', size: 26, color: K.INK4 });
        K.label(ctx, L('气泡面积 ∝ 人口', 'bubble area ∝ population'), g.padL, g.padT + g.ih + 30, { size: 10.5, color: K.INK3 });
        K.label(ctx, L('数据为示意，非官方统计', 'illustrative data, not an official statistic'), g.padL + g.iw, g.padT + g.ih + 30, { align: 'right', size: 10, color: K.INK4 });
        statEl.set(L('年份 ', 'year ') + '<b>' + yr + '</b>　·　' + L('六国示意轨迹', 'six illustrative trajectories'));
      }
      playBtn = K.btn(row, L('暂停', 'pause'), function (b) {
        playing = !playing;
        b.textContent = playing ? L('暂停', 'pause') : L('播放', 'play');
      });
      playBtn.setAttribute('aria-pressed', 'true');
      K.btn(row, L('单步', 'step'), function () { playing = false; playBtn.textContent = L('播放', 'play'); yi = (yi + 1) % years.length; draw(); });
      K.btn(row, L('轨迹', 'trails'), function (b) { trail = !trail; b.setAttribute('aria-pressed', String(trail)); draw(); }).setAttribute('aria-pressed', 'true');
      K.range(row, L('年份', 'year'), 0, years.length - 1, yi, 1, function (v) { playing = false; playBtn.textContent = L('播放', 'play'); yi = v; draw(); });
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
