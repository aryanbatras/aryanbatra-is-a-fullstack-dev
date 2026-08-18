/**
 * Touch interaction utilities — iOS-style feel on the web.
 *
 * - Haptic feedback via Vibration API
 * - Press scale animations
 * - Spring physics for smooth transitions
 */

/**
 * Trigger haptic feedback (if available).
 * Uses the Vibration API which works on most mobile browsers.
 */
export function hapticLight() {
  if ("vibrate" in navigator) navigator.vibrate(10);
}

export function hapticMedium() {
  if ("vibrate" in navigator) navigator.vibrate(20);
}

export function hapticHeavy() {
  if ("vibrate" in navigator) navigator.vibrate(30);
}

export function hapticSelection() {
  if ("vibrate" in navigator) navigator.vibrate(5);
}

/**
 * Spring animation parameters — iOS-style spring physics.
 * Use with CSS transitions or Framer Motion.
 */
export const SPRING = {
  /** Light tap — quick settle */
  light: { stiffness: 400, damping: 30, mass: 0.8 },
  /** Medium tap — balanced */
  medium: { stiffness: 300, damping: 25, mass: 1 },
  /** Heavy tap — weighty, slow settle */
  heavy: { stiffness: 200, damping: 20, mass: 1.2 },
  /** Bouncy — playful, overshooting */
  bouncy: { stiffness: 180, damping: 12, mass: 0.8 },
} as const;

/**
 * CSS transition string for spring-like feel.
 * Use `cubic-bezier` approximations of spring curves.
 */
export const SPRING_CSS = {
  light: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
  medium: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
  heavy: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  bouncy: "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

/**
 * Touch interaction handler for interactive elements.
 * Apply to React elements for iOS-style press feedback.
 *
 * Usage:
 *   <button {...touchFeedback("medium")}>Press me</button>
 */
export function touchFeedback(intensity: "light" | "medium" | "heavy" | "medium" = "medium") {
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(0.97)";
      el.style.transition = SPRING_CSS[intensity];
      hapticLight();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(1)";
    },
    onTouchCancel: (e: React.TouchEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(1)";
    },
    onMouseDown: (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(0.98)";
      el.style.transition = SPRING_CSS[intensity];
    },
    onMouseUp: (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(1)";
    },
    onMouseLeave: (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = "scale(1)";
    },
  };
}
