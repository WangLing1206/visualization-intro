# 《可视化导论》课程实践学习网站

一个纯静态的双语课程网站：十一章正文、三十三张实时绘制的交互图、中英文一键切换。
**没有构建步骤，没有依赖安装，双击 `index.html` 就能打开。**

```
website/
├─ index.html            站点外壳：封面、目录、演示、正文容器
├─ dev-figures.html      开发用自检页：一次挂载全部图形（不属于课程内容）
├─ css/
│  ├─ tokens.css         设计变量：两种油墨、纸张白、字号与版面尺度
│  ├─ base.css           重置、排版基座、页头页脚
│  ├─ cover.css          封面（黑色舞台 + 数据点阵）
│  ├─ home.css           目录、四种画法演示、阅读方式
│  ├─ book.css           正文版式：文字栏 680px，图版栏 940px
│  └─ figures.css        图版、代码块、交互控件、检索浮层
├─ js/
│  ├─ kit.js             图形工具库：比例尺、坐标轴、动画、控件、数据集
│  ├─ i18n.js            中英文文案与语言状态机
│  ├─ hero.js            封面点阵（three.js 自定义着色器 + 2D 回退）
│  ├─ demo.js            首页「同一份数据的四种画法」
│  ├─ app.js             路由、目录、正文渲染、左栏、检索、进度
│  ├─ notes.js           课程说明页内容
│  ├─ figures/           十一个图形模块，共 33 张图
│  └─ content/           十一章正文数据（中英双语、代码、图注）
├─ data/land.js          世界陆地轮廓（Natural Earth 110m 简化，公共领域）
├─ vendor/three.min.js   three.js r160 UMD 构建（本地内置，离线可用）
├─ tools/make_land.py    把 TopoJSON 陆地数据转成 data/land.js
└─ docs/                 写作规范、亮点说明、演示视频脚本
```

## 本地运行

任选一种：

```bash
# 1. 直接打开（无需服务器，脚本全部是经典脚本，file:// 可用）
start index.html

# 2. 起一个本地服务（推荐，字体与缓存行为更接近线上）
python -m http.server 8807
# 然后访问 http://127.0.0.1:8807/
```

部署到 GitHub Pages：把 `website/` 目录推到仓库，在仓库设置里把 Pages 的
Source 指向该目录（或把内容放到 `docs/` 分支目录）即可，无需任何构建。

## 三层结构

**内容层**（`js/content/chNN.js`）只描述文字、代码与图注，用 `VIZ.content.push({...})` 注册。
每个 block 同时带 `zh` 与 `en`，切换语言不刷新页面。

**图形层**（`js/figures/*.js`）把每张图注册进 `VIZ.figures`，正文用 `{t:'fig', fig:'fig-xxx'}` 引用。
图形模块不知道自己在第几节，也不写图号——编号由渲染器按章节顺序生成。

**渲染层**（`js/app.js`）负责路由（`#/`、`#/ch/03`、`#/ch/03/2`、`#/notes`）、
正文 DOM、左栏导航与滚动定位、检索索引、阅读进度。

## 新增一节或一章

1. 打开对应的 `js/content/chNN.js`，在 `sections` 里追加：

```js
{
  id: 's5',
  zh: { title: '小节标题' },
  en: { title: 'Section title' },
  blocks: [
    { t: 'p', zh: '一段话。', en: 'A paragraph.' },
    { t: 'code', lang: 'python', cap: { zh: '说明', en: 'caption' }, code: 'print(1)' },
    { t: 'fig', fig: 'fig-xxx', zh: '图注文字', en: 'Caption' }
  ]
}
```

2. 需要新图时，在 `js/figures/` 里注册：

```js
VIZ.figures['fig-xxx'] = {
  zh: '图名', en: 'Figure name',
  hint: { zh: '提示', en: 'hint' },
  mount: function (host) {
    var plate = VIZ.kit.plate(host);            // 带角标的图版
    var st = VIZ.kit.useCanvas(plate.inner, {
      h: function (w) { return Math.round(VIZ.kit.clamp(w * 0.46, 280, 380)); },
      draw: function (dt) { draw(dt); }         // 尺寸变化后自动补画
    });
    function draw(dt) { /* 用 st.ctx / st.w / st.h 绘制 */ }
    var ticker = VIZ.kit.ticker(st, draw);       // 仅在可见时运行
    if (st.onDraw) st.onDraw();                  // 首帧同步绘制
    return { destroy: function () { ticker.stop(); } };
  }
};
```

约定（详见 `docs/CONTENT_SPEC.md`）：

- 首帧必须在 `mount` 结束前同步画一次，否则后台标签页或不支持动画的环境里会是一片空白。
- 动画只在画布进入视口时运行，`K.ticker` 负责这件事。
- 文案用 `L(zh, en)` 取当前语言；不要缓存 `VIZ.i18n`，脚本顺序变化时它会失效。
- 颜色只用 `K.INK` 系列灰阶与 `K.SPOT`（一个印刷红）。

## 数据来源

| 数据 | 来源 |
| --- | --- |
| 42 座城市人口 | 示意数据（教学构造），见 `js/kit.js` 的 `data.cities` |
| 世界陆地轮廓 | Natural Earth 1:110m，公共领域，经 `tools/make_land.py` 简化为 21 KB |
| Anscombe 四组数据 | F. J. Anscombe, 1973，公开教学素材 |
| 高维/时序/网络/矩阵数据 | `js/kit.js` 中带种子的确定性生成（示意数据） |
| 层次数据 | 由本站目录实时生成，矩形面积对应真实篇幅 |
| 可视化简史节点 | Playfair 1786、Nightingale 1858、Minard 1869、Beck 1933、Bertin 1967、Tukey 1977、Tufte 1983、Furnas 1985、Shneiderman 1996、D3 2011 |

正文中标注「示意」的图形数据不代表真实统计，不应被引用为统计结果。

## 技术说明

- 封面点阵：three.js `ShaderMaterial`，三万颗粒子、六种目标形态（散点云／坐标纸／柱群／平行轴／网络／地球），
  逐粒子延迟的插值让迁移有先后；WebGL 不可用时退回 2D 投影渲染同一组坐标。
- 正文图形：Canvas 2D，全部实时绘制，无图片素材。
- 排版：Spectral + IBM Plex Sans + 思源宋体/黑体（通过 Google Fonts 异步加载，失败时回退系统字体）。
- 无障碍：键盘可达、焦点可见、正文对比度符合要求，尊重 `prefers-reduced-motion`。
- 自检页：`dev-figures.html` 一次挂载全部图形，开发时用来检查绘制与交互。
