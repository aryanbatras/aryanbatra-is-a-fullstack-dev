import { useState } from "react";
import useScreenWidth from "../../hooks/useScreenWidth";
import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";


export default function Camera() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { width } = useScreenWidth();
  const isMobile = width < 768;
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        setMousePos({
          x: (touch.clientX / window.innerWidth) * 2 - 1,
          // y: -(touch.clientY / window.innerHeight) * 2 + 1
          y: 0
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useFrame((state) => {
    const sensitivity = isMobile ? 0.5 : 1;
    const smoothFactor = isMobile ? 0.08 : 0.05;
    
    const targetX = mousePos.x * 2 * sensitivity;
    const targetY = mousePos.y * 1.5 * sensitivity;
    
    state.camera.position.x += (targetX - state.camera.position.x) * smoothFactor;
    state.camera.position.y += (targetY - state.camera.position.y) * smoothFactor;
    state.camera.lookAt(0.55, 0.55, -2.5);
  });

  return null;
}