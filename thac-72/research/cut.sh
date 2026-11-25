#!/bin/bash
# Cuts research/cuts.txt (muted) and cuts-audio.txt (keeps the clip's own sound, loudness-normalised, user rule 22/11/2026)
# into public/videos/thac-72/footage/<name>.mp4: 1080x1920 cover-crop, 30 fps, SDR bt709. Audio clips also get <name>.m4a.
cd /d/Thang_space_archive/thac-72/research || exit 1
OUT=../public/videos/thac-72/footage; mkdir -p $OUT
VF="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.05:saturation=1.1,format=yuv420p"
cut() {
  local list=$1 audio=$2
  grep -v '^#' $list | while IFS='|' read -r name src start dur note; do
    name=$(echo $name); src=$(echo $src); start=$(echo $start); dur=$(echo $dur)
    [ -z "$name" ] && continue
    [ -s "$OUT/$name.mp4" ] && continue
    ffmpeg -v error -y -ss "$start" -i "$src" -t "$dur" -an -r 30 -vf "$VF" \
      -c:v libx264 -crf 20 -preset medium -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart "$OUT/$name.mp4" </dev/null \
      && echo "ok $name" || echo "FAIL $name"
    if [ "$audio" = 1 ]; then
      ffmpeg -v error -y -ss "$start" -i "$src" -t "$dur" -vn -af "loudnorm=I=-18:TP=-2:LRA=11,afade=t=in:d=0.15,afade=t=out:st=$(python -c "print(max(0,$dur-0.3))"):d=0.3" -ar 44100 -c:a aac -b:a 160k "$OUT/$name.m4a" </dev/null && echo "  + audio $name"
    fi
  done
}
cut cuts.txt 0
cut cuts-audio.txt 1
echo DONE
