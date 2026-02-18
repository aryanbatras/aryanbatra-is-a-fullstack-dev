import styles from "@/styles/components/threejs/Model.module.css";
import { Canvas } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { Selection } from "@react-three/postprocessing";
import { useControls } from "leva";
import { Suspense, useState } from "react";
import Model from "./Model";
import Effects from "./Effects";
import Camera from "./Camera";
import OrbitingBalls from "./OrbitingBalls";
import { BallShape, ColorPreset } from "@/types";
import { Vector3 } from "three";
export default function ModelContainer() {
  const [modelPosition, setModelPosition] = useState(new Vector3(0, 0, 0));
  
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
    scale: { value: 1.5, min: 0.5, max: 5, step: 0.01 },
    ballCount: { value: 30, min: 1, max: 100, step: 1 },
    ballSize: { value: 0.10, min: 0.01, max: 1, step: 0.01 },
    ballSpeed: { value: 0.10, min: 0.01, max: 0.5, step: 0.01 },
    glowIntensity: { value: 0.2, min: 0, max: 2, step: 0.01 },
    discoMode: false,
    bloomEffect: false,
    autoRotate: false,
  });

  return (
    <div className={styles.container} data-section="threejs">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ 
          position: [0, 0.55, 0], 
          fov: 35,
          near: 0.1,
          far: 100
        }}
        style={{
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          display: "block",
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
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
              onPositionUpdate={setModelPosition}
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
                chromaticAberrationOffset={[0, 0.001, 0.002]}
              />

              <OrbitingBalls
                centerPosition={[0, 0, 0]}
                radius={1.2}
                ballCount={ballCount}
                ballSize={ballSize}
                orbitSpeed={ballSpeed}
                colorChangeMode={discoMode}
                ballShape={ballShape as BallShape}
                glowIntensity={glowIntensity}
                colorPreset={colorPreset as ColorPreset}
                modelPosition={modelPosition}
              />
            </Selection>
          </Suspense>
      </Canvas>
    </div>
  );
}
