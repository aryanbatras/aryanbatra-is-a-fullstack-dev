import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import useScreenWidth from "@/hooks/useScreenWidth";
import { ModelProps } from "@/types";
import { MODEL_PATH, RESPONSIVE_POSITIONS, BREAKPOINTS } from "@/constants";
export default function Model({
  floatIntensity,
  rotationSpeed,
  driftIntensity,
  scale,
  autoRotate,
  position,
  rotation,
}: ModelProps) {
  const { nodes, materials } = useGLTF(MODEL_PATH);
  const modelRef = useRef<any>(null);
  const { width } = useScreenWidth();

  const responsiveScale =
    width < BREAKPOINTS.mobile
      ? scale * RESPONSIVE_POSITIONS.mobile.scaleMultiplier
      : width < BREAKPOINTS.tablet
        ? scale * RESPONSIVE_POSITIONS.tablet.scaleMultiplier
        : scale * RESPONSIVE_POSITIONS.desktop.scaleMultiplier;

  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.elapsedTime;

      const floatY = Math.sin(time * 0.8) * floatIntensity * 1.5;
      const driftX = Math.sin(time * 0.4) * driftIntensity * 0.3;
      const driftZ = Math.sin(time * 0.3 + 2) * driftIntensity * 0.2;

      const responsiveConfig =
        width < BREAKPOINTS.mobile
          ? RESPONSIVE_POSITIONS.mobile
          : width < BREAKPOINTS.tablet
            ? RESPONSIVE_POSITIONS.tablet
            : RESPONSIVE_POSITIONS.desktop;

      const baseX = responsiveConfig.baseX;
      const baseY = responsiveConfig.baseY;
      const baseZ = responsiveConfig.baseZ;

      modelRef.current.position.x = baseX + driftX + position[0];
      modelRef.current.position.y = baseY + floatY + position[1];
      modelRef.current.position.z = baseZ + driftZ + position[2];

      const rotX = Math.sin(time * 0.3 + 0.5) * 0.01;
      const rotY =
        responsiveConfig.rotY + Math.sin(time * rotationSpeed + 1.5) * 0.02;
      const rotZ = responsiveConfig.rotZ + Math.sin(time * 0.5 + 2.5) * 0.015;

      const autoRotateY = autoRotate ? time * 0.5 : 0;

      modelRef.current.rotation.x = rotX + rotation[0];
      modelRef.current.rotation.y =
        responsiveConfig.finalRotY + rotY + rotation[1] + autoRotateY;
      modelRef.current.rotation.z = rotZ + rotation[2];
    }
  });

  return (
    <primitive
      ref={modelRef}
      scale={responsiveScale}
      dispose={null}
      object={nodes["tripo_node_2fb7c4c2-690b-405f-aee7-5223c78cc147"]}
      material={materials["tripo_mat_2fb7c4c2-690b-405f-aee7-5223c78cc147"]}
    />
  );
}
