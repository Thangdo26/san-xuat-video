#!/bin/bash
# Cuts research/cuts.txt into public/videos/ha-giang/footage/<name>.mp4: 1080x1920 cover-crop, 30 fps, no audio, SDR bt709.
cd /d/Thang_space_archive/ha-giang-v2/research || exit 1
OUT=../public/videos/ha-giang/footage; mkdir -p $OUT
grep -v '^#' cuts.txt | while IFS='|' read -r name src start dur note; do
  name=$(echo $name); src=$(echo $src); start=$(echo $start); dur=$(echo $dur)
  [ -z "$name" ] && continue
  [ -s "$OUT/$name.mp4" ] && continue
  ffmpeg -v error -y -ss "$start" -i "$src" -t "$dur" -an -r 30 \
    -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.04:saturation=1.06,format=yuv420p" \
    -c:v libx264 -crf 20 -preset medium -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$OUT/$name.mp4" </dev/null \
    && echo "ok $name" || echo "FAIL $name"
done
echo DONE
