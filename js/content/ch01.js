/* ==========================================================================
   ch01.js — 第 1 章 绪论
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '01',
  thumb: 'pipeline',
  zh: {
    title: '绪论',
    sub: '人眼是一条极窄但极快的通道。可视化要做的，是把数据压缩成这条通道能通过的形状。',
  },
  en: {
    title: 'Introduction',
    sub: 'The eye is a narrow but very fast channel. Visualization compresses data into shapes that fit through it.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '从数字到形状' },
      en: { title: 'From numbers to shapes' },
      blocks: [
        {
          t: 'p',
          zh: '先看一个老例子。下面四组数据，每组十一个点：横坐标的均值都是 9.0，纵坐标的均值都是 7.5，相关系数都是 0.816，最小二乘直线都是 y = 0.5x + 3。**只看统计量，它们是同一组数据。**',
          en: 'Start with an old example. Four datasets of eleven points each: every one has the same mean of x (9.0), the same mean of y (7.5), the same correlation (0.816) and the same least-squares line, y = 0.5x + 3. **By the numbers, they are the same dataset.**'
        },
        {
          t: 'p',
          zh: '画出图来，四组数据的差别一眼可见：一组是普通的线性关系，一组明显弯曲，一组被单个离群点带偏，最后一组的 x 几乎不变、整体由一点决定。这就是 Anscombe 四组数据，1973 年由统计学家 Francis Anscombe 构造，用来回答一个反复出现的问题——为什么算完了还要画图。',
          en: 'Plotted, the four are plainly different: one is ordinary, one curves, one is dragged by a single outlier, and in the last one x barely varies at all. These are Anscombe\u2019s quartet, built in 1973 to answer a question that keeps coming back: why draw the data after computing it?'
        },
        {
          t: 'fig',
          fig: 'fig-anscombe',
          zh: '统计量完全相同的四组数据。注意第三、四组：一条直线掩盖了数据的真实结构，而任何汇总指标都无法提示这件事。',
          en: 'Four datasets with identical summary statistics. Note the third and fourth: a straight line conceals the real structure, and no summary number can warn you.'
        },
        {
          t: 'p',
          zh: '可视化（visualization）由此有了一个朴素的定义：把数据映射为视觉元素，让人借助视觉系统完成比较、识别与推理。它不制造数据里没有的信息，但它把数据里已有、却无法被人读出的信息释放出来。',
          en: 'This gives visualization a plain definition: map data to visual marks so that the visual system can do the comparing, recognising and reasoning. It invents nothing; it releases information that was already in the data but unreadable.'
        },
        {
          t: 'p',
          zh: '下面一段代码画出的就是上面四组数据中的第一组。整本书都会沿用这个套路：先说明问题，给出最简代码，再把图形交给你操作。',
          en: 'The code below draws the first of those four datasets. The whole book follows this pattern: state the problem, give the shortest code, then hand the figure over to you.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '绘制一组散点并叠加回归直线', en: 'scatter with a fitted line' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'x = np.array([10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5])',
            'y = np.array([8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68])',
            '',
            'k, b = np.polyfit(x, y, 1)',
            'fig, ax = plt.subplots(figsize=(4.2, 3.4), dpi=200)',
            'ax.scatter(x, y, s=18, color="#141414")',
            'ax.plot(x, k * x + b, lw=1.2, color="#b4232a")',
            'ax.set_xticks([5, 10, 15, 20])',
            'ax.set_yticks([4, 8, 12])',
            'for s in ("top", "right"):',
            '    ax.spines[s].set_visible(False)',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '整站所有图形都在页面上实时绘制，不使用图片素材。代码为教学改写，直接运行即可得到形状相同的图。',
          en: 'Every figure on this site is drawn live in the page; no image assets are used. The code is rewritten for teaching and runs as shown.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '可视化流程' },
      en: { title: 'The visualization pipeline' },
      blocks: [
        {
          t: 'p',
          zh: '从原始记录到人脑中形成判断，中间有一连串可以拆开的步骤，通常归纳为五个阶段：**数据 → 数据变换 → 视觉映射 → 视图变换 → 感知**。前四步在计算机里完成，最后一步发生在观看者身上。',
          en: 'Between raw records and a judgement in someone\u2019s head there is a chain of separable steps, usually summarised as five stages: **data → data transformation → visual mapping → view transformation → perception**. The first four happen in the machine; the last happens in the viewer.'
        },
        {
          t: 'p',
          zh: '这个模型的价值不在于分得清楚，而在于**知道问题出在哪一步**。图太乱，可能是在数据变换时没有聚合；看不出趋势，可能是视觉映射选错了通道；只有放大才看得清，也许是视图变换没有设计好。',
          en: 'The value of the model is not the taxonomy but the diagnosis. A cluttered figure usually means a missing aggregation; an unreadable trend, a poorly chosen channel; a view that only works when zoomed, a view transformation that was never designed.'
        },
        {
          t: 'fig',
          fig: 'fig-pipeline',
          zh: '同一条记录在五个阶段中的状态。每一段的变化都是可逆的计算，只有最后一段不可逆地发生在观看者身上。',
          en: 'One record through five stages. Every change is reversible computation except the last, which happens irreversibly in the viewer.'
        },
        {
          t: 'p',
          zh: '流程里最容易被跳过的是**数据变换**。人们倾向于直接把手上的表扔给绘图函数，但决定图形上限的往往是这一步：单位是否统一、缺失值如何处理、按什么聚合、异常值保留还是剔除。图形能说什么，在这时就基本定下了。',
          en: 'The step most often skipped is **data transformation**. It is tempting to hand the raw table straight to a plotting function, but this step sets the ceiling: are the units consistent, what happens to missing values, at what level do you aggregate, do outliers stay or go. What the figure can say is largely fixed here.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '聚合是数据变换中最常做的一件事', en: 'aggregation: the most common data transform' },
          code: [
            'import pandas as pd',
            '',
            'df = pd.read_csv("orders.csv", parse_dates=["ts"])',
            'df = df.dropna(subset=["amount"])',
            '',
            'daily = (df',
            '    .assign(day=df.ts.dt.floor("D"))',
            '    .groupby(["day", "city"])["amount"]',
            '    .agg(["sum", "count"])',
            '    .reset_index())',
            '',
            'wide = daily.pivot(index="day", columns="city", values="sum")',
            'print(wide.tail())'
          ].join('\n')
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '三类用途' },
      en: { title: 'Three kinds of use' },
      blocks: [
        {
          t: 'p',
          zh: '同一套技术，在不同的场合下服务的目的并不相同。分清楚目的，才知道该往哪个方向优化。',
          en: 'The same techniques serve quite different purposes in different settings. Knowing which purpose you are serving tells you what to optimise.'
        },
        {
          t: 'list',
          zh: [
            '**分析**：自己看数据，目标是发现——异常、分组、关系。图形可以难看，但必须诚实，且要快。',
            '**呈现**：给别人看结论，目标是说服与传达。图形必须清晰、有重点、经得起追问。',
            '**探索**：在一个还不了解的领域里尝试假设，目标是不遗漏。此时需要通过交互不断改变视角。'
          ],
          en: [
            '**Analysis**: looking at data for yourself to find outliers, groups, relationships. The figure may be ugly, but it must be honest and fast.',
            '**Presentation**: showing a conclusion to someone else. The figure must be clear, focused and defensible under questioning.',
            '**Exploration**: probing an unfamiliar domain for hypotheses, with the aim of missing nothing. This is where interaction earns its place.'
          ]
        },
        {
          t: 'p',
          zh: '三者对图形的要求经常冲突：分析用的图追求信息密度，呈现用的图追求注意力集中。把分析图直接拿去汇报，是初学者最常见的失误之一。',
          en: 'The three pull in different directions: an analysis figure wants density, a presentation figure wants focus. Taking an analysis figure straight into a meeting is one of the most common beginner mistakes.'
        },
        {
          t: 'quote',
          zh: '图形的卓越之处在于把复杂的想法用清晰的方式表达出来——用更少的时间、更小的空间、更少的墨水，在最短的注视中获得最多的信息。',
          en: 'Graphical excellence is the well-designed presentation of interesting data — a matter of substance, of statistics, and of design.',
          by: 'Edward Tufte, 1983'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '一条很短的简史' },
      en: { title: 'A short history' },
      blocks: [
        {
          t: 'p',
          zh: '图形并不是计算机的产物。十八世纪末，William Playfair 用折线与条形讨论国民财富时，图形第一次被当作**论证工具**而不是装饰。1858 年，Florence Nightingale 用极区图呈现战场死亡率，说动了英国国会。1869 年，Minard 的拿破仑东征图在一张纸上同时编码了兵力、经纬、时间与温度。',
          en: 'Graphics predate computing by two centuries. In the late 1700s William Playfair used lines and bars to argue about national wealth, and the figure became an instrument of argument rather than ornament. In 1858 Florence Nightingale\u2019s polar-area diagrams moved Parliament. In 1869 Minard put army size, geography, time and temperature on a single sheet.'
        },
        {
          t: 'p',
          zh: '二十世纪后半叶，学科开始形成：Bertin 提出视觉变量，Tukey 把画图纳入探索性数据分析，Tufte 用数据墨水比总结出一套审美标准。再往后，计算机让图形可以**随输入而改变**——交互进入流程，可视分析成为独立的领域。',
          en: 'In the second half of the twentieth century the field took shape: Bertin named the visual variables, Tukey folded plotting into exploratory data analysis, Tufte reduced taste to a data-ink ratio. Then computing made figures respond to input, interaction joined the pipeline, and visual analytics became a field of its own.'
        },
        {
          t: 'fig',
          fig: 'fig-history',
          zh: '十个节点。前五个回答“图形能否当作证据”，后五个回答“图形能否随人而变”。',
          en: 'Ten milestones. The first five ask whether a figure can count as evidence; the last five ask whether it can respond to a person.'
        },
        {
          t: 'p',
          zh: '今天的难题已经不是“画不出来”，而是**画得太多**：默认样式生成的图看着都差不多，而其中大部分并没有让任何人更容易理解数据。这也是本课程的重点——不是记住图表类型，而是理解每一种映射的可读性与代价。',
          en: 'The difficulty today is no longer producing a figure but producing too many: default styles make everything look alike, and most of those figures make nothing easier to understand. That is where this course aims: not in memorising chart types, but in understanding the readability and the price of each mapping.'
        }
      ]
    },
    {
      id: 's5',
      zh: { title: '怎么用这份材料' },
      en: { title: 'How to use this material' },
      blocks: [
        {
          t: 'p',
          zh: '每一节都是同一个结构：一段概念、一段代码、一张可以操作的图。建议的读法是**先读概念，再动手改图**——把图中的参数推到极端，看看什么时候它不再可读，那时你对这个概念的理解就比读完文字深一层。',
          en: 'Every section has the same shape: an idea, its code, and a figure you can operate. The recommended order is to read the idea and then push the figure — drag its parameters to the extreme and find where it stops being readable. That is usually worth more than the paragraph.'
        },
        {
          t: 'list',
          zh: [
            '图形可以直接操作：拖动、悬停、切换参数，页面上会给出数值。',
            '代码可复制，都会在常见环境下直接运行。',
            '左栏是导航，随阅读位置移动；按 `/` 可以检索全书。',
            '中英文切换按钮在页面右上角，切换后正文与图形标注同时改变。'
          ],
          en: [
            'Figures are operable: drag, hover, switch parameters, and read the numbers they report.',
            'Code is copy-ready and runs as shown in a standard environment.',
            'The left rail tracks your position; press `/` to search the whole book.',
            'The language switch sits in the top right and changes both prose and figure labels.'
          ]
        },
        {
          t: 'note',
          zh: '正文中标“示意”的数据是为了教学构造的，不代表真实统计；其余数据在图形下方注明来源。公式统一采用 Tufte 与 Munzner 的记号习惯。',
          en: 'Data labelled “illustrative” is constructed for teaching and is not a statistic. Other data is credited under the figure. Notation follows the conventions of Tufte and Munzner.'
        }
      ]
    }
  ]
});
