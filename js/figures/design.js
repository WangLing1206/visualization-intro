/* ==========================================================================
   design.js — 第 5 章配图：标记与通道、通道有效性排序、数据墨水比
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  var CITIES = null;
  function cities() {
    if (!CITIES) CITIES = K.data.cities.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 14);
    return CITIES;
  }

  /* -------------------------------------------------------- 5.1 标记与通道 */
  VIZ.figures['fig-encoding'] = {
    zh: '标记与视觉通道', en: 'Marks and channels',
    hint: { zh: '选一种标记，再选一个通道', en: 'choose a mark, then a channel' },
    mount: function (host) {
      var MARKS = [
        { id: 'point', zh: '点', en: 'Point' },
        { id: 'line', zh: '线', en: 'Line' },
        { id: 'bar', zh: '条', en: 'Bar' },
        { id: 'area', zh: '面', en: 'Area' }
      ];
      var CHAN = [
        { id: 'pos', zh: '位置', en: 'Position' },
        { id: 'len', zh: '长度', en: 'Length' },
        { id: 'ang', zh: '角度', en: 'Angle' },
        { id: 'area', zh: '面积', en: 'Area' },
        { id: 'grey', zh: '灰度', en: 'Grey' }
      ];
      /* 组合评价：2 好用 / 1 勉强 / 0 不成立，附一句理由 */
      var R = {
        'point|pos': [2, { zh: '散点图：位置是人眼最准的通道。', en: 'Scatterplot: position is the channel the eye reads most accurately.' }],
        'point|len': [0, { zh: '点本身没有长度，长度必须依附在条或线上。', en: 'A point has no length; length must attach to a bar or a line.' }],
        'point|ang': [0, { zh: '角度需要两条射线的夹角，单点无法表达。', en: 'An angle needs two rays; a single point cannot carry it.' }],
        'point|area': [2, { zh: '气泡图：面积可以编码第三个变量，读者估计倍数时偏小。', en: 'Bubble chart: area carries a third variable, though readers underestimate ratios.' }],
        'point|grey': [1, { zh: '灰度编码需要图例，且在投影仪上容易失真。', en: 'Grey needs a legend and degrades badly on a projector.' }],

        'line|pos': [2, { zh: '折线图：线的连续性把顺序本身也编码进去了。', en: 'Line chart: the connection itself encodes order.' }],
        'line|len': [0, { zh: '一条线只有总长，无法逐点表达不同数值。', en: 'A line has one total length; it cannot vary point by point.' }],
        'line|ang': [1, { zh: '斜率可以编码变化率，但读者对斜率的判断很粗。', en: 'Slope can encode rate of change, but readers are coarse at judging it.' }],
        'line|area': [0, { zh: '线围成的面积取决于基线选择，含义不稳定。', en: 'The area under a line depends on where you put the baseline.' }],
        'line|grey': [1, { zh: '用灰度分段表示强度可行，但连续性被切断。', en: 'Grey segments can show intensity, but they break continuity.' }],

        'bar|pos': [1, { zh: '条的起点位置可以编码一个变量，但要与长度分开读。', en: 'The bar position can carry a variable, as long as it is read apart from length.' }],
        'bar|len': [2, { zh: '条形图：长度与位置共同作用，最常见的做法。', en: 'Bar chart: length with a common baseline — the most common encoding of all.' }],
        'bar|ang': [0, { zh: '条的端点不构成角度。', en: 'The ends of a bar do not form an angle.' }],
        'bar|area': [1, { zh: '一维的条上再加面积，等于把同一个变量画两遍。', en: 'Area on a 1-D bar draws the same variable twice.' }],
        'bar|grey': [1, { zh: '灰度可以编码第二个分类变量，属于冗余编码。', en: 'Grey can carry a second, categorical variable — redundant encoding.' }],

        'area|pos': [2, { zh: '面片的位置表达地理或类别位置。', en: 'The position of a patch encodes geography or category.' }],
        'area|len': [1, { zh: '宽度或高度可以表达数值，但面积会随之变化。', en: 'Width or height carries a value, and the area follows along.' }],
        'area|ang': [1, { zh: '饼图与玫瑰图：角度判断不如长度准确。', en: 'Pie and rose charts: angles are judged less accurately than lengths.' }],
        'area|area': [2, { zh: '矩形树图与分级统计图：面积就是数值本身。', en: 'Treemap and choropleth: the area is the number.' }],
        'area|grey': [2, { zh: '分级设色：灰度承担密度或分类。', en: 'Choropleth: grey carries density or class.' }]
      };
      var mark = 'point', chan = 'pos';
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 400)); }, draw: function () { draw(); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var mkG, chG;

      function verdict() { return R[mark + '|' + chan] || [0, { zh: '', en: '' }]; }

      function draw() {
        var ctx = st.ctx, w = st.w, h = st.h;
        K.clear(ctx, w, h);
        var c = cities(), v = verdict();
        var A = 58, B = 34, iw = w - A - 26, ih = h - B - 92;
        var ok = v[0] > 0;
        var X = K.linear(0, c.length, 0, iw), Y = K.linear(0, 40, ih, 0);
        K.axes(ctx, {
          x0: A, y0: B, w: iw, h: ih, x: X, y: Y,
          xTicks: null, yTicks: [0, 10, 20, 30, 40],
          yFormat: function (x) { return x; }, yGrid: ok, axisLine: ok,
          yLabel: L('人口 / 百万', 'population / M')
        });
        K.label(ctx, L('十四座城市，按人口排序', 'fourteen cities, sorted by population'), A, B - 14, { size: 10.5, color: K.INK4 });
        if (!ok) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = K.SPOT; ctx.lineWidth = 1;
          ctx.strokeRect(A + 0.5, B + 0.5, iw - 1, ih - 1);
          ctx.restore();
          K.label(ctx, L('这一组合不成立', 'this combination does not hold'), A + iw / 2, B + ih / 2 - 6, { align: 'center', size: 14, color: K.SPOT });
          K.label(ctx, L('换一个通道试试', 'try another channel'), A + iw / 2, B + ih / 2 + 16, { align: 'center', size: 11, color: K.INK3 });
        } else {
          c.forEach(function (ct, i) {
            var x = A + X(i + 0.5), yv = ct.pop;
            var y = B + Y(yv);
            if (mark === 'point') {
              if (chan === 'pos') { K.dot(ctx, A + X((i + 0.5) / 1), y, 3.4, K.INK, 0.9); }
              else if (chan === 'area') { K.dot(ctx, x, B + Y(30), Math.sqrt(ct.pop) * 2.6, K.INK, 0.5); }
              else if (chan === 'grey') { K.dot(ctx, x, B + Y(20), 5, K.withAlpha(K.INK, 0.15 + ct.pop / 40 * 0.85), 1); }
            } else if (mark === 'bar') {
              var bw = Math.max(6, X.bandwidth ? X.bandwidth : iw / c.length * 0.6);
              var bx = x - bw / 2;
              if (chan === 'len') {
                ctx.save(); ctx.fillStyle = K.INK; ctx.fillRect(bx, y, bw * 0.92, B + ih - y); ctx.restore();
              } else if (chan === 'grey') {
                ctx.save(); ctx.fillStyle = K.withAlpha(K.INK, 0.15 + ct.pop / 40 * 0.8);
                ctx.fillRect(bx, y, bw * 0.92, B + ih - y); ctx.restore();
              } else if (chan === 'pos') {
                K.dot(ctx, x, y, 3.2, K.INK, 0.9);
                K.vline(ctx, x, y, B + ih, K.RULE);
              } else if (chan === 'area') {
                var s = Math.sqrt(ct.pop) * 5;
                ctx.save(); ctx.fillStyle = K.withAlpha(K.INK, 0.5);
                ctx.fillRect(x - s / 2, B + ih - s, s, s); ctx.restore();
              }
            } else if (mark === 'line') {
              if (chan === 'pos') {
                if (i) K.line(ctx, [[A + X(i - 0.5), B + Y(c[i - 1].pop)], [x, y]], { color: K.INK, width: 1.6 });
                K.dot(ctx, x, y, 2.2, K.INK);
              } else if (chan === 'grey') {
                if (i) K.line(ctx, [[A + X(i - 0.5), B + Y(c[i - 1].pop)], [x, y]],
                  { color: K.withAlpha(K.INK, 0.2 + ct.pop / 40 * 0.8), width: 3 });
              }
            } else {
              if (chan === 'ang') {
                var ang = ct.pop / 40 * Math.PI * 2 * 0.9 + 0.12;
                ctx.save();
                ctx.beginPath(); ctx.moveTo(x, B + ih);
                ctx.arc(x, B + ih, Math.min(46, ih * 0.42), -Math.PI / 2, -Math.PI / 2 + ang);
                ctx.closePath();
                ctx.fillStyle = i % 2 ? K.withAlpha(K.INK, 0.25) : K.INK; ctx.fill(); ctx.restore();
              } else if (chan === 'area') {
                var s2 = Math.sqrt(ct.pop) * 6;
                ctx.save(); ctx.fillStyle = K.withAlpha(K.INK, 0.12 + (i % 3) * 0.0);
                ctx.fillRect(x - s2 / 2, B + ih - s2, s2, s2);
                ctx.strokeStyle = K.INK; ctx.lineWidth = 1;
                ctx.strokeRect(x - s2 / 2, B + ih - s2, s2, s2); ctx.restore();
              } else if (chan === 'grey') {
                ctx.save(); ctx.fillStyle = K.withAlpha(K.INK, 0.1 + ct.pop / 40 * 0.85);
                ctx.fillRect(x - iw / c.length * 0.44, B, iw / c.length * 0.88, ih); ctx.restore();
              } else if (chan === 'pos') {
                K.dot(ctx, x, y, 2.6, K.INK, 0.8);
              }
            }
          });
          if (mark === 'point' || mark === 'line') {
            c.forEach(function (ct, i) {
              if (i % 2) return;
              K.label(ctx, L(ct.zh, ct.en), A + X(i + 0.5), B + ih + 14, { align: 'center', size: 9.5, color: K.INK4, rotate: 0 });
            });
          }
        }
        // 底部：标记 × 通道 的评价格
        var gy = B + ih + 30, cw = iw / CHAN.length, rh = 20;
        K.label(ctx, L('标记与通道的配合', 'mark × channel'), A, gy - 6, { size: 10, color: K.INK4 });
        CHAN.forEach(function (ch, i) {
          K.label(ctx, L(ch.zh, ch.en), A + i * cw + cw / 2, gy + 6, { align: 'center', size: 10, color: K.INK3 });
        });
        MARKS.forEach(function (mk, r2) {
          K.label(ctx, L(mk.zh, mk.en), A - 12, gy + 22 + r2 * rh + 3, { align: 'right', size: 10.5, color: mk.id === mark ? K.INK : K.INK3 });
          CHAN.forEach(function (ch, i) {
            var vv = R[mk.id + '|' + ch.id];
            var cx = A + i * cw + cw / 2, cy = gy + 22 + r2 * rh;
            var on = mk.id === mark && ch.id === chan;
            var g = vv ? vv[0] : 0;
            ctx.save();
            if (on) { ctx.fillStyle = K.SPOT; ctx.fillRect(cx - cw * 0.4, cy - 7, cw * 0.8, 13); }
            ctx.restore();
            K.label(ctx, g === 2 ? '●' : (g === 1 ? '◐' : '○'), cx, cy + 3, {
              align: 'center', size: 11, color: on ? '#fff' : (g === 2 ? K.INK : K.INK4)
            });
          });
        });
        K.label(ctx, '● ' + L('好用', 'works well') + '　◐ ' + L('勉强', 'workable') + '　○ ' + L('不成立', 'does not hold'),
          A + iw, gy + 22 + MARKS.length * rh + 8, { align: 'right', size: 10, color: K.INK4 });
        read.innerHTML = '<b>' + K.esc(L(MARKS.filter(function (m) { return m.id === mark; })[0].zh, MARKS.filter(function (m) { return m.id === mark; })[0].en)) +
          ' × ' + K.esc(L(CHAN.filter(function (m) { return m.id === chan; })[0].zh, CHAN.filter(function (m) { return m.id === chan; })[0].en)) + '</b>　' +
          K.esc(L(v[1].zh, v[1].en));
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var A = 58, B = 34, iw = st.w - A - 26, ih = st.h - B - 92;
        var gy = B + ih + 30, cw = iw / CHAN.length, rh = 20;
        var inGrid = my > gy + 14 && my < gy + 22 + MARKS.length * rh + 4 && mx > A - 30;
        var i = Math.floor((mx - A) / cw), r3 = Math.floor((my - (gy + 22)) / rh);
        st.cv.style.cursor = (inGrid && i >= 0 && i < CHAN.length && r3 >= 0 && r3 < MARKS.length) ? 'pointer' : 'default';
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        var A = 58, B = 34, iw = st.w - A - 26, ih = st.h - B - 92;
        var gy = B + ih + 30, cw = iw / CHAN.length, rh = 20;
        var i = Math.floor((mx - A) / cw), r3 = Math.floor((my - (gy + 22)) / rh);
        if (i < 0 || i >= CHAN.length || r3 < 0 || r3 >= MARKS.length) return;
        if (my < gy + 14 || my > gy + 22 + MARKS.length * rh + 6) return;
        mark = MARKS[r3].id; chan = CHAN[i].id;
        if (mkG) mkG.select(mark);
        if (chG) chG.select(chan);
        draw();
      });
      mkG = K.group(row, MARKS.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { mark = v; draw(); });
      chG = K.group(row, CHAN.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { chan = v; draw(); });
      if (st.onDraw) st.onDraw();
      return { destroy: function () { } };
    }
  };

  /* ---------------------------------------------------------- 5.2 通道有效性 */
  VIZ.figures['fig-accuracy'] = {
    zh: '通道的准确性排序', en: 'Ranking channels by accuracy',
    hint: { zh: '点一行看它对应的实验', en: 'click a row for the experiment behind it' },
    mount: function (host) {
      var CH = [
        { zh: '共同基线上的位置', en: 'Position, common scale', e: 1.0, d: { zh: '读者对同一根轴上两点的高低判断最准，误差最小。', en: 'Judging two points against one shared axis is the most accurate task measured.' } },
        { zh: '非对齐位置', en: 'Position, non-aligned', e: 1.25, d: { zh: '两点不在同一根轴上时，需要心算平移，误差上升。', en: 'When the points sit on different axes the reader must translate mentally, and error rises.' } },
        { zh: '长度', en: 'Length', e: 1.35, d: { zh: '条形图的通道。基线一致时接近位置，基线不同则明显变差。', en: 'The bar chart channel. Close to position with a common baseline, much worse without one.' } },
        { zh: '方向与角度', en: 'Direction and angle', e: 1.55, d: { zh: '饼图的通道。小角度之间难以区分，且需要读者先估计圆心。', en: 'The pie chart channel. Small angles are hard to separate, and the centre must be estimated.' } },
        { zh: '面积', en: 'Area', e: 1.75, d: { zh: '读者倾向于低估倍数：面积大一倍，观感只大一点点。', en: 'Readers underestimate ratios: double the area looks only slightly bigger.' } },
        { zh: '体积与曲率', en: 'Volume and curvature', e: 2.0, d: { zh: '三维图形还要面对透视与遮挡，误差继续放大。', en: 'Three-dimensional marks add perspective and occlusion on top.' } },
        { zh: '灰度', en: 'Grey value', e: 2.3, d: { zh: '受背景与显示设备影响，可分辨的级数通常不到七级。', en: 'Dependent on background and display; usually fewer than seven levels are separable.' } },
        { zh: '颜色色相', en: 'Colour hue', e: 2.6, d: { zh: '适合表示分类，不适合表示大小：色相之间没有天然顺序。', en: 'Good for categories, poor for magnitude: hues have no natural order.' } }
      ];
      var sel = 0, appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 320, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var padL = 156, padT = 34, padR = 96;
        var ih = h - padT - 40;
        var rowH = ih / CH.length;
        var maxE = 2.8;
        var bw = w - padL - padR;
        K.label(ctx, L('从最准到最不准（示意误差指数，基准 = 1.0）', 'most to least accurate (indicative error index, baseline = 1.0)'),
          padL, padT - 16, { size: 10.5, color: K.INK4 });
        CH.forEach(function (c, i) {
          var y = padT + i * rowH;
          var on = i === sel;
          var bwid = (c.e / maxE) * bw * a;
          if (on) {
            ctx.save(); ctx.globalAlpha = 0.055; ctx.fillStyle = K.INK;
            ctx.fillRect(0, y, w, rowH); ctx.restore();
          }
          ctx.save();
          ctx.fillStyle = on ? K.SPOT : K.INK;
          ctx.globalAlpha = on ? 1 : 0.85;
          ctx.fillRect(padL, y + rowH * 0.34, bwid, rowH * 0.32);
          ctx.restore();
          K.label(ctx, (i + 1) + '', padL - 40, y + rowH * 0.62, { size: 10.5, mono: true, color: on ? K.SPOT : K.INK4 });
          K.label(ctx, L(c.zh, c.en), padL - 32, y + rowH * 0.62, { size: 11.5, color: on ? K.INK : K.INK2, weight: on ? 500 : 400 });
          K.label(ctx, c.e.toFixed(2), padL + bwid + 8, y + rowH * 0.62, { size: 10.5, mono: true, color: on ? K.SPOT : K.INK4 });
          if (i) K.hline(ctx, 0, w, y, K.RULE);
        });
        K.hline(ctx, 0, w, padT + ih, K.INK);
        var cur = CH[sel];
        K.label(ctx, L('第 ' + (sel + 1) + ' 位', 'rank ' + (sel + 1)), w - 12, padT + sel * rowH + rowH * 0.62,
          { align: 'right', size: 10.5, mono: true, color: K.SPOT });
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var my = e.clientY - r2.top;
        var padT = 34, ih = st.h - padT - 40;
        var i = Math.floor((my - padT) / (ih / CH.length));
        st.cv.style.cursor = (i >= 0 && i < CH.length) ? 'pointer' : 'default';
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var my = e.clientY - r2.top;
        var padT = 34, ih = st.h - padT - 40;
        var i = Math.floor((my - padT) / (ih / CH.length));
        if (i >= 0 && i < CH.length) { sel = i; sync(); }
      });
      function sync() {
        var c = CH[sel];
        read.innerHTML = '<b>' + K.esc(L(c.zh, c.en)) + '</b>　' + K.esc(L(c.d.zh, c.d.en));
      }
      var ticker = K.ticker(st, draw);
      sync();
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ---------------------------------------------------------- 5.3 数据墨水比 */
  VIZ.figures['fig-dataink'] = {
    zh: '数据墨水比', en: 'The data-ink ratio',
    hint: { zh: '拖动滑块，逐步去掉装饰', en: 'drag to strip the decoration away' },
    mount: function (host) {
      var STYLES = [
        { zh: '完整装饰', en: 'Full decoration', junk: 1.0 },
        { zh: '去掉投影', en: 'No shadow', junk: 0.8 },
        { zh: '去掉立体', en: 'No 3-D', junk: 0.62 },
        { zh: '减淡网格', en: 'Faint grid', junk: 0.42 },
        { zh: '去掉网格', en: 'No grid', junk: 0.26 },
        { zh: '去掉边框', en: 'No frame', junk: 0.12 },
        { zh: '只留数据', en: 'Data only', junk: 0 }
      ];
      var level = 0.35;                 // 0 = 只留数据，1 = 完整装饰
      var frac = 0.55;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 380)); }, draw: function () { draw(); } });
      var off = document.createElement('canvas');
      var row = K.row(host);
      var statEl = K.stat(row, '');
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      var data = [26, 31, 22, 38, 29, 34, 19, 27];
      var LAB = { zh: ['一', '二', '三', '四', '五', '六', '七', '八'], en: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] };

      function paintChart(ctx, w, h, withJunk, countInk) {
        var A = 52, B = 30, iw = w - A - 34, ih = h - B - 44;
        var maxV = 40;
        var band = K.band(data.length, 0, iw, 0.3, 0.24);
        var Y = K.linear(0, maxV, ih, 0);
        var ink = 0, total = 0;
        if (withJunk > 0) {
          // 背景色块
          ctx.save();
          ctx.globalAlpha = 0.035 * withJunk;
          ctx.fillStyle = K.INK;
          ctx.fillRect(A - 10, B - 10, iw + 20, ih + 20);
          ctx.restore();
        }
        if (withJunk > 0.35) {   // 网格
          for (var t = 0; t <= maxV; t += 10) {
            K.hline(ctx, A, A + iw, B + Y(t), withJunk > 0.5 ? K.RULE : K.withAlpha(K.RULE, 0.6));
            K.label(ctx, t, A - 8, B + Y(t) + 3.5, { align: 'right', size: 10, mono: true, color: K.INK4 });
          }
        } else {
          K.label(ctx, '0', A - 8, B + Y(0) + 3.5, { align: 'right', size: 10, mono: true, color: K.INK4 });
          K.label(ctx, '40', A - 8, B + Y(40) + 3.5, { align: 'right', size: 10, mono: true, color: K.INK4 });
        }
        data.forEach(function (v, i) {
          var x = A + band(i), bw = band.bandwidth;
          var bh = ih - Y(v);
          var depth = withJunk > 0.5 ? 9 : 0;
          var top = B + Y(v);
          if (withJunk > 0.8) {      // 投影
            ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = K.INK;
            ctx.fillRect(x + 4, top + 5, bw, bh); ctx.restore();
          }
          if (depth) {               // 立体侧面
            ctx.save();
            ctx.fillStyle = K.withAlpha(K.INK, 0.32);
            ctx.beginPath();
            ctx.moveTo(x + bw, top);
            ctx.lineTo(x + bw + depth, top - depth * 0.6);
            ctx.lineTo(x + bw + depth, B + ih - depth * 0.6);
            ctx.lineTo(x + bw, B + ih);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = K.withAlpha(K.INK, 0.5);
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x + depth, top - depth * 0.6);
            ctx.lineTo(x + bw + depth, top - depth * 0.6);
            ctx.lineTo(x + bw, top);
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
          if (withJunk > 0.55) {     // 渐变填充
            var g = ctx.createLinearGradient(0, top, 0, B + ih);
            g.addColorStop(0, K.INK); g.addColorStop(1, K.withAlpha(K.INK, 0.25));
            ctx.save(); ctx.fillStyle = g;
            ctx.fillRect(x, top, bw, bh); ctx.restore();
          } else {
            ctx.save(); ctx.fillStyle = K.INK;
            ctx.fillRect(x, top, bw, bh); ctx.restore();
          }
          if (withJunk < 0.3) {
            K.label(ctx, L(LAB.zh[i], LAB.en[i]), x + bw / 2, B + ih + 15, { align: 'center', size: 10, mono: true, color: K.INK4 });
          }
        });
        if (withJunk > 0.1) {
          ctx.save();
          ctx.globalAlpha = 0.4 + 0.6 * withJunk;
          ctx.strokeStyle = K.INK; ctx.lineWidth = withJunk > 0.6 ? 2 : 1;
          ctx.strokeRect(A - 0.5, B - 0.5, iw + 1, ih + 1);
          ctx.restore();
        } else {
          K.hline(ctx, A, A + iw, B + ih, K.INK);
        }
        K.label(ctx, L('八个类别的销量', 'sales of eight categories'), A, B - 12, { size: 10.5, color: K.INK3 });
        if (countInk) {
          var d = ctx.getImageData(0, 0, Math.round(w * st.dpr), Math.round(h * st.dpr)).data;
          for (var k = 0; k < d.length; k += 4) {
            if (d[k] < 250 || d[k + 1] < 250 || d[k + 2] < 250) {
              // 只看柱体范围（x 在 A..A+iw，y 在 B..B+ih）
              var px = (k / 4) % Math.round(w * st.dpr), py = Math.floor((k / 4) / Math.round(w * st.dpr));
              if (px > A * st.dpr && px < (A + iw) * st.dpr && py > B * st.dpr && py < (B + ih) * st.dpr) ink++;
            }
          }
        }
        return ink;
      }

      function draw() {
        var ctx = st.ctx, w = st.w, h = st.h;
        K.clear(ctx, w, h);
        var withJunk = frac;
        // 主图（按当前装饰程度）
        paintChart(ctx, w, h, withJunk, false);
        // 数据墨水比：分别统计“只画数据”与“完整绘制”的墨水像素
        var m = Math.min(2, window.devicePixelRatio || 1);
        off.width = Math.round(w * m); off.height = Math.round(h * m);
        var octx = off.getContext('2d');
        octx.setTransform(m, 0, 0, m, 0, 0);
        octx.clearRect(0, 0, w, h);
        var inkData = paintChart(octx, w, h, 0, true);
        octx.clearRect(0, 0, w, h);
        var inkAll = paintChart(octx, w, h, 1, true);
        var ratio = inkAll ? inkData / inkAll : 1;
        var name = STYLES.reduce(function (best, s2) {
          return Math.abs(s2.junk - withJunk) < Math.abs(best.junk - withJunk) ? s2 : best;
        }, STYLES[0]);
        statEl.set(L('数据墨水比 ', 'data-ink ratio ') + '<b>' + ratio.toFixed(2) + '</b>　·　' + K.esc(L(name.zh, name.en)));
        read.textContent = L('分子是柱体本身占用的像素，分母是整张图的墨水总量，两者都由浏览器现算。把装饰全部去掉，这个比值接近 1。',
          'The numerator is the pixels the bars themselves occupy; the denominator is all ink in the figure. Both are counted live. Strip every ornament and the ratio approaches 1.');
      }
      K.range(row, L('装饰程度', 'ornament'), 0, 1, frac, 0.02, function (v) { frac = v; draw(); });
      if (st.onDraw) st.onDraw();
      return { destroy: function () { } };
    }
  };
})();
