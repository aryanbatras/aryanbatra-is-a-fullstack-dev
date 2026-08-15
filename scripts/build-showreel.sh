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
#   no buffering, no flicker. Verified on this site: every seek decodes in
#   ~12ms median (well inside the 16.7ms frame budget).
#
# Why 60fps (motion-interpolated)?
#   Scrubbing can only ever display the frames that exist in the file, so a
#   24fps film caps the visible smoothness at 24 distinct frames per second of
#   film — that is the "24fps" feel. minterpolate (mci) synthesises the
#   in-between frames from the 24fps sources to give the scrub a true 60fps
#   content rate. The interpolated frames measure SSIM ~0.97 against the
#   sources at the real-frame positions (visually indistinguishable), and the
#   ~30% size tax over 24fps is the price of that smoothness.
#
# Why 1920x1080 (source resolution)?
#   The film displays fullscreen and zooms to 2.4x at the desktop hand-off, so
#   it must never be downscaled from the 1080p sources. Measured sizes for the
#   full 32s all-intra film (H.264): 1080p@60fps crf27 ~= 39MB. VP9 all-intra
#   was tested and came out ~2x BIGGER than H.264 for this screen-recorded
#   content (VP9's size advantage needs temporal prediction, which all-intra
#   removes), so MP4/H.264 is the only file shipped. Tune CRF to trade
#   quality for size: crf 24 ~= 52MB, crf 27 ~= 39MB, crf 28 ~= 34MB.
#
# Output:
#   public/aryan/showreel_a.mp4       (32s, 1920x1080, 60fps, all-intra, no audio)
#   public/aryan/poster_a.jpg         (first frame of the film)
#   public/aryan/poster_003.jpg       (first frame of chapter 3)
#   public/aryan/poster_004.jpg       (first frame of chapter 4)
#   public/aryan/photos/photo_XX.jpg  (8 frames per film x 4 films = 32)
#
# Flags explained:
#   -an                        drop audio (never audible while scrubbing)
#   -c:v libx264 -crf 27       quality knob for all-intra screen content
#   -preset slow               better compression at the same quality
#   -g 1 -keyint_min 1         ALL-INTRA: every frame is a keyframe
#   -sc_threshold 0            no scene-cut keyframes (GOP stays exactly 1)
#   -tune animation            tuned for flat-color UI/screen content
#   -movflags +faststart       moov atom at the front -> instant metadata
#   -fps_mode vfr              pass frames through untouched (fps=60 already
#                              gives CFR; the default cfr muxer would pad)
#   minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1
#                              motion-compensated 24 -> 60fps interpolation,
#                              variable-size block matching for cleanest UI

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FPS=60                 # final film rate (sources are 24fps -> minterpolate)
CRF=27                 # 27: ~39MB full film; 24: ~52MB; 28: ~34MB
RES="1920:1080"        # source resolution — never downscale (fullscreen film)
FILMS=(
  "$ROOT/public/aryan/processed_video_001.mp4"
  "$ROOT/public/aryan/processed_video_002.mp4"
  "$ROOT/public/aryan/new_video_003.mp4"
  "$ROOT/public/aryan/new_video_004.mp4"
)

echo "==> Film: 001 + 002 + 003 + 004 (continued sequence, all-intra, ${FPS}fps, ${RES})..."

# Build the concat filter from the films — every chapter normalized to
# ${FPS}fps and ${RES} before the concat so the chain is seamless. Each
# chapter is motion-interpolated on its own so chapter boundaries stay exact.
MINTERP="minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
FILTERS=()
for i in "${!FILMS[@]}"; do
  FILTERS+=("[${i}:v]fps=24,scale=${RES},setsar=1,${MINTERP}[v${i}]")
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
  -c:v libx264 -preset slow -crf "$CRF" \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -tune animation \
  -fps_mode vfr \
  "$ROOT/public/aryan/showreel_a.mp4"

# minterpolate ends at the last input frame's timestamp, so the concat comes
# out a few frames short of 32s. Clone the final (static desktop) frame until
# the film is EXACTLY 32.0s so the scroll-to-time mapping stays 1:1 with the
# chapter durations in src/constants/video.ts.
echo "==> Padding tail to exactly 32.0s..."
DUR_OUT=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ROOT/public/aryan/showreel_a.mp4")
PAD=$(awk -v d="$DUR_OUT" 'BEGIN{d=d+0; if (d < 32) printf "%.6f", 32 - d; else print 0}')
if awk -v p="$PAD" 'BEGIN{exit !(p > 0)}'; then
  ffmpeg -y -v error -i "$ROOT/public/aryan/showreel_a.mp4" \
    -vf "tpad=stop_mode=clone:stop_duration=$PAD" \
    -c:v libx264 -preset slow -crf "$CRF" \
    -g 1 -keyint_min 1 -sc_threshold 0 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -tune animation \
    -fps_mode vfr \
    "$ROOT/public/aryan/showreel_a.tmp.mp4"
  mv "$ROOT/public/aryan/showreel_a.tmp.mp4" "$ROOT/public/aryan/showreel_a.mp4"
fi

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
