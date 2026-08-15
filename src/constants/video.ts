/**
 * Timeline manifest for the /new scroll-scrub experience.
 *
 * A single act — one continued sequence that ends with a desktop-zoom:
 *
 *   Act one (showreel_a.mp4, 32s):
 *     [0, 8)    -> processed_video_001   (chapter 0 — the name)
 *     [8, 16)   -> processed_video_002
 *     [16, 24)  -> new_video_003
 *     [24, 32)  -> new_video_004         (ends on a complete desktop screen)
 *
 * The film is encoded ALL-INTRA (a keyframe at every frame — see
 * scripts/build-showreel.sh), so scrubbing via currentTime is instant and
 * frame-accurate: each seek decodes exactly one frame, no buffering, no
 * black frames, no flicker.
 *
 * When the film reaches its last frames the frozen frame — the finished
 * desktop (the last frame of video 004) — zooms in and fades to black. The
 * moment we hit the rock bottom of the pin, the desktop boots straight over
 * it: no text, no intermediate sections, nothing on screen.
 */

/** Act one — the continued sequence (001+002+003+004). */
export const SCRUB_VIDEO_A = "/aryan/showreel_a.mp4";
export const SCRUB_POSTER_A = "/aryan/poster_a.jpg";
export const ACT1_DURATIONS = [8, 8, 8, 8];
export const ACT1_DURATION = ACT1_DURATIONS.reduce((a, b) => a + b, 0); // 32s

/** Full original chapter files used by the desktop Videos app. */
export const ORIGINAL_VIDEOS = [
  { src: "/aryan/processed_video_001.mp4", poster: "/aryan/poster_001.jpg", title: "Showreel — Part 01" },
  { src: "/aryan/processed_video_002.mp4", poster: "/aryan/poster_002.jpg", title: "Showreel — Part 02" },
  { src: "/aryan/new_video_003.mp4", poster: "/aryan/poster_003.jpg", title: "Showreel — Part 03" },
  { src: "/aryan/new_video_004.mp4", poster: "/aryan/poster_004.jpg", title: "Showreel — Part 04" },
];

/** Frames extracted for the desktop Photos app (8 per film x 4 films). */
export const PHOTOS: string[] = Array.from(
  { length: 32 },
  (_, i) => `/aryan/photos/photo_${String(i + 1).padStart(2, "0")}.jpg`,
);
