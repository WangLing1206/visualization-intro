#!/usr/bin/env bash
# ============================================================================
# assemble-video.sh — 把录屏分镜、旁白音频合成最终演示视频
#
#   bash tools/assemble-video.sh <工作目录> <输出文件>
#
# 工作目录需包含：scene1..8.mp4（record-tour.cjs 产出）、audio/s1..8.mp3、
# audio_durations.json。每个场景按自己的旁白时长裁切，加左下角分镜标题，
# 再拼接并混音。
# ============================================================================
set -e
DIR="${1:?用法: assemble-video.sh <工作目录> <输出文件>}"
OUT="${2:-$DIR/可视化导论-演示视频.mp4}"
FF="${FFMPEG_PATH:?需要设置 FFMPEG_PATH}"
mkdir -p "$DIR/cut" "$DIR/wav"
# 把字体复制到工作目录，用不带盘符的相对路径引用：
# ffmpeg 的 filter 语法里 Windows 路径的冒号极易踩坑，这是最省事的绕法
cp "$(cygpath -u "${FONT_SRC:-C:/Windows/Fonts/simhei.ttf}")" "$DIR/caption.ttf"
FONT="caption.ttf"
cd "$DIR"

# 分镜标题（与 record-tour.cjs 中的场景顺序一致）
TITLES=(
  "01  封面 · 同一批数据点的六种组织方式"
  "02  目录 · 十一章与微缩图"
  "03  首页演示 · 同一份数据的四种画法"
  "04  第 2 章 · 感知：分组、搜索、阈值"
  "05  第 3–5 章 · 清洗、编码、数据墨水比"
  "06  第 6–9 章 · 高维、时序、地理、网络"
  "07  第 10–11 章 · 交互与评估"
  "08  中英文切换 · 全部图形实时绘制"
)
PAD=0.35          # 每个场景结尾留一点静默，避免解说首尾相接

python - "$DIR" "$FF" "$PAD" <<'PY'
import json, io, subprocess, sys, os
d, ff, pad = sys.argv[1], sys.argv[2], float(sys.argv[3])
durs = json.load(io.open(os.path.join(d, 'audio_durations.json'), encoding='utf-8'))
out = [round(x + pad, 3) for x in durs]
io.open(os.path.join(d, 'scene_durations.json'), 'w').write(json.dumps(out))
print('每个场景的目标时长：', ['%.2f' % x for x in out], '合计 %.1f s' % sum(out))
PY

# 逐个场景：裁切到旁白时长 + 左下角分镜标题
for i in 1 2 3 4 5 6 7 8; do
  D=$(python -c "import json;print(json.load(open('$DIR/scene_durations.json'))[$i-1])")
  T="${TITLES[$i-1]}"
  "$FF" -y -hide_banner -loglevel error -i "$DIR/scene$i.mp4" -t "$D" \
    -vf "drawtext=fontfile=${FONT}:text=${T}:fontcolor=white:fontsize=26:x=64:y=h-96:box=1:boxcolor=black@0.42:boxborderw=16:enable='between(t,0.8,6.2)'" \
    -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -r 30 -an "$DIR/cut/c$i.mp4"
  # 旁白：补齐到同样的时长
  "$FF" -y -hide_banner -loglevel error -i "$DIR/audio/s$i.mp3" \
    -af "apad,atrim=0:$D" -ar 24000 -ac 1 "$DIR/wav/w$i.wav"
  printf "  场景 %s → %s s\n" "$i" "$D"
done

# 末尾一张：网址提示（叠在最后一个场景上）
"$FF" -y -hide_banner -loglevel error -i "$DIR/cut/c8.mp4" \
  -vf "drawtext=fontfile=${FONT}:text=wangling1206.github.io/visualization-intro:fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-150:box=1:boxcolor=black@0.5:boxborderw=14:enable='gte(t,5)'" \
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -an "$DIR/cut/c8b.mp4"
mv "$DIR/cut/c8b.mp4" "$DIR/cut/c8.mp4"

# 拼接视频与音频
: > "$DIR/vlist.txt"; : > "$DIR/alist.txt"
for i in 1 2 3 4 5 6 7 8; do
  echo "file '$DIR/cut/c$i.mp4'" >> "$DIR/vlist.txt"
  echo "file '$DIR/wav/w$i.wav'" >> "$DIR/alist.txt"
done
"$FF" -y -hide_banner -loglevel error -f concat -safe 0 -i "$DIR/vlist.txt" -c copy "$DIR/_video.mp4"
"$FF" -y -hide_banner -loglevel error -f concat -safe 0 -i "$DIR/alist.txt" -c copy "$DIR/_audio.wav"

# 合流
"$FF" -y -hide_banner -loglevel error -i "$DIR/_video.mp4" -i "$DIR/_audio.wav" \
  -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT"
echo "完成：$OUT"
"$FF" -hide_banner -i "$OUT" 2>&1 | grep -E "Duration|Stream #"
