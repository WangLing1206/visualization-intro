/* ==========================================================================
   notes.js — 课程说明页（同时充当网站说明文档）
   ========================================================================== */
VIZ.built = '2026-10';

VIZ.notes = {
  zh: {
    kicker: '课程说明',
    title: '关于这份材料',
    sections: [
      {
        title: '它是什么',
        blocks: [
          {
            t: 'p',
            zh: '这是一个课程实践学习网站，配合《可视化导论》的课堂教学使用，也可以完全独立地当作自学读本来读。全书十一章，按“先概念、后代码、再图形”的次序展开，每一节的图形都真实运行在页面上，可以拖动、悬停、改变参数。',
            en: 'This is a course companion site for Introduction to Visualization. It works alongside the lectures, and it also stands on its own as a self-study reader. Eleven chapters, each following the order idea → code → figure, and every figure really runs in the page: drag it, hover it, change its parameters.'
          },
          {
            t: 'p',
            zh: '站点没有图片素材。封面上的点阵、目录里的缩略图、正文中的每一张图表，都由浏览器在打开页面的那一刻计算并绘制。这意味着你看到的每一张图，都可以在下面找到产生它的代码。',
            en: 'There are no image assets anywhere on the site. The point field on the cover, the thumbnails in the contents, every chart in the text: all computed and drawn by the browser when the page opens. That means for every figure you see, you can find the code that produces it.'
          }
        ]
      },
      {
        title: '阅读路径',
        blocks: [
          {
            t: 'p',
            zh: '如果按顺序读，前五章是共同的基础：绪论、视觉感知、数据、任务与可视化设计。第六章到第九章按数据类型展开：高维、时序、地理空间、层次与网络。第十章与第十一章讨论交互与评估，是把前九章组织成分析过程的两章。',
            en: 'Read in order, the first five chapters form the common ground: introduction, perception, data, tasks, and design. Chapters six through nine branch by data type: high-dimensional, temporal, geospatial, hierarchical and relational. The last two chapters turn the first nine into a process: interaction, then evaluation.'
          },
          {
            t: 'list',
            zh: [
              '赶时间：先读 1.1、5.3、8.1，理解映射与代价的基本直觉。',
              '做作业：按数据类型找对应章节，图下方的代码可以直接改写。',
              '准备汇报：读第五章与第十一章，重点看注意力与评估的冲突。',
              '完全自学：按顺序读，每节读完先关上网页，凭记忆把图重画一遍。'
            ],
            en: [
              'In a hurry: read 1.1, 5.3 and 8.1 for the core intuition about mapping and its costs.',
              'For an assignment: find the chapter matching your data type; the code under each figure is meant to be edited.',
              'For a presentation: read chapters 5 and 11, especially where attention and evaluation disagree.',
              'Self-study: read in order, and after each section close the page and redraw the figure from memory.'
            ]
          }
        ]
      },
      {
        title: '数据与代码说明',
        blocks: [
          {
            t: 'p',
            zh: '站点中的数据集分两类。第一类带有真实来源，例如城市人口、世界陆地轮廓（Natural Earth 一百一十万分之一简化的公共领域数据）。第二类在图形下方或正文中标明“示意”，是为教学构造的数据，其分布形态刻意设计过，用于呈现某种结构，**不应被引用为统计结果**。',
            en: 'The datasets here come in two kinds. The first has a real source: city populations, world land outlines (public-domain Natural Earth 1:110m data, simplified). The second is marked “illustrative”; those are constructed for teaching, deliberately shaped to show a structure, and **must not be cited as statistics**.'
          },
          {
            t: 'p',
            zh: '代码示例以 Python（matplotlib、pandas、scikit-learn）与 JavaScript（D3、原生 Canvas）为主，都控制在可以整段读完的长度。为了保持简短，示例里不写注释，变量的含义由上文解释。页面上实际运行的图形是用原生 Canvas 重写的版本，与示例代码一一对应，但为了让读者能操作，增加了交互与动画。',
            en: 'Code is mostly Python (matplotlib, pandas, scikit-learn) and JavaScript (D3, plain Canvas), kept short enough to read in one go. Comments are deliberately sparse — the prose above each listing explains the variables. The figures that actually run here are Canvas rewrites of the same steps, extended with interaction and animation so you can operate them.'
          }
        ]
      },
      {
        title: '技术说明',
        blocks: [
          {
            t: 'list',
            zh: [
              '纯静态站点：HTML、CSS 与原生 JavaScript，没有构建步骤，没有任何前端框架。',
              '封面点阵使用 three.js 绘制三万颗粒子，六个状态之间连续变形；WebGL 不可用时自动退回 2D 投影。',
              '全部图形用 Canvas 2D 实时绘制，仅在进入视口时运行，离开后停止。',
              '中英文内容在数据层分离，切换语言不刷新页面，正文、图形标注与导航同时更新。',
              '排版遵循黑白双色原则：正文只有黑、白与一个印刷红，其余层次用字重、灰度与发丝线区分。',
              '尊重系统的“减弱动态效果”设置；键盘可用，焦点可见，正文对比度满足无障碍要求。'
            ],
            en: [
              'A static site: HTML, CSS and plain JavaScript. No build step, no framework.',
              'The cover is 30,000 particles in three.js, morphing between six states; it falls back to a 2D projection when WebGL is unavailable.',
              'Every figure is drawn live with Canvas 2D and runs only while visible in the viewport.',
              'Chinese and English live in separate data layers; switching language updates prose, figure labels and navigation without a reload.',
              'Typography keeps to two inks: black, white, and one printer\u2019s red. Everything else is weight, grey and hairline rules.',
              'System “reduce motion” is respected; the site is keyboard operable, focus is visible, and body text meets contrast requirements.'
            ]
          }
        ]
      },
      {
        title: '使用与授权',
        blocks: [
          {
            t: 'p',
            zh: '本站用于教学，可自由用于课堂、作业与个人学习。文中的概念框架与图例体系参考了陈为等编著的《数据可视化》与 Tamara Munzner 的《Visualization Analysis and Design》，具体表述为本站重写。世界陆地轮廓数据来自 Natural Earth，属公共领域。',
            en: 'This site is for teaching and is free to use in class, in assignments and for personal study. The conceptual framework and figure vocabulary follow Data Visualization (Chen Wei et al.) and Tamara Munzner\u2019s Visualization Analysis and Design; the wording here is rewritten. The world land outlines come from Natural Earth and are in the public domain.'
          },
          {
            t: 'note',
            zh: '如果发现表述错误、图形无法操作或代码不能运行，请直接指出——这份材料是按“可以被改”的方式写的。',
            en: 'If you find a wrong statement, a figure that will not operate or code that will not run, say so. This material was written to be edited.'
          }
        ]
      }
    ]
  },

  en: {
    kicker: 'ABOUT',
    title: 'About this material',
    sections: [
      {
        title: 'What this is',
        blocks: [
          {
            t: 'p',
            zh: '这是一个课程实践学习网站，配合《可视化导论》的课堂教学使用，也可以完全独立地当作自学读本来读。全书十一章，按“先概念、后代码、再图形”的次序展开，每一节的图形都真实运行在页面上，可以拖动、悬停、改变参数。',
            en: 'This is a course companion site for Introduction to Visualization. It works alongside the lectures, and it also stands on its own as a self-study reader. Eleven chapters, each following the order idea → code → figure, and every figure really runs in the page: drag it, hover it, change its parameters.'
          },
          {
            t: 'p',
            zh: '站点没有图片素材。封面上的点阵、目录里的缩略图、正文中的每一张图表，都由浏览器在打开页面的那一刻计算并绘制。这意味着你看到的每一张图，都可以在下面找到产生它的代码。',
            en: 'There are no image assets anywhere on the site. The point field on the cover, the thumbnails in the contents, every chart in the text: all computed and drawn by the browser when the page opens. That means for every figure you see, you can find the code that produces it.'
          }
        ]
      },
      {
        title: 'Reading paths',
        blocks: [
          {
            t: 'p',
            zh: '如果按顺序读，前五章是共同的基础：绪论、视觉感知、数据、任务与可视化设计。第六章到第九章按数据类型展开：高维、时序、地理空间、层次与网络。第十章与第十一章讨论交互与评估，是把前九章组织成分析过程的两章。',
            en: 'Read in order, the first five chapters form the common ground: introduction, perception, data, tasks, and design. Chapters six through nine branch by data type: high-dimensional, temporal, geospatial, hierarchical and relational. The last two chapters turn the first nine into a process: interaction, then evaluation.'
          },
          {
            t: 'list',
            zh: [
              '赶时间：先读 1.1、5.3、8.1，理解映射与代价的基本直觉。',
              '做作业：按数据类型找对应章节，图下方的代码可以直接改写。',
              '准备汇报：读第五章与第十一章，重点看注意力与评估的冲突。',
              '完全自学：按顺序读，每节读完先关上网页，凭记忆把图重画一遍。'
            ],
            en: [
              'In a hurry: read 1.1, 5.3 and 8.1 for the core intuition about mapping and its costs.',
              'For an assignment: find the chapter matching your data type; the code under each figure is meant to be edited.',
              'For a presentation: read chapters 5 and 11, especially where attention and evaluation disagree.',
              'Self-study: read in order, and after each section close the page and redraw the figure from memory.'
            ]
          }
        ]
      },
      {
        title: 'Data and code',
        blocks: [
          {
            t: 'p',
            zh: '站点中的数据集分两类。第一类带有真实来源，例如城市人口、世界陆地轮廓（Natural Earth 一百一十万分之一简化的公共领域数据）。第二类在图形下方或正文中标明“示意”，是为教学构造的数据，其分布形态刻意设计过，用于呈现某种结构，**不应被引用为统计结果**。',
            en: 'The datasets here come in two kinds. The first has a real source: city populations, world land outlines (public-domain Natural Earth 1:110m data, simplified). The second is marked “illustrative”; those are constructed for teaching, deliberately shaped to show a structure, and **must not be cited as statistics**.'
          },
          {
            t: 'p',
            zh: '代码示例以 Python（matplotlib、pandas、scikit-learn）与 JavaScript（D3、原生 Canvas）为主，都控制在可以整段读完的长度。为了保持简短，示例里不写注释，变量的含义由上文解释。页面上实际运行的图形是用原生 Canvas 重写的版本，与示例代码一一对应，但为了让读者能操作，增加了交互与动画。',
            en: 'Code is mostly Python (matplotlib, pandas, scikit-learn) and JavaScript (D3, plain Canvas), kept short enough to read in one go. Comments are deliberately sparse — the prose above each listing explains the variables. The figures that actually run here are Canvas rewrites of the same steps, extended with interaction and animation so you can operate them.'
          }
        ]
      },
      {
        title: 'How it is built',
        blocks: [
          {
            t: 'list',
            zh: [
              '纯静态站点：HTML、CSS 与原生 JavaScript，没有构建步骤，没有任何前端框架。',
              '封面点阵使用 three.js 绘制三万颗粒子，六个状态之间连续变形；WebGL 不可用时自动退回 2D 投影。',
              '全部图形用 Canvas 2D 实时绘制，仅在进入视口时运行，离开后停止。',
              '中英文内容在数据层分离，切换语言不刷新页面，正文、图形标注与导航同时更新。',
              '排版遵循黑白双色原则：正文只有黑、白与一个印刷红，其余层次用字重、灰度与发丝线区分。',
              '尊重系统的“减弱动态效果”设置；键盘可用，焦点可见，正文对比度满足无障碍要求。'
            ],
            en: [
              'A static site: HTML, CSS and plain JavaScript. No build step, no framework.',
              'The cover is 30,000 particles in three.js, morphing between six states; it falls back to a 2D projection when WebGL is unavailable.',
              'Every figure is drawn live with Canvas 2D and runs only while visible in the viewport.',
              'Chinese and English live in separate data layers; switching language updates prose, figure labels and navigation without a reload.',
              'Typography keeps to two inks: black, white, and one printer\u2019s red. Everything else is weight, grey and hairline rules.',
              'System “reduce motion” is respected; the site is keyboard operable, focus is visible, and body text meets contrast requirements.'
            ]
          }
        ]
      },
      {
        title: 'Use and credits',
        blocks: [
          {
            t: 'p',
            zh: '本站用于教学，可自由用于课堂、作业与个人学习。文中的概念框架与图例体系参考了陈为等编著的《数据可视化》与 Tamara Munzner 的《Visualization Analysis and Design》，具体表述为本站重写。世界陆地轮廓数据来自 Natural Earth，属公共领域。',
            en: 'This site is for teaching and is free to use in class, in assignments and for personal study. The conceptual framework and figure vocabulary follow Data Visualization (Chen Wei et al.) and Tamara Munzner\u2019s Visualization Analysis and Design; the wording here is rewritten. The world land outlines come from Natural Earth and are in the public domain.'
          },
          {
            t: 'note',
            zh: '如果发现表述错误、图形无法操作或代码不能运行，请直接指出——这份材料是按“可以被改”的方式写的。',
            en: 'If you find a wrong statement, a figure that will not operate or code that will not run, say so. This material was written to be edited.'
          }
        ]
      }
    ]
  }
};
