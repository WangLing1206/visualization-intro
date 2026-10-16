/* ==========================================================================
   ch06.js — 第 6 章 高维数据可视化
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '06',
  thumb: 'parallel',
  zh: {
    title: '高维数据可视化',
    sub: '两个字段可以画一张散点图，六个字段就没有直接的画法：样本变稀，距离失去分辨力，出路只有换一种画法，或者主动降维。',
  },
  en: {
    title: 'High-dimensional data',
    sub: 'Two fields make a scatterplot; six have no direct picture. Samples grow sparse, distances lose their contrast, and the only ways out are a different figure or fewer dimensions.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '维度灾难' },
      en: { title: 'The curse of dimensionality' },
      blocks: [
        {
          t: 'p',
          zh: '先做一道算术。一维区间上放 100 个点已经够密，而在 d 维立方体里保持同样的密度需要 100^d 个点，10 维就是 10^20 个。`VIZ.kit.data.multi` 的 42 辆车摊在 `hp`、`weight`、`mpg`、`disp`、`acc`、`year` 六个字段上看着很宽松，可它们只占 6 维空间中极小的一块：空间指数增长而样本量不变，任何局部平均都凑不齐邻居。',
          en: 'Start with arithmetic. A hundred points are dense enough on a line, but keeping that density in a d-dimensional cube takes 100^d of them — 10^20 at ten dimensions. The 42 cars in `VIZ.kit.data.multi` look comfortably spread over the six fields `hp`, `weight`, `mpg`, `disp`, `acc` and `year`, yet they occupy a minute corner of that space: it grows exponentially while the sample size stays fixed, so no local average can gather enough neighbours.'
        },
        {
          t: 'p',
          zh: '第二个后果更隐蔽：**距离集中（distance concentration）**。低维里“最近”与“最远”相差很大，聚类、近邻分类与异常检测才有分辨力；维数升高后，随机两点间的距离集中到同一个值附近，最远与最近的比值趋于 1，距离的变异系数趋于 0，“谁离谁近”几乎不再携带信息。下面代码抽取随机点对，维数从 2 增到 1000，这两个数都会迅速塌缩。',
          en: 'The second consequence is quieter: **distance concentration**. In low dimensions the nearest and the farthest neighbour differ greatly, which is what gives clustering, nearest-neighbour classification and outlier detection their power. As the dimension rises, distances between random pairs collapse onto one value — the ratio of farthest to nearest tends to 1, the coefficient of variation tends to 0, and “which of these is closer” stops carrying information. The code samples random pairs from 2 to 1000 dimensions; both numbers collapse quickly.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '维数升高时距离的分辨力如何消失', en: 'how distance stops discriminating as d grows' },
          code: [
            'import numpy as np',
            '',
            'rng = np.random.default_rng(0)',
            'i = rng.integers(0, 1000, 4000)',
            'k = rng.integers(1, 1000, 4000)',
            '',
            'for d in (2, 10, 100, 1000):',
            '    x = rng.random((1000, d))',
            '    r = np.linalg.norm(x[i] - x[(i + k) % 1000], axis=1)',
            '    print(d, round(r.max() / r.min(), 2), round(r.std() / r.mean(), 3))'
          ].join('\n')
        },
        {
          t: 'note',
          zh: '维度灾难不是说维数高了会算错，而是**样本量与距离这两件依赖低维直觉的东西换了含义**。后三节各给一条出路：换坐标、把成对关系摊开、主动降维。',
          en: 'The curse of dimensionality is not a computational failure at high d; it is that **sample size and distance stop meaning what low-dimensional intuition expects**. The three sections that follow each offer a way out: change the coordinates, lay every pair out, or reduce the dimension on purpose.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '平行坐标与刷选' },
      en: { title: 'Parallel coordinates and brushing' },
      blocks: [
        {
          t: 'p',
          zh: '第一条出路不降维，而是**换一套坐标**：**平行坐标（parallel coordinates）**把 d 个字段各画成一条竖直的轴，等距并排，一条记录在每条轴上取一个位置，再用折线连接。散点图里的“一个点”在这里变成“一条折线”，沿它横扫一遍就读完了这条记录的全部字段；散点图里的一条直线则变成一族交于同一点的折线，交点位置只由斜率与截距决定。',
          en: 'The first way out keeps every dimension and **changes the coordinate system**. **Parallel coordinates** draw each of the d fields as a vertical axis at even spacing; a record takes one position on each axis and a polyline joins them. A point in a scatterplot becomes a line here, and sweeping along one polyline reads every field of that record; a straight line in a scatterplot becomes a family of polylines crossing at a single point whose position depends only on slope and intercept.'
        },
        {
          t: 'p',
          zh: '最容易被低估的是**轴序**。位置编码字段取值，轴间斜率与交叉编码两个字段是否同步变化，而读者能看到的只是相邻两轴之间的结构：相关的字段放在一起，折线收束成整齐的束；无关字段夹在中间，图形就退化成一片交叉的噪声。寻找交叉最少的轴序是组合优化问题，常用做法是先按相关性把字段聚成簇、再排轴（Ankerst 等，1998）。',
          en: 'The most underrated decision is **axis order**. Position on an axis encodes a field value; slopes and crossings between axes encode whether two fields move together; but a reader can only see structure between adjacent axes. Put correlated fields side by side and the polylines gather into tidy ribbons; slip an unrelated field between them and the display decays into crossing noise. Finding the order with the fewest crossings is a combinatorial problem, so in practice fields are clustered by correlation and the axes laid out cluster by cluster (Ankerst et al., 1998).'
        },
        {
          t: 'list',
          zh: [
            '在一条轴上拖出区间，等于给这个字段加一个条件：`hp` 落在 150 与 400 之间。',
            '在几条轴上继续刷选，得到的是各条件的**交集**，先后顺序不影响结果。',
            '交集收缩很快：两三条轴上的区间就能把某一类（`cls`：小型车、中型车、SUV）从 42 辆车里挑出来。'
          ],
          en: [
            'An interval dragged on one axis adds one condition to that field: `hp` between 150 and 400.',
            'Brushing several axes combines the conditions by **intersection**, and the order makes no difference to the result.',
            'A conjunction shrinks fast: intervals on two or three axes already isolate one class (`cls`: compact, mid-size, SUV) out of the forty-two cars.'
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '刷选就是若干区间条件的交集', en: 'a brush is the intersection of interval conditions' },
          code: [
            'import pandas as pd',
            '',
            'cars = pd.read_csv("cars.csv")',
            'sel = pd.Series(True, index=cars.index)',
            'for field, lo, hi in [("hp", 150, 400), ("weight", 1200, 2600)]:',
            '    sel &= cars[field].between(lo, hi)',
            '',
            'print(sel.sum())',
            'print(cars[sel].groupby("cls")["mpg"].agg(["count", "mean"]).round(1))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-parcoords',
          zh: '6 条轴，42 条折线，一条折线是一辆车的完整记录。在任意轴上拖出区间即完成一次刷选，被选中的折线在其余轴上同步高亮并给出统计。把 `hp` 的下界抬到 150 以上，剩下的折线明显偏向 SUV。',
          en: 'Six axes and forty-two polylines, each one the full record of a car. Dragging an interval on any axis brushes the data: the selected lines highlight across the other axes and their statistics are reported. Raise the lower bound on `hp` past 150 and the surviving lines lean towards the SUVs.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '散点图矩阵' },
      en: { title: 'The scatterplot matrix' },
      blocks: [
        {
          t: 'p',
          zh: '第二条出路不加新概念，只是把散点图**用足**：d 个字段两两配对共有 d(d-1)/2 种组合，排成方阵就是**散点图矩阵（scatterplot matrix）**。6 个字段给出 15 对，排成 6×6 的网格。它不做取舍，也不选主成分，每一格都是两个字段真实的联合分布。',
          en: 'The second way out adds no new idea, it only uses the scatterplot fully. The d(d-1)/2 pairs of d fields arranged in a square grid form the **scatterplot matrix**: six fields give 15 pairs in a 6×6 grid. Nothing is traded away and no component is chosen — every cell is the true joint distribution of two fields.'
        },
        {
          t: 'p',
          zh: '代价分两层，都随字段数增长。**面板数是 O(d²)**：字段从 6 个增到 12 个，面板从 15 块涨到 66 块，要扫视的图是原来的四倍多，每块还更小。**每格内部是 O(n²)**：n 条记录两两都可能落在同一个像素上，像素却不会随数据增长，几千条就能把一格填成实心色块，只剩透明度或按格计数还能显出密度。',
          en: 'The price comes in two layers, both growing with the field count. **The panel count is O(d²)**: from six fields to twelve, the matrix goes from 15 panels to 66, so there are four times as many plots and each is smaller. **Inside a cell the cost is O(n²)**: any two of the n records may land on the same pixel, while the pixel supply never grows, so a few thousand records fill a cell into a solid block and only transparency or cell counting shows density again.'
        },
        {
          t: 'p',
          zh: '它真正的威力来自**联动（linking）**：一格读不出的关系，几格一起看就读得出。指针悬停一点，所有格里的同一条记录同时高亮，“这辆车 `mpg` 偏低是因为它重”这类跨字段判断才有依据；在一处刷选，其余格只画选中的记录，边缘分布随即变成条件分布。冗余至此由缺点转为优点，前提是高亮真的同步。',
          en: 'Its real power comes from **linking**: a relation invisible in one cell becomes visible across several. Hover a point and the same record highlights everywhere, which is what supports a claim such as “this car is low on `mpg` because it is heavy”; brush in one cell and the others can be restricted to the selection, turning each marginal into a conditional distribution. Redundancy turns from cost into asset on one condition: the highlighting is genuinely synchronised.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '用四个字段画一张散点图矩阵', en: 'a four-field scatterplot matrix' },
          code: [
            'import pandas as pd',
            'import matplotlib.pyplot as plt',
            'from pandas.plotting import scatter_matrix',
            '',
            'cars = pd.read_csv("cars.csv")',
            'cols = ["hp", "weight", "mpg", "disp"]',
            '',
            'axes = scatter_matrix(',
            '    cars[cols], figsize=(6, 6), s=9, alpha=0.7,',
            '    diagonal="hist", color="#141414",',
            ')',
            'plt.show()'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-spm',
          zh: '6 个字段排成的方阵，同一条记录在各格中由同一份数值定位。把指针移到一点上，其余格子里的同一条记录同时亮起：一辆在 `mpg` 上离群的车，在 `weight` 上也能看到它离群的样子。',
          en: 'A square of six fields, every cell a scatterplot of one pair, the same record placed by the same values. Hover a point and that record lights up in all the other cells: a car that sits far out on `mpg` shows the same departure on `weight`.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '线性投影' },
      en: { title: 'Linear projection' },
      blocks: [
        {
          t: 'p',
          zh: '第三条出路不再增加图形，而是**减少维度**。线性投影（linear projection）把每条 d 维记录乘上一个 d×2 的矩阵压成两个坐标，再当作普通散点图画出来。系数有无穷多种取法，必须有一个准则，**主成分分析（principal component analysis，PCA）**取的是方差最大：第一主成分是使投影方差最大的方向，第二主成分在与之正交的方向中方差最大，依此类推。',
          en: 'The third way out stops adding figures and **removes dimensions**. A linear projection multiplies every d-dimensional record by a d×2 matrix to get two coordinates, drawn as an ordinary scatterplot. There are infinitely many ways to choose the coefficients, so a criterion is needed, and **principal component analysis (PCA)** takes maximum variance: the first component is the direction whose projection varies most, the second varies most among the directions orthogonal to it, and so on.'
        },
        {
          t: 'p',
          zh: '这个准则有闭式解：数据去中心化后，**协方差矩阵（covariance matrix）的特征向量（eigenvector）就是这些方向，对应的特征值（eigenvalue）就是投影后的方差**，特征向量的每个分量是该字段在这个方向上的权重。特征值之和等于总方差，所以第 i 个主成分的**方差解释比例**是 λ_i 除以总和：若前两个主成分解释 85%，就意味着 6 个字段压成 2 维时丢掉了 15% 的方差，而丢掉的部分不会回来——投影不是换个角度看同一份数据，而是抹平了被舍弃方向上的差别。',
          en: 'The criterion has a closed form. Once the data is centred, **the eigenvectors of the covariance matrix are those directions and the eigenvalues are the variances of the projections**; each coordinate of an eigenvector is the weight that direction gives a field. The eigenvalues sum to the total variance, so the **explained variance ratio** of the i-th component is λ_i over that sum: if the first two components explain 85%, squeezing six fields into two coordinates threw away 15% of the variance, and it does not come back. A projection is not another view of the same data; it flattens the differences along the directions it discards.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '标准化后做 PCA，打印方差解释比例、第一主成分载荷与得分', en: 'standardise, fit PCA, print the variance ratio, the first loadings and the scores' },
          code: [
            'import pandas as pd',
            'from sklearn.decomposition import PCA',
            'from sklearn.preprocessing import StandardScaler',
            '',
            'cars = pd.read_csv("cars.csv")',
            'fields = ["hp", "weight", "mpg", "disp", "acc", "year"]',
            '',
            'z = StandardScaler().fit_transform(cars[fields])',
            'p = PCA(n_components=2).fit(z)',
            '',
            'print(p.explained_variance_ratio_.round(2))',
            'print(p.components_[0].round(2))',
            'print(p.transform(z)[:3].round(2))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-pca',
          zh: '点云连续旋转到主成分方向，同时给出该方向解释的方差比例。最大值出现在主成分方向上，而且通常小于 1：垂直方向上的差别并没有消失，只是被这次投影丢掉了。',
          en: 'The cloud rotates continuously towards the principal direction while the explained variance ratio of the current direction is reported. The maximum falls exactly on the principal direction and is normally below 1: the spread perpendicular to it has not vanished, this projection simply discards it.'
        },
        {
          t: 'table',
          head: {
            zh: ['画法', '随字段数增长的代价', '能回答的问题'],
            en: ['View', 'Cost as fields grow', 'The question it answers']
          },
          rows: [
            {
              zh: ['平行坐标', '线性：每加一个字段加一条轴，轴序改变结构', '在若干字段上同时落在给定区间内的是哪些记录'],
              en: ['Parallel coordinates', 'linear: one axis per field, and axis order changes the structure', 'which records fall inside interval conditions on several fields at once']
            },
            {
              zh: ['散点图矩阵', '平方：d 个字段要 d(d-1)/2 块面板', '哪两个字段之间存在关系，离群点出现在哪些字段上'],
              en: ['Scatterplot matrix', 'quadratic: d fields need d(d-1)/2 panels', 'which pairs of fields relate, and on which fields the outliers sit']
            },
            {
              zh: ['线性投影', '恒定：只画两维，代价是丢掉部分方差、轴不再是原字段', '整体沿方差最大的两个方向怎样分群'],
              en: ['Linear projection', 'constant: two dimensions only, paid for in discarded variance and renamed axes', 'how the records spread along the two directions that vary most']
            }
          ]
        }
      ]
    }
  ]
});
