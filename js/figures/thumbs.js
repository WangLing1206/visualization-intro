/* ==========================================================================
   thumbs.js — 目录行内的微缩图：每章一张，悬停时重画一次
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit;
  var INK = K.INK, INK3 = K.INK3, INK4 = K.INK4, SPOT = K.SPOT, RULE = K.RULE;

  function base(ctx, w, h) {
    K.clear(ctx, w, h);
    ctx.save();
    ctx.translate(5, 5);
    return { w: w - 10, h: h - 10 };
  }
  function mk(fn, opts) {
    return function (ctx, w, h, t) {
      var s = base(ctx, w, h);
      fn(ctx, s.w, s.h, t == null ? 1 : t, opts || {});
      ctx.restore();
    };
  }
  function dot(ctx, x, y, r, c, a) { K.dot(ctx, x, y, r, c, a); }
  function seg(ctx, x0, y0, x1, y1, c, w, a) { K.line(ctx, [[x0, y0], [x1, y1]], { color: c, width: w || 1, alpha: a }); }

  var painters = {
    /* 1 绪论：数据沿流程流动 */
    pipeline: mk(function (ctx, w, h, t) {
      var y = h / 2, n = 4, bw = w / n;
      for (var i = 0; i < n; i++) {
        var x = i * bw + bw * 0.16, ww = bw * 0.68;
        ctx.save();
        ctx.globalAlpha = 0.14 + 0.1 * i / n;
        ctx.fillStyle = INK;
        ctx.fillRect(x, y - h * 0.3, ww, h * 0.6);
        ctx.restore();
        ctx.strokeStyle = RULE; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y - h * 0.3 + 0.5, ww - 1, h * 0.6 - 1);
        if (i < n - 1) {
          for (var k = 0; k < 2; k++) {
            var p = (t * 1.1 + k * 0.5 + i * 0.3) % 1;
            dot(ctx, x + ww + bw * 0.3 * p + bw * 0.02, y, 1.5, p < 0.55 ? SPOT : INK, 0.5 + 0.5 * Math.sin(p * 3.14));
          }
        }
      }
    }),

    /* 2 感知：近邻分组 */
    gestalt: mk(function (ctx, w, h, t) {
      var g = [[0.2, 0.42, 6], [0.52, 0.36, 5], [0.8, 0.5, 4]];
      g.forEach(function (gr, gi) {
        for (var i = 0; i < gr[2]; i++) {
          var a = i * 2.39 + gi, r = 3 + (i % 3) * 3.4;
          var x = gr[0] * w + Math.cos(a) * r, y = h * gr[1] + Math.sin(a) * r * 0.8;
          var appear = K.clamp(t * 1.6 - i * 0.09 - gi * 0.1, 0, 1);
          dot(ctx, x, y, 1.7 * appear, gi === 1 && i === 0 ? SPOT : INK, 0.35 + 0.5 * appear);
        }
        K.ring(ctx, gr[0] * w, h * gr[1], 9 - 9 * (1 - t), RULE, 1, 0.9);
      });
    }),

    /* 3 数据：表格与类型 */
    types: mk(function (ctx, w, h, t) {
      var cols = 6, rows = 4, cw = w / cols, ch = h / rows;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var on = t > (r * cols + c) / (rows * cols) * 0.7;
          var v = ((r * 7 + c * 3) % 5) / 4;
          ctx.save();
          ctx.globalAlpha = on ? 0.1 + v * 0.75 : 0.05;
          ctx.fillStyle = (r === 1 && c === 4) ? SPOT : INK;
          if (c === 0) ctx.fillRect(c * cw, r * ch + ch * 0.3, cw * 0.42, ch * 0.36);
          else ctx.fillRect(c * cw, r * ch + ch * 0.3, cw * (0.2 + v * 0.66), ch * 0.36);
          ctx.restore();
        }
        K.hline(ctx, 0, w, r * ch, RULE);
      }
    }),

    /* 4 任务：同心任务环 */
    tasks: mk(function (ctx, w, h, t) {
      var cx = w * 0.36, cy = h / 2;
      [0.32, 0.6, 0.9].forEach(function (f, i) {
        K.ring(ctx, cx, cy, Math.min(h / 2, w * 0.36) * f * (0.5 + 0.5 * t), RULE, 1, 0.9 - i * 0.12);
      });
      var pts = [[0.14, 0.3], [0.3, 0.66], [0.45, 0.42], [0.6, 0.2], [0.72, 0.5], [0.84, 0.34], [0.52, 0.78]];
      pts.forEach(function (p, i) {
        var a = K.clamp(t * 1.8 - i * 0.11, 0, 1);
        dot(ctx, cx + p[0] * w * 0.9, p[1] * h, 2 * a, i === 4 ? SPOT : INK, 0.28 + 0.55 * a);
      });
      seg(ctx, 0, h - 1, w, h - 1, INK, 1, 0.6);
    }),

    /* 5 设计：三种标记 × 通道 */
    encoding: mk(function (ctx, w, h, t) {
      var cw = w / 3, chh = h / 2;
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 3; c++) {
          var cx = c * cw + cw / 2, cy = r * chh + chh / 2;
          var p = K.clamp(t * 1.5 - (r * 3 + c) * 0.08, 0, 1);
          var col = (r === 0 && c === 2) ? SPOT : INK;
          if (r === 0) {
            ctx.save(); ctx.globalAlpha = 0.2 + 0.7 * p; ctx.fillStyle = col;
            ctx.fillRect(cx - cw * 0.2, cy + chh * 0.3 - chh * 0.6 * p, cw * 0.4, chh * 0.6 * p);
            ctx.restore();
          } else if (c === 0) {
            dot(ctx, cx, cy, 3.6 * p, col, 0.9);
          } else if (c === 1) {
            seg(ctx, cx - cw * 0.3, cy + 6, cx + cw * 0.3, cy - 6 * p, col, 1.4, 0.9);
          } else {
            ctx.save(); ctx.globalAlpha = 0.25 + 0.6 * p; ctx.fillStyle = col;
            ctx.fillRect(cx - cw * 0.3, cy - chh * 0.2, cw * 0.6, chh * 0.4 * p);
            ctx.restore();
          }
          K.hline(ctx, c * cw, (c + 1) * cw, r * chh, RULE);
        }
      }
    }),

    /* 6 高维：平行坐标 */
    parallel: mk(function (ctx, w, h, t) {
      var n = 4, ax = [];
      for (var i = 0; i < n; i++) ax.push(w * (0.08 + i * 0.84 / (n - 1)));
      ax.forEach(function (x) { K.vline(ctx, x, 2, h - 2, INK4, null); });
      var r = K.rng(9);
      for (var k = 0; k < 9; k++) {
        var base = r();
        var pts = ax.map(function (x, i) {
          var v = K.clamp(base + (r() - 0.5) * 0.75, 0, 1);
          return [x, 4 + v * (h - 8)];
        });
        var p2 = K.clamp(t * 1.6 - k * 0.07, 0, 1);
        if (k === 3) K.line(ctx, pts, { color: SPOT, width: 1.4, alpha: 0.85 * p2 });
        else K.line(ctx, pts, { color: INK, width: 0.9, alpha: 0.26 * p2 });
      }
    }),

    /* 7 时序：三张小图 */
    time: mk(function (ctx, w, h, t) {
      var rows = 3, rh = h / rows;
      for (var r = 0; r < rows; r++) {
        var y0 = r * rh + 3, hh = rh - 6;
        var pts = [];
        for (var i = 0; i < 26; i++) {
          var x = i / 25 * w;
          var v = 0.5 + 0.3 * Math.sin(i * 0.42 + r * 1.7) + 0.14 * Math.sin(i * 1.3 + r);
          pts.push([x, y0 + hh - v * hh]);
        }
        var n = Math.max(2, Math.floor(pts.length * K.clamp(t * 1.5 - r * 0.15, 0, 1)));
        K.line(ctx, pts.slice(0, n), { color: r === 0 ? SPOT : INK3, width: 1.2, alpha: r === 0 ? 0.9 : 0.65 });
      }
    }),

    /* 8 地理：地球与陆地点阵 */
    geo: mk(function (ctx, w, h, t) {
      var R = Math.min(h / 2, w * 0.3), cx = w * 0.33, cy = h / 2;
      K.ring(ctx, cx, cy, R, RULE, 1, 0.9);
      var r = K.rng(5);
      for (var i = 0; i < 90; i++) {
        var a = r() * 6.2832, b = Math.acos(2 * r() - 1);
        var x = Math.cos(b), y = Math.sin(b);
        if (x < -0.15) continue;
        var appear = K.clamp(t * 1.4 - i * 0.012, 0, 1);
        dot(ctx, cx + x * Math.sin(a) * R, cy + y * R * 0.98, 1.1 * appear, i % 23 === 0 ? SPOT : INK, 0.3 + 0.5 * appear);
      }
      var pts = [[0.62, 0.3], [0.72, 0.55], [0.85, 0.36], [0.9, 0.66], [0.56, 0.72], [0.8, 0.82]];
      pts.forEach(function (p, i) {
        var a2 = K.clamp(t * 1.6 - i * 0.1, 0, 1);
        dot(ctx, p[0] * w, p[1] * h, 2.2 * a2, i === 2 ? SPOT : INK, 0.9);
      });
      seg(ctx, w * 0.5, 4, w * 0.5, h - 4, RULE, 1, 0.9);
    }),

    /* 9 网络：节点与边 */
    network: mk(function (ctx, w, h, t) {
      var r = K.rng(21), nodes = [];
      for (var i = 0; i < 16; i++) {
        nodes.push([w * (0.08 + r() * 0.84), h * (0.1 + r() * 0.8), r()]);
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]);
          if (d < Math.min(w, h) * 0.33 && r() < 0.8) {
            seg(ctx, nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], INK, 0.8, 0.14 + 0.2 * t);
          }
        }
      }
      nodes.forEach(function (p, i) {
        var ap = K.clamp(t * 1.7 - i * 0.05, 0, 1);
        dot(ctx, p[0], p[1], (1.4 + p[2] * 2) * ap, i === 5 ? SPOT : INK, 0.3 + 0.6 * ap);
      });
    }),

    /* 10 交互：焦点 + 上下文 */
    interaction: mk(function (ctx, w, h, t) {
      var r = K.rng(77);
      var pts = [];
      for (var i = 0; i < 76; i++) pts.push([r() * w, h * (0.12 + r() * 0.78)]);
      pts.forEach(function (p) {
        var d = Math.hypot(p[0] - w * 0.52, p[1] - h * 0.5);
        dot(ctx, p[0], p[1], 1.5, INK, 0.2);
      });
      var R = 15 * (0.6 + 0.4 * t);
      ctx.save();
      ctx.beginPath(); ctx.arc(w * 0.52, h * 0.5, R, 0, 6.2832);
      ctx.clip();
      pts.forEach(function (p) {
        var d = Math.hypot(p[0] - w * 0.52, p[1] - h * 0.5);
        if (d < R * 1.6) {
          var mag = K.clamp(1 - d / (R * 1.6), 0, 1);
          var mx = w * 0.52 + (p[0] - w * 0.52) * (1 + 0.55 * mag);
          var my = h * 0.5 + (p[1] - h * 0.5) * (1 + 0.55 * mag);
          dot(ctx, mx, my, 1.6 + mag * 1.6, d < R * 0.5 ? SPOT : INK, 0.35 + 0.6 * mag);
        }
      });
      ctx.restore();
      K.ring(ctx, w * 0.52, h * 0.5, R, INK4, 1, 0.9);
    }),

    /* 11 评估：两种条件下的结果 */
    evaluate: mk(function (ctx, w, h, t) {
      var groups = [[0.44, 0.72, 0.58], [0.86, 0.62, 0.78]];
      var gw = w / 2;
      groups.forEach(function (g, gi) {
        g.forEach(function (v, i) {
          var bw = gw * 0.2, x = gi * gw + gw * 0.16 + i * (bw * 1.32);
          var bh = v * h * 0.8 * t;
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = (gi === 1 && i === 0) ? SPOT : INK;
          ctx.fillRect(x, h - bh, bw, bh);
          ctx.restore();
        });
        if (gi === 0) K.vline(ctx, gw, 2, h, RULE, null);
      });
      K.hline(ctx, 0, w, h, INK, null);
    }),

    /* 备用：坐标轴 + 折线 */
    'default': mk(function (ctx, w, h, t) {
      seg(ctx, 0, h - 1, w, h - 1, INK, 1, 0.9);
      seg(ctx, 0, 0, 0, h - 1, RULE, 1, 0.9);
      var pts = [];
      for (var i = 0; i < 24; i++) {
        pts.push([i / 23 * w, h - (0.2 + 0.55 * Math.abs(Math.sin(i * 0.36)) + 0.1 * Math.sin(i)) * h]);
      }
      for (var k = 1; k <= 4; k++) {
        K.line(ctx, pts.map(function (p) { return [p[0], p[1] - k * 3]; }),
          { color: INK, width: 0.9, alpha: 0.16 * t });
      }
      K.line(ctx, pts, { color: INK, width: 1.3, alpha: 0.9 });
    })
  };

  function paint(cv, key, t) {
    var w = cv.clientWidth || 176, h = cv.clientHeight || 62;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (painters[key] || painters['default'])(ctx, w, h, t);
  }

  function animate(cv, key) {
    var t0 = performance.now(), dur = K.reduced ? 1 : 780;
    var id = K.raf.add(function (dt, time) {
      var p = K.clamp((performance.now() - t0) / dur, 0, 1);
      paint(cv, key, K.ease.out(p));
      if (p >= 1) K.raf.remove(id);
    });
    paint(cv, key, 0);
  }

  VIZ.thumbs = { paint: paint, animate: animate, keys: Object.keys(painters) };
})();
