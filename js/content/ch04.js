/* ==========================================================================
   ch04.js — 第 4 章 可视化任务
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '04',
  thumb: 'tasks',
  zh: {
    title: '可视化任务',
    sub: '图形不是按好看与否来选的，而是按要回答的问题来选的。先把任务写清楚，再决定画什么。',
  },
  en: {
    title: 'Visualization Tasks',
    sub: 'A figure is chosen by the question it must answer, not by taste. Write the task down first, then decide what to draw.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '先谈任务，再谈图形' },
      en: { title: 'Tasks before charts' },
      blocks: [
        {
          t: 'p',
          zh: '初学者常常从一个图形名字出发，想的是折线还是柱状，然后去找一份能塞进去的数据。这个顺序是反的：形状应当由**要回答的问题**决定。同样是十二个月的销售额，比较各月高低、看全年的走向、找出异常的那一个月，是三个不同的问题，对应三种不同的排序、聚合与坐标。先说清问题再挑图形，才不至于把结论读错。',
          en: 'Beginners often start from a chart name — line or bar — and then look for data that fits it. The order is backwards: the shape should follow the question. Given the same twelve monthly totals, ranking the months, reading the year\u2019s direction and hunting for the odd month are three different questions, with three different sortings, aggregations and axes. Stating the question before choosing the chart is what keeps the reading correct.',
        },
        {
          t: 'p',
          zh: '把任务写下来还有一个好处：它让“图看不出来”变得可以诊断。若任务是找出离群点，而四十二条记录被压成一团重叠的墨迹，那么失败的不是审美，而是图形与任务不匹配。任务描述得越具体，剩余的候选图形越少，比较起来也越客观。',
          en: 'Writing the task down has a second benefit: it makes \u201cthe figure does not show it\u201d diagnosable. If the task is to find outliers and forty-two records are crushed into one overlapping smudge, the failure is not aesthetic; the figure and the task do not match. The more specific the task, the fewer candidates remain, and the more objective the comparison between them.',
        },
        {
          t: 'p',
          zh: '问题的形状也决定了坐标与排序。比较各月高低，需要一个共同的基线，条形从零开始；看全年走向，时间必须落在连续的位置通道上，折线才成立；找异常的那一个月，则要先考虑极端值如何影响坐标范围，否则一个尖峰会把其余十一个月的差别压平。',
          en: 'The shape of the question also settles the axis and the ordering. Ranking months needs a common baseline, so bars start at zero. Reading the year\u2019s direction needs time on a continuous position channel, which is what makes a line work. Hunting for the odd month means deciding first how extremes affect the axis range, or one spike flattens the differences between the other eleven.',
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一份月度数据，按三种任务各自变换一次', en: 'one monthly series, three task-specific transforms' },
          code: [
            'import pandas as pd',
            '',
            'df = pd.read_csv("orders.csv", parse_dates=["ts"])',
            'monthly = df.set_index("ts")["amount"].resample("MS").sum()',
            '',
            'def views(s):',
            '    return {',
            '        "compare": s.sort_values(ascending=False),',
            '        "trend": s.rolling(3, center=True).mean(),',
            '        "outliers": (s - s.median()).abs() > 2 * s.std(),',
            '    }',
            '',
            'for name, v in views(monthly).items():',
            '    print(name, v.round(1).head(3).to_dict())'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '本节不配图。任务本身还没有分类，这里的练习是把问题写成一句话；框架在下一节给出。',
          en: 'This section carries no figure. Tasks have not been classified yet, so the exercise here is to state the question in one sentence; the framework arrives in the next section.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '为什么、是什么、怎么做' },
      en: { title: 'Why, what, how' },
      blocks: [
        {
          t: 'p',
          zh: 'Munzner 把一份可视化要回答的问题分成三层，按“为什么（why）、是什么（what）、怎么做（how）”依次追问。第一层问使用者的意图：是扫一眼看有没有值得注意的东西，是拿图去说服别人，还是在图上直接产生新东西，比如标注、记录与推导。同一份数据，意图不同，画法就该不同。',
          en: 'Munzner splits the question a visualization must answer into three layers, asked in order: why, what, how. The first layer is intent — a glance to see whether anything deserves attention, a figure meant to convince someone else, or work on the figure that produces something new, such as an annotation, a record or a derived value. The same data drawn for different intents should be drawn differently.',
        },
        {
          t: 'p',
          zh: '第二层问数据：有哪些字段、各是什么测量尺度、多少条记录。它划定可能性——定类字段不能用来排序，只有十几条记录的序列不需要聚合。第三层才是图形与通道的选择：用点还是用线，哪个字段落到位置，哪个字段落到颜色。三层里最常被跳过的是第一层，而它恰恰决定后两层怎么取舍。',
          en: 'The second layer is the data: which fields exist, at what measurement scale, how many records. It bounds what is possible — a nominal field cannot be sorted, and a series of a dozen points needs no aggregation. The third layer is the choice of marks and channels: points or lines, which field goes to position, which to colour. The layer most often skipped is the first, and it is the one that decides the other two.',
        },
        {
          t: 'p',
          zh: '三层都写下来，任务说明通常只有三行，却足以排除大部分不合适的图形。它同时也给出了检查表的三个问题：意图是否说清、数据是否够用、映射是否有效。第三层的问题在下一章展开，这里先把三层写成可以记录、可以对照的形式。',
          en: 'Written out, the three layers usually take three lines, and those lines already exclude most unsuitable figures. They also supply three review questions: is the intent stated, is the data sufficient, is the mapping effective. The third layer is the subject of the next chapter; here the aim is to get all three written down in a form that can be checked.',
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '三层各写一句，就是一份完整的任务说明', en: 'three lines, one per layer, and the task is stated' },
          code: [
            'TASK = {',
            '    "why": "discover",',
            '    "what": {"records": 42, "fields": ["pop", "region", "lon", "lat"]},',
            '    "how": {"mark": "point", "x": "lon", "y": "lat", "size": "pop", "colour": "region"},',
            '}',
            '',
            'def brief(task):',
            '    what, how = task["what"], task["how"]',
            '    fields = ", ".join(what["fields"])',
            '    return f"{task[\'why\']}: {what[\'records\']} records over {fields} as {how[\'mark\']}"',
            '',
            'print(brief(TASK))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-tasktaxonomy',
          zh: '三层同心环，由内向外是为什么、是什么、怎么做。把指针移到任一层，该层会高亮并列出这一层的选项；照着自己的问题走一圈，三层都能填满时，任务说明就完整了。',
          en: 'Three concentric rings, from the inside out: why, what, how. Hover any ring and it highlights and lists the options at that layer. Walk your own question around the rings; when all three can be filled, the task is stated.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '动作与目标' },
      en: { title: 'Actions and targets' },
      blocks: [
        {
          t: 'p',
          zh: '第二层还可以再拆：读图的人**做**什么动作，想从数据里得到**什么**目标。Munzner 把动作归纳为查找（lookup）、识别（identify）、比较（compare）、概括（summarize）、定位（locate）、关联（correlate）与浏览（browse）七种。查找是按已知的键取值，识别是看着标记回答“这是哪一条”，概括是把一组记录压成一个统计量，浏览是不带具体目标地扫视。七种动作之间的界限并不严格，同一个提问常常同时包含两种，写出最主要的那一种就够用了。',
          en: 'The second layer splits again: what the reader does, and what they want out of the data. Munzner groups the actions into lookup, identify, compare, summarize, locate, correlate and browse. A lookup fetches a value by a known key; identify answers \u201cwhich record is this?\u201d from the marks; summarize compresses a group into a single statistic; browse is scanning without a target. The boundaries between the seven are not strict, and one question often contains two of them; naming the dominant one is enough.',
        },
        {
          t: 'p',
          zh: '目标是动作的去处：极值（extremes）、趋势（trends）、离群（outliers）、分布（distribution）、相关性（correlation）与相似性（similarity）。动作与目标不是一一对应：找极值往往只需要一个排好序的位置通道，而判断两个字段是否相关，要让许多记录同时留在视野里，对信息密度的要求完全不同。目标还可以再加一层：看一条记录、看若干条，还是看全体，这一层决定了图里要留出多少细节。先写动作、再写目标，图形该密还是该疏才有依据。',
          en: 'Targets are where the actions land: extremes, trends, outliers, distribution, correlation and similarity. Actions and targets are not one-to-one. Finding an extreme needs little more than a sorted position channel, whereas judging whether two fields are correlated requires many records to stay visible at once, and the demand on density is quite different. Targets carry one more qualifier: one record, some records, or all of them, and that decides how much detail the figure must keep. Writing the action first and the target second is what settles whether the figure should be dense or sparse.',
        },
        {
          t: 'table',
          head: {
            zh: ['动作', '它回答的问题', '目标示例'],
            en: ['Action', 'Question it answers', 'Targets']
          },
          rows: [
            { zh: ['查找 lookup', '某个键的值', '极值'], en: ['lookup', 'the value behind a key', 'extremes'] },
            { zh: ['识别 identify', '这是哪一条', '离群'], en: ['identify', 'which record is this', 'outliers'] },
            { zh: ['比较 compare', '两条差多少', '趋势'], en: ['compare', 'how two records differ', 'trends'] },
            { zh: ['概括 summarize', '一组的样子', '分布'], en: ['summarize', 'what a group looks like', 'distribution'] },
            { zh: ['定位 locate', '值落在哪里', '极值'], en: ['locate', 'where a value sits', 'extremes'] },
            { zh: ['关联 correlate', '两个字段同步吗', '相关性'], en: ['correlate', 'do two fields move together', 'correlation'] },
            { zh: ['浏览 browse', '还有什么', '相似性'], en: ['browse', 'what else is there', 'similarity'] }
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '六种目标各自是一种可以算出来的陈述', en: 'each target is a statement the machine can compute' },
          code: [
            'import numpy as np',
            'import pandas as pd',
            '',
            'df = pd.read_csv("cities.csv")',
            '',
            'report = {',
            '    "extremes": df.nlargest(3, "pop")[["city", "pop"]],',
            '    "trend": np.polyfit(df["lon"], df["pop"], 1)[0],',
            '    "outliers": df[(df["pop"] - df["pop"].median()).abs() > 2 * df["pop"].std()],',
            '    "distribution": df["pop"].describe(),',
            '    "correlation": df[["lat", "pop"]].corr().iloc[0, 1],',
            '    "similarity": df.nsmallest(3, "pop")[["city", "pop"]],',
            '}',
            '',
            'for name, value in report.items():',
            '    print(name, "\\n", value)'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-actions-targets',
          zh: '七种动作乘六种目标的矩阵。把指针移到任一格，它会给出一个落在这个组合里的具体问题，例如“哪几个城市人口最少”属于查找与极值。带着自己的问题在矩阵里找到一格，就知道还要补哪些字段。',
          en: 'A matrix of seven actions by six targets. Hover any cell and it names a concrete question from that combination — \u201cwhich cities have the smallest populations\u201d, a lookup for an extreme. Find the cell that matches your own question and it becomes clear which fields are still missing.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '概览优先的次序' },
      en: { title: 'Overview first, then details' },
      blocks: [
        {
          t: 'p',
          zh: 'Shneiderman 在 1996 年给出一条次序：**先给概览，再缩放与过滤，最后按需给出细节**。它针对一个具体困难——刚开始看数据的人并不知道要找什么。只给一屏原始记录，注意力无处落地；只给一张高度概括的图，异常又被平均掉了。这条次序不是界面形态，而是一条设计约束：任何一步缺失，读者都会退回到逐条翻记录的做法。',
          en: 'In 1996 Shneiderman set an order: overview first, zoom and filter, then details on demand. It answers a concrete difficulty — someone meeting a dataset does not yet know what to look for. A screen of raw records leaves attention with nowhere to land; a single heavily summarised figure averages the exceptions away. The order is not a style of interface but a design constraint: drop any one step and the reader falls back on reading records one at a time.',
        },
        {
          t: 'p',
          zh: '三步的次序不能颠倒。概览先建立坐标：范围有多大、大致分成几群、哪里明显不同。缩放与过滤把注意力收窄到可疑区域，这一步通常由人判断，而不是由算法替人决定看什么。细节放在最后，只在确认某个点值得看时才展开；每展开一条记录，都在与其余记录争夺同一块屏幕。先逐条读记录、再回头看汇总，几乎总是更慢，也更容易漏掉结构。',
          en: 'The order cannot be reversed. The overview establishes the coordinates: how wide the range is, how many groups there are, where things differ. Zooming and filtering narrow attention onto the suspect region, and that judgement is usually the reader\u2019s rather than an algorithm\u2019s. Details come last, only once a mark has earned a closer look, because every record shown competes for the same screen. Reading records one by one and then looking back at the summary is slower and misses structure.',
        },
        {
          t: 'quote',
          zh: '先给概览，再缩放与过滤，最后按需给出细节。',
          en: 'Overview first, zoom and filter, then details-on-demand.',
          by: 'Ben Shneiderman, 1996'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '概览、过滤、细节三步并排画出来', en: 'overview, filter and detail drawn side by side' },
          code: [
            'import pandas as pd',
            'import matplotlib.pyplot as plt',
            '',
            'df = pd.read_csv("cities.csv")',
            'lo, hi = df["pop"].quantile([0.25, 0.75])',
            '',
            'fig, ax = plt.subplots(1, 3, figsize=(9, 3), dpi=150)',
            'ax[0].scatter(df.lon, df.lat, s=6)',
            'sel = df[(df["pop"] > hi) & (df["lon"] > 0)]',
            'ax[1].scatter(sel.lon, sel.lat, s=6)',
            'top = sel.nlargest(1, "pop")',
            'ax[2].text(0.02, 0.5, top[["city", "pop"]].to_string(index=False))',
            'for a in ax:',
            '    a.set_axis_off()',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-mantra',
          zh: '三步依次走完：全体、刷选出的子集、单条记录。第三步不是把第二步放大，而是换了一种信息——标记让位给文字，其余记录全部离场。',
          en: 'The three steps in order: everything, a brushed subset, one record. The third step does not magnify the second — marks give way to text, and no other record is on screen.'
        }
      ]
    }
  ]
});
