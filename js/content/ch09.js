/* ==========================================================================
   ch09.js — 第 9 章 层次与网络数据可视化
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '09',
  thumb: 'network',
  zh: {
    title: '层次与网络数据可视化',
    sub: '数据里除了数值，还有关系。层次与网络是两种最常见的关系结构，它们的画法差别，归结为一个问题：位置是数据给的，还是算出来的。',
  },
  en: {
    title: 'Hierarchies and Networks',
    sub: 'Data carries relations as well as values. Hierarchies and networks are the two most common relational structures, and their layouts differ over one question: is position given by the data, or computed from it?',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '包含与关联' },
      en: { title: 'Containment and connection' },
      blocks: [
        {
          t: 'p',
          zh: '前面几章的数据都能摊成一张表，每行独立于其他行。另有一类数据，信息主要存在于元素之间的关系里，关系分两种。**包含（containment）**：一个元素是另一个的组成部分，像章下面是节、文件夹里有文件；它层层嵌套、不留环，形成层次（hierarchy）。**关联（connection）**：两个元素有联系，但谁也不是谁的组成部分，像引用、友谊、航线；它不规定上下、可以成环，形成网络（network）。',
          en: 'Every dataset so far could be laid out as a table in which each row stands on its own. Another kind of data carries its information mainly in the relations between elements, and those relations come in two forms. **Containment**: one element is part of another, as a section sits inside a chapter or a file inside a folder; it nests without cycles and forms a hierarchy. **Connection**: two elements are linked without either being part of the other, as with citations, friendships or air routes; it imposes no order, may contain cycles, and forms a network.'
        },
        {
          t: 'p',
          zh: '两种结构对画法的影响是根本性的。层次数据里每个节点都有一条从根出发的路径，位置是先天的：深度决定半径或纵坐标，兄弟次序决定横向位置，整块画布可以被完整分配。网络数据没有这样的路径，也没有天然的上下左右，位置必须由布局算法（layout）算出来——换个算法或换个随机种子就是另一幅图。**位置在层次图里是数据属性，在网络图里是计算结果**，这是最重要的区别。',
          en: 'The two structures shape the drawing in fundamentally different ways. In a hierarchy every node has a path from the root, so its position is given: depth sets the radius or the vertical coordinate, sibling order sets the horizontal one, and the canvas can be divided up completely. A network has no such paths and no natural up or down, so positions have to be computed by a layout algorithm — and another algorithm, or another random seed, produces a different picture. **Position is an attribute of the data in a hierarchy and a product of computation in a network**, and that is the key difference between them.'
        },
        {
          t: 'p',
          zh: '两种结构可用的编码资源相同，但一次画图只能让一类问题容易回答：比较大小读的是面积或长度，看连接与群团读的是位置与邻接。下面把两者分开讨论。',
          en: 'Both structures draw on the same encoding resources, yet one drawing can only make one kind of question easy to answer: comparing magnitudes means reading areas or lengths, while seeing connections and groups means reading position and adjacency. The two are treated separately below.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '同一份数据：层次的深度与网络的度数', en: 'one dataset, tree depth and graph degree' },
          code: [
            'const root = d3.hierarchy(VIZ.kit.bookTree("zh"))',
            '  .sum(d => d.value || 0)',
            '  .sort((a, b) => b.value - a.value);',
            '',
            'const net = VIZ.kit.data.network;',
            'const linked = new Set();',
            'net.links.forEach(l => { linked.add(l.s); linked.add(l.t); });',
            '',
            'console.log(root.height, root.leaves().length, linked.size);'
          ].join('\n')
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '层次布局' },
      en: { title: 'Hierarchy layouts' },
      blocks: [
        {
          t: 'p',
          zh: '层次布局要回答的是把一块面积按包含关系切开的方式。最直接的做法是节点-链接树（node-link tree）：节点画成点或小矩形，父子之间连线，深度映射到纵坐标或半径。它把结构讲得最清楚，层级、分支、深度一目了然，代价是空间利用率低——节点大小与它的值无关，画的只是拓扑。绕成圆形得到径向树（radial tree），省下横向空间，但同层节点的角度位置不编码数量，边都收敛到圆心。',
          en: 'A hierarchy layout has to decide how a block of area is divided by containment. The most direct approach is the node-link tree: nodes drawn as dots or small rectangles, parents joined to children by lines, depth mapped to a vertical coordinate or a radius. It states the structure most clearly — levels, branches and depth are obvious at a glance — and it wastes space, because the size of a node says nothing about its value; only the topology is drawn. Coiling the tree into a circle gives the radial tree, which saves horizontal room, but angle position within a level encodes no quantity and every edge converges on the centre.'
        },
        {
          t: 'p',
          zh: '空间填充（space-filling）布局反过来：不画连线，用面积表示包含关系。矩形树图（treemap）从外向内递归切分矩形，叶子面积正比于数值。要让面积可被眼睛比较，**切分算法必须控制长宽比**：slice-and-dice 切出细长条，很难判断大小；squarified treemap 把每一行排成接近正方形的块，使面积比较可靠。旭日图（sunburst）把同一棵树卷成同心环，角度编码数值、半径编码深度，保留完整路径，也能一眼看出总量分配；代价是外圈扇区又窄又扁，标签放不下。',
          en: 'Space-filling layouts do the opposite: no parent-child lines at all, containment shown by area. A treemap subdivides a rectangle recursively from the outside in, so each leaf is proportional in area to its value. For those areas to be comparable by eye, **the tiling algorithm has to control aspect ratio**: slice-and-dice yields long thin strips whose sizes are hard to rank, while a squarified treemap arranges each row of rectangles into near-squares so that areas can be compared reliably. A sunburst rolls the same tree into concentric rings, angle encoding value and radius encoding depth: it keeps the full path from the root and shows how the total splits at a glance, at the cost of narrow, flattened sectors in the outer rings where labels no longer fit.'
        },
        {
          t: 'p',
          zh: '三者的差别可以归结为一句话：**面积用来画数据，还是用来画结构**。比较“哪一项占多大”用矩形树图；读“有多深、路径如何”用节点-链接树或径向树；在层级之间逐层钻取（drill-down），同心环很自然。本站目录就是一例：根是书名，第二层是章，第三层是节，叶子面积来自正文长度，所以面积比的是内容量，不是节的个数。',
          en: 'The difference between the three comes down to one question: **is the area spent on data, or on structure**? Asking which item takes up most of the whole calls for a treemap; asking how deep the tree goes and where a path leads calls for a node-link or radial tree; drilling down through levels comes naturally to concentric rings. The site catalogue is a real example — the root is the book title, the second level the chapter, the third the section, and a leaf\u2019s area comes from the length of that section\u2019s text, so the areas compare amounts of content, not numbers of sections.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '用 squarified 算法切分目录树', en: 'tiling the catalogue tree with squarified rectangles' },
          code: [
            'const root = d3.hierarchy(VIZ.kit.bookTree("zh"))',
            '  .sum(d => d.value || 0)',
            '  .sort((a, b) => b.value - a.value);',
            '',
            'd3.treemap()',
            '  .size([600, 360])',
            '  .paddingInner(2)',
            '  .paddingOuter(3)',
            '  .tile(d3.treemapSquarify)(root);',
            '',
            'root.leaves().forEach(d => {',
            '  ctx.fillRect(d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);',
            '});'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-treemap',
          zh: '同一棵目录树在矩形树图、旭日图与径向树之间变形。矩形树图的面积可以直接比较；换到同心环与径向树，深度与通向叶子的路径更容易读——同一份数据，两种问题，两种答案。',
          en: 'One catalogue tree morphing between a treemap, a sunburst and a radial tree. In the treemap the areas can be compared directly; in the rings and the radial tree, depth and the path down to a leaf are easier to read — one dataset, two questions, two answers.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '力导向布局' },
      en: { title: 'Force-directed layout' },
      blocks: [
        {
          t: 'p',
          zh: '网络没有天然的坐标系，位置必须求解。力导向布局（force-directed layout）**把图当作物理系统**：每条边是一根弹簧（spring），把两端节点拉向理想长度；任意两个节点之间有斥力（repulsion），互相推开、避免重叠；再加一个拉向中心的弱力。每轮迭代累加每个节点所受的合力，让它沿力的方向移动一小步，并给速度加阻尼，能量逐步下降，直到位置稳定。',
          en: 'A network has no natural coordinate system, so its positions have to be solved for. The force-directed layout **treats the graph as a physical system**: every edge is a spring pulling its two nodes towards an ideal length, every pair of nodes repels every other pair so that nothing overlaps, and a weak force pulls the whole drawing towards the centre. Each iteration sums the forces on every node, moves it a small step along the resulting direction, and damps the velocity, so the energy falls until the positions settle.'
        },
        {
          t: 'p',
          zh: '它的副产品很受欢迎：连接密的节点被拉成一团，连接稀的团被推开，群团（cluster）结构自己浮现——本节图中五十五个节点正是按五个群团生成的。但**位置是算出来的，这带来三条限制**。结果不唯一：初始位置随机，两次运行会得到互为旋转或镜像的图，绝对坐标没有意义。容易停在局部最优：一个节点被拽到错误的一侧后，弹簧与斥力可能形成把它困住的平衡。稳定性差：拖动一个节点，整幅图重新平衡，读者刚记住的位置就失效。',
          en: 'The by-product is welcome: densely linked nodes are pulled together and sparse groups are pushed apart, so clusters emerge without any extra computation — the fifty-five nodes in this section\u2019s figure are generated as five clusters. But **the positions are computed, and that brings three limits**. The result is not unique: starting positions are random, two runs produce drawings that are rotated or mirrored versions of each other, and a node\u2019s absolute coordinates mean nothing. The system can stall in a local optimum: once a node is dragged to the wrong side, spring and repulsion forces may settle into an equilibrium that traps it there. And it is unstable: drag one node and the whole drawing rebalances, so the position the reader just memorised is gone.'
        },
        {
          t: 'p',
          zh: '因此工程上要做三件事：固定随机种子与初始位置，让同一份数据每次画出来一样；把拖动限制为局部调整，或在拖动后固定（pin）该节点；边太密时先减少边——按权重过滤、只显示选中节点的邻居，或改用邻接矩阵，因为几百条边以上的节点-链接图会变成无法追踪的毛线球（hairball）。',
          en: 'In practice that means three precautions: fix the random seed and the initial positions so that the same data always draws the same picture; keep dragging local, or pin a node once the reader has placed it; and thin the edges before drawing when they are dense — filter by weight, show only the neighbours of a selected node, or switch to an adjacency matrix, because a node-link diagram with more than a few hundred edges collapses into an untraceable knot, the familiar hairball.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '弹簧与斥力模拟', en: 'springs, repulsion and collision' },
          code: [
            'const { nodes, links } = VIZ.kit.data.network;',
            'const edges = links.map(l => ({ source: l.s, target: l.t, w: l.w }));',
            '',
            'const lines = svg.selectAll("line").data(edges).join("line");',
            'const dots = svg.selectAll("circle").data(nodes).join("circle");',
            '',
            'const sim = d3.forceSimulation(nodes)',
            '  .force("link", d3.forceLink(edges).id(d => d.id)',
            '    .distance(e => 14 + 30 * (1 - e.w))',
            '    .strength(e => 0.12 + 0.5 * e.w))',
            '  .force("charge", d3.forceManyBody().strength(-90))',
            '  .force("center", d3.forceCenter(300, 180))',
            '  .force("collide", d3.forceCollide().radius(d => 4 + d.deg * 2));',
            '',
            'sim.on("tick", () => {',
            '  dots.attr("cx", d => d.x).attr("cy", d => d.y);',
            '  lines.attr("x1", d => d.source.x).attr("y1", d => d.source.y)',
            '       .attr("x2", d => d.target.x).attr("y2", d => d.target.y);',
            '});'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-network',
          zh: '力导向网络：节点可拖动，也能展开某个节点的邻居，边宽表示权重。拖动一个节点，整幅图围绕它重新平衡，刚才记住的位置随即失效——这正是“位置是计算结果”的直接体现。',
          en: 'A force-directed network: nodes can be dragged, a node\u2019s neighbours can be unfolded, and edge width carries weight. Drag one node and the whole drawing rebalances around it, erasing the positions the reader had just memorised — a direct demonstration that position here is a computed result, not a property of the data.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '流量与层级' },
      en: { title: 'Flows and stages' },
      blocks: [
        {
          t: 'p',
          zh: '最后一类结构把包含与关联合在一起：数据分阶段流动，每个阶段有有限的几个门户。桑基图（Sankey diagram）是它的标准画法：节点按阶段排成几列，高度正比于流经它的总量，节点之间的带子宽度正比于流量。它最重要的性质是**守恒（conservation）**：中间节点的流入总量等于流出总量，每个截面的总宽度相同，读者看到的是同一份量在不同环节之间重新分配。',
          en: 'The last structure combines containment with connection: something flows between stages, and each stage has a small number of ports. The Sankey diagram is the standard drawing for it: nodes are arranged in columns by stage, the height of a node is proportional to the throughput passing through it, and the ribbons between nodes are as wide as the flow. Its defining property is conservation — what flows into an intermediate node equals what flows out — so every vertical slice of the diagram has the same total width, and the reader watches one fixed quantity being redistributed between stages.'
        },
        {
          t: 'p',
          zh: '守恒也是它的软肋。桑基图在几何上强制宽度相等，**只有数据本身守恒时它才诚实**；若各列数值来自独立测量、合计对不上，无论带子凭空出现或消失，还是两列总宽不等，读者都会以为存在一条并不存在的通道。画之前先核对各阶段合计，把差值作为损耗（loss）显式画出。它也不擅长回答“任意两个元素之间的关系”：交叉的带子互相遮挡，层级一多就难以追踪远距离连接，通常靠悬停高亮与把细流合并成“其他”来缓解。',
          en: 'Conservation is also its weak point. The geometry forces equal widths, so the picture is only honest when the data conserves; if each column comes from an independent measurement and the totals disagree, then either a ribbon appears or vanishes from nowhere or the two columns end at different widths, and the reader infers a channel that does not exist. Check the stage totals first, and draw any difference explicitly as a loss. A Sankey is also poor at answering "what is the relation between these two elements": crossing ribbons hide one another, and with more than a few stages a long-range connection becomes impossible to trace, which is why hovering to highlight and merging small flows into "other" are the usual remedies.'
        },
        {
          t: 'num',
          zh: [
            '从左端读出总量：节点高度就是它承载的流量。',
            '沿一条带子向右追：每经过一个节点它分成几份，几份之和等于进入时的宽度。',
            '悬停锁定单条流向，比较上下游的宽度；对不上的地方，问题通常在数据而不在画法。'
          ],
          en: [
            'Read the total off the left edge: the height of a node is the flow passing through it.',
            'Follow one ribbon to the right: at each node it splits into parts, and those parts add up to the width it arrived with.',
            'Hover to lock a single flow and compare its widths upstream and downstream; where they disagree, the problem is usually the data, not the drawing.'
          ]
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: 'Sankey 布局与守恒检查', en: 'Sankey layout and a conservation check' },
          code: [
            'const sankey = d3.sankey()',
            '  .nodeWidth(14)',
            '  .nodePadding(10)',
            '  .nodeAlign(d3.sankeyJustify)',
            '  .extent([[0, 0], [460, 260]]);',
            '',
            'const g = sankey({',
            '  nodes: data.nodes.map(d => Object.assign({}, d)),',
            '  links: data.links.map(d => Object.assign({}, d))',
            '});',
            '',
            'g.nodes.forEach(n => {',
            '  const inflow = d3.sum(n.targetLinks, l => l.value);',
            '  const outflow = d3.sum(n.sourceLinks, l => l.value);',
            '  console.log(n.name, inflow, outflow, Math.round(n.y1 - n.y0));',
            '});'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-sankey',
          zh: '分层流量图：数据从来源经中间节点流向去处，节点高度正比于通过它的总量，带子宽度正比于流量。悬停任一条带子可以高亮它完整的上下游路径，也可以据此检查这份数据是否真的守恒。',
          en: 'A staged flow diagram: data runs from sources through intermediate nodes to destinations, node height is proportional to throughput and ribbon width to flow. Hovering a ribbon highlights its whole upstream and downstream path, which is also how the conservation of this dataset can be checked.'
        }
      ]
    }
  ]
});
