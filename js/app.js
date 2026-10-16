/* ==========================================================================
   app.js — 路由、目录、正文渲染、左栏导航、检索、进度
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ, K = VIZ.kit, I = VIZ.i18n;
  var figures = VIZ.figures;
  var mounted = [];      // 当前页面上已挂载的交互图
  var scrollSpy = null;

  /* ---------- 行内标记：**粗体** `代码` [链接](url) ---------- */
  function inline(s) {
    if (!s) return '';
    var out = K.esc(String(s));
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return out;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function paras(text, cls) {
    return String(text).split(/\n{2,}/).map(function (p) {
      return el('p', cls || null, inline(p.trim()));
    });
  }

  /* ---------- 章节元信息 ---------- */
  function chapters() { return VIZ.content.slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; }); }
  function chapterById(id) {
    id = String(id).replace(/^0+/, '') || '0';
    return chapters().filter(function (c) { return String(parseInt(c.id, 10)) === id; })[0];
  }
  function lang(obj, key) {
    var L = obj[I.lang] || obj.zh;
    return key ? L[key] : L;
  }
  function figCount(ch) {
    var n = 0;
    (ch.sections || []).forEach(function (s) {
      (s.blocks || []).forEach(function (b) { if (b.t === 'fig') n++; });
    });
    return n;
  }
  function readingTime(ch) {
    var chars = 0;
    (ch.sections || []).forEach(function (s) {
      (s.blocks || []).forEach(function (b) {
        if (typeof b.zh === 'string') chars += b.zh.length;
        else if (Array.isArray(b.zh)) chars += b.zh.join('').length;
        else if (b.zh && b.zh.rows) b.zh.rows.forEach(function (r) { chars += r.join('').length; });
        if (b.t === 'code') chars += b.code.length * 0.2;
      });
    });
    return Math.max(3, Math.round(chars / 400) + figCount(ch) * 2);
  }

  /* ---------- 封面文字 ---------- */
  function paintCover() {
    var t = document.getElementById('cover-title');
    var alt = document.getElementById('cover-title-en');
    if (t) t.textContent = I.t('cover.title');
    if (alt) alt.textContent = I.t('cover.titleAlt');
  }

  /* ---------- 目录 ---------- */
  function buildToc() {
    var host = document.getElementById('toc');
    if (!host) return;
    host.innerHTML = '';
    chapters().forEach(function (ch) {
      var row = el('a', 'toc-row reveal');
      row.href = '#/ch/' + ch.id;
      var num = el('div', 'toc-num', ch.id);
      var main = el('div', 'toc-main');
      var zhTitle = I.lang === 'zh' ? lang(ch).title : (ch.zh.title || '');
      var altTitle = I.lang === 'zh' ? (ch.en.title || '') : (ch.zh.title || '');
      main.appendChild(el('div', 'toc-zh', K.esc(lang(ch).title)));
      main.appendChild(el('div', 'toc-en', K.esc(altTitle)));
      if (lang(ch).sub) main.appendChild(el('div', 'toc-desc', inline(lang(ch).sub)));
      var thumb = el('div', 'toc-thumb');
      var cv = document.createElement('canvas');
      thumb.appendChild(cv);
      thumb.appendChild(el('span', 'toc-thumb-tag', (figCount(ch)) + ' ' + (I.lang === 'zh' ? '图' : 'fig.') + ' · ' + readingTime(ch) + ' ' + I.t('ch.min')));
      var go = el('div', 'toc-go', '→');
      row.appendChild(num); row.appendChild(main); row.appendChild(thumb); row.appendChild(go);
      host.appendChild(row);
      VIZ.thumbs.paint(cv, ch.thumb || 'default');
      row.addEventListener('pointerenter', function () { VIZ.thumbs.animate(cv, ch.thumb || 'default'); });
      row.addEventListener('focus', function () { VIZ.thumbs.animate(cv, ch.thumb || 'default'); });
    });
    var note = document.getElementById('contents-note');
    if (note) {
      note.textContent = chapters().length + ' ' + I.t('ch.chapters') + ' · ' +
        totalSections() + ' ' + (I.lang === 'zh' ? '节' : 'sections') + ' · ' +
        totalFigures() + ' ' + (I.lang === 'zh' ? '张交互图' : 'live figures');
    }
    revealIn();
  }
  function totalSections() {
    return chapters().reduce(function (a, c) { return a + (c.sections || []).length; }, 0);
  }
  function totalFigures() {
    return chapters().reduce(function (a, c) { return a + figCount(c); }, 0);
  }

  /* ---------- 首屏数字 ---------- */
  function buildFacts() {
    var host = document.getElementById('facts');
    if (!host) return;
    var items = [
      [chapters().length, I.t('facts.chapters')],
      [totalSections(), I.t('facts.sections')],
      [totalFigures(), I.t('facts.figures')],
      [2, I.t('facts.langs')]
    ];
    host.innerHTML = '';
    items.forEach(function (it) {
      host.appendChild(el('div', null,
        '<div class="fact-n">' + it[0] + '</div><div class="fact-l">' + K.esc(it[1]) + '</div>'));
    });
  }

  /* ---------- 正文渲染 ---------- */
  function blockNode(b, ctx) {
    var L = I.lang;
    if (b.t === 'p') {
      var ps = paras(b[L] || b.zh);
      var frag = document.createDocumentFragment();
      ps.forEach(function (p) { frag.appendChild(p); });
      return frag;
    }
    if (b.t === 'h3') return el('h3', null, inline(b[L] || b.zh));
    if (b.t === 'list' || b.t === 'num') {
      var list = document.createElement(b.t === 'num' ? 'ol' : 'ul');
      (b[L] || b.zh).forEach(function (item) {
        var li = document.createElement('li');
        li.innerHTML = inline(item);
        list.appendChild(li);
      });
      return list;
    }
    if (b.t === 'quote') {
      var q = el('blockquote', 'quote');
      (Array.isArray(b[L] || b.zh) ? (b[L] || b.zh) : [b[L] || b.zh]).forEach(function (p) {
        q.appendChild(el('p', null, inline(p)));
      });
      if (b.by) q.appendChild(el('cite', null, K.esc(b.by)));
      return q;
    }
    if (b.t === 'note') {
      var nt = el('div', 'note');
      nt.appendChild(el('span', 'note-tag', I.t('ch.note')));
      nt.appendChild(el('span', null, inline(b[L] || b.zh)));
      return nt;
    }
    if (b.t === 'code') return codeNode(b);
    if (b.t === 'fig') return figNode(b, ctx);
    if (b.t === 'table') return tableNode(b);
    return el('p', null, inline(b[L] || b.zh || ''));
  }

  function tableNode(b) {
    var L = I.lang;
    var head = (b.head && (b.head[L] || b.head.zh)) || [];
    var tbl = el('table');
    if (head.length) {
      var thead = el('thead'), tr = el('tr');
      head.forEach(function (h) { tr.appendChild(el('th', null, inline(h))); });
      thead.appendChild(tr); tbl.appendChild(thead);
    }
    var tb = el('tbody');
    (b.rows || []).forEach(function (row) {
      var vals = row[L] || row.zh || row;
      var tr2 = el('tr');
      (Array.isArray(vals) ? vals : [vals]).forEach(function (v) {
        tr2.appendChild(el('td', null, inline(v)));
      });
      tb.appendChild(tr2);
    });
    tbl.appendChild(tb);
    return tbl;
  }

  function codeNode(b) {
    var wrap = el('div', 'code');
    var top = el('div', 'code-top');
    top.appendChild(el('span', null, K.esc(b.lang || 'text')));
    if (b.cap) top.appendChild(el('span', 'cap', inline(b.cap[I.lang] || b.cap.zh)));
    var copy = el('button', 'code-copy', I.t('ch.copy'));
    copy.type = 'button';
    copy.addEventListener('click', function () {
      copyText(b.code).then(function () {
        copy.textContent = I.t('ch.copied');
        setTimeout(function () { copy.textContent = I.t('ch.copy'); }, 1600);
      });
    });
    top.appendChild(copy);
    wrap.appendChild(top);
    var pre = el('pre');
    var codeEl = el('code');
    codeEl.innerHTML = K.highlight(b.code, b.lang);
    pre.appendChild(codeEl);
    wrap.appendChild(pre);
    return wrap;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallback(); });
    }
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      document.body.removeChild(ta);
    }
  }

  function figNode(b, ctx) {
    var f = figures[b.fig];
    var wrap = el('figure', 'fig');
    wrap.id = 'fig-' + ctx.figN;
    if (f) {
      var top = el('div', 'fig-top');
      top.appendChild(el('span', 'fig-name', K.esc(f[I.lang] || f.zh || '')));
      var hint = f.hint ? (f.hint[I.lang] || f.hint.zh) : null;
      if (hint) top.appendChild(el('span', 'fig-hint', K.esc(hint)));
      wrap.appendChild(top);
    }
    var body = el('div', 'fig-body');
    wrap.appendChild(body);
    var cap = el('figcaption', 'fig-cap');
    cap.appendChild(el('span', 'cap-n', I.t('ch.figure') + ' ' + ctx.chNum + '.' + ctx.figN));
    cap.appendChild(el('span', null, inline(b[I.lang] || b.zh)));
    wrap.appendChild(cap);
    if (!f) {
      body.appendChild(el('div', 'kit-hint', 'missing figure: ' + K.esc(b.fig)));
    } else {
      ctx.figN++;
      var instance = null;
      try {
        instance = f.mount(body, { lang: I.lang, kit: K });
      } catch (e) {
        console.error('figure ' + b.fig, e);
        body.appendChild(el('div', 'kit-hint', 'figure error: ' + K.esc(b.fig)));
      }
      mounted.push({ id: b.fig, inst: instance });
    }
    return wrap;
  }

  function clearMounted() {
    mounted.forEach(function (m) {
      try { if (m.inst && m.inst.destroy) m.inst.destroy(); } catch (e) { }
    });
    mounted = [];
  }

  /* ---------- 左栏 ---------- */
  function buildRail(host, ch) {
    if (!host) return;
    host.innerHTML = '';
    host.appendChild(el('div', 'rail-head', I.t('ch.allChapters')));
    chapters().forEach(function (c) {
      var a = el('a', 'rail-chapter');
      a.href = '#/ch/' + c.id;
      a.setAttribute('aria-current', String(!!ch && c.id === ch.id));
      a.appendChild(el('span', 'n', c.id));
      a.appendChild(el('span', null, K.esc(lang(c).title)));
      host.appendChild(a);
      if (ch && c.id === ch.id) {
        var ul = el('ul', 'rail-secs');
        (c.sections || []).forEach(function (s, i) {
          var li = document.createElement('li');
          var sa = el('a', null, '<span class="dot"></span>' + K.esc(lang(s).title));
          sa.href = '#/ch/' + c.id + '/' + (i + 1);
          sa.dataset.sec = 'sec-' + (i + 1);
          li.appendChild(sa);
          ul.appendChild(li);
        });
        host.appendChild(ul);
      }
    });
    host.appendChild(el('div', 'rail-foot', I.t('ch.railFoot')));
  }

  /* ---------- 章节页 ---------- */
  function renderChapter(chId, secIdx) {
    var ch = chapterById(chId) || chapters()[0];
    if (!ch) return;
    clearMounted();
    document.body.classList.remove('is-cover');
    var body = document.getElementById('chapter-body');
    body.innerHTML = '';
    var idx = chapters().indexOf(ch);

    // 章头
    var head = el('header', 'chapter-head');
    head.appendChild(el('div', 'chapter-kicker',
      '<span>' + I.t('ch.of') + ' ' + chapters().length + ' ' + I.t('ch.chapters') + '</span>' +
      '<span class="of">·</span><span>' + ch.id + '</span>'));
    head.appendChild(el('h1', 'chapter-title', K.esc(lang(ch).title)));
    head.appendChild(el('div', 'chapter-title-en', K.esc(I.lang === 'zh' ? (ch.en.title || '') : (ch.zh.title || ''))));
    if (lang(ch).sub) {
      var lead = el('div', 'chapter-lead');
      paras(lang(ch).sub).forEach(function (p) { lead.appendChild(p); });
      head.appendChild(lead);
    }
    head.appendChild(el('div', 'chapter-meta',
      '<span>' + (ch.sections || []).length + ' ' + (I.lang === 'zh' ? '节' : 'sections') + '</span>' +
      '<span>' + figCount(ch) + ' ' + (I.lang === 'zh' ? '张交互图' : 'live figures') + '</span>' +
      '<span>' + I.t('ch.reading') + ' <b>' + readingTime(ch) + '</b> ' + I.t('ch.min') + '</span>'));
    body.appendChild(head);

    // 各节
    var figCursor = { chNum: ch.id.replace(/^0/, ''), figN: 1 };
    (ch.sections || []).forEach(function (s, i) {
      var sec = el('section', 'sec');
      sec.id = 'sec-' + (i + 1);
      var sh = el('div', 'sec-head');
      sh.appendChild(el('div', 'sec-num', figCursor.chNum + '.' + (i + 1)));
      sh.appendChild(el('h2', 'sec-title', K.esc(lang(s).title)));
      if (I.lang === 'zh' && s.en && s.en.title) sh.appendChild(el('div', 'sec-title-alt', K.esc(s.en.title)));
      if (I.lang === 'en' && s.zh && s.zh.title) sh.appendChild(el('div', 'sec-title-alt', K.esc(s.zh.title)));
      sec.appendChild(sh);
      (s.blocks || []).forEach(function (b) {
        var node = blockNode(b, figCursor);
        if (node) sec.appendChild(node);
      });
      body.appendChild(sec);
    });

    // 阅读顺序：供 ← → 键与上下页使用
    var prev = chapters()[idx - 1], next = chapters()[idx + 1];
    var pager = el('nav', 'pager');
    [[prev, I.t('ch.prev'), '←'], [next, I.t('ch.next'), '→']].forEach(function (p, k) {
      var a = el('a', k === 0 ? '' : null);
      a.href = p[0] ? '#/ch/' + p[0].id : '#/';
      if (!p[0]) a.classList.add('is-empty');
      a.innerHTML = '<div class="dir">' + p[2] + ' ' + p[1] + '</div>' +
        '<div class="ttl">' + K.esc(p[0] ? lang(p[0]).title : '') + '</div>' +
        '<div class="sub">' + K.esc(p[0] ? (I.lang === 'zh' ? p[0].en.title : p[0].zh.title) : '') + '</div>';
      if (!p[0]) a.removeAttribute('href');
      pager.appendChild(a);
    });
    body.appendChild(pager);

    buildRail(document.getElementById('rail'), ch);
    bindSpy();
    document.title = (I.lang === 'zh' ? '可视化导论' : 'Introduction to Visualization') + ' · ' +
      (I.lang === 'zh' ? ch.id + ' ' + lang(ch).title : 'Ch. ' + ch.id + ' ' + lang(ch).title);
    if (secIdx) {
      var target = document.getElementById('sec-' + secIdx);
      // 深链接直接落到该节：用即时定位，避免整章长距离滚动
      if (target) setTimeout(function () {
        // behavior:'instant' 才会绕过 CSS 的 scroll-behavior:smooth，
        // 否则滚动会在旧版面上推算终点，落点会偏
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        // 网络字体到位后正文会重新排一遍，这里补一次定位，除非读者已经开始滚动
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            var t2 = document.getElementById('sec-' + secIdx);
            if (t2 && Math.abs(t2.getBoundingClientRect().top - (54 + 30)) > 40) {
              t2.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
          });
        }
      }, 30);
    } else {
      window.scrollTo(0, 0);
    }
    updateProgress();
  }

  function bindSpy() {
    if (scrollSpy) scrollSpy.disconnect();
    var links = document.querySelectorAll('.rail-secs a');
    if (!links.length) return;
    var map = {};
    Array.prototype.forEach.call(links, function (a) { map[a.dataset.sec] = a; });
    scrollSpy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.target.id) {
          Object.keys(map).forEach(function (k) { map[k].classList.toggle('is-on', k === e.target.id); });
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    document.querySelectorAll('.sec').forEach(function (s) { scrollSpy.observe(s); });
  }

  /* ---------- 进度条 ---------- */
  function updateProgress() {
    var bar = document.getElementById('progress');
    var barEl = document.getElementById('bar');
    var view = document.querySelector('.view.is-on');
    if (!bar || !view) return;
    // 封面之上：页头转为白字
    var cover = document.getElementById('cover');
    var overCover = false;
    if (cover) {
      var cr = cover.getBoundingClientRect();
      overCover = view.dataset.view === 'home' && cr.bottom > 70;
    }
    if (barEl) {
      barEl.classList.toggle('is-over-cover', overCover);
      barEl.classList.toggle('is-solid', !overCover && window.scrollY > 8);
    }
    if (view.dataset.view === 'home') { bar.style.width = '0%'; bar.style.opacity = '0'; return; }
    var r = view.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total <= 0 ? 1 : K.clamp(-r.top / total, 0, 1);
    bar.style.opacity = '1';
    bar.style.width = (p * 100).toFixed(2) + '%';
  }

  /* ---------- 课程说明 ---------- */
  function renderNotes() {
    var n = VIZ.notes;
    if (!n) return;
    clearMounted();
    var body = document.getElementById('notes-body');
    body.innerHTML = '';
    var head = el('header', 'chapter-head');
    head.appendChild(el('div', 'chapter-kicker', '<span>' + K.esc(lang(n).kicker || '') + '</span>'));
    head.appendChild(el('h1', 'chapter-title', K.esc(lang(n).title)));
    head.appendChild(el('div', 'chapter-title-en', K.esc(I.lang === 'zh' ? n.en.title : n.zh.title)));
    body.appendChild(head);
    var figCursor = { chNum: 'A', figN: 1 };
    (lang(n).sections || []).forEach(function (s, i) {
      var sec = el('section', 'sec');
      sec.id = 'sec-' + (i + 1);
      var sh = el('div', 'sec-head');
      sh.appendChild(el('h2', 'sec-title', K.esc(s.title)));
      sec.appendChild(sh);
      (s.blocks || []).forEach(function (b) { sec.appendChild(blockNode(b, figCursor)); });
      body.appendChild(sec);
    });
    buildRail(document.getElementById('rail-notes'), null);
    document.title = (I.lang === 'zh' ? '课程说明' : 'About') + ' · 可视化导论';
    window.scrollTo(0, 0);
  }

  /* ---------- 视图切换 ---------- */
  function showView(name) {
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.toggle('is-on', v.dataset.view === name);
    });
  }

  /* ---------- 路由 ---------- */
  function route() {
    var h = location.hash.replace(/^#/, '');
    var parts = h.split('/').filter(Boolean);
    var prevScroll = window.scrollY;
    if (parts[0] === 'ch') {
      showView('chapter');
      renderChapter(parts[1], parts[2]);
    } else if (parts[0] === 'notes') {
      showView('notes');
      renderNotes();
    } else if (h === '#contents' || parts[0] === 'contents') {
      showView('home');
      restoreHomeScroll(prevScroll);
      var c = document.getElementById('contents');
      if (c) c.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
    } else {
      showView('home');
      if (prevScroll === 0) window.scrollTo(0, 0);
      document.title = I.lang === 'zh' ? '可视化导论 · 课程实践学习网站' : 'Introduction to Visualization · Course Companion';
    }
    var barEl = document.getElementById('bar');
    updateProgress();
    if (barEl) barEl.classList.toggle('is-solid', window.scrollY > 8);
  }
  function restoreHomeScroll(y) { if (y > 0) requestAnimationFrame(function () { window.scrollTo(0, y); }); }

  /* ---------- 检索 ---------- */
  var index = [];
  function buildIndex() {
    index = [];
    chapters().forEach(function (ch) {
      (ch.sections || []).forEach(function (s, i) {
        var text = [];
        (s.blocks || []).forEach(function (b) {
          ['zh', 'en'].forEach(function (L) {
            var v = b[L];
            if (typeof v === 'string') text.push(v);
            else if (Array.isArray(v)) text.push(v.join(' '));
            else if (v && v.rows) v.rows.forEach(function (r) { text.push((v.head ? v.head[L] : []).join(' '), r.join(' ')); });
          });
          if (b.t === 'code' && b.cap) text.push(b.cap.zh || '', b.cap.en || '');
        });
        index.push({
          ch: ch.id, i: i + 1,
          zh: ch.zh.title + ' · ' + s.zh.title,
          en: (ch.en.title || '') + ' · ' + (s.en ? s.en.title : ''),
          body: text.join(' ').toLowerCase(),
          cht: ch.zh.title, che: ch.en.title, sht: s.zh.title, she: s.en.title || ''
        });
      });
    });
  }
  function doSearch(q) {
    var list = document.getElementById('search-list');
    var meta = document.getElementById('search-meta');
    q = q.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) { meta.textContent = I.t('search.meta'); return; }
    var hits = index.map(function (it) {
      var score = 0, hay = (it.zh + ' ' + it.en).toLowerCase();
      if (hay.indexOf(q) >= 0) score += 10;
      var n = it.body.split(q).length - 1;
      score += Math.min(n, 6) * 2;
      return { it: it, score: score };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 14);
    meta.textContent = hits.length ? hits.length + ' ' + I.t('search.count') : I.t('search.none');
    hits.forEach(function (h) {
      var a = el('a', 'search-item');
      a.href = '#/ch/' + h.it.ch + '/' + h.it.i;
      a.innerHTML = '<div class="s-ttl">' + K.esc(I.lang === 'zh' ? h.it.sht : (h.it.she || h.it.sht)) + '</div>' +
        '<div class="s-sub">' + K.esc((I.lang === 'zh' ? '第 ' + h.it.ch + ' 章 · ' + h.it.cht : 'Ch. ' + h.it.ch + ' · ' + h.it.che)) + '</div>';
      a.addEventListener('click', function () { closeSearch(); });
      list.appendChild(a);
    });
  }
  function openSearch() {
    var s = document.getElementById('search');
    s.classList.add('is-open');
    document.body.classList.add('is-locked');
    var inp = document.getElementById('search-input');
    inp.placeholder = I.t('search.ph');
    setTimeout(function () { inp.focus(); }, 20);
  }
  function closeSearch() {
    document.getElementById('search').classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  /* ---------- 入场动效 ---------- */
  function revealIn() {
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    Array.prototype.forEach.call(els, function (e, i) {
      setTimeout(function () { e.classList.add('is-in'); }, K.reduced ? 0 : 40 + i * 42);
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    I.init();
    paintCover();
    buildToc();
    buildFacts();
    buildIndex();
    VIZ.hero.init();
    VIZ.demo.init();

    // 语言切换
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { I.set(b.dataset.lang); });
    });
    I.onChange(function () {
      var h = location.hash;
      var y = window.scrollY;
      paintCover();
      buildToc();
      buildFacts();
      if (/^#\/ch\//.test(h) || /^#\/notes/.test(h)) {
        var parts = h.replace(/^#/, '').split('/').filter(Boolean);
        parts[0] === 'ch' ? renderChapter(parts[1], parts[2]) : renderNotes();
        requestAnimationFrame(function () { window.scrollTo(0, y); });
      } else {
        if (VIZ.demo) { }
      }
      document.getElementById('foot-fine2').textContent = I.lang === 'zh'
        ? '最后更新 ' + (VIZ.built || '2026') : 'Last update ' + (VIZ.built || '2026');
    });

    // 检索
    document.getElementById('search-open').addEventListener('click', openSearch);
    document.getElementById('search-input').addEventListener('input', function (e) { doSearch(e.target.value); });
    document.getElementById('search').addEventListener('click', function (e) {
      if (e.target.id === 'search') closeSearch();
    });

    // 快捷键
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea';
      if (e.key === 'Escape') { closeSearch(); return; }
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault(); openSearch(); return;
      }
      if (typing) return;
      var parts = location.hash.replace(/^#/, '').split('/').filter(Boolean);
      if (parts[0] !== 'ch') return;
      var ch = chapterById(parts[1]);
      if (!ch) return;
      var idx = chapters().indexOf(ch);
      if (e.key === 'ArrowRight' && chapters()[idx + 1]) location.hash = '#/ch/' + chapters()[idx + 1].id;
      if (e.key === 'ArrowLeft') {
        location.hash = idx > 0 ? '#/ch/' + chapters()[idx - 1].id : '#/';
      }
    });

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', updateProgress);
    document.getElementById('foot-fine2').textContent = (I.lang === 'zh' ? '最后更新 ' : 'Last update ') + (VIZ.built || '2026');
    revealIn();
    route();
  }

  VIZ.app = { boot: boot, renderChapter: renderChapter, renderNotes: renderNotes, route: route, inline: inline, blockNode: blockNode, chapters: chapters, lang: lang, el: el, clearMounted: clearMounted };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
