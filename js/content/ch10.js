/* ==========================================================================
   ch10.js — 第 10 章 交互与可视分析
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '10',
  thumb: 'interaction',
  zh: {
    title: '交互与可视分析',
    sub: '一张静止的图只能回答一个已经问出来的问题。交互让图形随问题改变，把有限的屏幕变成可以反复进入的工作面。',
  },
  en: {
    title: 'Interaction and Visual Analytics',
    sub: 'A static figure answers one question that has already been asked. Interaction lets the view change with the question, turning a small screen into a workspace you can re-enter.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '交互解决什么问题' },
      en: { title: 'What interaction solves' },
      blocks: [
        {
          t: 'p',
          zh: '屏幕的面积不会变大，数据却一直在增长。本站的城市数据只有 42 条记录，一张散点图还装得下；换成几十万条订单，任何单一视图都装不下。更要紧的是，一个视图只能承载一种映射，映射定了，它能回答的问题也就定了。',
          en: 'Screens do not grow; datasets do. The 42 cities on this site still fit into one scatter plot; a few hundred thousand orders will not fit into any single view. More important, a view carries one mapping, and once that mapping is fixed the questions the figure can answer are fixed with it.'
        },
        {
          t: 'p',
          zh: '交互（interaction）把“读一张图”变成“操作一个视图”，它应对三件事。屏幕有限而数据远超屏幕，视图必须先概括、再按需展开。答案不能一次读出，需要从全体到局部逐步逼近，也就是[概览优先](#/ch/04)的次序。探索还常常在提问者自己也不知道要找什么的时候开始，查询条件是在看的过程中形成的。',
          en: 'Interaction turns reading a figure into operating a view, and it answers three problems. The screen is small while the data is much larger, so a view must summarise first and expand on demand. An answer is rarely read off in one pass, so it is approached from the whole towards the part, in the [overview-first](#/ch/04) order of Chapter 4. And exploration often begins before the person knows what to look for; the query takes shape while looking.'
        },
        {
          t: 'list',
          zh: [
            '**延迟**：反馈慢于约 100 毫秒，操作与结果的联系就开始断裂，推理被打断。',
            '**状态**：视图要记住当前的选择，连续几次操作才能连成一条思路。',
            '**可逆**：每一次选择都必须能撤销，否则用户不敢探索，只走最保守的路径。'
          ],
          en: [
            '**Latency**: past roughly 100 milliseconds the link between action and result breaks and reasoning is interrupted.',
            '**State**: the view must hold the current selection so that consecutive actions form one line of thought.',
            '**Reversibility**: every selection must be undoable, or people stop exploring and take the safest path.'
          ]
        },
        {
          t: 'p',
          zh: '按这三条衡量，一个只在装饰上响应的图——悬停变色却读不出新数值、点击弹出重复的标签——只增加操作成本，不增加可读的信息。',
          en: 'Measured against those three, a view that responds only in decoration — a colour change on hover that yields no new reading, a tooltip that repeats the label — costs effort and returns no information.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '焦点与上下文' },
      en: { title: 'Focus and context' },
      blocks: [
        {
          t: 'p',
          zh: '放大与概览是一对矛盾：放大局部能看清细节，却失去它在整体中的位置；缩回全局能看清结构，细节又糊在一起。焦点加上下文（focus+context）这一族技术用同一张视图同时给出两者：一部分区域放大成焦点，其余部分被压缩但仍然可见，充当上下文。',
          en: 'Zooming in and staying overviewed pull against each other: enlarging a part shows its detail but loses where that part sits; pulling back shows structure but blurs detail. The focus+context family gives both in one view, with one region enlarged into focus while the rest is compressed but kept visible as context.'
        },
        {
          t: 'p',
          zh: '最常见的是鱼眼（fisheye）：指针附近被放大，放大倍率随与焦点的距离衰减，越远越接近原始比例。把焦点区域另列一处的是概览加细节（overview+detail）：一张给全体，一张给局部，代价是眼睛要在两处之间来回对照。表透镜（table lens）把同一思路用在表格上，行间距随到焦点的距离压缩，几百行可以同时可见。polyfocal 显示则保留多个焦点，让几处细节同时可读。',
          en: 'The most common is the fisheye: the area near the pointer is enlarged and the magnification decays with distance from the focus, approaching the original spacing further away. Overview+detail prints the focal region in a second view — one for the whole, one for the part — at the cost of moving the eyes between two places. The table lens applies the same idea to tables, compressing row spacing with distance so that hundreds of rows stay visible at once. Polyfocal displays keep several foci readable simultaneously.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '鱼眼失真：距焦点越远，放大倍率越低', en: 'fisheye distortion: magnification decays with distance' },
          code: [
            'const R = 240;',
            'const D = 2.4;',
            '',
            'function distort(x, focus) {',
            '  const dx = x - focus;',
            '  if (Math.abs(dx) > R) return x;',
            '  const t = dx / R;',
            '  return focus + R * Math.pow(Math.abs(t), D) * Math.sign(t);',
            '}',
            '',
            'function layout(focus) {',
            '  nodes.forEach(function (n) {',
            '    n.px = distort(n.x, focus.x);',
            '    n.py = distort(n.y, focus.y);',
            '  });',
            '  draw();',
            '}'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-focus',
          zh: '指针所在的一小块被放大，周围的点仍留在原处，整体轮廓不变。把指针移到图的边缘，看焦点区如何跟随；把放大倍率调回 1，图形恢复原来的间距。',
          en: 'A small area around the pointer is enlarged while the surrounding points stay in place, so the overall shape is unchanged. Move the pointer to the edge and watch the focus follow; set the magnification back to 1 and the spacing returns.'
        },
        {
          t: 'note',
          zh: '鱼眼不是免费的：焦点区被拉开，上下文区就被压得更密，本来就拥挤的地方更难读；放大倍率若随时间动画，还会让人短暂失去位置感。',
          en: 'Fisheye is not free: what the focus spreads out, the context squeezes, and an already crowded region becomes harder to read; an animated magnification also costs people their sense of position.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '刷选与联动' },
      en: { title: 'Brushing and linking' },
      blocks: [
        {
          t: 'p',
          zh: '刷选（brushing）是在一个视图里圈出一组记录，联动（linking）是让同一组记录在其他视图里同时高亮。关键不在圈选这个动作，而在于**选择成为一个可以被传递的对象**：系统记住哪些记录被选中，再把它们带到每一个视图。',
          en: 'Brushing selects a group of records inside one view; linking highlights the same records in the other views. The point is not the gesture but that **the selection becomes an object that can be passed on**: the system remembers which records were chosen and carries them to every view.'
        },
        {
          t: 'p',
          zh: '两张并排的图只给出两次独立读数，要比较就得靠记忆把两边的点对上。联动把“找同一批记录”的负担交给机器，把“判断它们意味着什么”留给读者；标识由系统维持，两幅视图里的高亮因此一定指同一批记录。当一处的结果与另一处矛盾——按人口筛出的城市在地图上并不相邻——矛盾会立刻显形，这是并排两张图给不出的信息。',
          en: 'Two figures side by side give only two independent readings, and comparing them means holding one set of points in memory while looking at the other. Linking hands the matching to the machine and leaves the judgement to the reader; identity is maintained by the system, so a highlight in one view and a highlight in the other certainly mean the same records. When one view contradicts another — cities filtered by population turn out not to be neighbours on the map — the contradiction shows at once, which two separate figures cannot deliver.'
        },
        {
          t: 'list',
          zh: [
            '视图越多，选择的语义越含糊：在一个视图里选中一组，它们在另一个视图里可能是空的。',
            '高亮要有节制，超过一半的标记被点亮时，高亮本身就不再是信息。',
            '联动依赖所有视图共享同一个标识，数据若没有统一的键，联动无从建立。'
          ],
          en: [
            'The more views, the vaguer the selection: a group selected in one view may simply be empty in another.',
            'Highlighting needs restraint; once more than half the marks are lit, the light carries no information.',
            'Linking assumes every view shares one identity, and without a common key it cannot be built at all.'
          ]
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '刷选的结果在多个视图之间共享', en: 'one brush result shared by several views' },
          code: [
            'const brush = d3.brush().on("brush end", function (event) {',
            '  const sel = event.selection;',
            '  const hits = sel ? rows.filter(function (d) {',
            '    return d.x >= sel[0][0] && d.x <= sel[1][0] &&',
            '           d.y >= sel[0][1] && d.y <= sel[1][1];',
            '  }) : rows;',
            '  const ids = new Set(hits.map(function (d) { return d.id; }));',
            '  views.forEach(function (view) {',
            '    view.selectAll(".dot").classed("is-on", function (d) {',
            '      return ids.has(d.id);',
            '    });',
            '  });',
            '});',
            '',
            'chart.call(brush);'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-brushlink',
          zh: '在一个视图里刷选，另一个视图里同一批记录同步高亮。缩小刷选范围，观察两张图的高亮如何同时收缩——没有联动时，这个动作要在两个视图里各做一次。',
          en: 'Brush in one view and the same records light up in the other. Shrink the brush and watch both highlights contract together — without linking, that action would have to be repeated in each view.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '语义缩放' },
      en: { title: 'Semantic zoom' },
      blocks: [
        {
          t: 'p',
          zh: '几何缩放（geometric zoom）把同样的标记放大：像素变大，信息不变，放大一座城市的点，最终得到一个巨大的点。语义缩放（semantic zoom）在尺度越过某个阈值时更换表示层级：国界换成城市，城市换成街道，街道换成建筑。标准很好判断——放大后如果出现新的对象、新的标签或新的聚合单位，是语义缩放；如果只是变得更大，是几何缩放。',
          en: 'Geometric zoom enlarges the same marks: pixels grow, information does not, and zooming into a city marker eventually yields one huge marker. Semantic zoom switches representation when the scale crosses a threshold: coastlines become cities, cities become streets, streets become buildings. The test is simple — if new objects, labels or aggregate units appear, it is semantic zoom; if everything merely got bigger, it is geometric.'
        },
        {
          t: 'p',
          zh: '层级之间需要锚点：同一个对象在相邻两级中必须可辨认，位置也要连续，否则读者会迷失在“荒漠之雾”（desert fog）里——看得见细节，却不知道自己在哪里。语义缩放的设计工作，因此主要是决定每一级画什么、在什么尺度切换，以及切换时保留哪些视觉线索。',
          en: 'Levels need anchors: the same object must stay recognisable across adjacent levels and its position must change continuously, or the reader is lost in desert fog — detail in sight, location unknown. Designing semantic zoom is therefore mostly deciding what each level draws, at which scale the switch happens, and which visual cues survive it.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '按当前缩放比例选择表示层级', en: 'choosing a representation level from the zoom scale' },
          code: [
            'const zoom = d3.zoom()',
            '  .scaleExtent([1, 64])',
            '  .on("zoom", function (event) {',
            '    const k = event.transform.k;',
            '    const level = k < 4 ? "region" : k < 16 ? "city" : "street";',
            '    if (level !== current) {',
            '      current = level;',
            '      render(level, event.transform);',
            '    } else {',
            '      place(event.transform);',
            '    }',
            '  });',
            '',
            'canvas.call(zoom);'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-semanticzoom',
          zh: '放大时标记被替换成更详细的层级，而不是把像素放大。在两个层级之间来回拖动，注意同一个对象在切换前后是否仍然可辨认。',
          en: 'Zooming replaces marks with a more detailed level instead of enlarging pixels. Move back and forth across a switch and check whether the same object stays recognisable on both sides.'
        },
        {
          t: 'note',
          zh: '切换点是离散的，如果切换瞬间标记的位置跳动过大，读者会短暂失去方向；把切换安排在标记位移最小的尺度上可以缓解这一点。',
          en: 'The switch is discrete: if marks jump too far when it happens, readers briefly lose their bearings, which is why the threshold is best placed where movement is smallest.'
        }
      ]
    },
    {
      id: 's5',
      zh: { title: '从图到知识的循环' },
      en: { title: 'From figures to knowledge' },
      blocks: [
        {
          t: 'p',
          zh: '一张图给出的是一次观察，知识来自多轮观察的累积。Keim 等人在 2008 年把可视分析（visual analytics）的过程概括成一条循环：数据经自动分析得到模型，模型经视觉映射成为图形，人在图形上交互，交互又改变数据与模型的选择，最终产出知识，知识再成为下一轮的假设。',
          en: 'One figure gives one observation, and knowledge accumulates over many. Keim and colleagues summarised the visual analytics process in 2008 as a loop: data yields models through automated analysis, models become figures through visual mapping, a person interacts with the figures, and that interaction changes which data and which models are considered — producing knowledge, which becomes the hypothesis of the next round.'
        },
        {
          t: 'p',
          zh: '循环里有两种互补的工作。自动方法负责规模：聚类、降维、异常检测把几十万条记录压成几十个候选。人负责判断：这个分组是有意义的类别，还是算法凑出的巧合；这个异常是数据错误，还是真正的发现。两者交替，单独工作都有失效的方式：全自动分析给出无法解释的结果，纯手工观察在数据规模前失效。以本站的 42 座城市为例，一轮循环是：先看总体分布，刷出人口超过 2000 万的 8 座城市，逐条读出数值，再把这个观察写成下一轮的假设。',
          en: 'Two kinds of work alternate. Automation handles scale: clustering, projection and outlier detection compress a few hundred thousand records into a few dozen candidates. The person handles judgement: is this group a meaningful category or a coincidence of the algorithm, is this outlier a data error or a finding. Each fails in its own way when left alone — a fully automatic analysis returns results nobody can explain, and manual inspection collapses in front of the data volume. On the 42 cities of this site, one round runs like this: look at the overall distribution, filter to the eight cities above twenty million, read their values one by one, then turn the observation into the next hypothesis.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '自动方法给出若干候选分组，供人判断', en: 'automation proposes candidate groupings for a person to judge' },
          code: [
            'import numpy as np',
            'from sklearn.cluster import KMeans',
            'from sklearn.preprocessing import StandardScaler',
            '',
            'X = np.array([[c["lon"], c["lat"], np.log10(c["pop"])] for c in cities])',
            'X = StandardScaler().fit_transform(X)',
            '',
            'for k in (2, 3, 4, 5):',
            '    km = KMeans(k, n_init=10, random_state=0).fit(X)',
            '    sizes = np.bincount(km.labels_, minlength=k)',
            '    print(k, sizes.tolist(), round(km.inertia_))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-valoop',
          zh: '数据、模型、可视化、交互与知识构成一个循环，动画演示其中一轮。注意两条箭头交替出现：一条代表自动分析，一条代表人的判断。',
          en: 'Data, models, visualization, interaction and knowledge form a loop; the animation plays one round. Watch the two arrows alternate — one for automated analysis, one for human judgement.'
        },
        {
          t: 'quote',
          zh: '可视分析是通过交互式视觉界面促进分析推理的科学。',
          en: 'Visual analytics is the science of analytical reasoning facilitated by interactive visual interfaces.',
          by: 'Thomas and Cook, 2005'
        }
      ]
    }
  ]
});
