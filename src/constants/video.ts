/**
 * Timeline manifest for the /new scroll-scrub experience.
 *
 * A single act — one continued sequence that ends with a photo zoom:
 *
 *   Act one (showreel_a.mp4, 16s):
 *     [0, 8)   -> processed_video_001
 *     [8, 16)  -> processed_video_002     (001+002 = ONE continued sequence)
 *
 * The film is encoded ALL-INTRA (a keyframe at every frame — see
 * scripts/build-showreel.sh), so scrubbing via currentTime is instant and
 * frame-accurate: each seek decodes exactly one frame, no buffering, no
 * black frames, no flicker.
 *
 * When the film reaches its last frame the section keeps scrolling and the
 * frozen frame — which is essentially a photo (the last frame of video 002,
 * photo_16 in the desktop Photos app) — zooms toward the bottom-right,
 * where the laptop sits in the footage, as if going inside the machine.
 */

/** Act one — the continued sequence (001+002). */
export const SCRUB_VIDEO_A = "/aryan/showreel_a.mp4";
export const SCRUB_POSTER_A = "/aryan/poster_a.jpg";
export const ACT1_DURATIONS = [8, 8];
export const ACT1_DURATION = ACT1_DURATIONS.reduce((a, b) => a + b, 0); // 16s

/** The frozen last frame of act one (video 002) — the 16:9 still that
    rises from the bottom and expands to fill the screen, becoming the login
    screen before the desktop boots. */
export const DESKTOP_PHOTO = "/aryan/desktop_photo.jpg";

/** Full original chapter files used by the desktop Videos app. */
export const ORIGINAL_VIDEOS = [
  { src: "/aryan/processed_video_001.mp4", poster: "/aryan/poster_001.jpg", title: "Showreel — Part 01" },
  { src: "/aryan/processed_video_002.mp4", poster: "/aryan/poster_002.jpg", title: "Showreel — Part 02" },
];

/** Frames extracted for the desktop Photos app (8 per film x 2 films). */
export const PHOTOS: string[] = Array.from(
  { length: 16 },
  (_, i) => `/aryan/photos/photo_${String(i + 1).padStart(2, "0")}.jpg`,
);
