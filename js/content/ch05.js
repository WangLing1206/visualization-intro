/* ==========================================================================
   ch05.js — 第 5 章 可视化设计
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '05',
  thumb: 'encoding',
  zh: {
    title: '可视化设计',
    sub: '数据到图形之间只有几级台阶：标记、通道、尺度。设计的大部分工作，是在这几级台阶上做取舍。',
  },
  en: {
    title: 'Visualization Design',
    sub: 'Between data and a figure there are only a few steps: marks, channels, scales. Most of design is choosing carefully on those steps.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '标记与视觉通道' },
      en: { title: 'Marks and channels' },
      blocks: [
        {
          t: 'p',
          zh: '任何一张统计图形都可以拆成两样东西。**标记（mark）**是画在屏幕上的几何图形：点、线、面（条形与区域）以及体积。**视觉通道（channel）**是标记可以变化的属性：位置、大小、长度、角度与斜率、颜色（色相、亮度、饱和度）、形状、纹理、方向与运动。数据字段通过通道接到标记上，这一步就是视觉编码（visual encoding）。',
          en: 'Any statistical figure splits into two things. A mark is the geometric primitive drawn on the screen: a point, a line, an area such as a bar or a region, a volume. A channel is a property of that mark which can vary: position, size, length, angle and slope, colour in its three parts of hue, luminance and saturation, shape, texture, orientation, motion. A data field is attached to a mark through a channel, and that attachment is the visual encoding.',
        },
        {
          t: 'p',
          zh: '标记与通道是两层，不能混为一谈。同样四个类别，画成四个点还是四根条，差别在标记；把这四个类别放在位置、颜色还是形状上，差别在通道。散点图、条形图与饼图之间的区别主要发生在标记这一层，而“地区用颜色表达还是用位置表达”发生在通道这一层。',
          en: 'Marks and channels are two layers and should not be conflated. Four categories drawn as four points or as four bars differ in the mark; the same four categories placed on position, on colour or on shape differ in the channel. Scatter plot, bar chart and pie chart differ mainly at the mark layer, while the decision to carry region by colour rather than by position is a decision at the channel layer.',
        },
        {
          t: 'p',
          zh: '通道的承载力并不相同。一次映射里，一个通道只能承载一个变量，而且能区分的取值数目有限：位置可以区分数千个取值，色相在一块屏幕上大约只能区分六到十二类，形状稍多，但也很快模糊。通道越窄，一张图能装的信息越少，冗余编码与分面（faceting）就越必要。',
          en: 'Channels do not carry the same load. Within one mapping a channel holds one variable at a time, and the number of values it can separate is limited: position separates thousands of values, hue separates six to twelve categories on a screen, shape a few more before it blurs. The narrower the channel, the less a single figure can hold, and the more it depends on redundant encoding or on faceting.',
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '四个通道同时工作：位置、大小、颜色', en: 'four channels at work: position, size, colour' },
          code: [
            'const svg = d3.select("#chart").append("svg")',
            '  .attr("viewBox", [0, 0, 640, 360]);',
            '',
            'const x = d3.scaleLinear().domain([-180, 180]).range([20, 620]);',
            'const y = d3.scaleLinear().domain([-60, 75]).range([340, 20]);',
            'const size = d3.scaleSqrt().domain([0, 37]).range([1.5, 12]);',
            'const hue = d3.scaleOrdinal()',
            '  .domain(["asia", "europe", "africa", "america", "oceania"])',
            '  .range(["#141414", "#4a4a4a", "#7d7d7d", "#b4232a", "#d9d9d9"]);',
            '',
            'svg.selectAll("circle")',
            '  .data(cities)',
            '  .join("circle")',
            '  .attr("cx", d => x(d.lon))',
            '  .attr("cy", d => y(d.lat))',
            '  .attr("r", d => size(d.pop))',
            '  .attr("fill", d => hue(d.region));'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-encoding',
          zh: '左侧选标记，右侧选通道，图形立刻重画。把同一个字段分别接到长度、面积与灰度上，会看到三种读法：长度几乎可以逐点比较，面积只能估量，灰度大体只能排序。',
          en: 'Pick a mark on the left and a channel on the right and the figure redraws at once. Attach one field to length, then to area, then to greyscale: length can be compared item by item, area can only be estimated, and greyscale can do little more than rank.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '通道的有效性' },
      en: { title: 'Channel effectiveness' },
      blocks: [
        {
          t: 'p',
          zh: '通道能表达什么，属于**表达性**（expressiveness）；表达得准不准，属于**有效性**（effectiveness），衡量它的是通道的判别力（discriminability）。Cleveland 与 McGill 在 1984 年做了一组判别实验，让人判断图中两个数值哪个更大，并记录判断误差，得到的是一条稳定的排序：位置 > 长度 > 角度与斜率 > 面积 > 体积 > 灰度 > 颜色。',
          en: 'What a channel can express is a question of expressiveness; how accurately it can be read — its discriminability — is a question of effectiveness. In 1984 Cleveland and McGill ran a set of discrimination experiments in which people judged which of two values in a figure was larger. Recording the errors gave a stable ranking: position > length > angle and slope > area > volume > greyscale > colour.',
        },
        {
          t: 'p',
          zh: '排序的原因是几何的。判断位置，只需把两个标记对齐到同一把刻度尺，误差以像素计；长度是沿一条轴的一维估计，误差略大；角度与斜率要把斜率读成比值，误差再大一档。面积与体积要求把一维长度换算成二维、三维量级，而人的估计被幂律压缩，真实面积翻倍时看上去往往不到翻倍。颜色排在最后，因为色相没有内在顺序，只能靠图例往返查找。',
          en: 'The ranking follows from geometry. Judging position means aligning two marks against one ruler, and the error is a matter of pixels. Length is a one-dimensional estimate along an axis and costs slightly more. Angle and slope require reading a slope as a ratio, which costs more again. Area and volume demand a conversion from one dimension to two or three, and perception compresses the result, so a doubled area rarely looks doubled. Colour comes last because hue has no intrinsic order and has to be looked up in a legend.',
        },
        {
          t: 'table',
          head: {
            zh: ['通道', '判别精度', '适合承载'],
            en: ['Channel', 'Discrimination', 'Carries']
          },
          rows: [
            { zh: ['位置（同一刻度）', '最高', '定量、定序、定类'], en: ['position, common scale', 'highest', 'quantitative, ordinal, nominal'] },
            { zh: ['长度、角度与斜率', '高', '定量'], en: ['length, angle, slope', 'high', 'quantitative'] },
            { zh: ['面积与体积', '中', '定量（数量级）'], en: ['area, volume', 'medium', 'quantitative, order of magnitude'] },
            { zh: ['灰度与饱和度', '低', '定序'], en: ['greyscale, saturation', 'low', 'ordinal'] },
            { zh: ['色相', '最低', '定类'], en: ['hue', 'lowest', 'nominal'] }
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一组数值落在三种通道上', en: 'one set of values on three channels' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'v = np.array([12, 17, 21, 26, 34])',
            'i = np.arange(len(v))',
            'fig, ax = plt.subplots(1, 3, figsize=(9, 3), dpi=150)',
            '',
            'ax[0].scatter(np.zeros_like(v), i, s=24)',
            'ax[1].barh(i, v, height=0.45, color="#141414")',
            'ax[2].scatter(np.zeros_like(v), i, s=v * 11, alpha=0.4)',
            '',
            'for a in ax:',
            '    a.set_yticks(i)',
            '    a.set_ylim(4.6, -0.6)',
            'ax[0].set_xlim(-1, 1)',
            'ax[1].set_xlim(0, 36)',
            'ax[2].set_xlim(-1, 1)',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-accuracy',
          zh: '点任一通道，界面给出它对应的判别实验与误差大小。注意排序的两端：位置与长度相差很小，而过了面积之后误差迅速变大，这就是把数值改成气泡之前必须权衡的代价。',
          en: 'Click any channel and the display gives the discrimination experiment behind it and the size of its error. Notice the two ends of the ranking: position and length sit close together, and beyond area the error grows quickly — the price to weigh before turning numbers into bubbles.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '表达性：选择正确的通道' },
      en: { title: 'Expressiveness: choosing the right channel' },
      blocks: [
        {
          t: 'p',
          zh: '表达性原则要求一条通道能表达的信息与数据字段的类型匹配。定量字段适合位置、长度、面积与亮度梯度，它们都带有顺序；定类字段只适合色相、形状、纹理这类无序通道。把定类字段放到位置或长度上，图形会凭空暗示一个并不存在的次序：按字母顺序排成的地区轴，会让读者把相邻两项当成相近的一对。',
          en: 'The expressiveness principle asks that what a channel can carry matches the type of the field. Quantitative fields suit position, length, area and luminance gradients, all of which are ordered; nominal fields suit unordered channels such as hue, shape and texture. Put a nominal field on position or length and the figure asserts an order that does not exist: an axis of regions sorted alphabetically invites the reader to treat neighbouring items as similar.',
        },
        {
          t: 'p',
          zh: '第二条规则是一个通道一次只承载一个变量。位置已经表示收入，就不能同时表示年份；颜色已经表示地区，就不能再表示销量，否则读者分不清通道上的变化来自哪个字段。第三条规则与值域有关：面积与大小无法表示负值，取平方根画半径会把正负号丢掉；色相只能区分少数几类，用它表达连续量，会在数据没有边界的地方造出边界。',
          en: 'The second rule is one channel, one variable at a time. If position already carries income it cannot also carry year; if colour already carries region it cannot also carry sales, or the reader cannot tell which field produced a change along the channel. The third rule concerns the range: area and size cannot represent negative values, and taking a square root for a radius throws the sign away; hue separates only a few categories, so a continuous field placed on it invents boundaries where the data has none.',
        },
        {
          t: 'list',
          zh: [
            '字段类型与通道的序性是否一致：定量走有序通道，定类走无序通道。',
            '同一个通道是否被两个字段共用，最重要的字段是否被有意重复表达。',
            '值域是否落在通道的范围内，负值、零值与极值是否都有交代。',
            '读者是否需要频繁往返图例；能直接标注的，就不要放进图例。'
          ],
          en: [
            'Does the type of the field match the ordering of the channel: quantitative on ordered channels, nominal on unordered ones.',
            'Is any channel shared by two fields, and is the most important field repeated on purpose.',
            'Does the value range fit what the channel can show, and are negatives, zeros and extremes accounted for.',
            'Does the reader keep travelling to the legend; anything that can be labelled directly should be labelled directly.'
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一组含负值的数：条形保号，气泡丢号', en: 'the same signed values: bars keep the sign, bubbles lose it' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'v = np.array([16, 9, 4, 0, -9, -16])',
            'r = np.sqrt(np.abs(v))',
            '',
            'fig, ax = plt.subplots(1, 2, figsize=(7, 3), dpi=150)',
            'ax[0].bar(np.arange(len(v)), v, color="#141414")',
            'ax[0].axhline(0, color="#b4232a", lw=1)',
            'ax[1].scatter(np.arange(len(v)), np.zeros_like(v), s=r * 26, alpha=0.4)',
            'for a in ax:',
            '    a.set_xticks(np.arange(len(v)))',
            '    a.set_ylim(-22, 22)',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '前两节的两张图配合起来，正好说明表达性与有效性的分工：能用哪个通道由字段类型决定，用得准不准由通道的判别精度决定。',
          en: 'The two figures from the previous sections combine into the division of labour between the two principles: which channel may be used is decided by the field type, and how accurately it reads is decided by the channel\u2019s discrimination.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '数据墨水与冗余' },
      en: { title: 'Data-ink and redundancy' },
      blocks: [
        {
          t: 'p',
          zh: 'Tufte 把图里的墨水分成两半：**数据墨水**是画出数据本身所必需的部分，其余是坐标轴、网格、边框、阴影与装饰。数据墨水比（data-ink ratio）是前者与总量的比值，去掉非数据墨水不损失任何信息。与之配套的是**变形因子**（lie factor）：图中尺寸的变化与数据本身的变化之比，偏离 1 就说明图形在夸大或压缩差异。',
          en: 'Tufte divides the ink in a figure into two parts: data-ink is what is needed to draw the data itself, and everything else is axes, grid, frame, shadow and ornament. The data-ink ratio is the first over the total, and erasing non-data ink costs no information. Its companion is the lie factor, the ratio of a size change in the figure to the change in the data; away from 1, the figure exaggerates or shrinks differences.',
        },
        {
          t: 'p',
          zh: '去墨要按次序，也要有限度。最常见的四样是网格线改淡或删掉、边框去掉、阴影与 3D 效果删掉、保留刻度而去掉多余的小刻度。极简不是目的：去掉网格之后，读者仍然需要一把能对照的尺子，一条参照线或一个直接标注往往比隐形的网格更省墨水，也更容易读。与去墨相对的是**冗余编码**（redundant encoding），同一个字段用两个通道同时表达，例如柱子既用长度也用数值标注；它降低信息效率，但当这个字段是最重要的结论时，冗余换来更准的读取与更少的图例查找，属于有意为之。',
          en: 'Erasing proceeds in an order and has a limit. The usual four: soften or drop grid lines, remove the frame, delete shadows and 3D effects, keep the ticks and drop the redundant minor ones. Minimalism is not the goal — once the grid is gone the reader still needs a ruler, and a reference line or a direct label usually costs less ink than an invisible grid and reads faster. The opposite economy is redundant encoding, one field carried by two channels at once, a bar drawn with both length and a value label. It lowers information efficiency, but when that field is the headline finding the redundancy buys a more accurate reading and fewer trips to the legend, which is repetition on purpose.',
        },
        {
          t: 'quote',
          zh: '最重要的是把数据展示出来。',
          en: 'Above all else show the data.',
          by: 'Edward Tufte, 1983'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '把同一张图渲染两次，数一数墨水的比例', en: 'render the same chart twice and count the ink' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'def ink(decorated):',
            '    fig, ax = plt.subplots(figsize=(4, 3), dpi=100)',
            '    ax.bar(["A", "B", "C", "D"], [3, 7, 5, 9], color="#141414")',
            '    if not decorated:',
            '        ax.set_axis_off()',
            '    fig.canvas.draw()',
            '    img = np.asarray(fig.canvas.buffer_rgba())[..., :3]',
            '    plt.close(fig)',
            '    return (img < 200).any(axis=2).mean()',
            '',
            'print(round(ink(False) / ink(True), 3))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-dataink',
          zh: '拖动滑块，网格、边框、阴影与 3D 效果依次消失，角落里的数据墨水比随之上升。停在中间几个位置可以看出：越过某个点之后，再删就只剩下难以比较的条形。',
          en: 'Drag the slider: grid, frame, shadow and 3D effects disappear one at a time while the data-ink ratio rises in the corner. Stop at a few positions in between and it becomes clear that past some point, further deletions leave bars that are hard to compare.'
        }
      ]
    }
  ]
});
