#!/usr/bin/env bash
#
# Builds the scroll-scrub film for the /new experience:
#
#   showreel_a.mp4  — act one: processed_video_001 -> 002 flow into each other
#                     as ONE continued sequence (16s)
#
# The film is pinned in a single scroll section on the page. When it reaches
# its last frame the section keeps scrolling and the frozen frame (essentially
# a photo) zooms into the machine — see src/constants/video.ts.
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
#   public/aryan/showreel_a.mp4       (16s,    1080p, all-intra, no audio)
#   public/aryan/poster_a.jpg         (first frame of act one)
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

echo "==> Act one: 001 + 002 (continued sequence, all-intra, 24fps)..."
ffmpeg -y -v error \
  -i "$ROOT/public/aryan/processed_video_001.mp4" \
  -i "$ROOT/public/aryan/processed_video_002.mp4" \
  -filter_complex "[0:v]fps=24,scale=1920:1080,setsar=1[v0];[1:v]fps=24,scale=1920:1080,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 22 \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -tune animation \
  -fps_mode vfr \
  "$ROOT/public/aryan/showreel_a.mp4"

echo "==> Generating poster... (first frame of act one)"
ffmpeg -y -v error -i "$ROOT/public/aryan/showreel_a.mp4" \
  -frames:v 1 -vf "scale=1920:1080" -q:v 3 "$ROOT/public/aryan/poster_a.jpg"

echo "==> Done:"
ls -lh "$ROOT"/public/aryan/showreel_a.mp4 "$ROOT"/public/aryan/poster_a.jpg | awk '{print "    ", $5, $9}'
