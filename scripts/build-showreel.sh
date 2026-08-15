#!/usr/bin/env bash
#
# Builds the scroll-scrub film for the /new experience:
#
#   showreel_a.mp4  — the full sequence: processed_video_001 -> 002 ->
#                     new_video_003 -> new_video_004 flow into each other
#                     as ONE continued film (32s, 4 chapters of 8s each)
#
# The film is pinned in a single scroll section on the page. When it reaches
# its last frame the section keeps scrolling and the frozen frame (essentially
# a photo of the finished desktop) zooms in — and the desktop boots the moment
# we hit the bottom of chapter four. See src/constants/video.ts.
#
# Why all-intra (-g 1)?
#   Scroll-based video scrubbing drives a <video> element by setting
#   currentTime to match the scroll position. A normal encode (keyframe every
#   2s+) makes the browser re-buffer at every seek, causing lag and black
#   frames. The fix is to give the encoder a keyframe at EVERY frame: seeking
#   to any timestamp then decodes exactly one frame — instant, frame-accurate,
#   no buffering, no flicker.
#
# Output:
#   public/aryan/showreel_a.mp4       (32s,    1080p, all-intra, no audio)
#   public/aryan/poster_a.jpg         (first frame of the film)
#   public/aryan/poster_003.jpg       (first frame of chapter 3)
#   public/aryan/poster_004.jpg       (first frame of chapter 4)
#   public/aryan/photos/photo_XX.jpg  (8 frames per film x 4 films = 32)
#
# Flags explained:
#   -an                        drop audio (never audible while scrubbing)
#   -c:v libx264 -crf 22       excellent quality for screen-recorded content
#   -preset slow               better compression at the same quality
#   -g 1 -keyint_min 1         ALL-INTRA: every frame is a keyframe
#   -sc_threshold 0            no scene-cut keyframes (GOP stays exactly 1)
#   -tune animation            tuned for flat-color UI/screen content
#   -movflags +faststart       moov atom at the front -> instant metadata
#   -fps_mode vfr              pass frames through untouched (fps=24 already
#                              gives CFR; the default cfr muxer would pad)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FPS=24
FILMS=(
  "$ROOT/public/aryan/processed_video_001.mp4"
  "$ROOT/public/aryan/processed_video_002.mp4"
  "$ROOT/public/aryan/new_video_003.mp4"
  "$ROOT/public/aryan/new_video_004.mp4"
)

echo "==> Film: 001 + 002 + 003 + 004 (continued sequence, all-intra, ${FPS}fps)..."

# Build the concat filter from the films — every chapter normalized to
# ${FPS}fps and 1920x1080 before the concat so the chain is seamless.
FILTERS=()
MAPS=""
for i in "${!FILMS[@]}"; do
  FILTERS+=("[${i}:v]fps=${FPS},scale=1920:1080,setsar=1[v${i}]")
done
CHAIN=""
for i in "${!FILMS[@]}"; do
  CHAIN+="[v${i}]"
done
CHAIN+="concat=n=${#FILMS[@]}:v=1:a=0[v]"
CONCAT_FILTER=$(IFS=';' && echo "${FILTERS[*]};${CHAIN}")

ARGS=()
for f in "${FILMS[@]}"; do
  ARGS+=(-i "$f")
done

ffmpeg -y -v error \
  "${ARGS[@]}" \
  -filter_complex "$CONCAT_FILTER" \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 22 \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -tune animation \
  -fps_mode vfr \
  "$ROOT/public/aryan/showreel_a.mp4"

echo "==> Generating posters..."
ffmpeg -y -v error -i "$ROOT/public/aryan/showreel_a.mp4" \
  -frames:v 1 -vf "scale=1920:1080" -q:v 3 "$ROOT/public/aryan/poster_a.jpg"

ffmpeg -y -v error -ss 8 -i "$ROOT/public/aryan/showreel_a.mp4" \
  -frames:v 1 -vf "scale=1920:1080" -q:v 3 "$ROOT/public/aryan/poster_003.jpg"
ffmpeg -y -v error -ss 16 -i "$ROOT/public/aryan/showreel_a.mp4" \
  -frames:v 1 -vf "scale=1920:1080" -q:v 3 "$ROOT/public/aryan/poster_004.jpg"

echo "==> Extracting Photos-app frames (8 per film x 4 films)..."
# photo_01..08 <- film 1, 09..16 <- film 2, 17..24 <- film 3, 25..32 <- film 4
N=0
for f in "${FILMS[@]}"; do
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  for k in 1 2 3 4 5 6 7 8; do
    N=$((N + 1))
    T=$(awk -v d="$DUR" -v k="$k" 'BEGIN{printf "%.3f", d * (k - 0.5) / 8}')
    ffmpeg -y -v error -ss "$T" -i "$f" -frames:v 1 -q:v 3 \
      "$ROOT/public/aryan/photos/photo_$(printf '%02d' "$N").jpg"
  done
done

echo "==> Done:"
ls -lh "$ROOT"/public/aryan/showreel_a.mp4 "$ROOT"/public/aryan/poster_a.jpg \
  "$ROOT"/public/aryan/poster_003.jpg "$ROOT"/public/aryan/poster_004.jpg \
  "$ROOT"/public/aryan/photos/photo_*.jpg | awk '{print "    ", $5, $9}'
