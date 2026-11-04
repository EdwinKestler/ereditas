#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/video/out"
VOICE="${VOICE_DIR:-$ROOT/video/voice}"
WORK="$OUT/.assemble"
MODE=${1:-final}

mkdir -p "$OUT" "$VOICE" "$WORK"
if [[ "$MODE" == "--draft" ]]; then
  FINAL="$OUT/ereditas-demo-draft.mp4"
else
  FINAL="$OUT/${OUTPUT_NAME:-ereditas-demo.mp4}"
fi

duration() {
  ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"
}

has_audio() {
  [[ -n $(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$1") ]]
}

segments=()
report=()
for i in 1 2 3 4 5 6; do
  scene="$OUT/scene-s$i.mp4"
  [[ -f "$scene" ]] || { echo "ERROR: missing $scene" >&2; exit 1; }
  visual_len=$(duration "$scene")
  voice_file=""
  for ext in m4a mp3 wav ogg; do
    if [[ -f "$VOICE/s$i.$ext" ]]; then voice_file="$VOICE/s$i.$ext"; break; fi
  done

  target_len="$visual_len"
  if [[ -n "$voice_file" ]]; then
    voice_len=$(duration "$voice_file")
    target_len=$(awk -v v="$visual_len" -v n="$voice_len" 'BEGIN { wanted=n+0.4; print (v>wanted ? v : wanted) }')
    voice_note="voice $(basename "$voice_file") ${voice_len}s"
  else
    voice_note="no voice"
  fi
  extension=$(awk -v t="$target_len" -v v="$visual_len" 'BEGIN { d=t-v; print (d>0 ? d : 0) }')
  segment="$WORK/s$i.mp4"
  video_filter="tpad=stop_mode=clone:stop_duration=$extension,trim=duration=$target_len,setpts=PTS-STARTPTS,fps=30,scale=1920:1080"

  if [[ -n "$voice_file" ]]; then
    if [[ "$i" == "5" ]] && has_audio "$scene"; then
      ffmpeg -y -i "$scene" -i "$voice_file" \
        -filter_complex "[0:v]$video_filter[v];[0:a]apad,atrim=duration=$target_len,asplit=2[ana][ana2];[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,adelay=200:all=1,apad,atrim=duration=$target_len[narr];[narr][ana]sidechaincompress=threshold=0.02:ratio=10:attack=20:release=500[ducked];[ducked][ana2]amix=inputs=2:duration=longest:dropout_transition=0,atrim=duration=$target_len[a]" \
        -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
        -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$segment"
    else
      ffmpeg -y -i "$scene" -i "$voice_file" \
        -filter_complex "[0:v]$video_filter[v];[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,adelay=200:all=1,apad,atrim=duration=$target_len[a]" \
        -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
        -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$segment"
    fi
  elif [[ "$i" == "5" ]] && has_audio "$scene"; then
    ffmpeg -y -i "$scene" \
      -filter_complex "[0:v]$video_filter[v];[0:a]apad,atrim=duration=$target_len[a]" \
      -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
      -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$segment"
  else
    ffmpeg -y -i "$scene" -f lavfi -i anullsrc=r=48000:cl=stereo \
      -filter_complex "[0:v]$video_filter[v];[1:a]atrim=duration=$target_len[a]" \
      -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
      -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$segment"
  fi
  segments+=("$segment")
  report+=("S$i visual=${visual_len}s target=$(duration "$segment")s $voice_note")
done

concat_file="$WORK/concat.txt"
: > "$concat_file"
for segment in "${segments[@]}"; do
  printf "file '%s'\n" "$segment" >> "$concat_file"
done

ffmpeg -y -f concat -safe 0 -i "$concat_file" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$FINAL"

total=$(duration "$FINAL")
printf '%s\n' "${report[@]}"
printf 'OUTPUT %s\nTOTAL %ss\n' "$FINAL" "$total"
if awk -v total="$total" 'BEGIN { exit !(total > 178) }'; then
  echo "WARN: total exceeds 178 seconds. Tighten the longest scenes:" >&2
  printf '%s\n' "${report[@]}" | sort -t= -k3,3nr | head -3 >&2
fi
