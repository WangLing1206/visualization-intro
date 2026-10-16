#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""build-docx.py — 生成《可视化导论》课程实践学习网站的亮点说明文档

格式对齐上一次作业（DataLens-亮点说明）：
  封面（校徽 + 标题 36pt 黑体 + 题目/姓名/学号/班级/日期 18pt）
  目录（居中「目 录」+ 真实 TOC 域，第二遍回填页码）
  第 N 章 标题：黑体 16pt 居中，Heading 样式（供目录抓取）
  正文：宋体 12pt（小四），两端对齐，首行缩进 2 字符，1.5 倍行距
  图注 / 表题：宋体 10.5pt（五号）居中；表格：三线表
  页眉「中国石油大学（华东）」，页脚页码；A4，页边距 2.5cm

用法：
  python tools/build-docx.py <截图目录> <输出.docx> [page_map.json]
"""
import io, json, os, sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SHOTS, OUT = sys.argv[1], sys.argv[2]
PAGEMAP = json.load(io.open(sys.argv[3], encoding='utf-8')) if len(sys.argv) > 3 else None

HEI, SONG, LATIN = '黑体', '宋体', 'Times New Roman'
BODY_PT, CAP_PT, H_PT, COVER_PT = 12, 10.5, 16, 36
IMG_W = Cm(14.6)                      # 与参考文档一致：截图宽 14.6 cm
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'university-logo.png')

doc = Document()

# ---------------------------------------------------------------- 基础样式
def set_style(st, font=LATIN, ea=SONG, size=BODY_PT, color='000000'):
    st.font.name = font
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor.from_string(color)
    rpr = st.element.get_or_add_rPr()
    rf = rpr.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); rpr.append(rf)
    rf.set(qn('w:ascii'), font); rf.set(qn('w:hAnsi'), font); rf.set(qn('w:eastAsia'), ea)

normal = doc.styles['Normal']
set_style(normal, LATIN, SONG, BODY_PT)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_before = Pt(0)
normal.paragraph_format.space_after = Pt(0)
for i in (1, 2, 3):
    try:
        st = doc.styles['Heading %d' % i]
        set_style(st, LATIN, HEI, H_PT if i <= 2 else 12)
        st.font.bold = (i == 1)
    except KeyError:
        pass

# ---------------------------------------------------------------- 小工具
def _rfonts(run, ea):
    rf = run._element.get_or_add_rPr().find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); run._element.get_or_add_rPr().append(rf)
    rf.set(qn('w:ascii'), LATIN); rf.set(qn('w:hAnsi'), LATIN); rf.set(qn('w:eastAsia'), ea)

def para(text='', ea=SONG, size=BODY_PT, bold=False, align='both', indent=True,
         before=0, after=0, line=1.5, style=None, color='000000'):
    p = doc.add_paragraph(style=style)
    pf = p.paragraph_format
    pf.line_spacing = line
    pf.space_before = Pt(before); pf.space_after = Pt(after)
    pf.alignment = {'both': WD_ALIGN_PARAGRAPH.JUSTIFY, 'center': WD_ALIGN_PARAGRAPH.CENTER,
                    'left': WD_ALIGN_PARAGRAPH.LEFT, 'right': WD_ALIGN_PARAGRAPH.RIGHT}[align]
    if indent:
        pf.first_line_indent = Pt(size * 2)      # 首行缩进 2 字符
    if text:
        r = p.add_run(text)
        r.font.size = Pt(size); r.font.bold = bold
        r.font.color.rgb = RGBColor.from_string(color)
        _rfonts(r, ea)
    return p

def rich(parts, ea=SONG, size=BODY_PT, indent=True, align='both', before=0, after=0):
    """parts: [(text, bold), ...] —— 用于「（1）要点。说明…」这种加粗小标题段落"""
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.line_spacing = 1.5; pf.space_before = Pt(before); pf.space_after = Pt(after)
    pf.alignment = {'both': WD_ALIGN_PARAGRAPH.JUSTIFY, 'center': WD_ALIGN_PARAGRAPH.CENTER,
                    'left': WD_ALIGN_PARAGRAPH.LEFT}[align]
    if indent:
        pf.first_line_indent = Pt(size * 2)
    for text, bold in parts:
        r = p.add_run(text)
        r.font.size = Pt(size); r.font.bold = bold
        r.font.color.rgb = RGBColor.from_string('000000')
        _rfonts(r, ea)
    return p

def heading(text, bookmark=None, new_page=False):
    if new_page:
        page_break()
    p = doc.add_paragraph(style='Heading 2')
    pf = p.paragraph_format
    pf.line_spacing = 1.5; pf.space_before = Pt(12); pf.space_after = Pt(12)
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf.keep_with_next = True
    if bookmark:
        bs = OxmlElement('w:bookmarkStart'); bs.set(qn('w:id'), str(abs(hash(bookmark)) % 90000))
        bs.set(qn('w:name'), bookmark)
        be = OxmlElement('w:bookmarkEnd'); be.set(qn('w:id'), bs.get(qn('w:id')))
        p._p.append(bs)
    r = p.add_run(text)
    r.font.size = Pt(H_PT); r.font.bold = False
    r.font.color.rgb = RGBColor.from_string('000000')
    _rfonts(r, HEI)
    if bookmark:
        p._p.append(be)
    return p

def caption(text, before=3, after=12):
    return para(text, ea=SONG, size=CAP_PT, align='center', indent=False,
                before=before, after=after, line=1.5)

def _png_size(path):
    import struct
    with open(path, 'rb') as f:
        head = f.read(33)
    return struct.unpack('>II', head[16:24])


def picture(name, caption_text, width=IMG_W, max_height=Cm(17.5)):
    """横版按宽度排版；竖版（如手机截图）按高度排版，避免高过一页"""
    path = os.path.join(SHOTS, 'shot-%s.png' % name)
    w_px, h_px = _png_size(path)
    p = doc.add_paragraph()
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    # 先按高度限制算宽度，再用宽度上限收一次，确保横竖都不越界
    aspect = w_px / float(h_px)
    w_cm = min(width.cm, max_height.cm * aspect)
    p.add_run().add_picture(path, width=Cm(w_cm))
    caption(caption_text)

def three_line_table(headers, rows, widths=None, font_pt=10.5):
    """三线表：上下粗线 + 表头下细线，无竖线"""
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = True
    # 去掉默认边框，改为三线
    tblPr = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge, sz in (('top', 12), ('bottom', 12), ('left', 0), ('right', 0), ('insideH', 0), ('insideV', 0)):
        el = OxmlElement('w:' + edge)
        el.set(qn('w:val'), 'single' if sz else 'none')
        el.set(qn('w:sz'), str(sz)); el.set(qn('w:color'), '000000'); el.set(qn('w:space'), '0')
        borders.append(el)
    tblPr.append(borders)
    mar = OxmlElement('w:tblCellMar')
    for edge, w in (('top', 20), ('left', 108), ('bottom', 20), ('right', 108)):
        el = OxmlElement('w:' + edge); el.set(qn('w:w'), str(w)); el.set(qn('w:type'), 'dxa'); mar.append(el)
    tblPr.append(mar)

    def fill(cell, text, bold=False):
        cell.text = ''
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(2); p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(text)
        r.font.size = Pt(font_pt); r.font.bold = bold
        r.font.color.rgb = RGBColor.from_string('000000')
        _rfonts(r, SONG)

    for i, h in enumerate(headers):
        fill(t.rows[0].cells[i], h, True)
    # 表头下细线
    for c in t.rows[0].cells:
        tcPr = c._tc.get_or_add_tcPr()
        b = OxmlElement('w:tcBorders')
        el = OxmlElement('w:bottom')
        el.set(qn('w:val'), 'single'); el.set(qn('w:sz'), '6'); el.set(qn('w:color'), '000000')
        b.append(el); tcPr.append(b)
    # 表头跨页重复 + 每行不拆断
    trPr = t.rows[0]._tr.get_or_add_trPr()
    th = OxmlElement('w:tblHeader'); th.set(qn('w:val'), 'true'); trPr.append(th)
    cs = OxmlElement('w:cantSplit'); trPr.append(cs)
    for row in rows:
        r_ = t.add_row()
        rp = r_._tr.get_or_add_trPr()
        cs2 = OxmlElement('w:cantSplit'); rp.append(cs2)
        cells = r_.cells
        for i, v in enumerate(row):
            fill(cells[i], v)
    if widths:
        for r_ in t.rows:
            for i, w in enumerate(widths):
                r_.cells[i].width = Cm(w)
    return t

def page_break():
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(0)
    p.add_run().add_break(WD_BREAK.PAGE)

# ---------------------------------------------------------------- 页面设置
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
sec.top_margin = sec.bottom_margin = sec.left_margin = sec.right_margin = Cm(2.5)
sec.header_distance, sec.footer_distance = Cm(1.5), Cm(1.75)

# ================================================================ 封面
if os.path.exists(LOGO):
    p = doc.add_paragraph()
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20); p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(LOGO, width=Cm(7.9))

# 标题按语义断行：36pt 下 16cm 只能放 12 个汉字，硬排会出现「站」这样的孤字
para('可视化导论', ea=HEI, size=COVER_PT, bold=True, align='center',
     indent=False, before=30, after=0, line=1.0)
para('课程实践学习网站', ea=HEI, size=COVER_PT, bold=True, align='center',
     indent=False, before=2, after=0, line=1.0)
para('亮点说明', ea=HEI, size=COVER_PT, bold=True, align='center', indent=False, before=20, after=0, line=1.0)

for line in ['题　目：可视化导论——课程实践学习网站',
             '姓　　名：　王文岭',
             '学　　号：　2407040110',
             '班　　级：　人工智能2401']:
    para(line, ea=HEI, size=18, align='center', indent=False, before=34, after=0, line=1.0)
para('2026 年 10 月', ea=HEI, size=18, align='center', indent=False, before=38, after=0, line=1.0)

# ================================================================ 节 2：目录与正文
sec2 = doc.add_section(WD_SECTION.NEW_PAGE)
sec2.page_width, sec2.page_height = Cm(21.0), Cm(29.7)
sec2.top_margin = sec2.bottom_margin = sec2.left_margin = sec2.right_margin = Cm(2.5)
sec2.header_distance, sec2.footer_distance = Cm(1.5), Cm(1.75)
sec2.header.is_linked_to_previous = False
sec2.footer.is_linked_to_previous = False

# 页眉：校名
hp = sec2.header.paragraphs[0]
hp.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
hr = hp.add_run('中国石油大学（华东）')
hr.font.size = Pt(10.5); _rfonts(hr, SONG)

# 页脚：页码
fp = sec2.footer.paragraphs[0]
fp.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE \\* arabic \\* MERGEFORMAT')
r = OxmlElement('w:r'); t = OxmlElement('w:t'); t.text = '1'; r.append(t); fld.append(r)
fp._p.append(fld)

# 页码从正文第 1 页开始
pgNum = OxmlElement('w:pgNumType'); pgNum.set(qn('w:start'), '1')
sec2._sectPr.append(pgNum)

CH = [  # 章标题（供目录与正文共用）
    '第1章 项目概述',
    '第2章 关键亮点',
    '第3章 功能清单',
    '第4章 章节内容与配图',
    '第5章 交互设计',
    '第6章 中英双语与响应式',
    '第7章 技术架构',
    '第8章 关键设计决策',
    '第9章 质量保证',
    '第10章 交付物与运行方式',
]

# ---------------------------------------------------------------- 目录页
para('目　录', ea=HEI, size=16, align='center', indent=False, before=12, after=12)
# 目录用普通段落手写：页码是按渲染结果实测回填的。
# （不用 TOC 域：域在 LibreOffice / WPS 里会按自己的规则重算，反而把页码丢掉，
#   手写版本在任何阅读器里都显示为实测页码。）
for name in CH:
    pg = (PAGEMAP or {}).get(name, '')
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.line_spacing = 1.5
    pf.space_before = Pt(3); pf.space_after = Pt(3)
    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
    pf.tab_stops.add_tab_stop(Cm(15.6), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    r = p.add_run(name + '	' + str(pg))
    r.font.size = Pt(BODY_PT); _rfonts(r, SONG)

page_break()

# ================================================================ 第1章 项目概述
heading(CH[0], 'ch1')
rich([('这是一个纯静态的双语课程网站', True),
      ('，配合《可视化导论》的课堂教学使用，也可以完全独立地当作自学读本来读。全书十一章、四十六节，'
       '按「知识 → 代码 → 图形」的次序组织：每一节先讲清一个概念，给出产生该图形的可运行代码，'
       '再把图形交给读者操作。站点没有一张图片素材——封面上的点阵、目录里的微缩图、正文中的每一张图表，'
       '都是浏览器在打开页面的那一刻计算并绘制出来的。', False)])
para('本项目想解决的是可视化教学里一个反复出现的困难：教材里的图是静止的，讲的是「怎么画」，'
     '而学生真正需要建立的是「这样画会读出什么、换一种画法又会读出什么」的判断力。'
     '静止的图无法回答这类问题，只有把图交到读者手里、允许他拖动参数、切换映射、再看一眼统计量，'
     '判断力才会长出来。因此本站把每一张图都做成了可以动手的对象，而不是排版好的插图。')
para('技术形态上，它是一个零构建的静态站点：原生 HTML、CSS 与 JavaScript，没有 npm、没有打包器、'
     '没有任何前端框架；three.js 与世界陆地轮廓数据都随源码内置，双击 index.html 即可离线打开。'
     '站点已部署到 GitHub Pages，英文内容与中文内容在数据层分离，切换语言不刷新页面。')

# ================================================================ 第2章 关键亮点
heading(CH[1], 'ch2', new_page=True)
para('以下七点，是本项目与「把讲义搬上网页」的分界线。')
rich([('（1）封面：三万颗粒子的六种数据形态。', True),
      ('首页不是一张图片，而是一个三万颗粒子的实时渲染场：同一批数据点在散点云、坐标纸、柱群、平行轴、'
       '网络、地球六种形状之间连续变形，粒子各自错开出发时刻，迁移带有先后与弧线。'
       '它演示的正是数据处理本身——同一批记录被组织成六种可读的形状。画面可拖动旋转，'
       '右侧阶段梯可随时跳转，WebGL 不可用时自动退回 2D 投影渲染同一组坐标。', False)], after=6)
rich([('（2）每一节都是「知识 → 代码 → 图形」的三段式。', True),
      ('讲清一个概念、给出最短的可运行代码、再把图形交给读者操作。代码与图形一一对应，'
       '示例里的变量含义由上文解释，因此不写注释；图注写的是「这张图让你看到什么」，'
       '图号由网站按章节顺序自动生成。', False)], after=6)
rich([('（3）33 张交互图全部实时绘制。', True),
      ('从格式塔分组、前注意搜索、韦伯定律，到平行坐标、流图基线、地图投影、力导向布局、桑基图、'
       '鱼眼与刷选联动，所有图形都是 Canvas 2D 现场绘制，没有一张是位图。'
       '动画只在画布进入视口时运行，离开即停；尺寸变化后立即补画一帧，'
       '因此在后台标签页、禁用了动画或 WebGL 的环境里，图形依然是一张完整可读的图。', False)], after=6)
rich([('（4）交互不是装饰，每个交互都对应一个可验证的判断。', True),
      ('前注意搜索把「并行搜索与串行搜索」的差别做成计时游戏；韦伯定律用一条阈值线告诉你'
       '刚能分辨的长度差与基准长度成比例；数据墨水比不是预先写死的数字，而是浏览器实时统计像素算出来的；'
       '「正确但误导」用三个开关，把同一份数据的同一个 1% 变化，呈现成 1% 或 10%。', False)], after=6)
rich([('（5）原生中英双语，不是机翻。', True),
      ('中文与英文在数据层分别成文，切换语言不刷新页面，正文、图注、控件、导航与页脚同时改变；'
       '中文页面在标题下保留英文标题，英文页面亦然，方便学生对照专业词汇。'
       '英文是同等信息量的独立写作，术语采用通行英文表述。', False)], after=6)
rich([('（6）两种油墨的印刷式排版。', True),
      ('全站只用一个黑、一个白和一个印刷红：层次靠字重、灰度与发丝线区分，没有圆角卡片、没有投影、'
       '没有渐变底、没有彩色气泡框。图版比文字栏更宽（940px / 680px），图形四角有印刷规矩线，'
       '图注为小字；正文用衬线体，界面用无衬线体，中文行距放宽到 1.9。', False)], after=6)
rich([('（7）零构建、离线可用、一行命令部署。', True),
      ('没有依赖安装，没有打包步骤；three.js 与陆地轮廓数据随源码内置，字体走 CDN 并带系统字体回退；'
       '推送到 GitHub 即自动重新发布到 GitHub Pages。', False)], after=6)

# ================================================================ 第3章 功能清单
heading(CH[2], 'ch3', new_page=True)
para('站点由五个可独立进入的部分组成，各部分的能力与对应的实现方式如表3-1所示，界面对应图3-1至图3-3。')
caption('表3-1 站点功能清单', before=12, after=6)
three_line_table(
    ['部分', '主要能力', '实现方式'],
    [['封面', '三万颗粒子的六种形态连续变形、拖动旋转、阶段跳转、自动巡演', 'three.js 自定义着色器；状态间逐粒子延迟插值'],
     ['目录', '11 章逐行列出，悬停时绘制该章微缩图并显示图数与预计阅读时间', 'Canvas 2D 手绘微缩图；滚动进入时交错入场'],
     ['首页演示', '同一份城市数据的四种画法（位置／长度／顺序／面积）连续变形', '四种布局之间插值标记的位置、尺寸与圆角'],
     ['正文', '11 章 46 节；每节含知识、代码与交互图；左栏随阅读位置移动；阅读进度条', '数据驱动渲染；IntersectionObserver 定位'],
     ['检索', '全书小节标题与正文的即时检索，按 `/` 或 Ctrl+K 唤起', '启动时建立倒排索引，纯前端匹配'],
     ['课程说明', '材料范围、数据来源、技术说明、自学路径与授权', '与正文共用同一套渲染器']],
    widths=[2.2, 6.4, 6.0])
picture('cover-globe', '图3-1 封面：同一批数据点的六种组织方式之一——地球。粒子按陆地点阵排布，'
                       '右侧阶段梯可随时切换其余五种形态')
picture('toc', '图3-2 目录：十一章逐行列出，悬停时绘制该章微缩图，右侧标注图数与预计阅读时间')
picture('demo-bubble', '图3-3 首页演示「同一份数据的四种画法」：气泡图用面积编码人口，'
                       '红色标出其中一类城市，数据一行未改而读法完全不同')

# ================================================================ 第4章 章节内容与配图
heading(CH[3], 'ch4', new_page=True)
para('全书十一章，按数据类型与任务展开，如表4-1所示。每一章都配有可操作的图，'
     '图4-1为正文的阅读版式（文字栏与图版栏的宽度对比），图4-2至图4-12为各章的代表配图。')
caption('表4-1 章节结构与核心配图', before=12, after=6)
three_line_table(
    ['章', '主题', '核心配图', '涉及的数据'],
    [['01', '绪论', '可视化流程、Anscombe 四组数据、简史时间线', 'Anscombe 1973（公开教学素材）'],
     ['02', '视觉感知与认知', '格式塔分组、前注意搜索、可辨识的差别', '确定性生成的示意点阵'],
     ['03', '数据', '测量尺度判定、清洗前后、分布的三种概括', '示意订单数据'],
     ['04', '可视化任务', '任务三分法、动作与目标矩阵、概览优先', '42 座城市人口'],
     ['05', '可视化设计', '标记×通道、通道有效性排序、数据墨水比', '42 座城市人口'],
     ['06', '高维数据', '平行坐标刷选、散点图矩阵、主成分投影', '42 辆车的六个字段'],
     ['07', '时序数据', '折线查询、流图基线、动画气泡', '四城 48 个月气温、六国轨迹'],
     ['08', '地理空间', '投影变形与面积放大、分级设色、流场', '城市经纬度、Natural Earth 轮廓'],
     ['09', '层次与网络', '三种层次布局、力导向、桑基图', '本站目录（真实篇幅）、55 节点网络'],
     ['10', '交互与可视分析', '鱼眼、刷选联动、语义缩放、可视分析循环', '城市、车辆、记录集'],
     ['11', '可视化评估', '两条件对比、正确但误导', '示意实验数据']],
    widths=[1.1, 2.6, 5.7, 4.6])
picture('reading', '图4-1 正文版式：文字栏 680px、图版栏 940px，代码块与图形占满图版宽度，'
                   '左栏随阅读位置移动')
picture('anscombe', '图4-2 第1章：统计量完全相同的四组数据。点击「加上回归线」后可见'
                    '直线掩盖了真实结构，而任何汇总指标都不会提示这件事')
picture('gestalt', '图4-3 第2章：同一批点经过五种分组方式（接近、相似、连续、连通、闭合），'
                   '分组原则在变，点没有变')
picture('dataclean', '图4-4 第3章：同一份数据在填补缺失值、剔除异常值、统一单位、去掉重复记录'
                     '四种处理前后的对照，下方实时给出样本数、均值与标准差')
picture('mantra', '图4-5 第4章：概览优先、缩放与过滤、按需细节三步演示，'
                  '在同一张图上依次给出全体、选区与选中记录')
picture('encoding', '图4-6 第5章：标记与通道的组合矩阵。二十种组合中哪些成立、哪些勉强、'
                    '哪些不成立，逐个点开即可看到理由与渲染结果')
picture('parcoords', '图4-7 第6章：平行坐标。在任意轴上刷选即是一次多维条件查询，'
                     '选中记录高亮为红色，下方给出各车型类别的数量')
picture('timeseries', '图4-8 第7章：折线图上的读数。指针移动给出十字准星读数，'
                      '横向拖动选出区间后，均值、最低与最高值随选择更新')
picture('projection', '图4-9 第8章：投影的取舍。同一份陆地轮廓在不同投影之间连续变形，'
                      '右侧现算各纬度圈的面积放大倍数（墨卡托在 80° 处放大 33 倍）')
picture('network', '图4-10 第9章：力导向布局。节点可拖动、可重新初始化，'
                   '悬停时相邻节点与边高亮并给出度数与邻居列表')
picture('focus', '图4-11 第10章：焦点与上下文。指针所在区域被鱼眼放大，'
                 '周围保持原位，细节与全局同屏，代价是位置不再精确')
picture('bias', '图4-12 第11章：正确但误导。六个数字从未改变，截断纵轴、改用面积或改用折线，'
                '同一个 1% 的变化可以看起来像 10%，谎言因子现算给出')

# ================================================================ 第5章 交互设计
heading(CH[4], 'ch5', new_page=True)
para('交互设计的目标不是「让页面动起来」，而是把某个抽象判断变成读者可以亲手复现的实验。'
     '图5-1至图5-7对应其中七处代表性设计。')
picture('preattentive', '图5-1 前注意处理：在点阵中找出不同的那个点，系统记录用时。'
                        '颜色与形状可以并行搜索，用时几乎与点数量无关；颜色加形状的组合搜索'
                        '只能逐个排查，用时明显上升')
picture('weber', '图5-2 可辨识的差别：拖动长度差，观察阈值线。'
                 '刚能分辨的差值与基准长度成比例，长度判断的韦伯分数约为 1/42')
picture('datashape', '图5-3 分布的三种概括：直方图、箱线图与累积分布展示同一组数，'
                     '分箱数、均值与中位数实时标注，轮廓随分箱宽度变化')
picture('dataink', '图5-4 数据墨水比：拖动滑杆逐步去掉阴影、立体、网格与边框，'
                   '比值由浏览器实时统计像素得出，而不是预设的数字')
picture('sankey', '图5-5 分层流量：悬停任一节点即可追踪它的进与出。'
                  '桑基图的第一条规矩是守恒——每个中间节点的进与出必须相等')
picture('brushlink', '图5-6 刷选与联动：在散点图中框选，右侧直方图立刻按同一批记录重新聚合，'
                     '这正是「联动」比「再画一张图」有用的地方')
picture('semanticzoom', '图5-7 语义缩放：换掉的不是分辨率，而是数据本身——'
                        '概览时是城市点阵，放大后变成网格聚合，再放大回到单条记录')

# ================================================================ 第6章 中英双语与响应式
heading(CH[5], 'ch6', new_page=True)
para('双语与响应式都不是「补丁」，而是从内容结构开始就设计好的：文字在数据层分离，'
     '版面用同一套栅格在窄屏上折叠。')
picture('english', '图6-1 英文模式：切换语言后标题、正文、图注、控件与导航同时改变，'
                   '中文标题作为副标题保留，便于对照专业词汇')
picture('mobile-both', '图6-2 移动端：390px 宽度下栅格自动折叠为单列（左：目录；右：正文），'
                       '图版按可用宽度等比缩放，画布随容器尺寸变化后立即补画，无横向溢出')
picture('search', '图6-3 检索：按 `/` 或 Ctrl+K 唤起，'
                  '对全部小节的标题与正文做即时匹配，中英文内容都可检索')

# ================================================================ 第7章 技术架构
heading(CH[6], 'ch7', new_page=True)
para('站点分为内容层、图形层、渲染层与工具链四层，如表7-1所示。分层的目的是让「写内容」与'
     '「写图形」互不干扰：内容文件里没有任何绘制逻辑，图形模块不知道自己出现在第几节。')
caption('表7-1 技术架构', before=12, after=6)
three_line_table(
    ['层', '内容', '职责与约定'],
    [['内容层', 'js/content/ch01–ch11.js', '每节含知识段落、代码与图形引用；每个区块同时带中英文；'
                                        '不出现任何绘制代码与图号'],
     ['图形层', 'js/figures/ 十一个模块，共 33 张图', '向 VIZ.figures 注册；首帧同步绘制，'
                                                 '动画仅在进入视口时运行；只用灰阶与一个印刷红'],
     ['渲染层', 'js/app.js', '路由（#/、#/ch/03、#/ch/03/2、#/notes）、正文 DOM、'
                           '左栏定位、检索索引、阅读进度'],
     ['图形工具库', 'js/kit.js', '比例尺、坐标轴、动画循环、交互控件、确定性数据集、代码高亮'],
     ['封面与演示', 'js/hero.js、js/demo.js', 'three.js 点阵与首页四种画法的插值变形'],
     ['数据', 'data/land.js', 'Natural Earth 110m 陆地轮廓，经 tools/make_land.py 简化为 21 KB'],
     ['工具链', 'tools/', '录屏、字幕、视频合成、截图、文档生成、陆地数据转换']],
    widths=[2.2, 4.8, 7.6])

# ================================================================ 第8章 关键设计决策
heading(CH[7], 'ch8', new_page=True)
rich([('（1）首帧同步绘制。', True),
      ('所有图形在挂载完成时先同步画一帧，动画循环只负责之后的更新。'
       '这样在后台标签页、禁用动画或动画循环被节流的环境里，图形仍是完整可读的一张图，'
       '而不是空白画布。', False)], after=6)
rich([('（2）动画只在可见时运行。', True),
      ('每张图用 IntersectionObserver 判断是否进入视口，离开即停；页面隐藏时全部暂停。'
       '一页里有三四张图同时存在，这个约束直接决定了滚动是否跟手。', False)], after=6)
rich([('（3）缩放后立即补画。', True),
      ('改动画布尺寸会清空像素，因此尺寸变化后立刻按新尺寸重画一帧；'
       '尺寸没变则直接返回，既不浪费一次清屏重绘，也避免与 ResizeObserver 形成回环。', False)], after=6)
rich([('（4）语言状态延迟读取。', True),
      ('图形模块取当前语言时读的是运行时的语言状态，而不是在脚本加载时缓存下来的引用——'
       '脚本顺序变化或延迟加载都不会让图形文字失效。', False)], after=6)
rich([('（5）录屏与字幕用时间戳而非帧率。', True),
      ('演示视频由 CDP 驱动真实浏览器逐帧抓取，按每帧到达的本地时间戳重采样成 30fps，'
       '因此静态段不会被压缩、动画段不会被拉长；字幕则用旁白里的真实停顿作为时间锚点对齐，'
       '而不是按字数平均分配。', False)], after=6)

# ================================================================ 第9章 质量保证
heading(CH[8], 'ch9', new_page=True)
para('站点的正确性通过三类检查保证，如表9-1所示。所有检查都在真实浏览器里执行，'
     '而不是只做静态的语法检查。')
caption('表9-1 验证项与结果', before=12, after=6)
three_line_table(
    ['检查项', '方法与覆盖范围', '结果'],
    [['章节渲染', '逐章打开 11 章，核对标题、节数、配图数、代码块与表格', '11 章全部通过'],
     ['图形绘制', '逐张挂载 33 张图，读取画布像素确认非空白，捕获运行时异常', '33 张全部有内容，无异常'],
     ['交互可用', '点击控件、拖动滑杆与画布、悬停读数，覆盖每张图的主要交互', '全部响应'],
     ['双语与路由', '切换中英文、深链接（#/ch/03/2）、上一章／下一章、检索', '内容与高亮同步更新'],
     ['响应式', '390px 与 1440px 两种宽度下检查横向溢出与栅格折叠', '无横向溢出'],
     ['离线可用', '静态审计：无 ES 模块、无 fetch／XHR；three.js 与陆地数据随源码内置', '可离线打开'],
     ['容错', 'WebGL 不可用时回退 2D 投影；动画循环不可用时保留首帧', '已实现并验证'],
     ['无障碍', '键盘可达、焦点可见、正文对比度达标，尊重系统的「减弱动态效果」设置', '已实现']],
    widths=[2.4, 8.6, 3.6])
para('源码包解压到空目录后重新起服务，仍能正常打开全部章节与图形；'
     '线上站点与本地版本在相同检查下结果一致。')

# ================================================================ 第10章 交付物与运行方式
heading(CH[9], 'ch10', new_page=True)
para('本次作业的交付物如表10-1所示。')
caption('表10-1 交付物清单', before=12, after=6)
three_line_table(
    ['交付物', '说明'],
    [['网站源码压缩包', 'website/ 目录，含全部页面、图形模块、内容与工具链；解压即可打开'],
     ['部署链接', 'https://wangling1206.github.io/visualization-intro/（GitHub Pages）'],
     ['演示视频', '4 分 08 秒，1600×900；中文旁白、逐句字幕，另附可开关的字幕轨'],
     ['亮点说明文档', '本文件'],
     ['视频旁白稿与制作脚本', 'docs/演示视频旁白稿.md、tools/ 下的录屏／字幕／合成脚本']],
    widths=[3.4, 11.2])
para('运行方式有两种：')
para('（1）直接打开：解压后双击 website/index.html 即可，无需任何安装；脚本全部是经典脚本，'
     '不依赖本地服务器。', indent=True)
para('（2）本地服务：在 website/ 目录下执行 python -m http.server 8807，'
     '浏览器访问 http://127.0.0.1:8807/，字体与缓存行为更接近线上。')
para('部署方式：把 website/ 的内容推到仓库根目录，在仓库设置里把 Pages 的 Source 指向该分支根目录，'
     '之后每次推送都会自动重新发布，不需要任何构建步骤。')

doc.save(OUT)
print('已生成：', OUT)
