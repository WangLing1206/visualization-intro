/* ==========================================================================
   network.js — 第 9 章配图：层次布局、力导向网络、桑基图
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  function L(zh, en) { return VIZ.i18n && VIZ.i18n.lang === 'en' ? en : zh; }

  /* -------------------------------------------------------- 9.1 层次布局 */
  VIZ.figures['fig-treemap'] = {
    zh: '同一棵树的三张脸', en: 'One tree, three layouts',
    hint: { zh: '切换布局，悬停看同一节点', en: 'switch layouts; hover the same node' },
    mount: function (host) {
      var LAYOUTS = [
        { id: 'treemap', zh: '矩形树图', en: 'Treemap' },
        { id: 'sunburst', zh: '旭日图', en: 'Sunburst' },
        { id: 'radial', zh: '径向树', en: 'Radial tree' }
      ];
      var layout = 'treemap', hover = null, up = [], appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.56, 320, 440)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      var tree = null, boxes = [], arcs = [], rad = [];
      function build() {
        tree = K.bookTree(VIZ.i18n.lang);
        // 矩形树图：按面积切分
        boxes = [];
        (tree.children || []).forEach(function (c, i) {
          var r1 = c.value / (tree.children.reduce(function (a, b) { return a + b.value; }, 0));
          boxes.push({ node: c, r: r1, i: i });
        });
        // 旭日图扇区
        arcs = [];
        (tree.children || []).forEach(function (c, i) {
          var seg = c.value / (tree.children.reduce(function (a, b) { return a + b.value; }, 0)) * Math.PI * 2;
          arcs.push({ node: c, a0: 0, seg: seg, i: i, children: c.children || [] });
        });
        // 径向树
        rad = [];
        (tree.children || []).forEach(function (c, i) {
          rad.push({ node: c, seg: c.value / (tree.children.reduce(function (a, b) { return a + b.value; }, 0)) * Math.PI * 2, i: i });
        });
      }
      function total() { return (tree.children || []).reduce(function (a, b) { return a + b.value; }, 0); }

      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        if (!tree) build();
        var t0 = 0;
        var padL = 34, padT = 44, padR = 34, padB = 34;
        var bw = w - padL - padR, bh = h - padT - padB;
        if (layout === 'treemap') {
          // 列式切分：按比例横切
          var x = padL;
          boxes.forEach(function (b) {
            var ww = bw * b.r;
            var on = hover === b.i;
            ctx.save();
            ctx.globalAlpha = a * (on ? 1 : 0.9);
            ctx.fillStyle = on ? K.withAlpha(K.SPOT, 0.14) : K.withAlpha(K.INK, 0.035 + (b.i % 3) * 0.03);
            ctx.fillRect(x, padT, ww - 2, bh);
            ctx.strokeStyle = on ? K.SPOT : K.RULE;
            ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, padT + 0.5, ww - 3, bh - 1);
            ctx.restore();
            // 内部按小节再切
            var y = padT;
            (b.node.children || []).forEach(function (s, si) {
              var hh = bh * (s.value / (b.node.children.reduce(function (p, q) { return p + q.value; }, 0) || 1));
              ctx.save();
              ctx.globalAlpha = a * 0.9;
              ctx.fillStyle = on ? K.withAlpha(K.SPOT, 0.22 + si * 0.05) : K.withAlpha(K.INK, 0.09 + (si % 3) * 0.04);
              ctx.fillRect(x + 3, y + 2, ww - 8, hh - 4);
              ctx.restore();
              K.label(ctx, L(s.name, s.name), x + 6, y + hh / 2 + 4, { size: 9.5, color: K.INK3 });
              y += hh;
            });
            K.label(ctx, b.node.name, x + 6, padT - 10, { size: 11, color: on ? K.SPOT : K.INK, weight: on ? 500 : 400 });
            x += ww;
          });
        } else if (layout === 'sunburst') {
          var cx = w / 2, cy = h * 0.54, R = Math.min(bw, bh) * 0.48;
          var ang = -Math.PI / 2;
          arcs.forEach(function (ar) {
            var on = hover === ar.i;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R * 0.42 * a, ang, ang + ar.seg * a);
            ctx.arc(cx, cy, R * a, ang + ar.seg * a, ang, true);
            ctx.closePath();
            ctx.fillStyle = on ? K.withAlpha(K.SPOT, 0.16) : K.withAlpha(K.INK, 0.05);
            ctx.fill();
            ctx.strokeStyle = on ? K.SPOT : K.RULE; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();
            var mid = ang + ar.seg / 2;
            K.label(ctx, ar.node.name, cx + Math.cos(mid) * R * 0.71 * a, cy + Math.sin(mid) * R * 0.71 * a + 3,
              { align: 'center', size: 10, color: on ? K.SPOT : K.INK2 });
            // 内环
            var a2 = ang;
            (ar.node.children || []).forEach(function (s, si) {
              var seg2 = ar.seg * (s.value / (ar.node.children.reduce(function (p, q) { return p + q.value; }, 0) || 1));
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, R * 0.16 * a, a2, a2 + seg2 * a);
              ctx.arc(cx, cy, R * 0.4 * a, a2 + seg2 * a, a2, true);
              ctx.closePath();
              ctx.fillStyle = on ? K.withAlpha(K.SPOT, 0.25) : K.withAlpha(K.INK, 0.12);
              ctx.fill();
              ctx.restore();
              a2 += seg2;
            });
            ang += ar.seg;
          });
          K.label(ctx, tree.name, cx, cy + 4, { align: 'center', size: 11, color: K.INK3 });
        } else {
          var cx2 = w / 2, cy2 = h * 0.52;
          var R1 = Math.min(bw, bh) * 0.18, R2 = Math.min(bw, bh) * 0.46;
          var ang2 = -Math.PI / 2;
          rad.forEach(function (rd) {
            var on = hover === rd.i;
            var a0 = ang2, a1 = ang2 + rd.seg;
            var mid = (a0 + a1) / 2;
            var x1 = cx2 + Math.cos(mid) * R1, y1 = cy2 + Math.sin(mid) * R1;
            var x2 = cx2 + Math.cos(mid) * R2, y2 = cy2 + Math.sin(mid) * R2;
            K.line(ctx, [[x1, y1], [x2, y2]], { color: on ? K.SPOT : K.RULE, width: on ? 1.6 : 1, alpha: a });
            K.dot(ctx, x2, y2, on ? 4 : 2.6, on ? K.SPOT : K.INK, a);
            K.label(ctx, rd.node.name, x2 + (Math.cos(mid) > 0 ? 8 : -8), y2 + 3,
              { align: Math.cos(mid) > 0 ? 'left' : 'right', size: 10, color: on ? K.SPOT : K.INK2 });
            (rd.node.children || []).forEach(function (s, si) {
              var aa = a0 + (a1 - a0) * (si + 0.5) / (rd.node.children.length || 1);
              var x3 = cx2 + Math.cos(aa) * (R1 + (R2 - R1) * 0.62);
              var y3 = cy2 + Math.sin(aa) * (R1 + (R2 - R1) * 0.62);
              K.line(ctx, [[cx2 + Math.cos(aa) * R1, cy2 + Math.sin(aa) * R1], [x3, y3]],
                { color: on ? K.withAlpha(K.SPOT, 0.6) : K.RULE, width: 0.9, alpha: a });
              K.dot(ctx, x3, y3, 1.8, on ? K.SPOT : K.INK4, a * 0.9);
            });
            ang2 = a1;
          });
          K.dot(ctx, cx2, cy2, 4, K.INK, a);
          K.label(ctx, tree.name, cx2, cy2 - 12, { align: 'center', size: 10.5, color: K.INK3 });
        }
      }
      function hitTest(mx, my) {
        var w = st.w, h = st.h;
        var padL = 34, padT = 44, padR = 34, padB = 34;
        var bw = w - padL - padR, bh = h - padT - padB;
        if (layout === 'treemap') {
          if (my < padT - 22 || my > padT + bh) return null;
          var tot = total(), x = padL;
          for (var i = 0; i < boxes.length; i++) {
            var ww = bw * boxes[i].r;
            if (mx >= x && mx <= x + ww) return i;
            x += ww;
          }
        } else if (layout === 'sunburst') {
          var cx = w / 2, cy = h * 0.54, R = Math.min(bw, bh) * 0.48;
          var d = Math.hypot(mx - cx, my - cy);
          if (d < R * 0.42 || d > R) return null;
          var ang = Math.atan2(my - cy, mx - cx);
          if (ang < -Math.PI / 2) ang += Math.PI * 2;
          var acc = -Math.PI / 2;
          for (var j = 0; j < arcs.length; j++) {
            if (ang >= acc && ang <= acc + arcs[j].seg) return j;
            acc += arcs[j].seg;
          }
        } else {
          var cx2 = w / 2, cy2 = h * 0.52, R2 = Math.min(bw, bh) * 0.46;
          var best = -1, bd = 20;
          var ang2 = -Math.PI / 2;
          rad.forEach(function (rd, i) {
            var mid2 = ang2 + rd.seg / 2;
            var x2 = cx2 + Math.cos(mid2) * R2, y2 = cy2 + Math.sin(mid2) * R2;
            var dd = Math.hypot(x2 - mx, y2 - my);
            if (dd < bd) { bd = dd; best = i; }
            ang2 += rd.seg;
          });
          return best >= 0 ? best : null;
        }
        return null;
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var i = hitTest(e.clientX - r2.left, e.clientY - r2.top);
        if (i !== hover) {
          hover = i; draw();
          st.cv.style.cursor = i != null ? 'pointer' : 'default';
          if (i != null) {
            var c = tree.children[i];
            read.innerHTML = '<b>' + K.esc(c.name) + '</b>　' + (c.children || []).length + L(' 节', ' sections') +
              '　·　' + L('篇幅权重 ', 'weight ') + c.value;
          }
        }
      });
      st.cv.addEventListener('pointerleave', function () { hover = null; draw(); });
      K.group(row, LAYOUTS.map(function (m) { return { label: L(m.zh, m.en), value: m.id }; }), function (v) { layout = v; draw(); });
      read.textContent = L('树是这本书自己的目录：十一章、四十多节，矩形面积与扇区角度都由实际篇幅决定。',
        "The tree is this book's own contents: eleven chapters and forty-odd sections, with areas and angles set by real length.");
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ------------------------------------------------------ 9.2 力导向网络 */
  VIZ.figures['fig-network'] = {
    zh: '力导向布局', en: 'Force-directed layout',
    hint: { zh: '拖动节点，或按住节点看它的邻居', en: 'drag a node, or hover to see its neighbours' },
    mount: function (host) {
      var net = K.data.network;
      var nodes = net.nodes.map(function (n) { return { id: n.id, c: n.c, x: 0, y: 0, vx: 0, vy: 0, deg: 0 }; });
      var links = net.links;
      links.forEach(function (l) { nodes[l.s].deg++; nodes[l.t].deg++; });
      var r = K.rng(2026);
      nodes.forEach(function (n, i) {
        var a = (n.c / 5) * 6.2832 + r() * 0.4;
        n.x = 0.5 + Math.cos(a) * 0.22 + (r() - 0.5) * 0.1;
        n.y = 0.5 + Math.sin(a) * 0.22 + (r() - 0.5) * 0.1;
      });
      var hover = -1, dragNode = null, appe = K.intro(0.8);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.44, 280, 350)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);
      var statEl = K.stat(row, '');

      function step(dt) {
        if (!dt) return;
        var k = 0.0016;               // 斥力强度
        for (var i = 0; i < nodes.length; i++) {
          var A = nodes[i];
          for (var j = i + 1; j < nodes.length; j++) {
            var B = nodes[j];
            var dx = B.x - A.x, dy = B.y - A.y;
            var d2 = dx * dx + dy * dy + 0.0008;
            var f = k / d2;
            var d = Math.sqrt(d2);
            var ux = dx / d, uy = dy / d;
            A.vx -= ux * f; A.vy -= uy * f;
            B.vx += ux * f; B.vy += uy * f;
          }
        }
        links.forEach(function (l) {
          var A = nodes[l.s], B = nodes[l.t];
          var dx = B.x - A.x, dy = B.y - A.y;
          var d = Math.hypot(dx, dy) + 0.0001;
          var target = 0.085 + 0.02 * (1 - l.w);
          var f = (d - target) * 0.12 * (0.6 + l.w * 0.6);
          var ux = dx / d, uy = dy / d;
          A.vx += ux * f * dt * 12; A.vy += uy * f * dt * 12;
          B.vx -= ux * f * dt * 12; B.vy -= uy * f * dt * 12;
        });
        nodes.forEach(function (n) {
          n.vx += (0.5 - n.x) * 0.012; n.vy += (0.5 - n.y) * 0.012;
          n.vx *= 0.86; n.vy *= 0.86;
          n.x += n.vx * dt * 22; n.y += n.vy * dt * 22;
          n.x = K.clamp(n.x, 0.03, 0.97); n.y = K.clamp(n.y, 0.04, 0.96);
        });
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        step(dt);
        var neighbours = {};
        if (hover >= 0) {
          neighbours[hover] = 1;
          links.forEach(function (l) { if (l.s === hover) neighbours[l.t] = 1; if (l.t === hover) neighbours[l.s] = 1; });
        }
        links.forEach(function (l) {
          var A = nodes[l.s], B = nodes[l.t];
          var on = hover >= 0 && (l.s === hover || l.t === hover);
          K.line(ctx, [[A.x * w, A.y * h], [B.x * w, B.y * h]], {
            color: on ? K.SPOT : K.INK, width: on ? 1.4 : 0.6 + l.w * 0.6,
            alpha: (on ? 0.8 : (hover >= 0 ? 0.1 : 0.24)) * a
          });
        });
        nodes.forEach(function (n, i) {
          var on = i === hover, near = neighbours[i];
          var rad = 2.2 + Math.sqrt(n.deg) * 1.1;
          K.dot(ctx, n.x * w, n.y * h, on ? rad + 1.6 : rad,
            on ? K.SPOT : (near ? K.INK : K.INK3), (on ? 0.95 : (near ? 0.95 : 0.5)) * a);
        });
        // 群团标注
        var CC = [{ zh: '群团 A', en: 'Cluster A' }, { zh: '群团 B', en: 'Cluster B' }, { zh: '群团 C', en: 'Cluster C' }, { zh: '群团 D', en: 'Cluster D' }, { zh: '群团 E', en: 'Cluster E' }];
        var cxSum = [0, 0, 0, 0, 0], cySum = [0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0];
        nodes.forEach(function (n) { cxSum[n.c] += n.x; cySum[n.c] += n.y; cnt[n.c]++; });
        for (var c = 0; c < 5; c++) {
          if (!cnt[c]) continue;
          K.label(ctx, L(CC[c].zh, CC[c].en), cxSum[c] / cnt[c] * w, cySum[c] / cnt[c] * h - 18,
            { align: 'center', size: 10, color: K.INK4 });
        }
        statEl.set(L('节点 ', 'nodes ') + '<b>' + nodes.length + '</b>　·　' + L('边 ', 'edges ') + '<b>' + links.length + '</b>' +
          (hover >= 0 ? '　·　' + L('当前节点度 ', 'degree ') + '<b>' + nodes[hover].deg + '</b>' : ''));
      }
      function at(mx, my) {
        var best = -1, bd = 16;
        nodes.forEach(function (n, i) {
          var d = Math.hypot(n.x * st.w - mx, n.y * st.h - my);
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var mx = e.clientX - r2.left, my = e.clientY - r2.top;
        if (dragNode != null) {
          nodes[dragNode].x = K.clamp(mx / st.w, 0.02, 0.98);
          nodes[dragNode].y = K.clamp(my / st.h, 0.02, 0.98);
          nodes[dragNode].vx = nodes[dragNode].vy = 0;
          return;
        }
        var i = at(mx, my);
        if (i !== hover) {
          hover = i; draw();
          st.cv.style.cursor = i >= 0 ? 'pointer' : 'default';
          if (i >= 0) {
            var nb = [];
            links.forEach(function (l) { if (l.s === i) nb.push(nodes[l.t].id + 1); if (l.t === i) nb.push(nodes[l.s].id + 1); });
            read.innerHTML = '<b>' + L('节点 N' + (i + 1), 'node N' + (i + 1)) + '</b>　' + L('度 ', 'degree ') + nodes[i].deg +
              '　·　' + L('邻居：', 'neighbours: ') + (nb.slice(0, 8).map(function (x) { return 'N' + x; }).join(' ') || '—') +
              (nb.length > 8 ? ' …' : '');
          }
        }
      });
      st.cv.addEventListener('pointerdown', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        dragNode = at(e.clientX - r2.left, e.clientY - r2.top);
        if (dragNode < 0) dragNode = null;
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        st.cv.addEventListener(ev, function () { dragNode = null; });
      });
      K.btn(row, L('重新初始化', 're-seed'), function () {
        nodes.forEach(function (n) {
          var a2 = (n.c / 5) * 6.2832 + r() * 0.5;
          n.x = 0.5 + Math.cos(a2) * 0.2; n.y = 0.5 + Math.sin(a2) * 0.2;
          n.vx = n.vy = 0;
        });
        draw();
      });
      read.textContent = L('力导向布局没有唯一解：弹簧把相邻的节点拉近，斥力把无关的节点推开，最后停在哪个形状取决于初始位置。',
        'A force-directed layout has no unique answer: springs pull neighbours together, repulsion pushes strangers apart, and where it settles depends on where it started.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };

  /* ---------------------------------------------------------- 9.3 桑基图 */
  VIZ.figures['fig-sankey'] = {
    zh: '分层流量', en: 'Layered flows',
    hint: { zh: '悬停任一节点追踪它的流向', en: 'hover a node to trace its flow' },
    mount: function (host) {
      var COL = [
        [
          { id: 'raw', zh: '原始数据', en: 'Raw data' },
          { id: 'api', zh: '接口', en: 'API' },
          { id: 'form', zh: '表单', en: 'Forms' }
        ],
        [
          { id: 'clean', zh: '清洗', en: 'Cleaning' },
          { id: 'join', zh: '关联', en: 'Joining' },
          { id: 'drop', zh: '丢弃', en: 'Discarded' }
        ],
        [
          { id: 'table', zh: '表格视图', en: 'Table view' },
          { id: 'chart', zh: '图形视图', en: 'Chart view' },
          { id: 'model', zh: '进入模型', en: 'Model input' }
        ]
      ];
      var FLOWS = [
        ['raw', 'clean', 42], ['raw', 'drop', 8], ['api', 'clean', 18], ['api', 'join', 22],
        ['form', 'join', 14], ['form', 'drop', 4],
        ['clean', 'table', 26], ['clean', 'chart', 30], ['join', 'chart', 18], ['join', 'model', 16],
        ['drop', 'table', 6], ['drop', 'model', 6]
      ];
      var hover = null, appe = K.intro(0.9);
      var plate = K.plate(host);
      var st = K.useCanvas(plate.inner, { h: function (w) { return Math.round(K.clamp(w * 0.5, 290, 380)); }, draw: function (dt) { draw(dt); } });
      var row = K.row(host);
      var read = K.ce('div', { class: 'kit-hint' });
      read.style.cssText = 'flex:1 1 100%;line-height:1.75';
      row.appendChild(read);

      function layout() {
        var pos = {};
        var padX = 96, padY = 34;
        var w = st.w, h = st.h;
        COL.forEach(function (col, ci) {
          var x = padX + ci * ((w - padX * 2) / (COL.length - 1));
          var tot = col.reduce(function (a, n) { return a + nodeOut(n.id) + nodeIn(n.id); }, 0);
          var y = padY;
          var avail = h - padY * 2;
          var sum = col.reduce(function (a, n) { return a + Math.max(nodeOut(n.id), nodeIn(n.id)); }, 0);
          col.forEach(function (n) {
            var v = Math.max(nodeOut(n.id), nodeIn(n.id));
            var hh = (v / sum) * (avail - (col.length - 1) * 18);
            pos[n.id] = { x: x, y: y, h: hh, node: n, ci: ci };
            y += hh + 18;
          });
        });
        return pos;
      }
      function nodeOut(id) {
        var s = 0;
        FLOWS.forEach(function (f) { if (f[0] === id) s += f[2]; });
        if (!s) FLOWS.forEach(function (f) { if (f[1] === id) s += f[2]; });
        return s;
      }
      function nodeIn(id) {
        var s = 0;
        FLOWS.forEach(function (f) { if (f[1] === id) s += f[2]; });
        return s || nodeOut(id);
      }
      function draw(dt) {
        var ctx = st.ctx, w = st.w, h = st.h;
        var a = appe.tick(dt);
        K.clear(ctx, w, h);
        var pos = layout();
        var scale = (h - 68) / 130;
        // 每条流的两端位置
        var outCursor = {}, inCursor = {};
        Object.keys(pos).forEach(function (k) { outCursor[k] = pos[k].y; inCursor[k] = pos[k].y; });
        FLOWS.forEach(function (f) {
          var A = pos[f[0]], B = pos[f[1]];
          if (!A || !B) return;
          var hh = f[2] * scale;
          var y0 = outCursor[f[0]], y1 = inCursor[f[1]];
          outCursor[f[0]] += hh; inCursor[f[1]] += hh;
          var on = hover && (f[0] === hover || f[1] === hover);
          var active = hover ? on : true;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(A.x + 8, y0);
          ctx.bezierCurveTo((A.x + B.x) / 2 + 6, y0, (A.x + B.x) / 2 - 6, y1, B.x - 8, y1);
          ctx.lineTo(B.x - 8, y1 + hh);
          ctx.bezierCurveTo((A.x + B.x) / 2 - 6, y1 + hh, (A.x + B.x) / 2 + 6, y0 + hh, A.x + 8, y0 + hh);
          ctx.closePath();
          ctx.globalAlpha = (on ? 0.5 : (hover ? 0.07 : 0.22)) * a;
          ctx.fillStyle = on ? K.SPOT : K.INK;
          ctx.fill();
          ctx.restore();
        });
        Object.keys(pos).forEach(function (k) {
          var p = pos[k];
          var on = hover === k;
          ctx.save();
          ctx.globalAlpha = a * (on ? 1 : 0.92);
          ctx.fillStyle = on ? K.SPOT : K.INK;
          ctx.fillRect(p.x - 8, p.y, 8, p.h);
          ctx.restore();
          K.label(ctx, L(p.node.zh, p.node.en), p.x - 14, p.y + p.h / 2 + 3,
            { align: 'right', size: 10.5, color: on ? K.SPOT : K.INK2 });
          K.label(ctx, String(nodeOut(k)), p.x - 14, p.y + p.h / 2 + 17, { align: 'right', size: 9.5, mono: true, color: K.INK4 });
        });
        K.label(ctx, L('单位：条记录', 'unit: records'), 12, h - 8, { size: 10, color: K.INK4 });
      }
      function at(mx, my) {
        var pos = layout(), best = null;
        Object.keys(pos).forEach(function (k) {
          var p = pos[k];
          if (mx > p.x - 22 && mx < p.x + 4 && my > p.y - 4 && my < p.y + p.h + 4) best = k;
        });
        return best;
      }
      st.cv.addEventListener('pointermove', function (e) {
        var r2 = st.cv.getBoundingClientRect();
        var k = at(e.clientX - r2.left, e.clientY - r2.top);
        if (k !== hover) {
          hover = k; draw();
          st.cv.style.cursor = k ? 'pointer' : 'default';
          if (k) {
            var outs = FLOWS.filter(function (f) { return f[0] === k; });
            var ins = FLOWS.filter(function (f) { return f[1] === k; });
            var nameOf = function (id) {
              var nm = null;
              COL.forEach(function (c) { c.forEach(function (n) { if (n.id === id) nm = n; }); });
              return L(nm.zh, nm.en);
            };
            read.innerHTML = '<b>' + K.esc(nameOf(k)) + '</b>　' +
              (ins.length ? L('来自 ', 'from ') + ins.map(function (f) { return nameOf(f[0]) + ' ' + f[2]; }).join('、') + '　·　' : '') +
              (outs.length ? L('流向 ', 'to ') + outs.map(function (f) { return nameOf(f[1]) + ' ' + f[2]; }).join('、') : '');
          }
        }
      });
      st.cv.addEventListener('pointerleave', function () { hover = null; draw(); });
      read.textContent = L('每个中间节点的进与出必须相等：桑基图的第一条规矩是守恒。宽度编码数量，位置编码顺序。',
        'Every intermediate node conserves: what flows in must flow out. Width encodes quantity; position encodes order.');
      var ticker = K.ticker(st, draw);
      if (st.onDraw) st.onDraw();
      return { destroy: function () { ticker.stop(); } };
    }
  };
})();
