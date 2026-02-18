import { TechIcon, ColorPreset } from '../types';

export const TECH_ICONS: TechIcon[] = [
  // Backend & Systems - Your Core Expertise
  { name: "Java", color: "#F89820", symbol: "☕", bgColor: "#1a1a1a" },
  { name: "Node.js", color: "#339933", symbol: "N", bgColor: "#1a1a1a" },
  { name: "Spring Boot", color: "#6DB33F", symbol: "SB", bgColor: "#1a1a1a" },
  { name: "Python", color: "#3776AB", symbol: "🐍", bgColor: "#1a1a1a" },
  { name: "Express.js", color: "#000000", symbol: "E", bgColor: "#1a1a1a" },
  { name: "FastAPI", color: "#009688", symbol: "FA", bgColor: "#1a1a1a" },
  
  // Frontend & 3D - Your Creative Side
  { name: "React", color: "#61DAFB", symbol: "⚛️", bgColor: "#1a1a1a" },
  { name: "Three.js", color: "#000000", symbol: "3D", bgColor: "#1a1a1a" },
  { name: "TypeScript", color: "#3178C6", symbol: "TS", bgColor: "#1a1a1a" },
  { name: "Next.js", color: "#000000", symbol: "▲", bgColor: "#FFFFFF" },
  { name: "JavaScript", color: "#F7DF1E", symbol: "JS", bgColor: "#1a1a1a" },
  { name: "HTML5", color: "#E34F26", symbol: "H5", bgColor: "#1a1a1a" },
  { name: "CSS3", color: "#1572B6", symbol: "C3", bgColor: "#1a1a1a" },
  { name: "SASS", color: "#CC6699", symbol: "S", bgColor: "#1a1a1a" },
  
  // DevOps & Cloud - Your Systems Skills
  { name: "Docker", color: "#2496ED", symbol: "🐳", bgColor: "#1a1a1a" },
  { name: "Kubernetes", color: "#326CE5", symbol: "☸️", bgColor: "#1a1a1a" },
  { name: "AWS", color: "#FF9900", symbol: "AWS", bgColor: "#1a1a1a" },
  { name: "Git", color: "#F05032", symbol: "GIT", bgColor: "#1a1a1a" },
  { name: "CI/CD", color: "#E74C3C", symbol: "CI", bgColor: "#1a1a1a" },
  { name: "Jenkins", color: "#D24939", symbol: "JK", bgColor: "#1a1a1a" },
  { name: "GitHub Actions", color: "#2088FF", symbol: "GA", bgColor: "#1a1a1a" },
  { name: "Terraform", color: "#7B42BC", symbol: "TF", bgColor: "#1a1a1a" },
  { name: "Ansible", color: "#EE0000", symbol: "AN", bgColor: "#1a1a1a" },
  
  // Databases - Your Data Skills
  { name: "PostgreSQL", color: "#336791", symbol: "🐘", bgColor: "#1a1a1a" },
  { name: "MongoDB", color: "#47A248", symbol: "🍃", bgColor: "#1a1a1a" },
  { name: "Redis", color: "#DC382D", symbol: "R", bgColor: "#1a1a1a" },
  { name: "MySQL", color: "#4479A1", symbol: "MY", bgColor: "#1a1a1a" },
  { name: "Firebase", color: "#FFCA28", symbol: "FB", bgColor: "#1a1a1a" },
  
  // Monitoring & Tools - Your Ops Skills
  { name: "Prometheus", color: "#E6522C", symbol: "PR", bgColor: "#1a1a1a" },
  { name: "Grafana", color: "#F46800", symbol: "GF", bgColor: "#1a1a1a" },
  { name: "Postman", color: "#FF6C37", symbol: "PM", bgColor: "#1a1a1a" },
  { name: "SonarQube", color: "#7E57C2", symbol: "SQ", bgColor: "#1a1a1a" },
  { name: "ELK Stack", color: "#005571", symbol: "EL", bgColor: "#1a1a1a" },
  { name: "Nginx", color: "#009639", symbol: "NX", bgColor: "#1a1a1a" },
  
  // Specialized Skills - Your Unique Expertise
  { name: "Ray Tracing", color: "#FF6B6B", symbol: "🔆", bgColor: "#1a1a1a" },
  { name: "Algorithms", color: "#9B59B6", symbol: "ALG", bgColor: "#1a1a1a" },
  { name: "C++", color: "#00599C", symbol: "C++", bgColor: "#1a1a1a" },
  { name: "Data Structures", color: "#FF9800", symbol: "DS", bgColor: "#1a1a1a" },
  { name: "System Design", color: "#2196F3", symbol: "SD", bgColor: "#1a1a1a" },
  { name: "Microservices", color: "#FF5722", symbol: "MS", bgColor: "#1a1a1a" }
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
  orbitSpeed: 250,
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
