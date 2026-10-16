/* ==========================================================================
   ch11.js — 第 11 章 可视化评估
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '11',
  thumb: 'evaluate',
  zh: {
    title: '可视化评估',
    sub: '图是画给别人看的，所以它的好坏不能由画图的人自己宣布。评估提供的是证据：谁在什么条件下读出了什么。',
  },
  en: {
    title: 'Evaluating Visualizations',
    sub: 'A figure is drawn for other people, so its quality cannot be declared by whoever drew it. Evaluation supplies evidence about who read what, under which conditions.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '为什么需要评估' },
      en: { title: 'Why evaluate' },
      blocks: [
        {
          t: 'p',
          zh: '设计者对自己的图知道得太多：他知道这张图要说明什么，也知道数据从哪来，于是很难再“第一次”看它。读图的人不共享这些背景，他不知道哪一列是重点、不知道纵轴被截断过、不知道那处异常是错误还是发现。评估（evaluation）要测量的，正是这段差距。',
          en: 'Designers know far too much about their own figure: they know what it is meant to say and where the data came from, so they can no longer look at it for the first time. Readers do not share that background; they do not know which column matters, that the axis was truncated, or whether the odd point is an error or a finding. Evaluation measures exactly this gap.'
        },
        {
          t: 'p',
          zh: '直觉还有系统偏差，而且偏差往往指向同一个方向：三维效果、彩虹色带、密集网格在制作者眼里显得专业，实验却反复表明它们降低读数精度。偏差另有两个来源：熟悉度，自己读自己的图总是更快；样本，身边的同事既不是目标用户，也不承担目标用户的任务。',
          en: 'Intuition is biased as well, and the bias tends to point one way: 3D effects, rainbow colour ramps and heavy grids look professional to their maker, while experiments keep showing that they cost reading accuracy. Two further sources of bias: familiarity, since reading your own figure is always faster, and sampling, since colleagues are neither the target users nor holders of their tasks.'
        },
        {
          t: 'list',
          zh: [
            '**能不能读**：标记能否被区分、数值能否被估准，也就是可读性。',
            '**有没有用**：完成一个具体任务要花多少时间、出多少错误。',
            '**会不会误导**：图形给人的印象是否与数据一致。'
          ],
          en: [
            '**Can it be read**: are marks distinguishable and values estimable — readability.',
            '**Does it help**: how long a task takes and how many errors it produces.',
            '**Does it mislead**: does the impression the figure gives agree with the data.'
          ]
        },
        {
          t: 'p',
          zh: '评估的目的因此不是证明自己的设计正确，而是找出它在哪一步失败、失败得多严重。一次评估只要指出一处必须修改的地方，就已经有产出。',
          en: 'The purpose is not to prove a design right but to find where it fails and how badly. An evaluation that names one thing which must change has already paid for itself.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '三种评估方法' },
      en: { title: 'Three families of method' },
      blocks: [
        {
          t: 'p',
          zh: '常用的方法有三类，它们回答的问题并不相同。受控实验（controlled experiment）操纵设计因素，测量完成时间与正确率，用来在两个方案之间选择。访谈与观察（interview and observation）让人在真实任务上操作并说出想法，用来发现设计者没有预料到的困难。日志分析（log analysis）在真实使用中埋点，收集长期、大样本的行为，用来检验实验结论在真实环境里是否成立。',
          en: 'Three families of method are in common use, and they answer different questions. A controlled experiment manipulates design factors and measures completion time and accuracy, which is how one chooses between two designs. Interview and observation put people on a real task and ask them to talk, which is how unexpected difficulties surface. Log analysis instruments real use and collects long-run behaviour at scale, which is how a laboratory finding is checked against the field.'
        },
        {
          t: 'p',
          zh: '受控实验的核心是三个事先定下来的东西。自变量（independent variable）是被操纵的设计因素，例如纵轴是否从零开始；因变量（dependent variable）是被测量的结果，如完成时间、正确率、主观量表；任务与假设要先声明，说明预期哪一边更快、为什么。同一批被试做两个条件用配对检验，不同被试则用独立样本检验。代价是场景人造、样本小，结论只在这类任务与这批被试的范围内成立。',
          en: 'A controlled experiment rests on three things fixed in advance. The independent variable is the design factor being manipulated, such as whether the axis starts at zero; the dependent variable is what gets measured — completion time, accuracy, a rating scale; task and hypothesis are stated first, naming which condition should be faster and why. Two conditions run on the same participants call for a paired test, conditions on different participants for an independent-samples test. The cost is an artificial setting and a small sample, so the conclusion holds only for this kind of task and these participants.'
        },
        {
          t: 'p',
          zh: '访谈与观察使用出声思维（think-aloud）：请被试用语言报告正在看什么、凭什么判断，主试只记录、不纠正。它回答“在哪里卡住、依据哪个线索”，代价是样本极小，而且说话会改变任务节奏。日志分析牺牲的则是原因：它能看到用户放大了哪一块、刷选几次、在哪一步退出，却看不到为什么退出，通常要配合访谈才能解释。',
          en: 'Interview and observation use think-aloud: participants report what they are looking at and what their judgement rests on, while the observer records without correcting. It says where people get stuck and which cue they used, at the cost of a tiny sample and a changed rhythm. Log analysis gives up the reason: it shows which region was zoomed, how often the brush was used, at which step people left, but not why they left, and interpreting it usually takes an interview.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '均值、区间与独立样本 t 检验', en: 'means, intervals and an independent-samples t test' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            'from scipy import stats',
            '',
            'a = np.array([12.4, 11.8, 13.1, 12.9, 11.5, 12.2, 12.7])',
            'b = np.array([9.8, 10.4, 10.1, 9.6, 10.7, 10.0, 9.9])',
            '',
            't, p = stats.ttest_ind(a, b, equal_var=False)',
            'means = [a.mean(), b.mean()]',
            'errs = [1.96 * a.std(ddof=1) / np.sqrt(len(a)),',
            '        1.96 * b.std(ddof=1) / np.sqrt(len(b))]',
            '',
            'fig, ax = plt.subplots(figsize=(3.6, 3.0), dpi=200)',
            'ax.bar(["A", "B"], means, yerr=errs, capsize=6, color="#141414")',
            'ax.set_ylabel("seconds")',
            'print(f"t = {t:.2f}, p = {p:.2e}")',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-evaluation',
          zh: '两种设计条件下完成时间与正确率的对比，误差棒表示区间。切换指标，看两个条件的排序是否改变；误差棒重叠时，均值差不能单独作为结论。',
          en: 'Completion time and accuracy under two design conditions, with error bars for the interval. Switch the measure and see whether the ordering of the conditions changes; when the bars overlap, a difference in means cannot stand alone.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '正确但误导' },
      en: { title: 'Correct but misleading' },
      blocks: [
        {
          t: 'p',
          zh: '有一类图，每一个数字都对，读者却会得出与数据相反的结论：误导不在数据里，而在编码里，视觉量没有与数据量成正比。守住两条纪律能挡住大部分问题——代表数值的长度从零开始，比较要给出完整的区间。',
          en: 'There is a class of figure in which every number is correct and the reader still draws the opposite conclusion: the distortion is not in the data but in the encoding, where a visual quantity fails to be proportional to the data. Two rules stop most of it — any length standing for a value starts at zero, and any comparison states its full interval.'
        },
        {
          t: 'quote',
          zh: '谎言因子：图形中所示效果的大小与数据中效果大小之比。',
          en: 'Lie factor: the ratio of the size of the effect shown in the graphic to the size of the effect in the data.',
          by: 'Edward Tufte, 1983'
        },
        {
          t: 'list',
          zh: [
            '**纵轴截断**（truncated axis）：柱形图不从零开始，柱长便不再代表数值，48 与 58 的差别可以画成两倍。',
            '**面积当作线性编码**：半径加倍，面积变成四倍，读者读到的是四倍。',
            '**三维透视**：近处的扇形在屏幕上更大，角度之间失去可比性。',
            '**选择性区间**：只取增长最快的那几年，把之前的持平略去。',
            '**双重纵轴**（dual axis）：两条轴的刻度可以任选，足以让两条无关的曲线看上去同步。'
          ],
          en: [
            '**Truncated axis**: when a bar chart does not start at zero, bar length no longer stands for the value, and a gap of 48 to 58 can be drawn as double.',
            '**Area as a linear encoding**: double the radius, quadruple the area, and the reader receives the quadrupled version.',
            '**3D perspective**: the near wedge is drawn larger on screen, and the angles stop being comparable.',
            '**A selected interval**: only the fastest-growing years are shown, and the flat stretch before them is dropped.',
            '**Dual axis**: the two scales can be chosen freely, which is enough to make two unrelated series look synchronised.'
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一份数据，纵轴是否从零开始', en: 'one dataset, with and without a zero baseline' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'years = np.arange(2016, 2024)',
            'sales = np.array([48, 49, 51, 50, 53, 55, 54, 58])',
            '',
            'fig, axes = plt.subplots(1, 2, figsize=(6.0, 2.6), dpi=200)',
            'for ax, lo in zip(axes, (0, 46)):',
            '    ax.bar(years, sales, color="#141414")',
            '    ax.set_ylim(lo, 60)',
            '    ax.set_xticks(years[::2])',
            '',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-bias',
          zh: '同一份数据，切换纵轴起点、坐标尺度或图形类型，得到的结论并不相同。先在柱形上放大纵轴起点，再换成折线，看变化幅度怎样被重新讲述。',
          en: 'One dataset, and a different conclusion each time the axis start, the scale or the chart type changes. Raise the axis start on the bars first, then switch to a line, and watch the size of the change be retold each time.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '一张图的自检清单' },
      en: { title: 'A checklist for one figure' },
      blocks: [
        {
          t: 'p',
          zh: '把图交出去之前，按顺序过一遍下面五类检查。清单的作用是把容易忘记的项目固定下来，一次检查能改掉一处就算有效；它挡不住错误的问题，那要交给评估处理。',
          en: 'Before a figure leaves your hands, run it through the five groups below in order. The point of a checklist is to hold on to what is easily forgotten, and one fix per pass is already a return; it will not catch a wrong question, which is what evaluation is for.'
        },
        {
          t: 'table',
          head: { zh: ['类别', '检查什么', '不合格的样子'], en: ['Area', 'What to check', 'How it fails'] },
          rows: [
            { zh: ['数据完整性', '筛选前后的记录数是否一致，缺失值是否说明', '少了一天，图上没有标注'], en: ['Data integrity', 'Do counts match before and after filtering, are missing values stated', 'A day is missing and the figure never says so'] },
            { zh: ['通道有效性', '位置、长度、面积是否与数值成正比', '半径加倍而面积变成四倍'], en: ['Channel validity', 'Are position, length and area proportional to the value', 'Radius doubled, area quadrupled'] },
            { zh: ['可比性', '各组的纵轴、尺度与区间是否相同', '两组各自从不同的起点开始'], en: ['Comparability', 'Same axis, scale and interval across groups', 'The two groups start from different baselines'] },
            { zh: ['标注', '单位、时间范围与数据来源是否写全', '纵轴只有数字，没有单位'], en: ['Labelling', 'Units, time range and data source', 'An axis with numbers and no unit'] },
            { zh: ['无障碍', '是否有只靠颜色区分的信息', '红绿是唯一的分组编码'], en: ['Accessibility', 'Is any information carried by colour alone', 'Red and green as the only encoding of groups'] }
          ]
        },
        {
          t: 'p',
          zh: '清单只能挡住低级错误。若这张图要支撑一个决定，或者在两个方案之间选择，仍然要回到上一节的方法：受控实验比较方案，访谈找出卡点，日志检验它在真实使用中的表现。',
          en: 'A checklist stops careless errors. If the figure is to support a decision, or to choose between two designs, the methods of the previous section still apply: an experiment compares the designs, an interview finds the sticking points, and logs check how it behaves in real use.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '把清单里能自动化的部分写成断言', en: 'the automatable part of the checklist as assertions' },
          code: [
            'import pandas as pd',
            'import matplotlib.pyplot as plt',
            '',
            'df = pd.read_csv("figure.csv")',
            '',
            'assert df["value"].notna().all()',
            'assert df["unit"].nunique() == 1',
            'assert df["label"].is_unique',
            'assert (df["value"] >= 0).all()',
            '',
            'ax = df.plot.bar(x="label", y="value", legend=False, color="#141414")',
            'ax.set_ylim(0, df["value"].max() * 1.15)',
            'ax.set_ylabel(df["unit"].iloc[0])',
            'plt.tight_layout()',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '清单里大部分项目可以自动化：完整性写成断言，通道有效性检查投影后的数值，颜色对比度直接计算。把能自动化的交给脚本，人的注意力留给判断。',
          en: 'Most of the checklist can be automated: completeness as assertions, channel validity as the projected values, colour contrast as a computation. Hand the mechanical part to a script and keep judgement for yourself.'
        }
      ]
    }
  ]
});
