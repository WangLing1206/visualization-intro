# 内容写作规范 / Content authoring spec

每一章是一个数据文件 `js/content/chNN.js`，只描述文字、代码与图形引用，**不含任何绘制逻辑**。
完整范例见 `js/content/ch01.js`，写作前必须先读它。

## 文件骨架

```js
/* ==========================================================================
   ch02.js — 第 2 章 视觉感知与认知
   ========================================================================== */
VIZ.content.push({
  id: '02',                    // 两位数字符串，必须与文件名一致
  thumb: 'gestalt',            // 目录缩略图键，见下表，不可改
  zh: { title: '视觉感知与认知', sub: '一到两句导语，说明本章要解决什么问题。' },
  en: { title: 'Perception and Cognition', sub: 'One or two sentences. Same meaning as zh.' },
  sections: [
    {
      id: 's1',
      zh: { title: '小节标题，不超过 14 个汉字' },
      en: { title: 'Section title' },
      blocks: [ /* 见下 */ ]
    }
  ]
});
```

## 区块类型（只能使用这 9 种）

| 类型 | 写法 | 说明 |
| --- | --- | --- |
| 段落 | `{ t:'p', zh:'…', en:'…' }` | 一段话，2–5 句。可用行内标记：`**加粗**`、`` `代码` ``、`[文字](#/ch/03)` |
| 小标题 | `{ t:'h3', zh:'…', en:'…' }` | 一节内通常 0–1 个 |
| 无序列表 | `{ t:'list', zh:['…','…'], en:['…','…'] }` | zh/en 条数必须相同 |
| 有序列表 | `{ t:'num', zh:['…'], en:['…'] }` | 有先后次序时使用（流程、步骤） |
| 引语 | `{ t:'quote', zh:'…', en:'…', by:'Edward Tufte, 1983' }` | 每章最多 1 处，引语必须真实可考 |
| 小字注 | `{ t:'note', zh:'…', en:'…' }` | 一至两句的旁注，渲染为极简竖线小字，不是彩色气泡 |
| 代码 | `{ t:'code', lang:'python', cap:{zh:'…',en:'…'}, code:'…' }` | lang 取值 `python` / `javascript` / `sql` / `bash` / `r` |
| 图形 | `{ t:'fig', fig:'fig-xxx', zh:'图注文字', en:'Caption' }` | 图号由网站自动生成，图注里不要再写“图 3.1” |
| 表格 | `{ t:'table', head:{zh:[],en:[]}, rows:[{zh:[],en:[]}] }` | 只用横线，避免超过 4 列 |

## 硬性规则

1. **代码不写注释。** 变量含义由上文段落解释，示例控制在 20 行以内，必须真实可运行、与同一节的图对应。
2. **图的编号与位置写死**：每章分配到的 `fig` 编号与出现顺序见下方清单，一节内图片不要跨节移动。
3. **中英内容等长**：`list` / `num` 的 zh 与 en 条数必须一致；每个 block 都要同时有 zh 与 en。
4. **中文用全角标点**（，。：；“”），英文用半角。代码里用半角引号。
5. 不使用 emoji、不使用 HTML 标签、不使用 Markdown 标题语法（## 之类）。
6. 术语第一次出现时给出英文对照，例如“视觉编码（visual encoding）”。
7. 每节建议 3–5 个 block：至少 1 段知识；涉及方法的节要有 1 个 `code` 与 1 个 `fig`；顺序为 知识 → 代码 → 图形。
8. 每章 4 节（个别章节见清单），节标题必须使用清单里给定的中文标题。
9. 语气平实、像教科书，不用营销式措辞，不用“我们”“大家都知道”这类填充语。整段不出现“本文将介绍”。
10. 数值与结论要自洽：文中引用的数字要与该节图形使用的数据一致（数据来源见 `js/kit.js` 的 `data` 字段）。

## 缩略图键（thumb）

`pipeline` `gestalt` `types` `tasks` `encoding` `parallel` `time` `geo` `network` `interaction` `evaluate` `default`

## 每章清单

| 章 | 文件 | thumb | 节标题（必须逐字使用） | 配图（按出现顺序） |
| --- | --- | --- | --- | --- |
| 02 | ch02.js | gestalt | 眼睛与大脑的分工 / 格式塔原则 / 前注意处理 / 可辨识的差别 | fig-gestalt, fig-preattentive, fig-weber |
| 03 | ch03.js | types | 数据的三种属性 / 数据表与字段 / 清洗：缺失与异常 / 分布的概括 | fig-datatypes, fig-dataclean, fig-datashape |
| 04 | ch04.js | tasks | 先谈任务，再谈图形 / 为什么、是什么、怎么做 / 动作与目标 / 概览优先的次序 | fig-tasktaxonomy, fig-actions-targets, fig-mantra |
| 05 | ch05.js | encoding | 标记与视觉通道 / 通道的有效性 / 表达性：选择正确的通道 / 数据墨水与冗余 | fig-encoding, fig-accuracy, fig-dataink |
| 06 | ch06.js | parallel | 维度灾难 / 平行坐标与刷选 / 散点图矩阵 / 线性投影 | fig-parcoords, fig-spm, fig-pca |
| 07 | ch07.js | time | 时间的两种角色 / 折线图与查询 / 密度与累积 / 动画与轨迹 | fig-timeseries, fig-stream, fig-bubble |
| 08 | ch08.js | geo | 投影的取舍 / 投影变形 / 分级设色与符号 / 流场与轨迹 | fig-projection, fig-choropleth, fig-flow |
| 09 | ch09.js | network | 包含与关联 / 层次布局 / 力导向布局 / 流量与层级 | fig-treemap, fig-network, fig-sankey |
| 10 | ch10.js | interaction | 交互解决什么问题 / 焦点与上下文 / 刷选与联动 / 语义缩放 / 从图到知识的循环 | fig-focus, fig-brushlink, fig-semanticzoom, fig-valoop |
| 11 | ch11.js | evaluate | 为什么需要评估 / 三种评估方法 / 正确但误导 / 一张图的自检清单 | fig-evaluation, fig-bias |

## 每张图的实际行为（图注必须与之一致）

- `fig-gestalt` — 一组点，可切换“接近/相似/连续/连通/闭合”五种分组原则，点是同一批点，只有感知分组在变。
- `fig-preattentive` — 找不同的小游戏：在点阵中找出目标点，记录用时；对比“颜色/形状/大小”（并行搜索，很快）与“颜色+形状的组合”（串行搜索，很慢）。
- `fig-weber` — 两条线段，拖动滑块改变长度差，观察“刚好能分辨”的差值与基准长度的比例关系（韦伯分数）。
- `fig-datatypes` — 一张小数据表，逐列判定测量尺度（定类/定序/定距/定比），并显示该尺度允许的运算。
- `fig-dataclean` — 同一份数据在四种处理前后的对照动画：缺失值填补、异常值处理、单位统一、去重。
- `fig-datashape` — 同一组数值在直方图、箱线图、累积分布三种概括之间变形。
- `fig-tasktaxonomy` — 三层同心环（为什么—是什么—怎么做），悬停任一层高亮并给出该层的选项。
- `fig-actions-targets` — 动作 × 目标矩阵（7 种动作 × 6 种目标），悬停单元格给出一个具体例子。
- `fig-mantra` — “概览优先、缩放与过滤、按需细节”三步交互演示：先看全体，再刷选，最后查看单条记录。
- `fig-encoding` — 选择标记（点/线/条/面）与视觉通道（位置/长度/角度/面积/灰度），右侧实时生成图形。
- `fig-accuracy` — Cleveland 与 McGill 的通道准确性排序，点击任一通道显示对应的判别实验与误差。
- `fig-encoding` 与 `fig-accuracy` 配合表达“表达性”与“有效性”的区别。
- `fig-dataink` — 一个滑块逐步去掉网格、边框、阴影、3D 效果，同时显示数据墨水比的变化。
- `fig-parcoords` — 平行坐标，可在任意轴上刷选，选中记录高亮并给出统计。
- `fig-spm` — 散点图矩阵，悬停一个点同时高亮所有子图里的同一记录。
- `fig-pca` — 二维点云旋转到主成分方向的连续动画，显示方差解释比例。
- `fig-timeseries` — 四条序列的折线图，十字准星读数与时间区间刷选。
- `fig-stream` — 流图（stacked area 的基线漂移版本），可切换排序方式，观察轮廓变化。
- `fig-bubble` — 类似 Gapminder 的动画气泡图：年份播放，横轴收入、纵轴预期寿命、面积人口。
- `fig-projection` — 同一份世界轮廓在不同投影之间的连续变形（等距圆柱/墨卡托/等面积/正射），正射可拖动旋转。
- `fig-choropleth` — 城市人口的分级设色与符号对照，可切换分类方法并悬停查看数值。
- `fig-flow` — 流场动画：粒子沿矢量场运动，可切换“均匀流/旋涡/城市间流量”。
- `fig-treemap` — 用真实课程大纲做的矩形树图，可在矩形树图、旭日图、径向树之间变形。
- `fig-network` — 力导向网络，节点可拖动、可展开邻居，边宽表示权重。
- `fig-sankey` — 分层流量图：数据从来源经中间节点流向去处，可悬停追踪单个流向。
- `fig-focus` — 鱼眼放大镜：跟随指针的焦点区域被放大，上下文保持可见。
- `fig-brushlink` — 两个联动视图：在一个视图刷选，另一个视图同步高亮。
- `fig-semanticzoom` — 语义缩放：放大时不是放大像素，而是换成更详细的信息层级。
- `fig-valoop` — 可视分析循环示意图：数据→模型→可视化→交互→知识，动画展示一次迭代。
- `fig-evaluation` — 两种设计条件下完成时间与正确率的对比（带误差棒），可切换指标。
- `fig-bias` — 一张“正确但误导”的图：切换纵轴起点、坐标尺度与图形类型，同一份数据得出不同结论。

## 数据来源（写作时可引用的数字）

- 城市人口：`VIZ.kit.data.cities`，42 座城市，按人口排序（示意数据，单位百万）。
- 时序：`VIZ.kit.data.series`，四座城市 48 个月的示意气温序列。
- 高维：`VIZ.kit.data.multi`，42 辆车的 6 个字段，含三个类别。
- 网络：`VIZ.kit.data.network`，55 个节点、五个群团。
- 动画气泡：`VIZ.kit.data.gapminder`，六国 1960–2020 的示意轨迹。
- 矩阵：`VIZ.kit.data.matrix`，28 天 × 8 个品类。
- 层次：由本站目录实时生成（`VIZ.kit.bookTree`）。
- Anscombe 四组数据、历史时间线等为公认的公开教学素材。
