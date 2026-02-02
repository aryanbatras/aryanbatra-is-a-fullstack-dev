import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import useScreenWidth from "../../hooks/useScreenWidth";

interface EnhancedModelProps {
  animationEnabled: boolean
  floatIntensity: number
  rotationSpeed: number
  driftIntensity: number
  scale: number
  wireframe: boolean
  autoRotate: boolean
  position: [number, number, number]
  rotation: [number, number, number]
}

export default function EnhancedModel({ 
  animationEnabled,
  floatIntensity,
  rotationSpeed,
  driftIntensity,
  scale,
  wireframe,
  autoRotate,
  position,
  rotation
}: EnhancedModelProps) {
  const { nodes, materials } = useGLTF('/assets/model.glb')
  const modelRef = useRef<any>(null)
  const { width } = useScreenWidth();

  const responsiveScale = width < 768 ? scale * 0.4 : scale;

  useFrame((state) => {
    if (modelRef.current && animationEnabled) {
      const time = state.clock.elapsedTime
      
      const floatY = Math.sin(time * 0.7) * floatIntensity
      const driftX = Math.sin(time * 0.5 + 1) * driftIntensity
      const driftZ = Math.sin(time * 0.6 + 2) * driftIntensity * 0.67
      
      const baseX = width < 768 ? 0.45 : width < 1280 ? 0.95 : 0.90
      const baseY = width < 768 ? 0.52 : width < 1280 ? 0.25 : -0.05
      const baseZ = width < 768 ? -1.70 : width < 1280 ? -3.35 : -2.05
      
      modelRef.current.position.x = baseX + driftX + position[0]
      modelRef.current.position.y = baseY + floatY + position[1]
      modelRef.current.position.z = baseZ + driftZ + position[2]
      
      const rotX = Math.sin(time * 0.3 + 0.5) * 0.01
      const rotY = (width < 768 ? 0.45 : 0.15) + Math.sin(time * rotationSpeed + 1.5) * 0.02
      const rotZ = (width < 768 ? -0.015 : -0.015) + Math.sin(time * 0.5 + 2.5) * 0.015
      
      const autoRotateY = autoRotate ? time * 0.5 : 0
      
      modelRef.current.rotation.x = rotX + rotation[0]
      modelRef.current.rotation.y = (width < 768 ? -2.25 : -2.0) + rotY + rotation[1] + autoRotateY
      modelRef.current.rotation.z = rotZ + rotation[2]
    } else if (modelRef.current) {
      const baseX = width < 768 ? 0.45 : width < 1280 ? 0.95 : 0.90
      const baseY = width < 768 ? 0.52 : width < 1280 ? 0.25 : -0.05
      const baseZ = width < 768 ? -1.70 : width < 1280 ? -3.35 : -2.05
      
      modelRef.current.position.x = baseX + position[0]
      modelRef.current.position.y = baseY + position[1]
      modelRef.current.position.z = baseZ + position[2]
      
      const autoRotateY = autoRotate ? state.clock.elapsedTime * 0.5 : 0
      
      modelRef.current.rotation.x = rotation[0]
      modelRef.current.rotation.y = (width < 768 ? -2.25 : -2.0) + rotation[1] + autoRotateY
      modelRef.current.rotation.z = rotation[2]
    }
  })
  
  const material = wireframe 
    ? { ...materials['tripo_mat_2fb7c4c2-690b-405f-aee7-5223c78cc147'], wireframe: true }
    : materials['tripo_mat_2fb7c4c2-690b-405f-aee7-5223c78cc147'];

  return (
    <primitive
      ref={modelRef}
      scale={responsiveScale}
      dispose={null}
      object={nodes['tripo_node_2fb7c4c2-690b-405f-aee7-5223c78cc147']}
      material={material}
    />
  )
}
