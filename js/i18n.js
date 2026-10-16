/* ==========================================================================
   i18n.js — 中英文切换：界面文本、语言状态、订阅通知
   ========================================================================== */
(function () {
  'use strict';
  var VIZ = window.VIZ;

  var D = {
    zh: {
      'brand.main': '可视化导论',
      'brand.alt': 'Introduction to Visualization',
      'nav.contents': '目录',
      'nav.notes': '课程说明',
      'nav.search': '检索',
      'a11y.skip': '跳到正文',

      'cover.title': '可视化导论',
      'cover.titleAlt': 'Data Visualization · A Course Companion',
      'cover.sub': '一本会动的参考书。每一节先讲清一个概念，给出对应的代码，再让图形在页面上自行演示——你可以直接动手改动它。',
      'cover.enter': '开始阅读',
      'cover.toc': '浏览目录',
      'cover.scroll': '向下滚动',
      'cover.credit': '参考教材：陈为《可视化导论》',
      'cover.figCap': '图 A 同一批数据点的六种组织方式',
      'cover.figNote': '实时绘制 · 拖动可旋转',

      'contents.title': '目录',
      'contents.lead': '全书十一章，每章由若干小节组成。每一节都按“知识 → 代码 → 交互图”的次序展开：先说明它解决什么问题，再给出产生图形的代码，最后把图形交给你操作。',
      'contents.note': '',

      'demo.title': '同一份数据的四种画法',
      'demo.desc': '42 座城市的人口。数据从未改变，变的只是映射方式。选择任意一种编码，图形会在其间连续变形。',
      'demo.auto': '自动演示',
      'demo.legendBar': '柱长 = 人口',
      'demo.legendScatter': '横轴 = 经度，纵轴 = 人口',
      'demo.legendLine': '横轴 = 经度序列',
      'demo.legendHeat': '灰度 = 人口密度',
      'demo.data': '数据：42 座城市人口（示意数据，用于教学演示）',

      'how.title': '如何使用本站',
      'how.note': '每一节的固定结构',
      'how.lead': '不需要按顺序读完。任何一节都可以独立进入：图可以操作，代码可以直接复制运行。',
      'how.1.kind': '知识',
      'how.1.t': '概念',
      'how.1.d': '每一节只讨论一个问题，说明它的来由、适用条件与代价。术语第一次出现时给出英文对照。',
      'how.1.m': '正文 · 约 400 字',
      'how.2.kind': '代码',
      'how.2.t': '实现',
      'how.2.d': '给出最简的可运行代码，与上文的概念一一对应。代码很短，可以直接粘贴到自己的环境里。',
      'how.2.m': 'Python / JavaScript · 可复制',
      'how.3.kind': '交互',
      'how.3.t': '图形',
      'how.3.d': '同样一份数据，用图形画出来。拖动、悬停、切换参数，观察映射方式改变时，你能读到什么。',
      'how.3.m': '实时绘制 · 可交互',

      'facts.chapters': '章',
      'facts.sections': '节',
      'facts.figures': '张交互图',
      'facts.langs': '种语言',

      'ch.of': '共',
      'ch.chapters': '章',
      'ch.inChapter': '本章目录',
      'ch.allChapters': '全部章节',
      'ch.prev': '上一章',
      'ch.next': '下一章',
      'ch.start': '开始本章',
      'ch.headsUp': '本章要点',
      'ch.figure': '图',
      'ch.copy': '复制',
      'ch.copied': '已复制',
      'ch.note': '注',
      'ch.code': '代码',
      'ch.min': '分钟',
      'ch.reading': '阅读约',
      'ch.railFoot': '左栏为本节导航，随阅读位置移动。',

      'search.ph': '检索章节、小节或关键词',
      'search.meta': '输入关键词开始检索，Esc 关闭',
      'search.none': '没有找到匹配的章节',
      'search.count': '条结果',

      'foot.mark': '可视化导论 · 课程实践学习网站',
      'foot.about': '站内所有图形均由浏览器实时绘制，没有使用图片素材。数据集中标注“示意”者为教学构造，不代表真实统计。',
      'foot.ref': '参考资料',
      'foot.ref1': '陈为, 沈则潜, 陶煜波. 数据可视化. 电子工业出版社.',
      'foot.ref2': 'Munzner T. Visualization Analysis and Design. CRC Press, 2014.',
      'foot.stack': '技术',
      'foot.stack1': '原生 HTML / CSS / JavaScript；封面点阵使用 three.js。',
      'foot.stack2': '无构建步骤，可直接离线打开。',
      'foot.fine1': '教学用途 · 可自由用于课堂',
      'foot.fine2': ''
    },

    en: {
      'brand.main': 'Introduction to Visualization',
      'brand.alt': '可视化导论',
      'nav.contents': 'Contents',
      'nav.notes': 'About',
      'nav.search': 'Search',
      'a11y.skip': 'Skip to content',

      'cover.title': 'Introduction to Visualization',
      'cover.titleAlt': '数据可视化 · 课程自学读本',
      'cover.sub': 'A reference book that moves. Every section states one idea, shows the code that produces it, and then hands you the figure to operate.',
      'cover.enter': 'Start reading',
      'cover.toc': 'Browse contents',
      'cover.scroll': 'Scroll',
      'cover.credit': 'Reference text: Chen Wei, Introduction to Visualization',
      'cover.figCap': 'Fig. A — six arrangements of one point set',
      'cover.figNote': 'Rendered live · drag to rotate',

      'contents.title': 'Contents',
      'contents.lead': 'Eleven chapters, each built from short sections. Every section follows the same order: what problem it solves, the code that draws it, and the figure you can operate yourself.',
      'contents.note': '',

      'demo.title': 'Four ways to draw one dataset',
      'demo.desc': 'Population of 42 cities. The data never changes; only the mapping does. Pick an encoding and the marks morph continuously.',
      'demo.auto': 'Auto',
      'demo.legendBar': 'bar length = population',
      'demo.legendScatter': 'x = longitude, y = population',
      'demo.legendLine': 'x = longitude order',
      'demo.legendHeat': 'grey = population density',
      'demo.data': 'Data: population of 42 cities (illustrative, for teaching)',

      'how.title': 'How to read this site',
      'how.note': 'the structure of every section',
      'how.lead': "You don't need to read it in order. Any section stands on its own: figures are operable, code is copy-ready.",
      'how.1.kind': 'IDEA',
      'how.1.t': 'The concept',
      'how.1.d': 'Each section discusses one question: where it comes from, when it applies, what it costs.',
      'how.1.m': 'Prose · about 400 words',
      'how.2.kind': 'CODE',
      'how.2.t': 'The implementation',
      'how.2.d': 'The shortest runnable code that matches the idea above. Short enough to paste into your own environment.',
      'how.2.m': 'Python / JavaScript · copy-ready',
      'how.3.kind': 'FIGURE',
      'how.3.t': 'The figure',
      'how.3.d': 'The same data, drawn. Drag it, hover it, change the parameters, and see what the mapping lets you read.',
      'how.3.m': 'Rendered live · interactive',

      'facts.chapters': 'chapters',
      'facts.sections': 'sections',
      'facts.figures': 'live figures',
      'facts.langs': 'languages',

      'ch.of': 'of',
      'ch.chapters': 'chapters',
      'ch.inChapter': 'In this chapter',
      'ch.allChapters': 'All chapters',
      'ch.prev': 'Previous',
      'ch.next': 'Next',
      'ch.start': 'Start',
      'ch.headsUp': 'What this chapter covers',
      'ch.figure': 'Fig.',
      'ch.copy': 'Copy',
      'ch.copied': 'Copied',
      'ch.note': 'Note',
      'ch.code': 'Code',
      'ch.min': 'min',
      'ch.reading': 'About',
      'ch.railFoot': 'The left rail tracks your reading position.',

      'search.ph': 'Search chapters, sections, keywords',
      'search.meta': 'Type to search · Esc to close',
      'search.none': 'Nothing matches that yet',
      'search.count': 'results',

      'foot.mark': 'Introduction to Visualization · Course Companion',
      'foot.about': 'Every figure on this site is drawn live in the browser; no image assets are used. Datasets labelled “illustrative” are constructed for teaching and are not official statistics.',
      'foot.ref': 'References',
      'foot.ref1': 'Chen W., Shen Z., Tao Y. Data Visualization. Publishing House of Electronics Industry.',
      'foot.ref2': 'Munzner T. Visualization Analysis and Design. CRC Press, 2014.',
      'foot.stack': 'Built with',
      'foot.stack1': 'Plain HTML / CSS / JavaScript; the cover point field uses three.js.',
      'foot.stack2': 'No build step — opens offline from the file system.',
      'foot.fine1': 'For teaching · free to use in class',
      'foot.fine2': ''
    }
  };

  var subs = [];
  var i18n = {
    lang: 'zh',
    t: function (k) {
      var v = D[i18n.lang][k];
      if (v == null) v = D.zh[k];
      return v == null ? k : v;
    },
    other: function () { return i18n.lang === 'zh' ? 'en' : 'zh'; },
    pick: function (obj) {
      if (obj == null) return '';
      if (typeof obj === 'string') return obj;
      return obj[i18n.lang] != null ? obj[i18n.lang] : (obj.zh || obj.en || '');
    },
    onChange: function (fn) { subs.push(fn); },
    set: function (lang, opts) {
      if (lang !== 'zh' && lang !== 'en') lang = 'zh';
      var changed = lang !== i18n.lang;
      i18n.lang = lang;
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = i18n.t(el.getAttribute('data-i18n'));
        if (el.hasAttribute('data-i18n-html')) el.innerHTML = v; else el.textContent = v;
      });
      document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        el.setAttribute('placeholder', i18n.t(el.getAttribute('data-i18n-ph')));
      });
      document.querySelectorAll('.lang-toggle button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
      });
      document.querySelector('title').textContent = lang === 'zh'
        ? '可视化导论 · 课程实践学习网站'
        : 'Introduction to Visualization · Course Companion';
      try { localStorage.setItem('viz.lang', lang); } catch (e) { }
      if (changed || (opts && opts.force)) subs.forEach(function (f) { f(lang); });
    },
    init: function () {
      var saved = null;
      try { saved = localStorage.getItem('viz.lang'); } catch (e) { }
      if (!saved) {
        var n = (navigator.language || 'zh').toLowerCase();
        saved = n.indexOf('zh') === 0 ? 'zh' : (n.indexOf('en') === 0 ? 'en' : 'zh');
      }
      i18n.set(saved, { force: true });
    }
  };

  VIZ.i18n = i18n;
})();
