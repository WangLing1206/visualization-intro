/* ==========================================================================
   ch08.js — 第 8 章 地理空间数据可视化
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '08',
  thumb: 'geo',
  zh: {
    title: '地理空间数据可视化',
    sub: '地球是曲面，屏幕是平面。地理数据里的大多数错误，都发生在摊平之后仍然按面积读图的时候。',
  },
  en: {
    title: 'Geospatial Visualization',
    sub: 'The Earth is a curved surface and the screen is flat. Most geographic visualization errors happen after the flattening, when areas are still read as if nothing had changed.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '投影的取舍' },
      en: { title: 'Choosing a projection' },
      blocks: [
        {
          t: 'p',
          zh: '地理数据比普通表格多一个字段：位置。位置以经纬度记在球面上，而屏幕是平的，所以画图之前必须做一次投影（map projection）。球面有曲率，压不平：橘子皮摊平要么撕开要么皱起，地图能选的只是把变形放在哪里。',
          en: 'A geographic dataset carries one field an ordinary table does not: location. Location is recorded on a sphere as longitude and latitude, and the screen is flat, so a map needs a projection before anything can be drawn. A curved surface has no flat equivalent: an orange peel tears or wrinkles when pressed down, and a map only gets to choose where the distortion goes.'
        },
        {
          t: 'p',
          zh: '投影因此是一道取舍题。**面积、形状、距离、方向不可能同时保真**，每种投影都要放弃其中几项，放弃哪几项取决于读者比较什么：比较面积或人口密度，用等面积（equal-area）投影；导航与局部形状，用保角（conformal）投影，接受面积被放大。',
          en: 'A projection is therefore a trade-off. **Area, shape, distance and direction cannot all hold at once**; every projection gives up some of them, and which ones depends on what the reader gets to compare. Areas and population densities call for an equal-area projection. Navigation and local shape call for a conformal one, which accepts inflated areas.'
        },
        {
          t: 'table',
          head: {
            zh: ['投影', '保真', '主要变形', '常见用途'],
            en: ['Projection', 'Preserves', 'Main distortion', 'Typical use']
          },
          rows: [
            {
              zh: ['墨卡托', '角度与局部形状', '面积随纬度放大', '导航、网络地图'],
              en: ['Mercator', 'angles, local shape', 'area grows with latitude', 'navigation, web maps']
            },
            {
              zh: ['等面积', '面积', '形状被拉伸或压扁', '专题制图'],
              en: ['Equal-area', 'area', 'shapes stretched or flattened', 'thematic maps']
            },
            {
              zh: ['等距', '标准线附近的距离', '离标准线越远误差越大', '量测'],
              en: ['Equidistant', 'distance near the standard line', 'error grows away from it', 'measurement']
            },
            {
              zh: ['正射', '球面观感', '只显示半个地球', '演示、示意'],
              en: ['Orthographic', 'the look of a globe', 'one hemisphere only', 'presentation, locators']
            }
          ]
        },
        {
          t: 'p',
          zh: '投影还决定数据能不能算。经纬度以度为单位，直接求面积得到的是平方度；要算面积、距离或缓冲区，必须先把数据换到投影平面坐标系（projected CRS）。**选投影因此贯穿整个处理流程**。',
          en: 'The projection also decides what can be computed. Longitude and latitude are measured in degrees, so an area taken on them comes out in square degrees; areas, distances and buffers all require the data to be reprojected into a projected CRS. **Choosing a projection therefore runs through the whole processing chain**.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一份陆地轮廓在两种坐标系下的总面积', en: 'land area under an equal-area and a Mercator CRS' },
          code: [
            'import geopandas as gpd',
            '',
            'land = gpd.read_file("ne_110m_land.shp")',
            '',
            'equal = land.to_crs("EPSG:6933").area.sum() / 1e12',
            'mercator = land.to_crs("EPSG:3857").area.sum() / 1e12',
            '',
            'print("等面积", round(equal, 1), "百万平方公里")',
            'print("墨卡托", round(mercator, 1), "百万平方公里")',
            'print("放大倍数", round(mercator / equal, 2))'
          ].join('\n')
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '投影变形' },
      en: { title: 'How projections distort' },
      blocks: [
        {
          t: 'p',
          zh: '**变形不是一个数值，而是一张分布图**：同一幅图上各处的变形量不同。等距圆柱把经线画成等距竖线，越靠两极东西方向被拉得越长；墨卡托让纬线间距随纬度增大，换来角度与局部形状的正确，代价是面积按纬度平方割线放大——赤道处 1 倍，60° 处 4 倍，80° 处约 33 倍。所以世界地图上格陵兰看起来与非洲相当，而非洲的实际面积约是它的 14 倍。',
          en: '**Distortion is not a single number but a field**: on one map, different places are distorted by different amounts. Equirectangular draws meridians as evenly spaced vertical lines and stretches the east-west direction more and more towards the poles. Mercator widens the spacing of parallels with latitude and buys correct angles and local shapes with it, paying in area inflated by the square of the secant of latitude — one at the equator, four at 60°, about thirty-three at 80°. That is why Greenland looks comparable to Africa on a familiar world map, while Africa is in fact about fourteen times larger.'
        },
        {
          t: 'p',
          zh: '网络地图几乎都用 Web 墨卡托（EPSG:3857）。它成为标准不是因为适合展示世界，而是因为保角、经纬度到像素只是一个简单公式，与 256×256 的瓦片金字塔（tile pyramid）严格配套，缩放时局部形状不变。这些性质对街道导航恰好合适，**用来做全球专题制图却危险**：高纬度区域被放大数倍，读者对面积与距离的第一印象就是错的。',
          en: 'Almost every web map uses Web Mercator (EPSG:3857). It became the standard not because it shows the world well but because it is conformal, because longitude and latitude map to pixels through one simple formula, because it fits the 256×256 tile pyramid exactly, and because local shapes survive zooming. Those properties suit street-level navigation and **turn dangerous on a global thematic map**: regions at high latitude are magnified several times over, and the first impression of area and distance is simply wrong.'
        },
        {
          t: 'p',
          zh: '等面积投影修正了面积，代价转移到形状：Mollweide 与 Equal Earth 把高纬度区域压扁，形状与角度不再可信；区域制图多用 Albers 等积圆锥，它在目标区域内的变形很小。若面积与形状都不能牺牲太多，就退到折中投影（compromise），如 Robinson 与 Winkel Tripel：它们不保任何量度，只把变形压进可接受的范围。',
          en: 'Equal-area projections fix the area and move the cost to shape: Mollweide and Equal Earth flatten high latitudes, so shape and angle stop being trustworthy; regional mapping usually prefers an Albers equal-area conic, whose distortion stays small inside the region of interest. When neither inflated areas nor grotesque shapes are acceptable, the retreat is a compromise projection such as Robinson or Winkel Tripel, which preserves nothing exactly and keeps every distortion inside a tolerable band.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '墨卡托的面积放大倍数随纬度变化', en: 'Mercator area inflation by latitude' },
          code: [
            'import numpy as np',
            '',
            'lat = np.array([0, 30, 45, 60, 75, 85])',
            'factor = 1 / np.cos(np.radians(lat)) ** 2',
            '',
            'for p, f in zip(lat, factor):',
            '    print(str(p).rjust(2) + "°", round(f, 1))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-projection',
          zh: '同一份世界轮廓在等距圆柱、墨卡托、等面积与正射之间连续变形。盯住格陵兰：它在墨卡托里迅速膨胀，在等面积投影里被压回原形；正射可拖动旋转，转到背面时半个地球会消失——那是投影的可见范围，不是数据缺失。',
          en: 'One world outline morphing continuously through equirectangular, Mercator, equal-area and orthographic. Watch Greenland swell under Mercator and shrink back under the equal-area view; the orthographic globe can be dragged, and far enough round, half the world disappears — the visible range of the projection, not missing data.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '分级设色与符号' },
      en: { title: 'Choropleths and symbols' },
      blocks: [
        {
          t: 'p',
          zh: '分级设色（choropleth）把面单元的数值编码成填充色。它有一个常被忽略的前提：单元的边界来自行政划分，不由数据决定，因此若不先把总量除以面积或人口，**颜色回答的是“哪里多”而不是“哪里密”**。用人口总量着色，颜色最深的永远是人口最多的区域。',
          en: 'A choropleth encodes the value of each area unit as a fill colour. It rests on an assumption that is easy to miss: the units come from administrative boundaries, not from the data, so unless the total is divided by area or population first, **the colour answers "where is there most" rather than "where is it densest"**. Colour raw population totals and the deepest shade always lands on the most populous region.'
        },
        {
          t: 'p',
          zh: '第二个决定是**分级（graduation）**，即把连续数值切成若干级。等距（equal interval）按相同宽度切分，断点好读，但长尾数据会把多数单元挤进最低的一两级：本节 42 座城市、五级时，等距分级把 32 座放进最低两级，最高两级只剩东京与新德里。等分位（quantile）让每级单元数大致相同，成图均匀，代价是相邻两级的真实差距可大可小，级内差异全部消失。自然断点（natural breaks，Jenks 方法）最小化组内方差，断点落在数据的天然空隙上，但它依赖算法与级数 k：换数据或换 k，断点就移动，跨图比较不再可靠。',
          en: 'The second decision is graduation, cutting the continuous range into classes. Equal interval uses equal-width breaks that are easy to read, but with long-tailed data it squeezes almost everything into the lowest class or two: with the 42 cities of this section in five classes, equal interval leaves 32 cities in the bottom two and only Tokyo and New Delhi in the top two. Quantile classes hold roughly the same number of units each and colour the map evenly, at the price of an arbitrary gap between neighbouring classes and the complete loss of within-class variation. Natural breaks (Jenks) minimise within-class variance so that the breaks land in the gaps of the data, but they depend on the algorithm and on the number of classes k: a new dataset or a new k moves every break, and separately classified maps can no longer be compared.'
        },
        {
          t: 'p',
          zh: '第三类图用符号而不是颜色编码总量。点密度图（dot density）用一个点代表固定数量（例如十万人），读者看到的是密度纹理，不必做面积归一化，但点数无法精确读出，随机撒点还会造出并不存在的模式。比例符号（proportional symbol）用圆的面积表示数值；人眼判断大小遵循幂律，**半径必须按数值的平方根缩放**。若半径与数值成正比，差异被夸大一个量级：东京 3700 万对奥克兰 170 万，真实面积比约 22 倍，线性映射下接近 470 倍。',
          en: 'A third family encodes totals with symbols rather than colour. A dot density map lets one dot stand for a fixed count, say one dot per hundred thousand people, and the reader sees a texture of density with no area normalisation needed, but the count cannot be read exactly and random placement can invent patterns that are not in the data. A proportional symbol map encodes the total as the area of a circle. Judgements of size follow a power law, so the radius must scale with the square root of the value. Scale the radius linearly instead and differences are exaggerated by an order of magnitude: Tokyo at 37 million against Auckland at 1.7 million differ by a factor of about 22 in true area, which a linear mapping turns into nearly 470.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '三种分级方法给出的断点', en: 'breaks from three classification methods' },
          code: [
            'import numpy as np',
            'import mapclassify as mc',
            '',
            'pop = np.array([37.0, 32.0, 28.5, 22.4, 21.8, 21.8, 21.7, 21.3, 18.9, 17.0, 15.6, 15.4,',
            '                15.4, 14.6, 13.9, 13.9, 12.8, 12.6, 12.5, 11.3, 11.1, 11.0, 10.9, 10.9,',
            '                9.9, 9.5, 9.5, 8.9, 8.5, 8.0, 7.5, 6.7, 6.3, 6.2, 6.0, 5.3, 5.3,',
            '                4.3, 3.6, 3.6, 2.6, 1.7])',
            '',
            'for scheme in ["equal_interval", "quantile", "natural_breaks"]:',
            '    b = mc.classify(pop, scheme=scheme, k=5)',
            '    print(scheme, np.round(b.bins, 1))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-choropleth',
          zh: '同一批城市人口的两种读法：分级着色与平方根比例圆。切换分类方法，注意哪些城市换了级，而圆的面积不受分级影响；悬停读出的数值可以核对上文的 22 倍与 470 倍。',
          en: 'One set of city populations read two ways: shaded by class and drawn as circles scaled by the square root. Switch the classification method and watch which cities change class while the circles stay as they are; the numbers reported on hover are how the factors of 22 and 470 above can be checked.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '流场与轨迹' },
      en: { title: 'Flow fields and trajectories' },
      blocks: [
        {
          t: 'p',
          zh: '前面的图都假设对象不动。地理数据里还有随位置变化的量，如气压、温度与风，以及本身在移动的对象，如候鸟、气旋与船队。前者是场（field），每一点上都有方向与强度，用箭头、流线或粒子动画来画；后者是轨迹（trajectory），一条带时间戳的位置序列。**场回答“这里的流向是什么”，轨迹回答“它从哪里来、到哪里去”**。',
          en: 'Every map so far assumed that nothing moves. Geographic data also holds quantities that vary from place to place, such as pressure, temperature and wind, and objects that travel, such as migratory birds, cyclones and fleets. The first is a field: a direction and a magnitude defined at every point, drawn with arrows, streamlines or animated particles. The second is a trajectory: a sequence of positions carrying timestamps. **A field answers "which way does it flow here"; a trajectory answers "where did it come from and where did it go"**.'
        },
        {
          t: 'p',
          zh: '三种画法各有代价。箭头最直接，但方向与长度都靠眼睛比较，一密就互相遮挡；流线把矢量场沿切线积分成曲线，路径清楚，读者却容易把线条疏密误读为强度，而一条流线只是某个假想示踪粒子的路径；粒子动画运动感最强，适合随时间变化的场，但它随时间播放，读者不能定格，也不能把两个时刻并排比较。多条轨迹会交叉成一团，通常要用颜色编码时间，或拆成按时间分面的小倍数图（small multiples）。',
          en: 'Each technique costs something. Arrows are the most direct, but direction and length must be judged by eye and dense arrows hide one another. Streamlines integrate the field along its tangent, so paths are clear and uncluttered, yet readers mistake line spacing for magnitude, and a streamline is only the path of an imaginary tracer. Particle animation conveys motion best and suits time-varying fields, but it plays through time: nothing can be held still and two moments cannot be compared side by side. Multiple trajectories tangle, and time has to be encoded as colour or split into small multiples.'
        },
        {
          t: 'p',
          zh: '用粒子画流场时，两个参数会改变读者读到的结论：速度快的地方粒子被拉散、显得稀疏，慢的地方堆积、显得稠密，密度因此同时取决于场强与采样；拖尾长度决定每条轨迹保留多少历史，也影响图的“流量感”。这两个参数改变的是观感而不是数据，必须固定并说明。图里可以切换均匀流、旋涡与城市间流量：均匀流让粒子走平行直线，旋涡把它们卷成螺旋，城市间流量把它们沿大圆送往另一座城市——此时粒子表达的是流向，不是真实航线。',
          en: 'When particles draw a flow field, two settings change the conclusion a reader reaches. Particles travel faster where the field is strong and get pulled apart into sparse streaks, while slow regions accumulate them into density, so the visible density depends on the field and on the sampling at once. Trail length decides how much history each particle keeps and how much flow the picture seems to carry. Both settings change the impression rather than the data, so both must be fixed and stated. The figure below switches between a uniform flow, a vortex and inter-city flows: the uniform field sends particles along parallel lines, the vortex coils them into spirals, and the inter-city field routes them along great circles towards another city, where the particles express a direction of flow rather than a real flight path.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '粒子在矢量场中的推进（欧拉方法）', en: 'advancing particles through a vector field' },
          code: [
            'const u = p => Math.cos(p[1] / 70);',
            'const v = p => -Math.sin(p[0] / 70);',
            '',
            'function advect(pt, dt) {',
            '  pt.x += u([pt.x, pt.y]) * dt;',
            '  pt.y += v([pt.x, pt.y]) * dt;',
            '  pt.trail.push([pt.x, pt.y]);',
            '  if (pt.trail.length > 24) pt.trail.shift();',
            '}',
            '',
            'function frame() {',
            '  particles.forEach(pt => advect(pt, 1.4));',
            '  drawParticles(particles);',
            '  requestAnimationFrame(frame);',
            '}',
            '',
            'requestAnimationFrame(frame);'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-flow',
          zh: '粒子沿矢量场运动。切换“均匀流／旋涡／城市间流量”，看粒子如何被拉伸、卷曲或沿大圆连线；再改变粒子数量与拖尾长度，注意“看起来有多少流量”会变，而数据没有变。',
          en: 'Particles moving through a vector field. Switch between the uniform flow, the vortex and the inter-city flows and watch particles stretch, coil, or follow great-circle arcs; then change the particle count and the trail length and note that the apparent amount of flow changes while the data does not.'
        }
      ]
    }
  ]
});
