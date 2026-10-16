/* ==========================================================================
   evaluation.js — 第 11 章配图：两种条件的对比、正确但误导的图
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* ---------------------------------------------------------- 11.1 评估结果 */
  VIZ.figures['fig-evaluation'] = {
    zh: '两种条件的对比', en: 'Comparing two conditions',
    hint: { zh: '切换指标，看误差棒是否重叠', en: 'switch metric and check whether the bars overlap' },
    mount: function (host) {
      var METRICS = [
        { id: 'time', zh: '完成时间', en: 'Completion time', unit: 's', lower: true },
        { id: 'acc', zh: '正确率', en: 'Accuracy', unit: '%', lower: false }
      ];
      var CONDS = [
        { zh: '默认样式', en: 'Default style', time: [24.1, 4.2], acc: [71, 8.5] },
        { zh: '去装饰', en: 'Stripped back', time: [18.6, 3.4], acc: [83, 6.2] },
        { zh: '加交互', en: 'With interaction', time: [15.2, 3.9], acc: [88, 5.4] }
      ];
      var metric = 'time', appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 270, 350)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      function M() { return METRICS.filter(function (m) { return m.id === metric; })[0]; }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var m = M();
        var A = 56, B = 40, iw = w - A - 40, ih = h - B - 52;
        var vals = CONDS.map(function (c) { return c[metric]; });
        var hi = Math.max.apply(null, vals.map(function (v) { return v[0] + v[1]; })) * 1.18;
        var band = K.band(CONDS.length, 0, iw, 0.42, 0.3);
        var Y = K.linear(0, hi, ih, 0);
        K.axes(ctx, {
          x0: A, y0: B, w: iw, h: ih,
          x: K.linear(0, CONDS.length, 0, iw), y: Y,
          xTicks: null, yTicks: K.ticks(0, hi, 5),
          yFormat: function (v) { return K.fmt(v); }, grid: true,
          yLabel: L(m.zh, m.en) + ' / ' + m.unit
        });
        CONDS.forEach(function (c, i) {
          var v = c[metric];
          var bx = A + band(i), bw = band.bandwidth;
          var y = B + Y(v[0]);
          ctx.save(); ctx.globalAlpha = 0.9 * a; ctx.fillStyle = i === 2 ? K.SPOT : K.INK;
          ctx.fillRect(bx, y, bw, B + ih - y); ctx.restore();
          // 误差棒
          var yTop = B + Y(v[0] + v[1]), yBot = B + Y(Math.max(0, v[0] - v[1]));
          K.line(ctx, [[bx + bw / 2, yTop], [bx + bw / 2, yBot]], { color: K.INK, width: 1.2, alpha: a });
          K.line(ctx, [[bx + bw / 2 - 7, yTop], [bx + bw / 2 + 7, yTop]], { color: K.INK, width: 1.2, alpha: a });
          K.line(ctx, [[bx + bw / 2 - 7, yBot], [bx + bw / 2 + 7, yBot]], { color: K.INK, width: 1.2, alpha: a });
          K.label(ctx, K.fmt(v[0], 1) + (m.unit === '%' ? '%' : 's'), bx + bw / 2, y - 10, { align: 'center', size: 11, mono: true, color: i === 2 ? K.SPOT : K.INK });
          K.label(ctx, L(c.zh, c.en), bx + bw / 2, B + ih + 18, { align: 'center', size: 11, color: K.INK2 });
        });
        // 显著性提示：误差棒是否重叠
        var o1 = Math.abs(vals[2][0] - vals[0][0]) > (vals[2][1] + vals[0][1]) * 0.6;
        K.label(ctx, o1 ? L('第一与第三种条件差距大于误差之和，通常可以认为有效',
          'The first and third conditions differ by more than their error bars, so the effect is usually taken as real')
          : L('误差棒重叠：这一差别很可能只是抽样波动', 'The error bars overlap: the difference may be sampling noise'),
          A, B + ih + 38, { size: 10.5, color: o1 ? K.SPOT : K.INK3 });
        statEl.set(L('n = 24 / 条件 · 误差棒为 95% 置信区间', 'n = 24 per condition · bars are 95% confidence intervals') +
          '　·　' + L('数据为示意', 'illustrative data'));
      }
      K.group(row, METRICS.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { metric = v; draw(); });
      read.textContent = L('受控实验的读法：先看差值，再看误差。差值小于误差时，结论不成立——这与图形是否好看无关。',
        'How to read a controlled experiment: look at the difference, then at the error. When the difference is smaller than the error, there is no conclusion to draw.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ---------------------------------------------------------- 11.2 正确但误导 */
  VIZ.figures['fig-bias'] = {
    zh: '正确但误导', en: 'Correct but misleading',
    hint: { zh: '切换开关，同一份数据得出不同结论', en: 'flip the switches; the data never changes' },
    mount: function (host) {
      var data = [
        { zh: '一月', en: 'Jan', v: 101.2 }, { zh: '二月', en: 'Feb', v: 101.9 },
        { zh: '三月', en: 'Mar', v: 101.5 }, { zh: '四月', en: 'Apr', v: 102.4 },
        { zh: '五月', en: 'May', v: 103.1 }, { zh: '六月', en: 'Jun', v: 102.8 }
      ];
      var truncate = true, useArea = false, useLine = false;
      var appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 270, 350)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var A = 62, B = 36, iw = w - A - 40, ih = h - B - 54;
        var lo = truncate ? 100 : 0;
        var hi = 104;
        var band = K.band(data.length, 0, iw, 0.4, 0.3);
        var Y = K.linear(lo, hi, ih, 0);
        var ticks = truncate ? [100, 101, 102, 103, 104] : [0, 20, 40, 60, 80, 100];
        K.axes(ctx, {
          x0: A, y0: B, w: iw, h: ih,
          x: K.linear(0, data.length, 0, iw), y: Y,
          xTicks: null, yTicks: ticks, grid: true,
          yFormat: function (v) { return v; },
          yLabel: L('指数（基准 100）', 'index (base 100)')
        });
        if (useLine) {
          K.line(ctx, data.map(function (d, i) { return [A + band(i) + band.bandwidth / 2, B + Y(d.v)]; }),
            { color: K.INK, width: 2, alpha: a });
          data.forEach(function (d, i) {
            K.dot(ctx, A + band(i) + band.bandwidth / 2, B + Y(d.v), 3, K.INK, a);
          });
        } else {
          data.forEach(function (d, i) {
            var bw = band.bandwidth;
            if (useArea) {
              var rad = Math.sqrt(d.v - 90) * 2.6;
              K.dot(ctx, A + band(i) + bw / 2, B + ih - rad, rad, K.INK, 0.55 * a);
              K.ring(ctx, A + band(i) + bw / 2, B + ih - rad, rad, K.INK, 1, a);
            } else {
              var y = B + Y(d.v);
              ctx.save(); ctx.globalAlpha = 0.9 * a; ctx.fillStyle = K.INK;
              ctx.fillRect(A + band(i), y, bw, B + ih - y); ctx.restore();
            }
          });
        }
        data.forEach(function (d, i) {
          K.label(ctx, L(d.zh, d.en), A + band(i) + band.bandwidth / 2, B + ih + 18, { align: 'center', size: 10.5, color: K.INK3 });
        });
        // 变化幅度提示
        var chg = (data[5].v - data[0].v) / data[0].v * 100;
        var visual = truncate ? 91 : 9;
        var lie = visual / Math.max(0.001, chg);
        K.label(ctx, L('真实变化 ', 'real change ') + chg.toFixed(1) + '%',
          A + iw, B - 12, { align: 'right', size: 11, mono: true, color: K.INK2 });
        K.label(ctx, L('视觉高度比 ', 'visual ratio ') + visual + '%',
          A + iw, B - 26, { align: 'right', size: 11, mono: true, color: lie > 3 ? K.SPOT : K.INK2 });
        statEl.set(L('谎言因子 ≈ ', 'lie factor ≈ ') + '<b>' + lie.toFixed(1) + '</b>　·　' +
          (lie > 3 ? L('视觉夸大了变化', 'the visuals exaggerate the change') : L('视觉与数据一致', 'visuals match the data')));
      }
      function tog(label, get, set) {
        var b = K.btn(row, label, function () {
          set(!get());
          b.setAttribute('aria-pressed', String(get()));
          draw();
        });
        b.setAttribute('aria-pressed', String(get()));
        return b;
      }
      tog(L('截断纵轴', 'truncated axis'), function () { return truncate; }, function (v) { truncate = v; });
      tog(L('改用面积', 'use area'), function () { return useArea; }, function (v) { useArea = v; });
      tog(L('改用折线', 'use a line'), function () { return useLine; }, function (v) { useLine = v; });
      read.textContent = L('六个数字没有变过。纵轴从 100 开始、把数值编码成面积、或者在 0–100 的区间里画折线，都会让同一个 1% 的变化看起来像 10%。',
        'The six numbers never change. Starting the axis at 100, encoding the value as area, or drawing a line over a 0–100 range all make the same 1% change look like 10%.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
