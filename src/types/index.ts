import { Vector3 as ThreeVector3 } from "three";

export type Vector3 = [number, number, number];

export interface TechIcon {
  name: string;
  color: string;
  symbol: string;
  bgColor: string;
}

export type EnvironmentPreset = 
  | "sunset"
  | "dawn"
  | "night"
  | "warehouse"
  | "forest"
  | "apartment"
  | "studio"
  | "city"
  | "park"
  | "lobby";

export type BallShape = 
  | "sphere"
  | "cube"
  | "tetrahedron"
  | "octahedron"
  | "torus"
  | "cone";

export type ColorPreset = 
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "green"
  | "yellow"
  | "pink"
  | "white";

export interface ModelProps {
  floatIntensity: number;
  rotationSpeed: number;
  driftIntensity: number;
  scale: number;
  autoRotate: boolean;
  position: Vector3;
  rotation: Vector3;
  onPositionUpdate?: (position: ThreeVector3) => void;
}

export interface EffectsProps {
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomRadius: number;
  depthOfFieldEnabled: boolean;
  depthOfFieldFocusDistance: number;
  depthOfFieldFocalLength: number;
  depthOfFieldBokehScale: number;
  vignetteEnabled: boolean;
  vignetteOffset: number;
  vignetteDarkness: number;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationOffset: Vector3;
}

export interface OrbitingBallsProps {
  centerPosition: Vector3;
  radius: number;
  ballCount: number;
  ballSize: number;
  orbitSpeed: number;
  colorChangeMode?: boolean;
  ballShape?: BallShape;
  glowIntensity?: number;
  colorPreset?: ColorPreset;
  modelPosition?: ThreeVector3;
}
