/* ==========================================================================
   tasks.js — 第 4 章配图：任务三分法、动作与目标矩阵、概览优先的次序
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* -------------------------------------------------------- 4.1 任务三分法 */
  VIZ.figures['fig-tasktaxonomy'] = {
    zh: '为什么、是什么、怎么做', en: 'Why, what and how',
    hint: { zh: '悬停任一层，看它的选项', en: 'hover a ring to see its options' },
    mount: function (host) {
      var RINGS = [
        {
          zh: '怎么做', en: 'How',
          segs: [
            { zh: '视觉编码', en: 'Visual encoding', ex: { zh: '把字段映射到位置、长度、灰度', en: 'map fields to position, length, grey' } },
            { zh: '交互', en: 'Interaction', ex: { zh: '刷选、缩放、联动、细节按需', en: 'brushing, zooming, linking, details on demand' } },
            { zh: '算法', en: 'Algorithms', ex: { zh: '降维、聚类、布局、抽样', en: 'projection, clustering, layout, sampling' } },
            { zh: '动画', en: 'Animation', ex: { zh: '用时间编码变化本身', en: 'time as the channel for change' } }
          ]
        },
        {
          zh: '是什么', en: 'What',
          segs: [
            { zh: '表格', en: 'Tables', ex: { zh: '行是记录、列是属性的规整数据', en: 'rows are records, columns are attributes' } },
            { zh: '时序', en: 'Time series', ex: { zh: '记录按时间排列，时间是键', en: 'records ordered in time; time is the key' } },
            { zh: '地理', en: 'Geometry', ex: { zh: '带经纬与形状的空间对象', en: 'spatial objects with coordinates and shape' } },
            { zh: '网络', en: 'Networks', ex: { zh: '节点与边的关联结构', en: 'nodes and edges, a relational structure' } },
            { zh: '层次', en: 'Trees', ex: { zh: '包含关系构成的树', en: 'containment forming a tree' } },
            { zh: '场', en: 'Fields', ex: { zh: '空间上连续取值的量', en: 'a quantity defined continuously in space' } }
          ]
        },
        {
          zh: '为什么', en: 'Why',
          segs: [
            { zh: '呈现', en: 'Present', ex: { zh: '把已有结论讲清楚', en: 'communicate a conclusion you already have' } },
            { zh: '发现', en: 'Discover', ex: { zh: '在数据里找出未知的结构', en: 'find structure you did not know was there' } },
            { zh: '记录', en: 'Record', ex: { zh: '把过程存档，供以后核对', en: 'keep a trace for later checking' } },
            { zh: '确认', en: 'Confirm', ex: { zh: '验证一个假设是否成立', en: 'check whether a hypothesis holds' } }
          ]
        }
      ];
      var sel = { r: 1, s: 0 }, hov = null, appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 280, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      var R = [0.28, 0.6, 0.9];
      function geom() {
        var w = st.w, h = st.h;
        var cx = w * 0.5, cy = h * 0.54;
        var rad = Math.min(w * 0.46, h * 0.46) / R[2];
        return { cx: cx, cy: cy, rad: rad };
      }
      function segAt(mx, my) {
        var g = geom();
        var dx = mx - g.cx, dy = my - g.cy;
        var d = Math.hypot(dx, dy) / g.rad;
        if (d < 0.24) return null;
        var ri = d < R[0] ? 2 : (d < R[1] ? 1 : 0);
        var ring = RINGS[ri];
        var ang = Math.atan2(dy, dx);
        if (ang < 0) ang += Math.PI * 2;
        var step = Math.PI * 2 / ring.segs.length;
        var si = Math.floor(((ang + Math.PI / 2 + step / 2) % (Math.PI * 2)) / step);
        return { r: ri, s: si % ring.segs.length };
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var active = hov || sel;
        for (var ri = 0; ri < RINGS.length; ri++) {
          var inner = R[ri] * 0.62 * g.rad, outer = R[ri] * g.rad;
          var ring = RINGS[ri];
          var step = Math.PI * 2 / ring.segs.length;
          for (var si = 0; si < ring.segs.length; si++) {
            var a0 = -Math.PI / 2 + si * step + 0.012;
            var a1 = a0 + step - 0.024;
            var dd = (a - 0.15 * ri) * a * 1.15;
            a1 = a0 + (a1 - a0) * K.clamp(dd, 0, 1);
            if (a1 <= a0) continue;
            var on = active && active.r === ri && active.s === si;
            var off = on ? 3 : 0;
            ctx.save();
            ctx.beginPath();
            ctx.arc(g.cx, g.cy, inner + off * 0.4, a0, a1);
            ctx.arc(g.cx, g.cy, outer + off, a1, a0, true);
            ctx.closePath();
            ctx.fillStyle = on ? K.SPOT : (ri === 1 ? K.withAlpha(K.INK, 0.07) : K.withAlpha(K.INK, 0.025));
            ctx.fill();
            ctx.strokeStyle = on ? K.SPOT : K.RULE;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
            // 标签
            var mid = -Math.PI / 2 + (si + 0.5) * step;
            var rr = (inner + outer) / 2;
            var lx = g.cx + Math.cos(mid) * rr, ly = g.cy + Math.sin(mid) * rr;
            var size = ri === 1 ? 11 : 11.5;
            K.label(ctx, L(ring.segs[si].zh, ring.segs[si].en), lx, ly + 4, {
              align: 'center', size: on ? size + 0.5 : size, color: on ? '#fff' : (active && active.r === ri ? K.INK : K.INK2)
            });
          }
          // 环名
          K.label(ctx, L(ring.zh, ring.en), g.cx, g.cy - inner - (outer - inner) / 2 + 4, { align: 'center', size: 9.5, color: K.INK4, rotate: 0, alpha: 0 });
        }
        // 圆心：当前选择
        var cur = RINGS[sel.r].segs[sel.s];
        ctx.save();
        ctx.beginPath(); ctx.arc(g.cx, g.cy, R[0] * 0.62 * g.rad, 0, 6.2832);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = K.INK; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
        K.label(ctx, L(cur.zh, cur.en), g.cx, g.cy - 4, { align: 'center', size: 12.5, color: K.INK });
        K.label(ctx, L(RINGS[sel.r].zh, RINGS[sel.r].en), g.cx, g.cy + 13, { align: 'center', size: 9.5, color: K.SPOT });
        // 三条图例
        var lg = [[0, L('为什么（任务）', 'why (task)')], [1, L('是什么（数据类型）', 'what (data)')], [2, L('怎么做（技术）', 'how (technique)')]];
        K.label(ctx, L('从内到外', 'inner to outer'), 14, 18, { size: 10, color: K.INK4 });
        lg.forEach(function (it) {
          K.label(ctx, it[1], 14, 36 + (2 - it[0]) * 16, { size: 10.5, color: it[0] === sel.r ? K.INK : K.INK3 });
        });
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var s = segAt(e.clientX - r2.left, e.clientY - r2.top);
        if (s && (!hov || hov.r !== s.r || hov.s !== s.s)) {
          hov = s;
          var seg = RINGS[s.r].segs[s.s];
          read.innerHTML = L(RINGS[s.r].zh, RINGS[s.r].en) + ' · <b>' + K.esc(L(seg.zh, seg.en)) + '</b>　' + K.esc(L(seg.ex.zh, seg.ex.en));
          st.cv.style.cursor = 'pointer';
        }
        if (!s && hov) { hov = null; st.cv.style.cursor = 'default'; }
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var s = segAt(e.clientX - r2.left, e.clientY - r2.top);
        if (s) { sel = s; hov = null; draw(); }
      });
      read.textContent = L('三层分别回答：为什么做、数据是什么、用什么技术。', 'The three rings answer: why, what kind of data, and which technique.');
      if (st.onDraw) st.onDraw();
      return { destroy: function () { } };
    }
  };

  /* ------------------------------------------------------ 4.2 动作与目标矩阵 */
  VIZ.figures['fig-actions-targets'] = {
    zh: '动作与目标的组合', en: 'Actions against targets',
    hint: { zh: '悬停单元格看一个具体例子', en: 'hover a cell for a concrete example' },
    mount: function (host) {
      var ACT = [
        { zh: '定位', en: 'Locate' },
        { zh: '识别', en: 'Identify' },
        { zh: '浏览', en: 'Browse' },
        { zh: '概括', en: 'Summarise' },
        { zh: '比较', en: 'Compare' },
        { zh: '关联', en: 'Correlate' }
      ];
      var TGT = [
        { zh: '极值', en: 'Extremes' },
        { zh: '趋势', en: 'Trends' },
        { zh: '离群', en: 'Outliers' },
        { zh: '分布', en: 'Distribution' },
        { zh: '相关', en: 'Correlation' },
        { zh: '相似', en: 'Similarity' }
      ];
      /* 每个单元格一句例子；空串表示该组合少有实际意义 */
      var EX = [
        ['找出人口最多的那座城市', 'find the single most populous city'],
        ['读出最高刻度上是哪一年', 'read which year sits at the peak'],
        ['指出偏离整体的那个点是谁', 'name the point that leaves the band'],
        ['读出分布的众数落在哪个区间', 'read which interval holds the mode'],
        ['确认两个字段是否同向变化', 'check whether two fields move together'],
        ['说出与北京最接近的城市', 'say which city is most like Beijing'],

        ['标出某个已知城市在图中的位置', 'mark where a known city sits'],
        ['说出这条线的斜率大约多少', 'say roughly what the slope is'],
        ['确认这个记录是否真的异常', 'confirm whether a record really is an outlier'],
        ['读出中位数与均值差多少', 'read how far the median is from the mean'],
        ['判断相关是正还是负', 'judge whether the association is positive'],
        ['比较两个城市的轮廓是否接近', 'compare two city profiles'],

        ['扫过全表找有没有漏掉的区域', 'sweep the whole table for untouched regions'],
        ['看整段区间有没有整体上升', 'see whether the whole span drifts upward'],
        ['翻遍数据找出所有可疑点', 'scan everything for suspicious points'],
        ['看分布有几个峰', 'count how many peaks the distribution has'],
        ['扫过所有成对的散点', 'sweep every pairwise scatter'],
        ['找出成组出现的几个点', 'find groups that move together'],

        ['给出前十名的名单', 'produce the top-ten list'],
        ['用一条趋势线概括整体走向', 'summarise the trend with one fitted line'],
        ['报告离群点的数量与占比', 'report how many outliers there are'],
        ['用箱线图概括四分位', 'summarise quartiles in a box plot'],
        ['给出相关系数', 'report the correlation coefficient'],
        ['把记录聚成几类并给出中心', 'cluster records and name the centres'],

        ['比较两个城市在总量上的差距', 'compare two cities on the total'],
        ['比较两段时期上升的快慢', 'compare the pace of two periods'],
        ['比较两组的异常程度', 'compare how anomalous two groups are'],
        ['比较两种条件下的分布形状', 'compare the shape of two distributions'],
        ['比较两组成对的强弱', 'compare the strength in two groups'],
        ['比较哪两个更接近', 'compare which pair is closer'],

        ['看极值之间是否有关系', 'see whether extremes relate to each other'],
        ['看两条走势是否同步', 'see whether two trends move in step'],
        ['看离群点是否集中在某个区间', 'see whether outliers cluster in one range'],
        ['看两组分布是否同源', 'see whether two distributions share an origin'],
        ['看相关是否在分组后仍然成立', 'see whether a correlation survives grouping'],
        ['看相似的记录是否也相邻', 'see whether similar records are also neighbours']
      ];
      var hov = null, pin = null;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 400)); }, draw: function () { draw(); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function geom() {
        var padL = 66, padT = 54, padR = 18, padB = 30;
        var w = st.w - padL - padR, h = st.h - padT - padB;
        return { L: padL, T: padT, cw: w / TGT.length, ch: h / ACT.length };
      }
      function draw() {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        K.clear(ctx, w, h);
        // 列标题（目标）
        TGT.forEach(function (t, c) {
          var on = hov && hov.c === c;
          K.label(ctx, L(t.zh, t.en), g.L + (c + 0.5) * g.cw, g.T - 20, { align: 'center', size: 11.5, color: on ? K.SPOT : K.INK });
          ctx.save();
          ctx.globalAlpha = on ? 0.06 : 0.03; ctx.fillStyle = on ? K.SPOT : K.INK;
          ctx.fillRect(g.L + c * g.cw, g.T, g.cw, g.ch * ACT.length); ctx.restore();
        });
        K.label(ctx, L('目标（读者要找到什么）', 'targets (what the reader wants)'), g.L, g.T - 34, { size: 10, color: K.INK4 });
        ACT.forEach(function (a2, r) {
          var on = hov && hov.r === r;
          K.label(ctx, L(a2.zh, a2.en), g.L - 12, g.T + (r + 0.5) * g.ch + 4, { align: 'right', size: 11.5, color: on ? K.SPOT : K.INK });
          K.hline(ctx, g.L, g.L + g.cw * TGT.length, g.T + (r + 1) * g.ch, K.RULE);
        });
        K.vline(ctx, g.L, g.T, g.T + g.ch * ACT.length, K.INK);
        K.hline(ctx, g.L, g.L + g.cw * TGT.length, g.T, K.INK);
        for (var r2 = 0; r2 < ACT.length; r2++) {
          for (var c2 = 0; c2 < TGT.length; c2++) {
            var txt = EX[r2 * TGT.length + c2];
            var has = !!txt[0];
            var on = (hov && hov.r === r2 && hov.c === c2) || (pin && pin.r === r2 && pin.c === c2);
            var cx = g.L + (c2 + 0.5) * g.cw, cy = g.T + (r2 + 0.5) * g.ch;
            if (has) {
              K.dot(ctx, cx, cy, on ? 5 : 2.6, on ? K.SPOT : K.INK, on ? 1 : 0.55);
              if (on) K.ring(ctx, cx, cy, 9, K.SPOT, 1);
            } else {
              K.label(ctx, '·', cx, cy + 4, { align: 'center', size: 12, color: K.INK4 });
            }
          }
        }
        K.label(ctx, L('动作（读者做什么）', 'actions (what the reader does)'), g.L - 12, g.T - 34, { align: 'right', size: 10, color: K.INK4 });
      }
      function paintHint() {
        var cur = hov || pin;
        if (!cur) {
          read.textContent = L('三十六个组合里，最常用的往往只有十来个。悬停任一格子，看它在实际场景里长什么样。',
            'Of the thirty-six combinations, only a dozen are used often. Hover any cell to see how it looks in practice.');
          return;
        }
        var txt = EX[cur.r * TGT.length + cur.c];
        read.innerHTML = '<b>' + K.esc(L(ACT[cur.r].zh, ACT[cur.r].en)) + ' × ' + K.esc(L(TGT[cur.c].zh, TGT[cur.c].en)) + '</b>　' +
          K.esc(L(txt[0] || '—', txt[1] || '—'));
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r3 = st.cv.getBoundingClientRect();
        var g = geom();
        var c = Math.floor((e.clientX - r3.left - g.L) / g.cw);
        var r2 = Math.floor((e.clientY - r3.top - g.T) / g.ch);
        var nh = (c >= 0 && c < TGT.length && r2 >= 0 && r2 < ACT.length) ? { r: r2, c: c } : null;
        if ((nh && (!hov || hov.r !== nh.r || hov.c !== nh.c)) || (!nh && hov)) {
          hov = nh; draw(); paintHint();
          st.cv.style.cursor = nh ? 'pointer' : 'default';
        }
      });
      st.cv.addEventListener('pointerdown', function () { pin = hov; draw(); });
      st.cv.addEventListener('pointerleave', function () { hov = null; draw(); paintHint(); });
      paintHint();
      if (st.onDraw) st.onDraw();
      return { destroy: function () { } };
    }
  };

  /* -------------------------------------------------------- 4.3 概览优先的次序 */
  VIZ.figures['fig-mantra'] = {
    zh: '概览优先、缩放过滤、按需细节', en: 'Overview first, zoom and filter, details on demand',
    hint: { zh: '点三个步骤，或直接在图上拖动刷选', en: 'press the three steps, or drag on the plot' },
    mount: function (host) {
      var cities = K.data.cities.slice().sort(function (a, b) { return b.pop - a.pop; });
      var sel = [0, 1];           // 数据坐标下的选择区间（人口）
      var panel = 0;              // 细节面板展开程度
      var appe = K.intro(0.8), anim = null;
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 300, 400)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var hintEl = K.ce('div', { class: 'kit-hint' });
      hintEl.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(hintEl);
      var statEl = K.stat(row, '');
      var dragging = false;

      var STEPS = [
        { zh: '概览', en: 'Overview', d: { zh: '先给出全部 42 座城市，读者知道数据大致长什么样。', en: 'Start with all 42 cities so the reader knows the overall shape.' } },
        { zh: '缩放与过滤', en: 'Zoom and filter', d: { zh: '刷选人口区间，其余暂时退到背景。', en: 'Brush a population range; everything else recedes.' } },
        { zh: '按需细节', en: 'Details on demand', d: { zh: '只对选中的记录给出名字与数值。', en: 'Only the selected records get names and numbers.' } }
      ];
      var step = 0;

      function geom() {
        var w = st.w, h = st.h;
        var pw = w * 0.62, padL = 54, padT = 30, padB = 44;
        return { pw: pw, padL: padL, padT: padT, padB: padB, iw: pw - padL - 24, ih: h - padT - padB, dpx: pw + 26 };
      }
      function xs() { return K.linear(0, 40, 0, geom().iw); }
      function ys() { return K.linear(-40, 62, geom().ih, 0); }

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h, g = geom();
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var X = xs(), Y = ys();
        var x0 = g.padL, y0 = g.padT;
        K.axes(ctx, {
          x0: x0, y0: y0, w: g.iw, h: g.ih, x: X, y: Y,
          xTicks: [0, 10, 20, 30, 40], yTicks: [-20, 0, 20, 40, 60],
          xFormat: function (v) { return v; }, yFormat: function (v) { return v; },
          xLabel: L('人口 / 百万', 'population / M'), yLabel: L('纬度', 'latitude')
        });
        // 刷选区域
        var lo = Math.min(sel[0], sel[1]), hi = Math.max(sel[0], sel[1]);
        var bx0 = x0 + X(lo), bx1 = x0 + X(hi);
        ctx.save();
        ctx.globalAlpha = 0.06; ctx.fillStyle = K.SPOT;
        ctx.fillRect(bx0, y0, bx1 - bx0, g.ih);
        ctx.restore();
        K.vline(ctx, bx0, y0, y0 + g.ih, K.SPOT);
        K.vline(ctx, bx1, y0, y0 + g.ih, K.SPOT);
        var picked = [];
        cities.forEach(function (c) {
          var inSel = c.pop >= lo && c.pop <= hi;
          if (inSel) picked.push(c);
          var px = x0 + X(c.pop), py = y0 + Y(c.lat);
          K.dot(ctx, px, py, inSel ? (3.4 + panel * 0.6) : 2.2, inSel ? K.SPOT : K.INK, (inSel ? 0.95 : 0.35) * a);
          if (inSel && panel > 0.5 && picked.length <= 12) {
            K.label(ctx, L(c.zh, c.en), px + 7, py + 3, { size: 10, color: K.INK2, alpha: (panel - 0.5) * 2 });
          }
        });
        // 细节面板
        var px0 = g.dpx, pw = w - px0 - 12;
        ctx.save();
        ctx.globalAlpha = 1;
        K.vline(ctx, px0 - 12, 8, h - 30, K.RULE);
        ctx.restore();
        K.label(ctx, L('选中记录', 'selected'), px0, 20, { size: 10, mono: true, color: K.INK4 });
        K.label(ctx, picked.length + ' / ' + cities.length, px0, 36, { size: 15, color: K.INK });
        var rows = picked.slice(0, 9);
        rows.forEach(function (c2, i) {
          var y = 60 + i * 24;
          if (y > h - 24) return;
          K.label(ctx, L(c2.zh, c2.en), px0, y, { size: 11, color: K.INK, alpha: panel });
          K.label(ctx, c2.pop.toFixed(1) + ' M', px0 + pw, y, { align: 'right', size: 10.5, mono: true, color: K.SPOT, alpha: panel });
          K.hline(ctx, px0, px0 + pw, y + 7, K.RULE);
        });
        if (picked.length > 9) {
          K.label(ctx, L('还有 ' + (picked.length - 9) + ' 条', (picked.length - 9) + ' more'), px0, 60 + 9 * 24, { size: 10.5, color: K.INK4 });
        }
        statEl.set(L('步骤 ', 'step ') + '<b>' + (step + 1) + '</b> / 3 · ' + K.esc(L(STEPS[step].zh, STEPS[step].en)) +
          ' · ' + L('选中 ', 'picked ') + '<b>' + picked.length + '</b>');
      }
      function hint() {
        hintEl.innerHTML = '<b>' + K.esc(L(STEPS[step].zh, STEPS[step].en)) + '</b>　' + K.esc(L(STEPS[step].d.zh, STEPS[step].d.en));
      }
      function animateTo(target, dur) {
        var from = sel.slice(), t0 = performance.now();
        anim = K.raf.add(function () {
          var p = K.clamp((performance.now() - t0) / dur, 0, 1);
          var e = K.ease.inOut(p);
          sel[0] = K.lerp(from[0], target[0], e);
          sel[1] = K.lerp(from[1], target[1], e);
          if (p >= 1) { K.raf.remove(anim); anim = null; }
        });
      }
      function gotoStep(i) {
        step = i;
        if (i === 0) { animateTo([0, 40], 520); panel = 0; }
        else if (i === 1) { animateTo([9, 24], 620); panel = 0; }
        else { animateTo([12, 30], 420); K.tween(0.4, function (e) { panel = e; }, null, K.ease.out); }
        hint(); draw();
      }
      var ticker = K.ticker(st, draw);
      K.group(row, STEPS.map(function (s, i) { return { label: L(s.zh, s.en), value: String(i) }; }), function (v) {
        gotoStep(parseInt(v, 10));
      });
      // 直接在图上刷选
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var g = geom();
        var mx = e.clientX - r2.left;
        if (mx < g.padL || mx > g.padL + g.iw) return;
        dragging = true;
        step = 1;
        if (anim) { K.raf.remove(anim); anim = null; }
        sel[0] = sel[1] = xs().invert(mx - g.padL);
        hint(); draw();
      });
      st.cv.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var r2 = st.cv.getBoundingClientRect();
        var g = geom();
        sel[1] = K.clamp(xs().invert(e.clientX - r2.left - g.padL), 0, 40);
        draw();
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () {
          if (!dragging) return;
          dragging = false;
          if (Math.abs(sel[1] - sel[0]) < 0.6) { sel[0] = 0; sel[1] = 40; }
          step = 2;
          K.tween(0.35, function (e) { panel = e; }, null, K.ease.out);
          hint(); draw();
        });
      });
      gotoStep(0);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); if (anim) K.raf.remove(anim); } };
    }
  };
})();
