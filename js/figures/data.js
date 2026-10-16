/* ==========================================================================
   data.js — 第 3 章配图：测量尺度、数据清洗、分布概括
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* ---------------------------------------------------------- 3.1 测量尺度 */
  VIZ.figures['fig-datatypes'] = {
    zh: '字段的测量尺度', en: 'Scales of measurement',
    hint: { zh: '点表头选字段，再判断尺度', en: 'pick a column, then judge its scale' },
    mount: function (host) {
      var COLS = [
        { key: '城市', en: 'City', vals: ['北京', '上海', '成都', '西安'], scale: 0, mono: false,
          why: { zh: '城市名之间只有“相同或不同”，既没有顺序，也没有距离。', en: 'City names can only be equal or different — no order, no distance.' } },
        { key: '等级', en: 'Tier', vals: ['一线', '新一线', '二线', '三线'], scale: 1, mono: false,
          why: { zh: '等级可以排序，但“一线”与“新一线”的差距无法与“二线”与“三线”的差距相比。', en: 'Tiers can be ordered, but the step between tiers has no measurable size.' } },
        { key: '气温 ℃', en: 'Temp. °C', vals: ['12.9', '16.6', '16.2', '13.7'], scale: 2, mono: true,
          why: { zh: '摄氏度可以相减，但 0 ℃ 不等于“没有温度”，所以倍数比较没有意义。', en: 'Celsius can be subtracted, but 0 °C is not the absence of heat, so ratios are meaningless.' } },
        { key: '人口 / 百万', en: 'Population / M', vals: ['21.7', '28.5', '9.5', '8.0'], scale: 3, mono: true,
          why: { zh: '人口有真正的零点，28.5 与 9.5 之间可以说“约三倍”。', en: 'Population has a true zero: 28.5 is meaningfully about three times 9.5.' } }
      ];
      var SCALES = [
        { zh: '定类', en: 'Nominal', ops: ['=', '≠'] },
        { zh: '定序', en: 'Ordinal', ops: ['=', '≠', '<', '>'] },
        { zh: '定距', en: 'Interval', ops: ['=', '≠', '<', '>', '+', '−'] },
        { zh: '定比', en: 'Ratio', ops: ['=', '≠', '<', '>', '+', '−', '×', '÷'] }
      ];
      var sel = 0, pick = -1, score = 0, tries = 0;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.30, 276, 300)); }, draw: function () { draw(); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      function geom() {
        var w = st.w, h = st.h;
        var tx = 14, ty = 46, tw = w - 28, rh = 27;
        return { tx: tx, ty: ty, tw: tw, rh: rh, cw: tw / COLS.length, band: rh * 4.4, sy: ty + rh * 4.4 + 40 };
      }
      function draw() {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        K.clear(ctx, w, h);
        K.label(ctx, L('同一张表的四个字段，尺度并不相同', 'four fields of one table, four different scales'), g.tx, 20, { size: 11, color: K.INK3 });
        for (var c = 0; c < COLS.length; c++) {
          var cx = g.tx + c * g.cw, on = c === sel;
          if (on) {
            ctx.save(); ctx.fillStyle = K.INK;
            ctx.fillRect(cx + 1, g.ty - 24, g.cw - 3, 24); ctx.restore();
          }
          K.label(ctx, L(COLS[c].key, COLS[c].en), cx + g.cw / 2, g.ty - 8, { align: 'center', size: 11, color: on ? '#fff' : K.INK2 });
          K.hline(ctx, cx + 1, cx + g.cw - 1, g.ty - 24, on ? K.INK : K.RULE);
          K.hline(ctx, cx + 1, cx + g.cw - 1, g.ty, K.INK);
          for (var r = 0; r < 4; r++) {
            K.label(ctx, COLS[c].vals[r], cx + g.cw / 2, g.ty + (r + 0.7) * g.rh, { align: 'center', size: 11.5, mono: COLS[c].mono, color: K.INK });
            K.hline(ctx, cx + 1, cx + g.cw - 1, g.ty + (r + 1) * g.rh, K.RULE);
          }
          K.vline(ctx, cx, g.ty - 24, g.ty + 4 * g.rh, K.RULE);
        }
        K.label(ctx, L('这个字段属于哪一种尺度？', 'which scale of measurement is this?'), g.tx, g.sy - 10, { size: 10.5, color: K.INK3 });
        var sw = g.tw / SCALES.length;
        for (var s = 0; s < SCALES.length; s++) {
          var sx = g.tx + s * sw, ww = sw - 9;
          var correct = pick >= 0 && s === COLS[sel].scale;
          var chosen = pick === s;
          ctx.save();
          ctx.fillStyle = correct ? K.INK : (chosen ? K.withAlpha(K.SPOT, 0.1) : '#fff');
          ctx.fillRect(sx, g.sy, ww, 26);
          ctx.strokeStyle = correct ? K.INK : (chosen ? K.SPOT : K.RULE);
          ctx.lineWidth = chosen && !correct ? 1.4 : 1;
          ctx.strokeRect(sx + 0.5, g.sy + 0.5, ww - 1, 25);
          ctx.restore();
          K.label(ctx, L(SCALES[s].zh, SCALES[s].en), sx + ww / 2, g.sy + 17, {
            align: 'center', size: 11, color: correct ? '#fff' : (chosen ? K.SPOT : K.INK2)
          });
        }
        var oy = g.sy + 52;
        if (pick >= 0) {
          K.label(ctx, L('允许的运算', 'allowed'), g.tx, oy - 11, { size: 10.5, color: K.INK3 });
          SCALES[COLS[sel].scale].ops.forEach(function (op, i) {
            var ox = g.tx + 62 + i * 28;
            ctx.save(); ctx.fillStyle = K.INK; ctx.fillRect(ox, oy - 22, 22, 17); ctx.restore();
            K.label(ctx, op, ox + 11, oy - 9, { align: 'center', size: 11, mono: true, color: '#fff' });
          });
          K.label(ctx, COLS[sel].scale < 3
            ? L('再往上的运算这一尺度不支持', 'beyond this the scale gives nothing')
            : L('最高尺度：几乎所有运算都有意义', 'the highest scale: almost every operation is meaningful'),
            g.tx + 62 + 8 * 28 + 4, oy - 9, { size: 10.5, color: K.INK4 });
        } else {
          K.label(ctx, L('先点表头，再选一种尺度', 'click a column head, then a scale'), g.tx, oy - 9, { size: 10.5, color: K.INK4 });
        }
      }
      function sync() {
        if (pick < 0) {
          read.textContent = L('点上方表格的任一表头，然后判断它的测量尺度。', 'Click any column head above, then judge which scale it is measured on.');
          statEl.set(''); return;
        }
        var c = COLS[sel], ok = pick === c.scale;
        read.innerHTML = '<b>' + K.esc(L(c.key, c.en)) + '</b>　' + K.esc(L(c.why.zh, c.why.en)) +
          '　' + (ok ? L('判断正确。', 'Correct.') : L('正确答案是 ', 'The answer is ') + K.esc(L(SCALES[c.scale].zh, SCALES[c.scale].en)) + '。');
        statEl.set(L('答对 ', 'score ') + '<b>' + score + '</b> / ' + tries);
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top, g = geom();
        var col = Math.floor((mx - g.tx) / g.cw);
        var overHead = my > g.ty - 26 && my < g.ty;
        var overScale = my > g.sy && my < g.sy + 26;
        st.cv.style.cursor = (col >= 0 && col < COLS.length && (overHead || overScale)) ? 'pointer' : 'default';
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top, g = geom();
        var col = Math.floor((mx - g.tx) / g.cw);
        if (col < 0 || col >= COLS.length) return;
        if (my > g.ty - 26 && my < g.ty) { if (col !== sel) { sel = col; pick = -1; } draw(); sync(); return; }
        if (my > g.sy && my < g.sy + 26) {
          var s = Math.floor((mx - g.tx) / (g.tw / SCALES.length));
          if (s >= 0 && s < SCALES.length) {
            pick = s; tries++;
            if (s === COLS[sel].scale) score++;
            draw(); sync();
          }
        }
      });
      draw(); sync();
      return { destroy: function () { } };
    }
  };

  /* ------------------------------------------------------------ 3.2 数据清洗 */
  VIZ.figures['fig-dataclean'] = {
    zh: '清洗前后的数据', en: 'Before and after cleaning',
    hint: { zh: '选一种处理，看点被搬到哪去', en: 'pick a treatment and watch the points move' },
    mount: function (host) {
      var OPS = [
        { id: 'miss', zh: '缺失值', en: 'Missing', note: { zh: '缺失的记录用当月均值填补：点的数量补齐了，均值被轻微拉向中间。', en: 'Missing records are filled with the monthly mean: the count is repaired, and the mean is pulled slightly inward.' } },
        { id: 'out', zh: '异常值', en: 'Outliers', note: { zh: '低于 0.05 或高于 0.95 的点被标出并剔除：均值下降，标准差明显收缩。', en: 'Points below 0.05 or above 0.95 are flagged and dropped: the mean falls and the deviation contracts.' } },
        { id: 'unit', zh: '单位不一致', en: 'Unit mismatch', note: { zh: '四条以“千”为单位的记录被换算回原单位，它们从高空落回数据带。', en: 'Four records entered in thousands are converted back, dropping from orbit into the band.' } },
        { id: 'dup', zh: '重复记录', en: 'Duplicates', note: { zh: '九条完全重复的记录被去掉。它们原本就重叠在一起，图上看不出变化，但计数变了。', en: 'Nine duplicate records are removed. They overlapped already, so the picture barely changes — but the count does.' } }
      ];
      var op = 'miss', t = 1;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.46, 280, 360)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      var r = K.rng(4242), pts = [];
      for (var i = 0; i < 64; i++) {
        var x = i / 63;
        var base = 0.42 + 0.2 * Math.sin(x * 7.2);
        var p = { x: x, kind: 'ok', y: base + K.gauss(r) * 0.05, dup: false };
        if (i % 9 === 4) { p.kind = 'miss'; p.y = null; }
        if ([12, 23, 38, 47, 55, 61].indexOf(i) >= 0) { p.kind = 'out'; p.y = 0.42 + 0.2 * Math.sin(x * 7.2) + 0.32 + r() * 0.1; }
        if ([17, 29, 44, 52].indexOf(i) >= 0) p.kind = 'unit';
        if ([8, 19, 31, 40, 50, 58, 62, 5, 35].indexOf(i) >= 0) p.dup = true;
        pts.push(p);
      }
      function val(p, cur) {
        var base = 0.42 + 0.2 * Math.sin(p.x * 7.2);
        if (p.kind === 'miss') return cur === 'miss' ? base : null;
        if (p.kind === 'out') return cur === 'out' ? null : p.y;
        if (p.kind === 'unit') return cur === 'unit' ? p.y : p.y + 0.30;
        return p.y;
      }
      function stats(cur) {
        var v = [];
        pts.forEach(function (p) {
          var y = val(p, cur);
          if (y == null) return;
          if (p.dup && cur === 'dup') return;
          v.push(y);
        });
        var mu = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
        var sd = Math.sqrt(v.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / v.length);
        return { n: v.length, mu: mu, sd: sd };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        if (dt && t < 1) t = Math.min(1, t + dt / 0.75);
        var e = K.ease.inOut(t);
        K.clear(ctx, w, h);
        var A = 54, B = 30, iw = w - A - 30, ih = h - B - 48;
        var xs = K.linear(0, 1, 0, iw), ys = K.linear(0.05, 1.05, ih, 0);
        K.axes(ctx, {
          x0: A, y0: B, w: iw, h: ih, x: xs, y: ys,
          xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0.2, 0.4, 0.6, 0.8, 1],
          xFormat: function (v) { return v.toFixed(2); }, yFormat: function (v) { return v.toFixed(1); },
          xLabel: L('时间', 'time'), yLabel: L('指标值 / 千', 'value (thousands)')
        });
        var s = stats(op), sb = stats('none');
        var noop = op === 'dup' || op === 'miss';
        K.hline(ctx, A, A + iw, B + ys(s.mu), K.SPOT, [4, 3]);
        K.label(ctx, L('处理后均值 ', 'mean after ') + s.mu.toFixed(3), A + iw, B + ys(s.mu) - 6, { align: 'right', size: 10, mono: true, color: K.SPOT });
        for (var k = 0; k < pts.length; k++) {
          var p = pts[k];
          var yNow = val(p, op), yOld = val(p, 'none');
          if (p.dup && op === 'dup') continue;
          if (yNow == null && yOld != null) {
            K.dot(ctx, A + xs(p.x), B + ys(yOld), 2.4, K.SPOT, 0.4 * (1 - e));
            K.ring(ctx, A + xs(p.x), B + ys(yOld), 4 + 8 * e, K.SPOT, 1, 0.55 * (1 - e));
            continue;
          }
          if (yNow == null) continue;
          var vy = yOld == null ? yNow : K.lerp(yOld, yNow, e);
          var alpha = yOld == null ? K.clamp(e * 1.2, 0, 1) * 0.95 : 0.85;
          var col = (p.kind === 'miss' || (p.kind === 'unit' && op !== 'unit')) ? K.SPOT : K.INK;
          K.dot(ctx, A + xs(p.x), B + ys(vy), p.kind === 'miss' ? 2.7 : 2.4, col, alpha);
        }
        statEl.set('n <b>' + s.n + '</b> · μ <b>' + s.mu.toFixed(3) + '</b> · σ <b>' + s.sd.toFixed(3) + '</b>　' +
          L('处理前 n ' + sb.n + ' · μ ' + sb.mu.toFixed(3) + ' · σ ' + sb.sd.toFixed(3),
            'before n ' + sb.n + ', μ ' + sb.mu.toFixed(3) + ', σ ' + sb.sd.toFixed(3)));
      }
      var ticker = K.ticker(st, draw);
      K.group(row, OPS.map(function (o) { return { label: L(o.zh, o.en), value: o.id }; }), function (v) {
        op = v; t = 0;
        var o = OPS.filter(function (x) { return x.id === v; })[0];
        read.textContent = L(o.note.zh, o.note.en);
        draw(0.001);
      });
      read.textContent = L(OPS[0].note.zh, OPS[0].note.en);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------------ 3.3 分布概括 */
  VIZ.figures['fig-datashape'] = {
    zh: '同一组数的三种概括', en: 'Three summaries of one distribution',
    hint: { zh: '切换视图，调整分箱数', en: 'switch views, change the bin count' },
    mount: function (host) {
      var VIEWS = [
        { id: 'hist', zh: '直方图', en: 'Histogram' },
        { id: 'box', zh: '箱线图', en: 'Box plot' },
        { id: 'ecdf', zh: '累积分布', en: 'ECDF' }
      ];
      var view = 'hist', bins = 18, mor = 1;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.44, 270, 350)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var statEl = K.stat(row, '');

      var r = K.rng(9091), vals = [];
      for (var i = 0; i < 420; i++) {
        var u = r();
        var v = u < 0.42 ? 24 + K.gauss(r) * 4.4 : (u < 0.86 ? 46 + K.gauss(r) * 6.2 : 78 + Math.abs(K.gauss(r)) * 9);
        vals.push(Math.max(6, v));
      }
      vals.sort(function (a, b) { return a - b; });
      function q(p) { return vals[K.clamp(Math.round(p * (vals.length - 1)), 0, vals.length - 1)]; }
      var mn = vals[0], mx = vals[vals.length - 1];
      var mu = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var med = q(0.5), q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        if (dt && mor < 1) mor = Math.min(1, mor + dt / 0.55);
        var e = K.ease.inOut(mor);
        K.clear(ctx, w, h);
        var A = 54, B = 34, iw = w - A - 48, ih = h - B - 46;
        var xs = K.linear(mn - 4, mx + 4, 0, iw);
        K.axes(ctx, {
          x0: A, y0: B, w: iw, h: ih, x: xs, y: K.linear(0, 1, ih, 0),
          xTicks: K.ticks(mn, mx, 6), yTicks: [], grid: true, yGrid: false, axisLine: false,
          xFormat: function (v) { return Math.round(v); }, xLabel: L('指标值', 'value')
        });
        [mu, med].forEach(function (v2, k) {
          K.vline(ctx, A + xs(v2), B, B + ih, k ? K.INK2 : K.SPOT, k ? [3, 3] : null);
          K.label(ctx, (k ? L('中位数 ', 'median ') : L('均值 ', 'mean ')) + v2.toFixed(1),
            A + xs(v2), B - 10 - k * 13, { align: 'center', size: 10, mono: true, color: k ? K.INK2 : K.SPOT });
        });
        if (view === 'hist') {
          var cw = (mx - mn + 8) / bins, counts = new Array(bins).fill(0);
          vals.forEach(function (v2) {
            var b = Math.floor((v2 - (mn - 4)) / cw);
            if (b >= 0 && b < bins) counts[b]++;
          });
          var cmax = Math.max.apply(null, counts), ys = K.linear(0, cmax * 1.12, ih, 0);
          for (var b2 = 0; b2 < bins; b2++) {
            var bx = A + xs(mn - 4 + b2 * cw);
            var bw = xs(mn - 4 + (b2 + 1) * cw) - xs(mn - 4 + b2 * cw);
            var bh = (ih - ys(counts[b2])) * e;
            ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = K.INK;
            ctx.fillRect(bx, B + ih - bh, Math.max(1, bw - 1.5), bh); ctx.restore();
          }
          K.label(ctx, L('分箱数 ' + bins + '：轮廓随分箱宽度变化', 'bins = ' + bins + ': the outline follows the bin width'),
            A + iw, B + ih + 32, { align: 'right', size: 10.5, color: K.INK3 });
        } else if (view === 'box') {
          var yMid = B + ih * 0.56, bh2 = 46;
          var x1 = A + xs(q1), x3 = A + xs(q3), xm = A + xs(med);
          var lo = A + xs(q(0.02)), hi = A + xs(q(0.98));
          ctx.save(); ctx.globalAlpha = e;
          K.line(ctx, [[lo, yMid], [x1, yMid]], { color: K.INK, width: 1.2 });
          K.line(ctx, [[x3, yMid], [hi, yMid]], { color: K.INK, width: 1.2 });
          K.line(ctx, [[lo, yMid - 9], [lo, yMid + 9]], { color: K.INK, width: 1.2 });
          K.line(ctx, [[hi, yMid - 9], [hi, yMid + 9]], { color: K.INK, width: 1.2 });
          ctx.strokeStyle = K.INK; ctx.lineWidth = 1.2;
          ctx.strokeRect(x1, yMid - bh2 / 2, Math.max(1, x3 - x1), bh2);
          K.line(ctx, [[xm, yMid - bh2 / 2], [xm, yMid + bh2 / 2]], { color: K.SPOT, width: 1.8 });
          ctx.restore();
          K.label(ctx, 'Q1 ' + q1.toFixed(0), x1, yMid + bh2 / 2 + 17, { align: 'center', size: 10, mono: true, color: K.INK3 });
          K.label(ctx, 'Q3 ' + q3.toFixed(0), x3, yMid + bh2 / 2 + 17, { align: 'center', size: 10, mono: true, color: K.INK3 });
          K.label(ctx, 'IQR = ' + iqr.toFixed(1), (x1 + x3) / 2, yMid - bh2 / 2 - 12, { align: 'center', size: 10, mono: true, color: K.INK2 });
          vals.forEach(function (v2, k) {
            if (k % 3) return;
            var out = v2 < q1 - 1.5 * iqr || v2 > q3 + 1.5 * iqr;
            K.dot(ctx, A + xs(v2), yMid + (out ? 34 : 0), out ? 2.2 : 1.1, out ? K.SPOT : K.INK4, 0.55 * e);
          });
          K.label(ctx, L('中位数在箱内，均值被长尾拉向右方', 'the median sits inside the box; the long tail drags the mean right'),
            A, B + ih + 32, { size: 10.5, color: K.INK3 });
        } else {
          var pts = [[A + xs(mn), B + ih]];
          vals.forEach(function (v2, k) { pts.push([A + xs(v2), B + ih - (k + 1) / vals.length * ih]); });
          pts.push([A + xs(mx), B]);
          K.line(ctx, pts, { color: K.INK, width: 1.6, alpha: e });
          [[0.25, 'Q1'], [0.5, ''], [0.75, 'Q3']].forEach(function (qq) {
            var v3 = q(qq[0]);
            K.hline(ctx, A + xs(v3), A + iw, B + ih - qq[0] * ih, K.RULE);
            K.label(ctx, qq[0] === 0.5 ? L('中位数', 'median') : qq[1] + ' ' + v3.toFixed(0),
              A + iw, B + ih - qq[0] * ih - 5, { align: 'right', size: 10, mono: true, color: K.INK3 });
          });
          K.label(ctx, L('纵轴是“小于该值的比例”', 'the vertical axis is the share below the value'),
            A, B + ih + 32, { size: 10.5, color: K.INK3 });
        }
        statEl.set('n <b>' + vals.length + '</b> · μ <b>' + mu.toFixed(1) + '</b> · 中位数 <b>' + med.toFixed(1) + '</b> · IQR <b>' + iqr.toFixed(1) + '</b>');
      }
      var ticker = K.ticker(st, draw);
      K.group(row, VIEWS.map(function (v) { return { label: L(v.zh, v.en), value: v.id }; }), function (v) {
        view = v; mor = 0; draw(0.001);
      });
      K.range(row, L('分箱数', 'bins'), 6, 48, bins, 1, function (v) { bins = v; mor = 1; draw(); });
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
