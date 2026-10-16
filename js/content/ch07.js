/* ==========================================================================
   ch07.js — 第 7 章 时序数据可视化
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '07',
  thumb: 'time',
  zh: {
    title: '时序数据可视化',
    sub: '时间是数据集里最容易被随手处理的一个字段：当键，它决定顺序与对齐；当值，它参与运算。折线、累积与动画各自回答这条轴上的不同问题。',
  },
  en: {
    title: 'Time series',
    sub: 'Time is the field most easily mishandled: as a key it fixes order and alignment, as a value it enters the arithmetic. Line charts, accumulation and animation each answer a different question about that axis.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '时间的两种角色' },
      en: { title: 'Two roles for time' },
      blocks: [
        {
          t: 'p',
          zh: '时间是键（time as key）时，时刻是记录的地址：它决定顺序、决定两条记录能否对齐、决定“同一时段的北京与上海”怎样一起算，而时刻本身不参与运算。时间是值（time as value）时，时刻是可以参与算术的连续量：相减得到间隔，对 24 小时取模得到周期，排序之后可以取滑动窗口。同一个时间戳，两种用法给出不同的产物——前者是对齐好的表，后者是新的派生字段。',
          en: 'When time is a key, the timestamp is the address of a record: it fixes the order, decides whether two records can be aligned, and decides how “Beijing and Shanghai in the same period” are combined, while the timestamp itself never enters the arithmetic. When time is a value, the timestamp is a quantity to compute with: two moments subtract to an interval, a timestamp modulo 24 hours gives a cycle, and sorting allows a moving window. The same timestamp produces different things — an aligned table in the first case, a derived field in the second.'
        },
        {
          t: 'table',
          head: {
            zh: ['问题', '时间是键', '时间是值'],
            en: ['Question', 'Time as a key', 'Time as a value']
          },
          rows: [
            {
              zh: ['时刻的角色', '记录的地址，决定顺序与对齐', '可计算的量，决定坐标轴与派生字段'],
              en: ['The role of a timestamp', 'the address of a record: fixes order and alignment', 'a quantity to compute with: fixes the axis and derived fields']
            },
            {
              zh: ['缺一个月', '就是没有这条记录', '轴上一段空位，断开或插值'],
              en: ['A missing month', 'the record simply is not there', 'a gap on the axis: break the line or interpolate']
            },
            {
              zh: ['轴怎么画', '按次序排成等距位置', '按真实间隔映射，两年是一年的两倍'],
              en: ['How the axis is drawn', 'equal positions in sequence', 'true intervals, so two years are twice one year']
            }
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一列数据的两种用法：先按时间对齐，再把时刻取出来当数值分组', en: 'one column, two uses: align on the time axis, then read the timestamp out as a value' },
          code: [
            'import pandas as pd',
            '',
            's = pd.read_csv("readings.csv", parse_dates=["ts"]).set_index("ts")["temp"]',
            '',
            'daily = s.resample("1D").mean()',
            'monthly = s.groupby(s.index.month).mean()',
            'hourly = s.groupby(s.index.hour).mean()',
            '',
            'print(daily.tail(), monthly, hourly, sep="\\n")'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '时间轴还有两个必须交代的前提：起点与时区。跨地区的序列放进同一张图之前要统一时区，否则峰值会错开几个小时。',
          en: 'A time axis owes its reader two statements: its origin and its time zone. Series from different regions must be brought to a common zone before sharing a figure, or their peaks sit hours apart.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '折线图与查询' },
      en: { title: 'Line charts and querying' },
      blocks: [
        {
          t: 'p',
          zh: '时间是值时，最自然的映射是把时间放在水平位置、数值放在垂直位置，于是有了折线图（line chart）。折线把相邻时刻的点连起来，同时留下一个隐含声明：两点之间是线性变化——采样足够密时它无关紧要，采样稀疏时它会编造形状，每年一个点连成的折线像是知道年中的起伏，其实什么也不知道。读图分两层：十字准星（crosshair）给出某一时刻的确切值（点查询），拖出区间并统计区间内的取值（区间查询）。',
          en: 'With time as a value, the natural mapping puts time on horizontal position and the measurement on vertical position, which gives the line chart. The polyline joins consecutive moments and thereby makes an implicit claim: between two samples the value changes linearly. With dense sampling the claim costs nothing; with sparse sampling it invents shape — a line through one point a year looks as if it knew the within-year swings and knows nothing. Reading has two levels: the crosshair reports the exact value at one moment, a point query; dragging an interval and taking its statistics is a range query.'
        },
        {
          t: 'p',
          zh: '采样密度还有另一个极端。一条 100 万点的序列画在 1000 像素宽的画布上，每个像素平均摊到 1000 个点：逐点画线不是更精确，而是把峰值磨平；为了加速先抽稀，最高气温还可能整段被跳过。稳妥的做法是按像素取**极值区间**，每列画一条从最小到最大的竖线。抗锯齿（anti-aliasing）也会骗人：大量半透明细线叠在同一列像素上合成出更深的颜色，这层深浅不对应数据里的任何量。',
          en: 'Sampling density has a second extreme. One million points on a canvas 1000 pixels wide average 1000 points per pixel: drawing every point does not make the figure more precise, it erases the peaks, and if the series is thinned for speed the hottest day can be skipped altogether. The safe rule is to take an **extreme interval per pixel**, one vertical line from the minimum to the maximum in each column. Anti-aliasing misleads in the same family: the many translucent strokes sharing a pixel column blend into a darker colour, and that darkness answers to no quantity in the data.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '每列画一条极值竖线，再叠加日均线', en: 'an extreme interval per column, with the daily mean on top' },
          code: [
            'import pandas as pd',
            'import matplotlib.pyplot as plt',
            '',
            's = pd.read_csv("temps.csv", parse_dates=["ts"]).set_index("ts")["temp"]',
            'col = s.resample("1D").agg(["min", "max"])',
            '',
            'fig, ax = plt.subplots(figsize=(6, 3), dpi=200)',
            'ax.vlines(col.index, col["min"], col["max"], lw=0.5, color="#8a8a8a")',
            'ax.plot(col.mean(axis=1), lw=1.0, color="#141414")',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-timeseries',
          zh: '四座城市 48 个月的示意气温共用一条时间轴。十字准星给出某一时刻四条序列的读数，拖出区间则给出该区间的统计。把北京的振幅与广州对比，纬度带来的季节差异直接可见。',
          en: 'Forty-eight months of illustrative temperature for four cities sharing one time axis. The crosshair reports all four readings at one moment; dragging an interval reports statistics over that range. Compare Beijing with Guangzhou and the effect of latitude on the seasonal swing is visible directly.'
        },
        {
          t: 'note',
          zh: '本章数据只有 4 条序列、192 个点，远少于画布像素数，采样问题不会出现：图形的可信度取决于点数与像素数的比例。四条序列以内，把城市名写在线端比图例更快。',
          en: 'This chapter has four series and 192 points, far fewer than there are pixels, so sampling is not an issue here: trustworthiness depends on the ratio of points to pixels. With four series or fewer, labelling the line ends beats a legend.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '密度与累积' },
      en: { title: 'Density and accumulation' },
      blocks: [
        {
          t: 'p',
          zh: '序列一多，折线图先遇到覆盖：几条线叠在一起，谁在谁上面读不出来。如果真正要问的是“每个时刻的取值分布”，也不必画出每条轨迹：把时间与数值组成的平面按落入的记录数着色，得到的**密度图（density plot）**把所有序列叠成一张长曝光照片，单条轨迹消失，群体的节奏留下。',
          en: 'With many series, the line chart first meets overplotting: stacked lines make it impossible to see which is on top. And if the real question is how values are distributed at each moment, there is no need to draw every trajectory: colour the plane of time against value by the number of records that fall in each cell, and the **density plot** stacks all the series into one long-exposure photograph, where individual trajectories vanish and the rhythm of the group remains.'
        },
        {
          t: 'p',
          zh: '第二条思路是用颜色换高度，即**地平线图（horizon chart）**。把数值范围切成 f 段等宽区间，落在第 k 段的部分填充第 k 级深浅的底色，再把各段折回同一条基线：原本要占 f 倍高度的序列只占一格，大小改由颜色深浅承担。代价是读到的只是级别而不是数值，图例不可省略，能分辨的深浅大约只有 4 到 6 级。',
          en: 'The second idea trades colour for height: the **horizon chart**. Cut the value range into f equal bands, fill the part of the series that falls in band k with the k-th level of the colour scale, then fold every band back onto one baseline. A series that would need f times the height occupies a single band, and colour depth rather than vertical position carries the magnitude. The price is that the reader gets levels rather than values, so the legend is not optional, and only about four to six depth levels can be told apart.'
        },
        {
          t: 'p',
          zh: '第三条思路是累积。把若干序列堆成面积图（stacked area）时，上层序列的垂直位置等于它下面所有序列的累计，总和的波动会压到每一条上层轨迹上。**流图（streamgraph）**把基线做成随数据弯曲的曲线，代价直接：基线由全体序列共同决定，**换一种排序就换一条基线**，同一份数据能画出轮廓很不一样的两张图。堆叠还有个前提——各序列之和必须有意义，六国人口可以相加，四座城市的气温不能。',
          en: 'The third idea is accumulation. Stacking series into a **stacked area** chart lets total and composition be read at once, but the vertical position of an upper series equals the running sum of everything below it, so the swings of the total are pressed onto every upper trajectory. A **streamgraph** bends the baseline into a data-driven curve instead of a horizontal rule, and the price is direct: the baseline is decided by all series together, so **a different ordering is a different baseline**, and one dataset can be drawn with two quite different silhouettes. Stacking also has a precondition that is often skipped — the sum has to mean something. Populations of six countries add up; temperatures of four cities do not.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '`offset` 决定基线漂移，`order` 决定堆叠次序', en: '`offset` sets the baseline drift, `order` sets the stacking sequence' },
          code: [
            'const countries = ["China", "India", "United States", "Brazil", "Nigeria", "Japan"];',
            'const stack = d3.stack().keys(countries)',
            '  .offset(d3.stackOffsetWiggle)',
            '  .order(d3.stackOrderInsideOut);',
            '',
            'const series = stack(rows);',
            'const x = d3.scaleLinear().domain(d3.extent(rows, d => d.year)).range([0, width]);',
            'const y = d3.scaleLinear()',
            '  .domain(d3.extent(series.flatMap(s => s.flatMap(p => [p[0], p[1]]))))',
            '  .range([height, 0]);',
            '',
            'const area = d3.area()',
            '  .x(d => x(d.data.year))',
            '  .y0(d => y(d[0]))',
            '  .y1(d => y(d[1]));',
            '',
            'svg.selectAll("path").data(series).join("path").attr("d", area);'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-stream',
          zh: '基线不再是一条水平线，而是随数据弯曲；切换排序方式，同一份数据的整体轮廓明显改变——这是排序造成的，不是数据变了。流图能读总量构成的节奏，单个序列只能看趋势，读不到具体数值。',
          en: 'The baseline is no longer a horizontal rule but bends with the data, and switching the ordering changes the overall silhouette markedly: that is the sort order, not the data. A streamgraph reads the rhythm of a composition; an individual series reads as a trend, not as a number.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '动画与轨迹' },
      en: { title: 'Animation and trails' },
      blocks: [
        {
          t: 'p',
          zh: '动画把时间映射到一个新的通道：**播放的时刻**。折线图只能给时间留一条边，动画让每个时刻都拥有一整幅二维画面——横轴收入、纵轴预期寿命、面积人口，`VIZ.kit.data.gapminder` 的六国 1960 到 2020 正是这个形状。一帧放下三个变量加一个时刻，比折线图高一个维度；代价是时间轴退到后台，读者看到的是此刻的状态，而不是两个时刻之差。',
          en: 'Animation maps time onto a new channel: the **moment being played**. A line chart can spend only one edge of the figure on time; animation gives every moment a whole two-dimensional picture — income on the horizontal axis, life expectancy on the vertical, population as area, which is the shape of `VIZ.kit.data.gapminder` for six countries from 1960 to 2020. A frame carries three variables and a moment, one dimension more than a line chart, and the cost is that the time axis retreats into the background: the reader sees the state now, not the difference between two moments.'
        },
        {
          t: 'p',
          zh: '这正是**变化盲视（change blindness）**起作用的地方：两幅画面不在视野里同时出现时，人眼对它们的差别极为迟钝，缓慢而持续的变化尤其容易漏掉。把差别重新变成同时可见，是唯一的补救方向。',
          en: 'This is where **change blindness** does its work: when two frames are never on screen together, the eye is remarkably poor at the difference between them, and slow, steady change is missed most easily. Making the difference visible at the same time is the only direction a remedy can take.'
        },
        {
          t: 'list',
          zh: [
            '留下**轨迹（trail）**：把过去若干年的位置连成线，移动的速度与方向直接可见。',
            '提供暂停、单步与时间轴拖动，让任意两个时刻并排比较，而不是靠记忆。',
            '给出**小多图（small multiples）**：把若干年份并排画成一排静态图——动画在截图与引用里会消失，静态图不会。'
          ],
          en: [
            'Leave a **trail**: join the last few years of positions into a line, so speed and direction can be read directly.',
            'Offer pause, single step and a draggable time axis, so any two moments are compared side by side instead of from memory.',
            'Supply **small multiples**: a row of years as static frames — animation vanishes in a screenshot or a citation, static frames do not.'
          ]
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '按年份重画：位置由收入与预期寿命决定，面积由人口决定', en: 'redraw by year: position from income and life expectancy, area from population' },
          code: [
            'const x = d3.scaleLog().domain([250, 120000]).range([0, width]);',
            'const y = d3.scaleLinear().domain([30, 90]).range([height, 0]);',
            'const r = d3.scaleSqrt().domain([0, 1500]).range([2, 26]);',
            '',
            'function show(year) {',
            '  svg.selectAll("circle")',
            '    .data(rows.filter(d => d.year === year), d => d.en)',
            '    .join("circle")',
            '    .transition().duration(800)',
            '    .attr("cx", d => x(d.gdp))',
            '    .attr("cy", d => y(d.lifeExp))',
            '    .attr("r", d => r(d.pop));',
            '}',
            '',
            'let year = 1960;',
            'setInterval(() => { show(year); year = year >= 2020 ? 1960 : year + 2; }, 900);'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-bubble',
          zh: '年份沿时间轴播放，横轴是收入（`gdp`，对数刻度），纵轴是预期寿命，圆面积表示人口，一个圆是一国在某一年的状态。只看播放不足以支撑结论：暂停在某一年、再跳到十年后比较，或者打开轨迹，才能说清哪几个国家移动最大。',
          en: 'The years play along the time axis; the horizontal axis is income (`gdp`, on a log scale), the vertical axis is life expectancy and circle area is population — one circle per country per year. Watching the playback does not support a claim on its own: pause on one year, jump ten years ahead and compare, or turn on the trails, before saying which countries moved furthest.'
        }
      ]
    }
  ]
});
