import { Canvas } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { Selection } from "@react-three/postprocessing";
import Model from "./Model";
import OrbitingBalls from "./OrbitingBalls";
import Effects from "./Effects";
import styles from "../../styles/components/threejs/Model.module.css";
import { Suspense } from "react";
import Camera from "./Camera";
import { useControls } from "leva";

export default function ModelContainer() {
  const {
    scale,
    autoRotate,
    environment,
    ballCount,
    ballSize,
    ballSpeed,
    bloomEffect,
    discoMode,
    colorPreset,
    ballShape,
    glowIntensity,
  } = useControls({
    environment: {
      value: "sunset",
      options: [
        "sunset",
        "dawn",
        "night",
        "warehouse",
        "forest",
        "apartment",
        "studio",
        "city",
        "park",
        "lobby",
      ],
    },
    ballShape: {
      value: "sphere",
      options: ["sphere", "cube", "tetrahedron", "octahedron", "torus", "cone"],
    },
    colorPreset: {
      value: "blue",
      options: [
        "blue",
        "red",
        "orange",
        "purple",
        "green",
        "yellow",
        "pink",
        "white",
      ],
    },
    scale: { value: 2.5, min: 0.5, max: 5, step: 0.01 },
    ballCount: { value: 8, min: 1, max: 20, step: 1 },
    ballSize: { value: 0.175, min: 0.05, max: 0.5, step: 0.001 },
    ballSpeed: { value: 0.01, min: 0.001, max: 0.05, step: 0.0001 },
    glowIntensity: { value: 0.2, min: 0, max: 2, step: 0.01 },
    discoMode: false,
    bloomEffect: false,
    autoRotate: false,
  });

  return (
    <div className={styles.container}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.55, 0], fov: 35 }}
        style={{ 
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          display: "block"
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true
        }}
      >
        <Camera />
        <Suspense
          fallback={
            <Html center>
              <div style={{ color: "white", fontSize: "14px" }}>
                Loading model...
              </div>
            </Html>
          }
        >
          <Environment preset={environment as any} />
          <Model
            floatIntensity={0.02}
            rotationSpeed={0.4}
            driftIntensity={0.015}
            scale={scale}
            autoRotate={autoRotate}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />

          <Selection>
            <Effects
              bloomEnabled={bloomEffect}
              bloomIntensity={bloomEffect ? 10 : 0.5}
              bloomLuminanceThreshold={0.2}
              bloomRadius={0.1}
              depthOfFieldEnabled={true}
              depthOfFieldFocusDistance={0.1}
              depthOfFieldFocalLength={0.02}
              depthOfFieldBokehScale={0.75}
              vignetteEnabled={true}
              vignetteOffset={0.5}
              vignetteDarkness={0.75}
              chromaticAberrationEnabled={bloomEffect}
              chromaticAberrationOffset={[0.001, 0.002]}
            />

            <OrbitingBalls
              centerPosition={[0.9, 0.5, -1.2]}
              radius={1.8}
              ballCount={ballCount}
              ballSize={ballSize}
              orbitSpeed={ballSpeed}
              colorChangeMode={discoMode}
              ballShape={ballShape}
              glowIntensity={glowIntensity}
              colorPreset={colorPreset}
            />
          </Selection>
        </Suspense>
      </Canvas>
    </div>
  );
}
