/* ==========================================================================
   ch03.js — 第 3 章 数据
   内容型数据文件：只描述文字、代码与图形引用，不含绘制逻辑。
   ========================================================================== */
VIZ.content.push({
  id: '03',
  thumb: 'types',
  zh: {
    title: '数据',
    sub: '图形能说什么，取决于手上的表是什么形状。这一章看属性尺度、表的组织、清洗的取舍与概括的代价。',
  },
  en: {
    title: 'Data',
    sub: 'What a figure can say depends on the shape of the table behind it: the scale of each attribute, the layout of the table, what cleaning costs, and what a summary hides.',
  },
  sections: [
    {
      id: 's1',
      zh: { title: '数据的三种属性' },
      en: { title: 'Three kinds of attribute' },
      blocks: [
        {
          t: 'p',
          zh: '任何数据集都可以拆成条目（item）与属性（attribute）：一行是一条记录，一列是一个字段。一串符号能做哪些运算，取决于它属于哪一类。常用的分法有三类：类别型（categorical，又称定类 nominal）、有序型（ordinal）与数值型（quantitative）；数值型再分为定距（interval）与定比（ratio），区别在于零点是不是“没有”。',
          en: 'Any dataset splits into items and attributes: a row is a record, a column is a field. Which operations a value supports depends on the kind of scale it lives on. The usual division has three families: categorical (also called nominal), ordinal, and quantitative. Quantitative attributes split further into interval and ratio, according to whether zero means “none”.'
        },
        {
          t: 'p',
          zh: '尺度判错，错误会一路传到图上。对“低、中、高”求平均，得到的中间值无人能解释；对摄氏温度求和同样没有意义，因为 0°C 不是没有温度，而人口为 0 是真的没有人——前者的零点是约定的，后者是自然的。另有一类容易漏掉的情况：看起来是数字，其实是编号，学号、邮编参与排序或求平均，给出的都是错误结论。属性类型也约束了视觉编码：位置能编码三类属性，颜色与形状更适合类别，只有定量属性才适合用长度与面积表达大小。',
          en: 'Get the scale wrong and the mistake travels all the way into the figure. The mean of “low, medium, high” produces a value nobody can interpret; summing Celsius temperatures is equally empty, because 0°C is not the absence of temperature, while a population of 0 really is nobody — one zero is a convention, the other is natural. One case is easy to miss: values that look numeric but are codes. Student numbers and postcodes yield nonsense as soon as they are sorted or averaged. Attribute type also constrains the visual encoding: position carries all three families, colour and shape suit categories, and only quantitative attributes belong on length and area to express magnitude.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '声明类型，再决定哪些统计量是合法的', en: 'declare the type, then decide which statistics are legal' },
          code: [
            'import pandas as pd',
            '',
            'df = pd.DataFrame({',
            '    "city": ["Beijing", "Shanghai", "Chengdu", "Xi\'an"],',
            '    "tier": pd.Categorical(["一线", "新一线", "二线", "三线"],',
            '                           ["一线", "新一线", "二线", "三线"], ordered=True),',
            '    "temp_c": [12.9, 16.6, 16.2, 13.7],',
            '    "pop_m": [21.7, 28.5, 9.5, 8.0],',
            '})',
            '',
            'print(df.dtypes.to_dict())',
            'print(df["tier"].min(), df["tier"].max())',
            'print(df["city"].mode().iat[0], df["city"].nunique())',
            'print(round(df["temp_c"].mean(), 2), round(df["pop_m"].mean(), 2))',
            'print(round(df["temp_c"].sum(), 1), round(df["pop_m"].sum(), 1))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-datatypes',
          zh: '点一列表头，再判断它属于哪种尺度。判定正确后标出允许的运算：等与不等、大小比较、加减，直到乘除。同一列“1、2、3”被判成编号、等级还是测量值，可用的运算完全不同。',
          en: 'Pick a column, then judge which scale it lives on. A correct answer shows the operations that scale admits — equality, ordering, addition and subtraction, multiplication and division. The same 1, 2, 3 can be a code, a rank or a measurement, and the legal operations change completely.'
        },
        {
          t: 'note',
          zh: '尺度不是数据的固有标签，而是使用方式的声明：以 2000 年为起点还是以公元 0 年为起点，年份就从定距变成定比；把收入归成五档，定比又降成定序。',
          en: 'A scale is not a permanent label on the data but a statement about use. Anchor years at 2000 rather than year zero and they become ratio; bucket income into five bands and a ratio scale degrades to ordinal.'
        }
      ]
    },
    {
      id: 's2',
      zh: { title: '数据表与字段' },
      en: { title: 'Tables and fields' },
      blocks: [
        {
          t: 'p',
          zh: '表（table）是最通用的数据集类型，几乎所有绘图函数都在读一张表。规范的排法是：每条记录占一行，每个变量占一列，每个格子只放一个值。这样排出来的表，每一行都能单独取出，每一列都能单独比较；反过来，把多个值塞进一格（“北京、上海”），或把两种单位混进一列（有的行是厘米，有的行是米），后面的分组与聚合就失去了前提。',
          en: 'The table is the most general dataset type; almost every plotting function ends up reading one. The disciplined layout is one record per row, one variable per column, one value per cell. Laid out this way, each row can be pulled out on its own and each column compared on its own. Put several values in one cell (“Beijing, Shanghai”), or two units into one column (some rows in centimetres, others in metres), and every later grouping and aggregation loses its premise.'
        },
        {
          t: 'p',
          zh: '字段不只是一串值，它同时携带三样约定：**名字**、**单位**与**类型**。名字要能读出含义与单位，`pop_m` 比 `p1` 有用；单位要么写进名字，要么存为元数据，不能靠记忆；类型要在读入时就声明，否则邮政编码会变成整数。字段之外还需要一个能唯一标识每一行的键（key），否则重复的行无法与合法的重复记录区分——这正是下一节的问题。',
          en: 'A field carries three commitments along with its values: a **name**, a **unit** and a **type**. The name should convey meaning and unit, so `pop_m` beats `p1`; the unit must live in the name or in metadata, never in someone\u2019s memory; the type must be declared on read, or postcodes turn into integers. Beyond the fields a table needs a key that identifies each row uniquely, otherwise duplicated rows cannot be told apart from legitimately repeated records — which is exactly the problem of the next section.'
        },
        {
          t: 'p',
          zh: '同一份数据可以排成宽表（wide）或长表（long）。宽表把每个变量放成一列，适合横向读一条完整记录；长表把列名收进一列数据，适合分组、筛选与分组绘图。两种排法可以互相转换，选哪一种取决于下一步要做的运算，而不是哪种更整齐。',
          en: 'The same data can be arranged as a wide or a long table. A wide table gives every variable its own column and reads well horizontally, one complete record at a time; a long table folds the column names into a column of data, which suits grouping, filtering and grouped plotting. The two are convertible, and the choice follows from the operation you need next rather than from which looks tidier.'
        },
        {
          t: 'code',
          lang: 'javascript',
          cap: { zh: '同一批记录：按地区分组，或按城市索引', en: 'the same records, grouped by region or indexed by city' },
          code: [
            'const rows = [',
            "  { city: 'Beijing', region: 'asia', pop: 21.7 },",
            "  { city: 'Shanghai', region: 'asia', pop: 28.5 },",
            "  { city: 'Chengdu', region: 'asia', pop: 9.5 },",
            "  { city: 'Tokyo', region: 'asia', pop: 37.0 },",
            "  { city: 'Paris', region: 'europe', pop: 11.1 }",
            '];',
            '',
            'const byRegion = new Map();',
            'for (const row of rows) {',
            '  const g = byRegion.get(row.region) || { n: 0, sum: 0 };',
            '  g.n += 1;',
            '  g.sum = +(g.sum + row.pop).toFixed(1);',
            '  byRegion.set(row.region, g);',
            '}',
            'console.log(byRegion);',
            '',
            'const keyed = Object.fromEntries(rows.map(r => [r.city, r]));',
            "console.log(keyed['Tokyo'], Object.keys(keyed).length);"
          ].join('\n')
        },
        {
          t: 'note',
          zh: '绘图库对表的形状各有偏好：分组统计的接口通常要长表，拿到宽表得先转换。转换放在读入之后立刻完成，比在绘图层反复补救省事。',
          en: 'Plotting libraries have their own preferences. Grouped statistics usually want a long table, so a wide input has to be reshaped first. Doing that reshape right after reading is cheaper than patching it in the drawing layer.'
        }
      ]
    },
    {
      id: 's3',
      zh: { title: '清洗：缺失与异常' },
      en: { title: 'Cleaning: missing values and outliers' },
      blocks: [
        {
          t: 'p',
          zh: '缺失值至少有三层含义：**不存在**（某座城市没有地铁）、**未记录**（漏采）、**不可用**（采集失败或拒绝回答）。三者要用不同方式对待：不存在的值不该填补；未记录的值可以借助其他字段插补；不可用的值应当留成“未知”一类。直接删除会缩小样本、改变比例，均值填补会压小方差、稀释相关系数，而且填补出来的记录与真实记录长得一样，读者看不出哪些值是猜的。',
          en: 'A missing value means at least three different things: **not applicable** (the city has no metro), **not recorded** (the reading was simply missed), or **unavailable** (collection failed or the answer was refused). Each needs its own treatment. Not-applicable values should not be imputed; unrecorded ones can be filled from other fields; unavailable ones deserve an explicit “unknown” category. Dropping rows shrinks the sample and shifts proportions; mean imputation compresses variance and dilutes correlations, and the imputed records look exactly like real ones in the figure, so no reader can tell which values were guessed.'
        },
        {
          t: 'p',
          zh: '异常值也分两类：**错误**与**真实**。单位混用（米与厘米）、录入错误（80 变成 800）属于前者，核对原记录后应修正；真实的极端值常常就是结论本身，不能当噪声抹掉，只能单独标注，或改用对极端值不敏感的概括。无论做了哪一步，都要留下可追溯的记录：原始值与处理后的值并存，结论才有可能被复核，也才能在下一版数据里重跑。',
          en: 'Outliers also come in two kinds: **errors** and **facts**. Mixed units (metres and centimetres) and mistyped values (80 becoming 800) belong to the first and should be corrected against the source record. A genuinely extreme value is often the conclusion itself; it must not be swept away as noise, only annotated, or summarised with a method that is not at the mercy of extremes. Whatever you decide, leave a trail: keep the raw and the processed values side by side, so a claim made from the figure can be rechecked and the whole pipeline re-run on the next version of the data.'
        },
        {
          t: 'table',
          head: {
            zh: ['现象', '常见原因', '处理'],
            en: ['Symptom', 'Usual cause', 'Treatment']
          },
          rows: [
            {
              zh: ['缺失值', '未记录、不适用、采集失败', '按含义删除、插补或留成“未知”'],
              en: ['Missing values', 'not recorded, not applicable, collection failed', 'delete, impute or keep as “unknown”']
            },
            {
              zh: ['异常值', '录入错误、单位混用、真实的极端值', '核对记录后修正；真实的极端值保留并标注'],
              en: ['Outliers', 'typing errors, mixed units, genuinely extreme values', 'correct against the record; keep and annotate the real ones']
            },
            {
              zh: ['不一致', '同一城市两种写法、同一个量两种单位', '统一标准名与基准单位后再判重'],
              en: ['Inconsistency', 'one city spelled two ways, one quantity in two units', 'standardise names and base units, then deduplicate']
            }
          ]
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '一条清洗流水线：统一、换算、填补、截断、去重', en: 'one cleaning pipeline: standardise, convert, fill, clip, deduplicate' },
          code: [
            'import pandas as pd',
            '',
            'df = pd.read_csv("stations.csv")',
            '',
            'df["city"] = df["city"].str.strip().str.title()',
            '',
            'df["temp_c"] = df["temp_f"].sub(32).div(1.8).round(2)',
            '',
            'df["rain_mm"] = df["rain_mm"].fillna(df["rain_mm"].median())',
            '',
            'q1, q3 = df["rain_mm"].quantile([0.25, 0.75])',
            'df["rain_mm"] = df["rain_mm"].clip(q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1))',
            '',
            'df = df.drop_duplicates(subset=["station", "day"])',
            '',
            'print(df[["station", "temp_c", "rain_mm"]].tail())'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-dataclean',
          zh: '四种处理各切换一次：缺失值用均值填补、异常值标记后剔除、单位不一致的换算回来、重复记录去掉。每切换一次，看点是被搬回来还是被移走，以及下方的 n、均值与标准差怎样变化；去重那一步图上看不出变化，计数却变了。',
          en: 'Four treatments, one at a time: missing values filled with the mean, outliers flagged and dropped, mismatched units converted back, duplicates removed. Each time, watch whether points come back or are moved away, and how the count, mean and deviation underneath respond — for deduplication the picture barely moves, but the count does.'
        }
      ]
    },
    {
      id: 's4',
      zh: { title: '分布的概括' },
      en: { title: 'Summarising a distribution' },
      blocks: [
        {
          t: 'p',
          zh: '一列几百个数无法逐个看过，读图往往从概括开始：把它压成几个特征。概括必然丢掉信息，换来的是可比较，真正的问题是丢掉了什么。三种常见概括各回答一个问题：直方图（histogram）回答形状——单峰还是多峰、偏向哪一边；箱线图（box plot）回答位置与离散——中位数、四分位距，以及超出围栏的离群点；累积分布（cumulative distribution）回答比例——“低于某个值的占多少”。',
          en: 'Nobody reads a column of several hundred numbers one by one, so reading a figure starts with summarising: compressing the column into a few features. A summary always discards information in exchange for comparability, and the real question is what it discards. Three common summaries answer three different questions. A histogram answers shape: one peak or several, and which way it leans. A box plot answers position and spread: median, interquartile range, and the points beyond the fences. A cumulative distribution answers proportion: which share of the values falls below a given threshold.'
        },
        {
          t: 'p',
          zh: '三种概括并不总是给出同一个印象。均值与中位数在偏斜分布下相差很大；箱线图看不出多峰，两个形状完全不同的分布可以有相同的四分位数；累积分布能直接读出比例，却看不出局部的起伏。[第 1 章](#/ch/01)的 Anscombe 四组数据说明统计量相同不等于数据相同，这里遇到的是同一件事的另一层：选哪种概括本身就是一次判断。',
          en: 'The three do not always agree. Mean and median diverge sharply in a skewed distribution; a box plot cannot show a second peak, and two distributions of quite different shape can share the same quartiles; a cumulative curve reads off proportions directly but hides local bumps. The Anscombe quartet in [Chapter 1](#/ch/01) showed that equal statistics do not mean equal data; this is the same lesson one level up, because choosing a summary is itself a judgement.'
        },
        {
          t: 'p',
          zh: '直方图还多一个参数：分箱的宽度与起点。同一列数换一个箱宽，可以从两个峰变成看上去只有一个峰，也可以把平滑的分布切成锯齿。因此，几个概括数字不足以描述一个分布；在看到图形之前，也很难判断哪种概括更合适。',
          en: 'A histogram carries one more parameter: bin width and bin origin. Change the width and two peaks can merge into one, or a smooth distribution can be sliced into teeth. A handful of summary numbers therefore does not describe a distribution, and until the figure is on screen it is hard to say which summary suits this particular data.'
        },
        {
          t: 'code',
          lang: 'python',
          cap: { zh: '同一列数的三种概括与箱线图围栏', en: 'three summaries of one column, plus the box-plot fences' },
          code: [
            'import numpy as np',
            '',
            'pop = np.loadtxt("cities.csv", delimiter=",", skiprows=1, usecols=1)',
            '',
            'counts, edges = np.histogram(pop, bins=6)',
            'print("histogram", counts)',
            '',
            'print("cumulative", np.round(np.cumsum(counts) / pop.size, 2))',
            '',
            'q1, med, q3 = np.percentile(pop, [25, 50, 75])',
            'iqr = q3 - q1',
            'print("quartiles", round(q1, 1), round(med, 1), round(q3, 1), round(iqr, 1))',
            '',
            'out = pop[(pop < q1 - 1.5 * iqr) | (pop > q3 + 1.5 * iqr)]',
            'print("outside fences", np.sort(np.round(out, 1)))'
          ].join('\n')
        },
        {
          t: 'fig',
          fig: 'fig-datashape',
          zh: '同一组数值在直方图、箱线图、累积分布之间变形，分箱数可以调整。留意有的判断在一种概括里一眼可见、在另一种里完全消失：多峰在箱线图中不留痕迹，比例在直方图里要数格子。',
          en: 'One set of numbers morphing between histogram, box plot and cumulative distribution, with an adjustable bin count. Watch for judgements that vanish between them: several peaks leave no trace in a box plot, while a proportion has to be counted off the bars of a histogram.'
        }
      ]
    }
  ]
});
