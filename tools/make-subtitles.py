#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""make-subtitles.py — 从旁白稿与旁白音频生成字幕

思路：用 silencedetect 找出旁白里的真实停顿，得到语音段；把旁白文本切成
适合屏幕阅读的字幕条（每条不超过 22 个汉字，尽量在标点处断）；再把两者对齐。

- 语音段比字幕条多：把停顿最短的相邻段合并
- 语音段比字幕条少：按字数比例拆分最长的段

输出：
  <工作目录>/subs/s1.ass … s8.ass   场景内相对时间（烧进画面用）
  <工作目录>/subs/all.srt           全片绝对时间（作为可开关的字幕轨）

用法：
  python tools/make-subtitles.py <工作目录> <旁白稿.md> <ffmpeg路径> [<音频目录>]
"""
import io, json, os, re, subprocess, sys

WORK = sys.argv[1]
SCRIPT_MD = sys.argv[2]
FFMPEG = sys.argv[3]
AUDIO_DIR = sys.argv[4] if len(sys.argv) > 4 else os.path.join(WORK, 'audio')
SUBS = os.path.join(WORK, 'subs')
os.makedirs(SUBS, exist_ok=True)

MAXLEN = 16          # 每条字幕的目标长度
HARD_MAX = 22        # 只比目标长一点的句子就整句显示，不要为了长度把它切碎
MIN_DUR = 0.65       # 一条字幕最短停留时间
BREAKS = '。！？；：，、'          # 优先在这些标点后断行
NUMERALS = set('0123456789零一二三四五六七八九十百千万亿两')   # 不要从数字中间断开
SENT_END = '。！？'                # 句子结束标点

# ---------------------------------------------------------------- 读旁白稿
def read_scenes(path):
    src = io.open(path, encoding='utf-8').read()
    parts = re.split(r'\n##\s+', src)
    out = []
    for p in parts[1:]:
        head, _, body = p.partition('\n')
        text = ' '.join(l.strip() for l in body.splitlines() if l.strip() and not l.strip().startswith('#'))
        text = re.sub(r'\s+', '', text)
        out.append((head.split()[0], text))
    return out

# -------------------------------------------------------- 文本切成字幕条
def split_cues(text):
    """先按句切，再把长句在标点处切成不超过 MAXLEN 的条。
    标点一律保留在文本里：字幕条首尾相接应当还原出原句。"""
    sents, buf = [], ''
    for ch in text:
        buf += ch
        if ch in SENT_END:
            sents.append(buf)
            buf = ''
    if buf:
        sents.append(buf)
    cues = []
    for s in sents:
        if len(s) <= HARD_MAX:
            cues.append(s)
            continue
        pieces = []
        rest = s
        while len(rest) > HARD_MAX:
            window = rest[:MAXLEN + 6]
            cuts = [i + 1 for i, ch in enumerate(window[:-1]) if ch in BREAKS]
            mid = len(window) / 2
            # 避开数字/数词中间的断点
            safe = [i for i in cuts if not (rest[i - 1] in NUMERALS and rest[i] in NUMERALS)]
            pool = safe or cuts
            if pool:
                pick = min(pool, key=lambda i: abs(i - mid))
            else:
                # 附近没有标点：在 MAXLEN 左右找一个不切在数字中间的位置
                cands = [p2 for p2 in range(max(6, MAXLEN - 5), min(len(rest), MAXLEN + 6))
                         if not (rest[p2 - 1] in NUMERALS and rest[p2] in NUMERALS)]
                pick = min(cands, key=lambda i: abs(i - MAXLEN)) if cands else min(MAXLEN, len(rest) - 1)
            if pick < 6:
                cand = [c for c in (safe or cuts) if c >= 6]
                pick = min(cand) if cand else MAXLEN
            pieces.append(rest[:pick])
            rest = rest[pick:]
        if rest:
            pieces.append(rest)
        # 末尾残片太短就从上一片借几个字，避免「学习网站。」这种孤零零的短条
        if len(pieces) > 1 and len(pieces[-1]) < 6:
            need = 6 - len(pieces[-1])
            if len(pieces[-2]) - need >= 6:
                pieces[-1] = pieces[-2][-need:] + pieces[-1]
                pieces[-2] = pieces[-2][:-need]
        cues.extend(pieces)
    # 只有标点或太短的残片并回上一条，避免出现「。」这种单独一条
    out = []
    for c in cues:
        c = c.strip()
        if not c:
            continue
        bare = all(ch in BREAKS + '…—' for ch in c)
        if out and (bare or len(c) < 4) and len(out[-1]) + len(c) <= MAXLEN + 8:
            out[-1] += c
            continue
        out.append(c)
    return out

# ---------------------------------------------------- 用停顿找出语音段
def speech_segments(mp3):
    out = subprocess.run([FFMPEG, '-hide_banner', '-i', mp3,
                          '-af', 'silencedetect=n=-38dB:d=0.15', '-f', 'null', '-'],
                         capture_output=True, text=True, errors='replace').stderr
    dur = 0.0
    for line in out.splitlines():
        if 'Duration' in line:
            t = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = t.split(':')
            dur = int(h) * 3600 + int(m) * 60 + float(s)
    marks = []
    for line in out.splitlines():
        if 'silence_start' in line:
            marks.append(('s', float(line.split('silence_start:')[1].split()[0])))
        elif 'silence_end' in line:
            marks.append(('e', float(line.split('silence_end:')[1].split()[0])))
    # 语音段 = 静音之间的区间
    segs, cur = [], 0.0
    for kind, t in marks:
        if kind == 's' and t > cur + 0.05:
            segs.append([cur, t]); cur = t
        elif kind == 'e':
            cur = t
    if dur > cur + 0.05:
        segs.append([cur, dur])
    return segs if segs else [[0.0, dur]], dur

# ------------------------------------------------------------ 对齐
def align(cues, segs):
    """返回与 cues 等长的 [(start, end)]"""
    n, m = len(cues), len(segs)
    segs = [list(s) for s in segs]
    if m > n:                                   # 合并停顿最短的相邻段
        while len(segs) > n:
            gaps = [(segs[i + 1][0] - segs[i][1], i) for i in range(len(segs) - 1)]
            gaps.sort()
            _, i = gaps[0]
            segs[i][1] = segs[i + 1][1]
            del segs[i + 1]
    elif m < n:                                 # 按字数拆分最长的段
        while len(segs) < n:
            widths = [(s[1] - s[0], i) for i, s in enumerate(segs)]
            widths.sort(reverse=True)
            _, i = widths[0]
            a, b = segs[i]
            # 该段内应包含几条字幕：按总字数比例分配
            share = max(2, round((b - a) / ((segs[-1][1] - segs[0][0]) / n)))
            share = min(share, n - len(segs) + 1, 6)
            step = (b - a) / share
            segs[i:i + 1] = [[a + k * step, a + (k + 1) * step] for k in range(share)]
    return [[round(a, 3), round(b, 3)] for a, b in segs[:n]]

def merge_short(cues, times, min_dur=0.7, max_join=28):
    """太短的字幕一闪而过：并进相邻的那条；并进去会太长就把时间往后挪一点"""
    i = 0
    while i < len(cues):
        d = times[i][1] - times[i][0]
        if d < min_dur and len(cues) > 1:
            if i > 0 and len(cues[i - 1]) + len(cues[i]) <= max_join:
                cues[i - 1] = cues[i - 1] + cues[i]
                times[i - 1][1] = times[i][1]
                cues.pop(i); times.pop(i)
                continue
            if i + 1 < len(cues) and len(cues[i]) + len(cues[i + 1]) <= max_join:
                cues[i + 1] = cues[i] + cues[i + 1]
                times[i + 1][0] = times[i][0]
                cues.pop(i); times.pop(i)
                continue
        i += 1
    # 还剩太短的：把结束时间推后，必要时借用下一条的开头
    for i in range(len(cues)):
        if times[i][1] - times[i][0] < min_dur:
            want = times[i][0] + min_dur
            if i + 1 < len(cues):
                times[i][1] = min(want, times[i + 1][1] - 0.3)
                if times[i][1] > times[i + 1][0]:
                    times[i + 1][0] = times[i][1]
            else:
                times[i][1] = want
    return cues, times

def tidy(times):
    """给太短的条留出时间：把它的结束时间推到下一条开始"""
    for i in range(len(times) - 1):
        if times[i][1] - times[i][0] < MIN_DUR:
            times[i][1] = min(times[i + 1][0], times[i][0] + MIN_DUR + 0.4)
    if times and times[-1][1] - times[-1][0] < MIN_DUR:
        times[-1][1] = times[-1][0] + MIN_DUR
    return times

# ------------------------------------------------------------ ASS / SRT
ASS_HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1600
PlayResY: 900
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,SimHei,36,&H00FFFFFF,&H00FFFFFF,&HA0000000,&HA0000000,0,0,0,0,100,100,0.6,0,3,9,0,2,120,120,58,134

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def ass_time(t):
    cs = int(round(t * 100))
    return '%d:%02d:%02d.%02d' % (cs // 360000, (cs // 6000) % 60, (cs // 100) % 60, cs % 100)

def srt_time(t):
    ms = int(round(t * 1000))
    return '%02d:%02d:%02d,%03d' % (ms // 3600000, (ms // 60000) % 60, (ms // 1000) % 60, ms % 1000)

def main():
    scenes = read_scenes(SCRIPT_MD)
    durs = json.load(io.open(os.path.join(WORK, 'audio_durations.json'), encoding='utf-8'))
    at = 0.0
    all_srt = []
    report = []
    for i, (name, text) in enumerate(scenes, 1):
        cues = split_cues(text)
        segs, dur = speech_segments(os.path.join(AUDIO_DIR, 's%d.mp3' % i))
        cues, times = merge_short(cues, align(cues, segs))
        times = tidy(times)
        # 场景 ASS
        lines = []
        for c, (a, b) in zip(cues, times):
            lines.append('Dialogue: 0,%s,%s,Sub,,0,0,0,,%s' % (ass_time(a), ass_time(b), c.replace('\n', '\\N')))
        io.open(os.path.join(SUBS, 's%d.ass' % i), 'w', encoding='utf-8').write(ASS_HEAD + '\n'.join(lines) + '\n')
        # 全片 SRT（绝对时间，按合成后的场景长度累加）
        off = sum(durs[:i - 1]) + 0.35 * (i - 1)
        for k, (c, (a, b)) in enumerate(zip(cues, times), 1):
            all_srt.append((off + a, off + b, c, i))
        report.append('  S%d  %2d 条字幕 / %2d 个语音段  文本 %d 字' % (i, len(cues), len(segs), len(text)))
    io.open(os.path.join(SUBS, 'all.srt'), 'w', encoding='utf-8', newline='\n').write(
        '\n'.join('%d\n%s --> %s\n%s\n' % (n, srt_time(a), srt_time(b), c)
                  for n, (a, b, c, _) in enumerate(all_srt, 1)))
    io.open(os.path.join(SUBS, 'all.ass'), 'w', encoding='utf-8').write(
        ASS_HEAD + '\n'.join('Dialogue: 0,%s,%s,Sub,,0,0,0,,%s' % (ass_time(a), ass_time(b), c)
                             for a, b, c, _ in all_srt) + '\n')
    print('\n'.join(report))
    print('合计 %d 条字幕，最长 %.1f 秒，最短 %.1f 秒' % (
        len(all_srt), max(b - a for a, b, _, _ in all_srt), min(b - a for a, b, _, _ in all_srt)))

if __name__ == '__main__':
    main()
