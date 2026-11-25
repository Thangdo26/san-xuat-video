#!/bin/bash
# Downloads the TikTok source videos (research only; clips cut from them are credited in the caption + on screen).
cd /d/Thang_space_archive/trung-quoc-tuyet/research || exit 1
Y=/c/Users/thang/Thang_space/VoiceStudio/.venv/Scripts/yt-dlp.exe
while read -r path tag; do
  [ -z "$path" ] && continue
  u=${path%%/*}; id=${path##*/}; out="raw-tiktok/${tag}__${u}__${id}.mp4"
  [ -s "$out" ] && continue
  "$Y" -q --no-warnings -f "best[vcodec^=h264]/best" -o "$out" "https://www.tiktok.com/@${u}/video/${id}" && echo "ok $out" || echo "FAIL $path"
done < tiktok-clips.txt
echo DONE
