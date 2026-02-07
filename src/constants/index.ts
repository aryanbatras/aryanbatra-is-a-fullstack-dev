import { TechIcon, ColorPreset } from '../types';

export const TECH_ICONS: TechIcon[] = [
  { name: "JavaScript", color: "#007ACC", symbol: "JS", bgColor: "white" },
  { name: "TypeScript", color: "#007ACC", symbol: "TS", bgColor: "white" },
  { name: "React", color: "#007ACC", symbol: "⚛️", bgColor: "white" },
  { name: "Next.js", color: "#007ACC", symbol: "▲", bgColor: "red" },
  { name: "Redux", color: "#007ACC", symbol: "RX", bgColor: "red" },
  { name: "SolidJS", color: "#00B4D8", symbol: "S", bgColor: "red" },
  { name: "Tailwind", color: "#007ACC", symbol: "TW", bgColor: "red" },
  { name: "Zustand", color: "#007ACC", symbol: "ZT", bgColor: "red" }
];

export const COLOR_PRESETS: Record<ColorPreset, string> = {
  blue: "#007ACC",
  red: "#DC2626",
  orange: "#FF9900",
  purple: "#764ABC",
  green: "#4FC08D",
  yellow: "#FFCA28",
  pink: "#E10098",
  white: "#FFFFFF"
};

export const MODEL_PATH = '/assets/model.glb';

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1280,
  desktop: 1920
};

export const ANIMATION_DEFAULTS = {
  floatIntensity: 0.02,
  rotationSpeed: 0.4,
  driftIntensity: 0.015,
  orbitSpeed: 0.01,
  glowIntensity: 0.2
};

export const EFFECTS_DEFAULTS = {
  bloomIntensity: 10,
  bloomLuminanceThreshold: 0.2,
  bloomRadius: 0.1,
  depthOfFieldFocusDistance: 0.1,
  depthOfFieldFocalLength: 0.02,
  depthOfFieldBokehScale: 0.75,
  vignetteOffset: 0.5,
  vignetteDarkness: 0.75,
  chromaticAberrationOffset: [0.001, 0.002, 0] as [number, number, number]
};

export const RESPONSIVE_POSITIONS = {
  mobile: {
    baseX: 0.45,
    baseY: 0.45,
    baseZ: -1.90,
    scaleMultiplier: 0.4,
    rotY: 0.45,
    rotX: -0.015,
    rotZ: -0.015,
    finalRotY: -2.25
  },
  tablet: {
    baseX: 0.95,
    baseY: 0.25,
    baseZ: -3.35,
    scaleMultiplier: 0.7,
    rotY: 0.15,
    rotX: -0.015,
    rotZ: -0.015,
    finalRotY: -2.0
  },
  desktop: {
    baseX: 0.90,
    baseY: -0.16,
    baseZ: -2.05,
    scaleMultiplier: 1,
    rotY: 0.15,
    rotX: -0.015,
    rotZ: -0.015,
    finalRotY: -2.0
  }
};
