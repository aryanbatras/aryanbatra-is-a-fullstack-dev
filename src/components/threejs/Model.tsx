import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import useScreenWidth from "../../hooks/useScreenWidth";
export default function Model() {
  const { nodes, materials } = useGLTF('/assets/model.glb')
  const modelRef = useRef<any>(null)
  const { width } = useScreenWidth();

  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.elapsedTime
      
      const floatY = Math.sin(time * 0.7) * 0.02
      const driftX = Math.sin(time * 0.5 + 1) * 0.015
      const driftZ = Math.sin(time * 0.6 + 2) * 0.01
      
      const baseX = width < 768 ? 0.45 : width < 1280 ? 0.95 : 0.90
      const baseY = width < 768 ? 0.52 : width < 1280 ? 0.25 : -0.05
      const baseZ = width < 768 ? -1.70 : width < 1280 ? -3.35 : -2.05
      
      modelRef.current.position.x = baseX + driftX
      modelRef.current.position.y = baseY + floatY
      modelRef.current.position.z = baseZ + driftZ
      
      const rotX = Math.sin(time * 0.3 + 0.5) * 0.01
      const rotY = (width < 768 ? 0.45 : 0.15) + Math.sin(time * 0.4 + 1.5) * 0.02
      const rotZ = (width < 768 ? -0.015 : -0.015) + Math.sin(time * 0.5 + 2.5) * 0.015
      
      modelRef.current.rotation.x = rotX
      modelRef.current.rotation.y = (width < 768 ? -2.25 : -2.0) + rotY
      modelRef.current.rotation.z = rotZ
    }
  })
  
  return (
    <primitive
      ref={modelRef}
      scale={width < 768 ? 1 : 2.5}
      dispose={null}
      object={nodes['tripo_node_2fb7c4c2-690b-405f-aee7-5223c78cc147']}
      material={materials['tripo_mat_2fb7c4c2-690b-405f-aee7-5223c78cc147']}
    />
  )
}
