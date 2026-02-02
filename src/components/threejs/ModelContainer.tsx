import { Canvas } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Selection } from "@react-three/postprocessing";
import Model from "./Model";
import OrbitingBalls from "./OrbitingBalls";
import styles from "../../styles/components/threejs/Model.module.css";
import { Suspense } from "react";
import CameraController from "./CameraController";

export default function ModelContainer() {
  return (
    <div className={styles.container}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.55, 0], fov: 35 }}
        style={{ pointerEvents: 'none' }}
      >
        <CameraController />
        <Suspense
          fallback={
            <Html center>
              <div style={{ color: "white", fontSize: "14px" }}>
                Loading model...
              </div>
            </Html>
          }
        >
          <Environment preset="sunset" />
          <Model />
          
          <Selection>
            <EffectComposer>
              <Bloom
                intensity={1.5}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                radius={0.1}
              />
              <DepthOfField
                focusDistance={0.1}
                focalLength={0.02}
                bokehScale={0.75}
                height={640}
              />
              <Vignette
                eskil={false}
                offset={0.5}
                darkness={0.75}
              />
              <ChromaticAberration
                offset={[0.001, 0.002]}
                radialModulation={true}
                modulationOffset={0.5}
              />
            </EffectComposer>
            
            <OrbitingBalls
              centerPosition={[0.9, 0.5, -1.2]}
              radius={1.8}
              ballCount={8}
              ballSize={0.175}
              orbitSpeed={0.01}
            />
          </Selection>
        </Suspense>
      </Canvas>
    </div>
  );
}
