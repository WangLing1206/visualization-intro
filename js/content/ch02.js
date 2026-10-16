/* ==========================================================================
   ch02.js — 第 2 章 视觉感知与认知
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '02',
  thumb: 'gestalt',
  zh: {
    title: '视觉感知与认知',
    sub: '图形最终由人眼读出。这一章看这条通道的带宽、偏好与硬性限制。',
  },
  en: {
    title: 'Perception and Cognition',
    sub: 'A figure is finally read by a human eye. This chapter looks at that channel: its bandwidth, its preferences and its hard limits.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '眼睛与大脑的分工' },
      en: { title: 'How the eye and the brain divide the work' },
      blocks: [
        {
          t: 'p',
          zh: '视网膜（retina）上约有 1.2 亿个感光细胞，而从眼睛通往大脑的视神经只有约 100 万根纤维。两个数字差了两个量级，说明眼睛并不把画面当作照片传上去：它在眼球内部就完成了一轮压缩，只把最值得报告的变化送出去。',
          en: 'The retina holds roughly 120 million photoreceptors, while the optic nerve leaving the eye carries only about one million fibres. The two numbers differ by two orders of magnitude, which means the eye does not transmit a picture: it compresses inside the eyeball and sends only the changes worth reporting.'
        },
        {
          t: 'p',
          zh: '压缩的手段是**只传对比、不传亮度**。神经节细胞的感受野是中心—周边式（center-surround）的：中心受光时兴奋，周边受光时抑制，于是它报告的是局部差值，而不是绝对水平。两个可以直接用在绘图上的结论由此而来：深浅相近的两块灰色几乎无法区分；把要比较的量放在同一基准上对齐（同一坐标轴、同一起点），比分别给它们一种颜色更容易比较。',
          en: 'The compression works by **reporting contrast, not luminance**. A ganglion cell has a center-surround receptive field: light in the centre excites it, light in the surround inhibits it, so what travels upward is a local difference rather than an absolute level. Two conclusions for drawing follow immediately: two greys of similar lightness are practically indistinguishable, and quantities aligned on a shared baseline — one axis, one origin — compare far more easily than quantities given two separate colours.'
        },
        {
          t: 'table',
          head: {
            zh: ['系统', '处理什么', '容量'],
            en: ['System', 'What it handles', 'Capacity']
          },
          rows: [
            {
              zh: ['并行（前注意）', '颜色、朝向、大小、位置这些单一特征', '整幅视野同时进行，几乎不随元素增多而变慢'],
              en: ['Parallel (pre-attentive)', 'single features: colour, orientation, size, position', 'runs over the whole field at once, barely slowing as elements are added']
            },
            {
              zh: ['串行（注意）', '两个特征的组合、逐个计数、精确比较', '一次只能守住少数几个对象，用时随对象数量增长'],
              en: ['Serial (attention)', 'combinations of two features, counting, exact comparison', 'holds a few objects at a time; time grows with their number']
            }
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '中心—周边感受野：两个高斯之差', en: 'a center-surround receptive field as a difference of Gaussians' },
          code: [
            'import numpy as np',
            'import matplotlib.pyplot as plt',
            '',
            'def receptive_field(size=41, sigma_c=2.0, sigma_s=6.0):',
            '    y, x = np.mgrid[0:size, 0:size] - size // 2',
            '    r2 = x ** 2 + y ** 2',
            '    centre = np.exp(-r2 / (2 * sigma_c ** 2))',
            '    surround = np.exp(-r2 / (2 * sigma_s ** 2))',
            '    return centre - 0.8 * surround',
            '',
            'field = receptive_field()',
            'plt.imshow(field, cmap="gray")',
            'plt.axis("off")',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '视网膜的采样并不均匀：中央凹（fovea）附近的分辨率比视野边缘高一个数量级以上。图注、标签与数值要落在注视点上，而颜色与形状的差别在边缘仍然能被察觉。',
          en: 'Sampling is not uniform: acuity near the fovea is more than an order of magnitude higher than at the edge of the field. Captions, labels and numbers belong where the gaze lands; colour and shape differences are still noticed in the periphery.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '格式塔原则' },
      en: { title: 'Gestalt principles' },
      blocks: [
        {
          t: 'p',
          zh: '1923 年，Wertheimer 提出一组分组原则（Gestalt principles of grouping），回答一个基本问题：画面里只有点，为什么看到的是几组？这些原则描述的是**推断**——图中并没有“组”这样一个对象，组是观看者自己构造出来的。下面的图里，点的个数始终不变，只在五种排列之间变形，变的只有你会读成几组。',
          en: 'In 1923 Wertheimer set out the Gestalt principles of grouping to answer a basic question: the picture contains only dots, so why do you see groups? The principles describe an inference. Nothing in the image is a group; the viewer constructs the groups. In the figure below the number of dots never changes — the same set is arranged five ways, and only the groups you read change.'
        },
        {
          t: 'p',
          zh: '五条最常用的原则是接近（proximity）、相似（similarity）、连续（good continuation）、连通（connectedness）与闭合（closure）。它们的强度并不相等，也不彼此独立：间距拉开到一定程度，“相似”就接管分组；连通往往压倒接近。反过来的一面同样重要：分组会发生在你不想要的地方——斑马纹的行底色、横穿数据区的网格线、离数据点太近的标签，都会造出数据里并不存在的组。',
          en: 'The five most used principles are proximity, similarity, good continuation, connectedness and closure. They are not equally strong and not independent: stretch the spacing far enough and similarity takes over, while connectedness usually overrides proximity. The reverse side matters just as much. Grouping also happens where you do not want it: zebra-striped rows, grid lines cutting across the data, labels sitting too close to the marks — each manufactures a group the data never had.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一批点，两种线索给出两种分组', en: 'one set of points, two cues, two groupings' },
          code: [
            'import numpy as np',
            '',
            'rng = np.random.default_rng(3)',
            'pos = np.r_[rng.normal(0, 0.4, 10), rng.normal(3, 0.4, 10)]',
            'shape = np.tile([0, 1], 10)',
            '',
            'order = np.argsort(pos)',
            'cut = int(np.argmax(np.diff(pos[order]))) + 1',
            '',
            'by_pos = np.sort(order[:cut])',
            'by_shape = np.flatnonzero(shape == 0)',
            '',
            'print("proximity group :", by_pos)',
            'print("similarity group:", by_shape)',
            'print("shared members  :", np.intersect1d(by_pos, by_shape).size)'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-gestalt',
          zh: '同一批 54 个点，在五种分组方式之间变形：接近、相似、连续、连通、闭合。点数始终不变，变的只有排列和你读出的组，每种方式下方给出一句理由。把“相似”与“接近”两种排列对照着看，可以判断哪一条线索更强。',
          en: 'One set of 54 points morphing between five groupings: proximity, similarity, continuity, connectedness, closure. The count never changes — only the arrangement and the groups you read, with a line of explanation for each. Contrast the similarity arrangement with the proximity one to see which cue wins.'
        },
        {
          t: 'note',
          zh: '线索的强弱由量级决定，而不是由种类决定：两点足够近时，颜色相同也压不过距离；差别足够小的时候，相似又反过来决定分组。',
          en: 'Which cue wins depends on magnitude, not on kind: bring two points close enough and matching colour no longer beats distance; shrink the difference far enough and similarity decides the grouping instead.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '前注意处理' },
      en: { title: 'Pre-attentive processing' },
      blocks: [
        {
          t: 'p',
          zh: '在一屏黑白噪点里找一颗红点，几乎不花时间；在一屏红点与绿点中找一颗红色方块，就必须逐个检查。前者是特征搜索（feature search），后者是联合搜索（conjunction search），区别在于用时是否随干扰项的数量增长。用时几乎不随数量变化的那一类判断，称为前注意处理（pre-attentive processing）：它在注视之后的极短时间内完成，不需要主动注意。',
          en: 'Finding a red dot among black-and-white noise costs almost nothing; finding a red square among red and green dots forces you to inspect them one by one. The first is a feature search, the second a conjunction search, and the difference is whether the time grows with the number of distractors. Judgements whose cost barely depends on that number are called pre-attentive: they complete within a fraction of a second after fixation, without deliberate attention.'
        },
        {
          t: 'p',
          zh: '可用的前注意特征并不多：颜色、朝向、大小、形状、位置，以及运动的某些属性。它们同时生效、彼此干扰很小，但总数有限；一旦问题变成两个特征的组合，处理方式就从并行退回串行，速度随元素数量下降。度量这件事的办法是量**斜率**：把目标点的数量逐次加倍，看用时增加多少。',
          en: 'The list of pre-attentive features is short: colour, orientation, size, shape, position and some aspects of motion. They operate at the same time and interfere little with one another, but there are only a handful. As soon as the question asks for a combination of two features, processing falls back from parallel to serial and speed drops as elements are added. The way to measure this is to measure **slope**: double the number of items and see what the time does.'
        },
        {
          t: 'list',
          zh: [
            '并行可用：颜色、朝向、大小、形状这些单一特征，在整幅图上同时生效。',
            '只能串行：两个特征的组合、逐个计数，以及精确的数值比较。',
            '编码含义：一个变量用一条线索；把两个变量都压在颜色上，读每一次都要做联合搜索。'
          ],
          en: [
            'Parallel: single features — colour, orientation, size, shape — act across the whole field at once.',
            'Serial only: combinations of two features, counting, and exact numerical comparison.',
            'Design rule: one cue per variable. Compress two variables into colour alone and every reading becomes a conjunction search.'
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '用斜率区分特征搜索与联合搜索', en: 'slopes separate a feature search from a conjunction search' },
          code: [
            'import numpy as np',
            '',
            'sizes = np.array([4, 8, 16, 32])',
            'times = np.array([',
            '    [507, 516, 529, 564],',
            '    [498, 512, 536, 561],',
            '    [561, 641, 828, 1169],',
            '])',
            '',
            'for row, name in zip(times, ["colour", "shape", "colour + shape"]):',
            '    slope, base = np.polyfit(sizes, row, 1)',
            '    print(f"{name:>14}  {slope:6.1f} ms/item  base {base:6.1f} ms")'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-preattentive',
          zh: '点一下开始计时，在点阵里找出那个不同的点。点阵大小固定，只有目标的定义在变：颜色、形状、大小三个单特征模式几乎一点即中，换成“颜色加形状”的组合就必须逐个扫过，用时明显更长。',
          en: 'Click once to start the clock, then find the odd one out. The field holds a fixed number of dots and only the definition of the target changes: the single-feature modes — colour, shape, size — are hit almost instantly, while a colour-plus-shape target forces a scan and takes visibly longer.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '可辨识的差别' },
      en: { title: 'Just noticeable differences' },
      blocks: [
        {
          t: 'p',
          zh: '两条线段并排时，人能分辨的最小长度差是多少？这个差值并不是一个固定的像素数，而是**与基准长度成比例**：基准越长，需要加上去的差别越大。这个比例叫韦伯分数（Weber fraction），长度判断上约为 1/42；这条规律叫韦伯定律（Weber\u2019s law）。它给长度、面积、灰度这些通道各设了一个下限，也就是刚好能分辨的差别（just noticeable difference）。',
          en: 'Put two bars side by side and ask what the smallest length difference is that a person can see. The answer is not a fixed number of pixels: it is **proportional to the reference length**. The longer the reference, the larger the difference you must add. That ratio is the Weber fraction — about 1/42 for length — and the regularity is Weber\u2019s law. It sets a floor for each channel: length, area, grey. That floor is the just noticeable difference.',
        },
        {
          t: 'p',
          zh: '由此可以推出两条常被违反的规则。第一，不要用固定的绝对差值去编码等级：基准是 20 像素和 200 像素时，同样的 3 像素差别在小基准上看得见、在大基准上看不见，所以分级应当按比例而不是按等距。第二，通道不同，分数不同：长度上的韦伯分数较小，面积与明度上的分数大得多，因此同一个相对差别，用长度编码能被读出，用灰阶编码常常就消失了。',
          en: 'Two rules follow, and both are frequently broken. First, do not encode magnitude with a fixed absolute difference: with references of 20 and 200 pixels, the same 3-pixel difference is visible in one case and invisible in the other, so steps must be proportional rather than equal. Second, the fraction depends on the channel: it is small for length and much larger for area and lightness, so a given relative difference can be read off a bar and vanish in a grey scale.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同样的 3 像素差别，在小基准上可见、在大基准上不可见', en: 'the same 3-pixel difference: visible on a short bar, invisible on a long one' },
          code: [
            'import numpy as np',
            '',
            'k = 1 / 42',
            'bases = np.array([20, 50, 100, 200])',
            'delta = 3.0',
            '',
            'print("base   delta/base    jnd   visible")',
            'for b in bases:',
            '    jnd = k * b',
            '    print(f"{b:5d} {delta / b * 100:11.1f}% {jnd:6.1f} {delta >= jnd}")'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-weber',
          zh: '两个滑块分别控制基准长度与长度差。下方的散点把每一种组合画成一点，刚能分辨的界线是一条过原点的直线，斜率约为 1/42；差值落到线以下时，比较线段转为灰色。基准翻倍，需要的绝对差值也翻倍。',
          en: 'Two sliders set the reference length and the difference to compare against it. Below, each combination is plotted as a point and the just-noticeable boundary is a straight line through the origin with a slope of about 1/42; the comparison bar turns grey once the difference falls under it. Double the reference and the absolute difference required doubles too.'
        },
        {
          t: 'note',
          zh: '还有一层放大效应：感觉强度与物理强度不成正比（Stevens 的幂定律），面积的指数小于 1，所以在气泡图里，直径加倍的圆读起来远不到四倍的量——用面积编码的差别会被系统性低估。',
          en: 'There is a further distortion. Perceived intensity grows as a power of physical intensity (Stevens\u2019 power law) and the exponent for area is below one, so in a bubble chart a circle of double the diameter reads as far less than four times the quantity: area systematically understates differences.'
        }
      ]
    }
  ]
});
