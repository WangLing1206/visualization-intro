/* ==========================================================================
   hero.js — 封面：同一批数据点的六种组织方式
   优先使用 WebGL（three.js 点阵 + 自定义着色器），不可用时退回 2D 画布投影。
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ;
  var K = VIZ.kit;
  var I = VIZ.i18n;

  var STAGES = [
    { id: 'cloud', zh: ['散点云', '原始记录'], en: ['Point cloud', 'raw records'] },
    { id: 'grid', zh: ['格网', '结构化'], en: ['Grid', 'structure imposed'] },
    { id: 'bars', zh: ['柱群', '统计量'], en: ['Bars', 'summary statistics'] },
    { id: 'par', zh: ['平行轴', '多维记录'], en: ['Parallel axes', 'many dimensions'] },
    { id: 'net', zh: ['网络', '关系'], en: ['Network', 'relations'] },
    { id: 'globe', zh: ['地球', '地理空间'], en: ['Globe', 'geographic space'] }
  ];

  /* ---------- 目标形态：每个状态给出 n 个三维坐标 ---------- */
  function buildStates(n) {
    var r = K.rng(20261016);
    var S = {}, i, x, y, z, k;

    // 0 散点云
    var cloud = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      var th = r() * 6.2832, ph = Math.acos(2 * r() - 1), rad = 9.4 * Math.pow(r(), 0.34);
      cloud[i * 3] = rad * Math.sin(ph) * Math.cos(th) * 1.15;
      cloud[i * 3 + 1] = rad * Math.cos(ph) * 0.62;
      cloud[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th) * 1.15;
    }
    S.cloud = cloud;

    // 1 格网：点线构成的坐标纸（竖线与横线各占一半点数）
    var grid = new Float32Array(n * 3);
    var lines = 46, half = Math.floor(n / 2), perV = Math.floor(half / lines), perH = Math.floor((n - lines * perV) / lines);
    var W = 12.6, H = 7.6, g, k2, idx = 0;
    for (g = 0; g < lines; g++) {
      var gx = -W + (g / (lines - 1)) * 2 * W;
      for (k2 = 0; k2 < perV && idx < n; k2++, idx++) {
        grid[idx * 3] = gx;
        grid[idx * 3 + 1] = -H + (k2 / (perV - 1)) * 2 * H;
        grid[idx * 3 + 2] = 0;
      }
    }
    for (g = 0; g < lines; g++) {
      var gy = -H + (g / (lines - 1)) * 2 * H;
      for (k2 = 0; k2 < perH && idx < n; k2++, idx++) {
        grid[idx * 3] = -W + (k2 / (perH - 1)) * 2 * W;
        grid[idx * 3 + 1] = gy;
        grid[idx * 3 + 2] = 0;
      }
    }
    while (idx < n) {
      grid[idx * 3] = (r() - 0.5) * 2 * W;
      grid[idx * 3 + 1] = (r() - 0.5) * 2 * H;
      grid[idx * 3 + 2] = 0;
      idx++;
    }
    S.grid = grid;

    // 2 柱群：一段有起伏的分布
    var bars = new Float32Array(n * 3);
    var nb = 46, per = Math.ceil(n / nb);
    var heights = [];
    for (k = 0; k < nb; k++) {
      var t = k / (nb - 1);
      heights.push(1.4 + 8.2 * (0.42 + 0.34 * Math.sin(t * 5.1) + 0.22 * Math.sin(t * 13.7 + 1.2) + 0.14 * Math.sin(t * 31.0)));
    }
    var bw = 13.4 / nb;
    for (i = 0; i < n; i++) {
      var bi = Math.min(nb - 1, Math.floor(i / per));
      var h = heights[bi];
      var u = r(), v = r();
      bars[i * 3] = -6.7 + bi * bw + bw * 0.5 + (u - 0.5) * bw * 0.74;
      bars[i * 3 + 1] = -3.6 + Math.pow(v, 0.82) * h;
      bars[i * 3 + 2] = (r() - 0.5) * 0.9;
    }
    S.bars = bars;

    // 3 平行轴：5 条轴 + 记录折线
    var par = new Float32Array(n * 3);
    var axes = 5, axX = [], axH = 8.6;
    for (k = 0; k < axes; k++) axX.push(-7.4 + k * (14.8 / (axes - 1)));
    var perAxis = Math.floor(n * 0.13 / axes);
    var used = 0;
    for (k = 0; k < axes; k++) {
      for (i = 0; i < perAxis; i++) {
        par[used * 3] = axX[k] + (r() - 0.5) * 0.05;
        par[used * 3 + 1] = (r() - 0.5) * axH;
        par[used * 3 + 2] = (r() - 0.5) * 0.05;
        used++;
      }
    }
    var recs = 900, perRec = 20, dims = [];
    for (i = 0; i < recs; i++) {
      var a0 = r(), a1 = a0 * 0.7 + r() * 0.3, a2 = r(), a3 = a1 * 0.5 + r() * 0.5, a4 = a0 * 0.3 + r() * 0.7;
      dims.push([a0, a1, a2, a3, a4]);
    }
    var ri = 0, pi = 0;
    while (used < n) {
      var d = dims[ri % recs];
      var seg = Math.min(axes - 2, Math.floor(pi / perRec * (axes - 1)));
      var lt = (pi % perRec) / perRec;
      var v0 = d[seg] * 2 - 1, v1 = d[seg + 1] * 2 - 1;
      par[used * 3] = K.lerp(axX[seg], axX[seg + 1], lt);
      par[used * 3 + 1] = K.lerp(v0, v1, lt) * axH * 0.46;
      par[used * 3 + 2] = (r() - 0.5) * 0.06;
      used++; pi++;
      if (pi >= perRec * (axes - 1)) { pi = 0; ri++; }
    }
    S.par = par;

    // 4 网络：群团 + 边
    var net = VIZ.kit.data.network, pos3 = [], cn = 5;
    var nodes = net.nodes;
    for (i = 0; i < nodes.length; i++) {
      var ang = nodes[i].a * 1.5 + i * 0.4;
      pos3.push([
        Math.cos(nodes[i].a) * nodes[i].r * 11.5 + Math.sin(i * 2.1) * 0.8,
        Math.sin(nodes[i].a) * nodes[i].r * 6.4 + Math.cos(i * 1.7) * 0.8,
        (i % 3 - 1) * 1.5 + Math.cos(ang) * 1.6
      ]);
    }
    var netArr = new Float32Array(n * 3);
    var perNode = Math.floor(n * 0.72 / nodes.length), u2 = 0, rad;
    for (i = 0; i < nodes.length && u2 < n; i++) {
      rad = 0.92 - nodes[i].r * 0.42;
      for (k = 0; k < perNode && u2 < n; k++) {
        var tt = r() * 6.2832, pp = Math.acos(2 * r() - 1), rr = rad * Math.pow(r(), 0.5);
        netArr[u2 * 3] = pos3[i][0] + rr * Math.sin(pp) * Math.cos(tt);
        netArr[u2 * 3 + 1] = pos3[i][1] + rr * Math.cos(pp);
        netArr[u2 * 3 + 2] = pos3[i][2] + rr * Math.sin(pp) * Math.sin(tt);
        u2++;
      }
    }
    var li = 0;
    while (u2 < n) {
      var L = net.links[li % net.links.length];
      var lt2 = r(), a = pos3[L.s], b = pos3[L.t];
      netArr[u2 * 3] = K.lerp(a[0], b[0], lt2) + (r() - 0.5) * 0.08;
      netArr[u2 * 3 + 1] = K.lerp(a[1], b[1], lt2) + (r() - 0.5) * 0.08;
      netArr[u2 * 3 + 2] = K.lerp(a[2], b[2], lt2) + (r() - 0.5) * 0.08;
      u2++; li++;
    }
    S.net = netArr;

    // 5 地球：陆地点阵 + 数据环
    var globe = new Float32Array(n * 3);
    var mask = landMask(180, 90);
    var landCells = mask.cells;
    var R = 6.1, lc = Math.floor(n * 0.56);
    for (i = 0; i < lc; i++) {
      var ci = landCells[Math.floor(r() * landCells.length)];
      var cl = ci % 180, rw = Math.floor(ci / 180);
      var lon = (-180 + (cl + r()) * 2) * Math.PI / 180;
      var lat = (90 - (rw + r()) * 2) * Math.PI / 180;
      var cl2 = Math.cos(lat);
      globe[i * 3] = R * cl2 * Math.sin(lon);
      globe[i * 3 + 1] = R * Math.sin(lat);
      globe[i * 3 + 2] = R * cl2 * Math.cos(lon);
    }
    for (; i < n; i++) {
      var ra = 8.2 + K.gauss(r) * 0.75;
      var ta = r() * 6.2832;
      globe[i * 3] = Math.cos(ta) * ra;
      globe[i * 3 + 1] = K.gauss(r) * 0.34;
      globe[i * 3 + 2] = Math.sin(ta) * ra;
    }
    S.globe = globe;

    return S;
  }

  /* 陆地掩膜：按纬线扫描填充，采样时 O(1) */
  var _mask = null;
  function landMask(cols, rows) {
    if (_mask) return _mask;
    var x = function (lon) { return (lon + 180) / 360 * cols; };
    var y = function (lat) { return (90 - lat) / 180 * rows; };
    var grid = new Uint8Array(cols * rows);
    var land = window.VIZ_LAND || [];
    for (var p = 0; p < land.length; p++) {
      var ring = land[p];
      for (var r = 0; r < rows; r++) {
        var lat = 90 - (r + 0.5) * (180 / rows);
        var xs = [];
        for (var i = 0; i < ring.length; i++) {
          var a = ring[i], b = ring[(i + 1) % ring.length];
          if ((a[1] > lat) === (b[1] > lat)) continue;
          xs.push(x(a[0]) + (x(b[0]) - x(a[0])) * ((lat - a[1]) / (b[1] - a[1])));
        }
        if (xs.length < 2) continue;
        xs.sort(function (m, n2) { return m - n2; });
        for (var j = 0; j + 1 < xs.length; j += 2) {
          var c0 = Math.max(0, Math.ceil(xs[j])), c1 = Math.min(cols - 1, Math.floor(xs[j + 1]));
          for (var c = c0; c <= c1; c++) grid[r * cols + c] = 1;
        }
      }
    }
    var cells = [];
    for (var q = 0; q < grid.length; q++) if (grid[q]) cells.push(q);
    _mask = { cols: cols, rows: rows, cells: cells };
    return _mask;
  }

  /* 每个状态的默认视角：绕 y 的基准角与俯角 */
  var BASE = {
    cloud: [-0.30, 0.10], grid: [-0.34, 0.20], bars: [-0.56, 0.16],
    par: [-0.12, 0.10], net: [-0.30, 0.16], globe: [-0.1, 0.14]
  };

  /* ---------- 状态 ---------- */
  var state = {
    i: 0, next: null, p: 1, dur: 1.55, auto: true, t0: 0,
    dragging: false, mx: 0, my: 0, userY: 0, userX: 0, rotY: -0.30, rotX: 0.10,
    lang: 'zh', count: 0, mode: 'canvas'
  };

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* ---------- 三种粒子属性：大小、颜色、相位 ---------- */
  function makeAttrs(n, r) {
    var size = new Float32Array(n), color = new Float32Array(n * 3), phase = new Float32Array(n);
    var nRed = Math.max(6, Math.round(n * 0.022));
    var redIdx = {};
    for (var i = 0; i < nRed; i++) redIdx[Math.floor(r() * n)] = 1;
    for (i = 0; i < n; i++) {
      var isRed = redIdx[i] === 1;
      size[i] = isRed ? 1.5 + r() * 0.7 : 0.58 + r() * 0.72;
      if (isRed) { color[i * 3] = 1.0; color[i * 3 + 1] = 0.30; color[i * 3 + 2] = 0.22; }
      else {
        var b = 0.62 + r() * 0.42;
        color[i * 3] = b; color[i * 3 + 1] = b; color[i * 3 + 2] = b * 1.02;
      }
      phase[i] = r();
    }
    return { size: size, color: color, phase: phase };
  }

  /* ---------- WebGL 渲染器 ---------- */
  function WebGLHero(canvas, n, states, attrs) {
    var THREE = window.THREE;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 1);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    var group = new THREE.Group();
    scene.add(group);

    var geo = new THREE.BufferGeometry();
    var cur = new Float32Array(states.cloud);   // 当前坐标
    geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(attrs.size, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(attrs.color, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(attrs.phase, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uSize: { value: 2.9 } },
      vertexShader: [
        'attribute float aSize;',
        'attribute vec3 aColor;',
        'attribute float aPhase;',
        'uniform float uTime; uniform float uPR; uniform float uSize;',
        'varying vec3 vColor;',
        'void main() {',
        '  vec3 p = position;',
        '  p.x += cos(uTime * 0.5 + aPhase * 6.2832) * 0.014;',
        '  p.y += sin(uTime * 0.62 + aPhase * 6.2832) * 0.016;',
        '  p.z += sin(uTime * 0.44 + aPhase * 4.1) * 0.05;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float att = clamp(20.0 / max(-mv.z, 0.1), 0.62, 1.9);',
        '  gl_PointSize = uSize * aSize * uPR * att;',
        '  float d = clamp((mv.z + 32.0) / 24.0, 0.28, 1.0);',
        '  vColor = aColor * d;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vColor;',
        'void main() {',
        '  vec2 d = gl_PointCoord - vec2(0.5);',
        '  float r2 = dot(d, d);',
        '  float a = smoothstep(0.25, 0.0, r2);',
        '  if (a < 0.02) discard;',
        '  gl_FragColor = vec4(vColor, a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    var pts = new THREE.Points(geo, mat);
    group.add(pts);

    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      mat.uniforms.uPR.value = Math.min(2, window.devicePixelRatio || 1);
    }

    return {
      resize: resize,
      update: function (cur, time) {
        geo.attributes.position.array.set(cur);
        geo.attributes.position.needsUpdate = true;
        mat.uniforms.uTime.value = time;
        group.rotation.y = state.rotY;
        group.rotation.x = state.rotX;
        camera.position.x = state.mx * 1.5;
        camera.position.y = -state.my * 1.1;
        camera.position.z = 18.2;
        camera.lookAt(-1.9, 0, 0);   // 视线略偏左，主体因此落在画面右半边
        renderer.render(scene, camera);
      }
    };
  }

  /* ---------- 2D 画布后备渲染器 ---------- */
  function CanvasHero(canvas, n, states, attrs) {
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    function resize() {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var cols = [];
    for (var i = 0; i < n; i++) {
      cols.push(attrs.color[i * 3] > 0.9 && attrs.color[i * 3 + 1] < 0.5
        ? 'rgba(255,72,54,' : 'rgba(226,228,232,');
    }
    return {
      resize: resize,
      update: function (cur, time) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        var cy = Math.cos(state.rotY), sy = Math.sin(state.rotY);
        var cx = Math.cos(state.rotX), sx = Math.sin(state.rotX);
        var scale = Math.min(w, h * 1.35) / 22;
        var cxp = w / 2, cyp = h / 2;
        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < n; i++) {
          var x = cur[i * 3], y = cur[i * 3 + 1], z = cur[i * 3 + 2];
          var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
          var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
          var zz = z2 + 18.2;
          if (zz < 0.6) continue;
          var f = 18.2 / zz;
          var px = cxp + x1 * scale * f, py = cyp - y1 * scale * f;
          if (px < -6 || px > w + 6 || py < -6 || py > h + 6) continue;
          var fade = K.clamp((zz - 4) / 24, 0.12, 1);
          ctx.fillStyle = cols[i] + (0.34 * fade * (0.5 + attrs.size[i] * 0.5)).toFixed(3) + ')';
          var s = attrs.size[i] * 1.5 * dpr * f;
          ctx.fillRect(px, py, s > 1.1 ? s : 1.1, s > 1.1 ? s : 1.1);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---------- 交互与生命周期 ---------- */
  var env = null;
  var baseY = K.spring(-0.30), baseX = K.spring(0.10);

  function morphTo(i, instant) {
    if (i === state.i && state.p >= 1) return;
    var st = STAGES[i];
    if (!st || !env) return;
    env.from.set(env.cur);
    env.to = env.states[st.id];
    env.start = performance.now() / 1000;
    state.p = 0;
    state.i = i;
    if (instant || K.reduced) {
      env.cur.set(env.to);
      state.p = 1;
    }
    paintLadder();
  }

  function step(dt, t) {
    if (!env) return;
    var st = STAGES[state.i];
    if (state.p < 1) state.p = Math.min(1, state.p + dt / state.dur);
    var p = state.p;
    var n = env.n, cur = env.cur, from = env.from, to = to3(env, st.id);
    if (p < 1) {
      var pa = env.archA, pb = env.archB, pc = env.archC;
      for (var i = 0; i < n; i++) {
        var i3 = i * 3;
        // 每颗粒子有自己的出发时刻，形成“群落迁移”的观感
        var lp = state.p - env.attrs.phase[i] * 0.34;
        lp = lp <= 0 ? 0 : (lp >= 0.66 ? 1 : K.ease.inOut(lp / 0.66));
        var arch = 0;
        if (lp > 0 && lp < 1) arch = Math.sin(Math.PI * lp) * (0.9 + env.attrs.phase[i] * 2.4);
        cur[i3] = K.lerp(from[i3], to[i3], lp) + pa[i] * arch * 0.4;
        cur[i3 + 1] = K.lerp(from[i3 + 1], to[i3 + 1], lp) + pb[i] * arch * 0.5;
        cur[i3 + 2] = K.lerp(from[i3 + 2], to[i3 + 2], lp) + pc[i] * arch * 0.4;
      }
    } else if (env.lastP < 1) {
      env.cur.set(to3(env, st.id));
    }
    env.lastP = p;

    // 自动巡演
    if (state.auto && !K.reduced && t - state.t0 > 7.2) {
      state.t0 = t;
      morphTo((state.i + 1) % STAGES.length);
    }
    // 视角：绕状态的基准角缓慢摆动，叠加拖拽偏移
    var B = BASE[st.id] || BASE.cloud;
    baseY.to(B[0]); baseX.to(B[1]);
    var by = baseY.step(dt), bx = baseX.step(dt);
    var osc = K.reduced ? 0 : Math.sin(t * 0.13) * 0.17;
    state.rotY = by + osc + state.userY;
    state.rotX = K.clamp(bx + state.userX, -0.5, 0.9);
    env.renderer.update(cur, t);
  }

  var _tmp = {};
  function to3(env, id) { return env.states[id]; }
  function wave(phase, k, cos) {
    var a = new Float32Array(phase.length);
    for (var i = 0; i < phase.length; i++) a[i] = cos ? Math.cos(phase[i] * k) : Math.sin(phase[i] * k);
    return a;
  }

  function paintLadder() {
    var host = document.getElementById('cover-stages');
    if (!host) return;
    Array.prototype.forEach.call(host.children, function (b, i) {
      b.setAttribute('aria-current', String(i === state.i));
    });
    var fig = document.getElementById('cover-fig');
    if (fig && env) {
      var s = STAGES[state.i];
      var lab = s[state.lang][0] + ' · ' + s[state.lang][1];
      fig.innerHTML =
        '<b>' + I.t('cover.figCap') + '</b><br>' +
        '<span class="counter">' + state.count.toLocaleString('en-US') + '</span> points · ' +
        I.t('cover.figNote') + '<br>' + lab;
    }
  }

  function buildLadder() {
    var host = document.getElementById('cover-stages');
    if (!host) return;
    host.innerHTML = '';
    STAGES.forEach(function (s, i) {
      var b = K.ce('button', { type: 'button' }, [
        K.ce('span', { class: 'idx', text: '0' + (i + 1) }),
        K.ce('span', { class: 'lb' }, [
          K.ce('span', { text: s[state.lang][0] }),
          K.ce('span', { class: 'lb-en', text: s[state.lang === 'zh' ? 'en' : 'zh'][1] })
        ])
      ]);
      b.addEventListener('click', function () {
        state.auto = false;
        state.t0 = performance.now() / 1000;
        morphTo(i);
      });
      host.appendChild(b);
    });
    paintLadder();
  }

  function bindInput(canvas) {
    var down = false, px = 0, py = 0;
    canvas.addEventListener('pointerdown', function (e) {
      down = true; px = e.clientX; py = e.clientY;
      state.dragging = true;
      state.auto = false;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (down) {
        state.userY += (e.clientX - px) * 0.0055;
        state.userX = K.clamp(state.userX + (e.clientY - py) * 0.0035, -0.4, 0.6);
        px = e.clientX; py = e.clientY;
      } else {
        var r = canvas.getBoundingClientRect();
        state.mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        state.my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      canvas.addEventListener(ev, function () { down = false; state.dragging = false; });
    });
    canvas.addEventListener('dblclick', function () { state.auto = !state.auto; state.t0 = performance.now() / 1000; });
  }

  var hero = {
    init: function () {
      var canvas = document.getElementById('cover-canvas');
      if (!canvas || env) return;
      var useGL = !!(window.THREE && hasWebGL() && !K.reduced);
      var n = useGL ? 30000 : 3000;
      var r = K.rng(4242);
      var states = buildStates(n);
      var attrs = makeAttrs(n, r);
      var renderer;
      try {
        renderer = useGL
          ? WebGLHero(canvas, n, states, attrs)
          : CanvasHero(canvas, n, states, attrs);
      } catch (e) {
        console.warn('cover: falling back to 2d', e);
        renderer = CanvasHero(canvas, n, states, attrs);
      }
      env = {
        n: n, states: states, attrs: attrs, renderer: renderer,
        cur: new Float32Array(states.cloud), from: new Float32Array(states.cloud),
        archA: wave(attrs.phase, 31.4), archB: wave(attrs.phase, 17.7), archC: wave(attrs.phase, 23.1, true),
        lastP: 1
      };
      state.count = n;
      state.mode = useGL ? 'webgl' : 'canvas';
      state.lang = I.lang;
      renderer.resize();
      bindInput(canvas);
      var t0 = performance.now() / 1000;
      state.t0 = t0;
      K.ticker({ cv: canvas }, function (dt, t) { step(dt, t); });
      window.addEventListener('resize', function () { renderer.resize(); });
      buildLadder();
      // 首帧同步绘制：动画循环被节流或不可用时，封面仍然是一张完整的图
      step(0, t0);
      // 开场：从散点云收拢到格网，再回到自动巡演
      setTimeout(function () { morphTo(1); }, 1400);
      setTimeout(function () { state.auto = true; state.t0 = performance.now() / 1000; }, 4200);
      VIZ.i18n.onChange(function (lang) { state.lang = lang; buildLadder(); });
    },
    setLang: function (lang) { state.lang = lang; },
    webgl: function () { return state.mode === 'webgl'; },
    /* 供调试与验证：立即切到某个状态并同步重绘 */
    show: function (i) {
      if (!env) return;
      state.auto = false;
      morphTo(i, true);
      var B = BASE[STAGES[i].id] || BASE.cloud;
      baseY.jump(B[0]); baseX.jump(B[1]);
      step(0, performance.now() / 1000);
    },
    states: function () { return STAGES.map(function (s) { return s.id; }); }
  };

  VIZ.hero = hero;
})();
