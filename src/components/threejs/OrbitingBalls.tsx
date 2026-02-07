import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitingBallsProps, TechIcon, BallShape, ColorPreset } from "@/types";
import { Group, Mesh, Object3D, CanvasTexture, Color } from "three";
import { TECH_ICONS, COLOR_PRESETS, ANIMATION_DEFAULTS} from "@/constants";

function createIconTexture(icon: TechIcon) {
  
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillRect(0, 0, 1024, 512);
  
  for (let i = 0; i < 4; i++) {
    const x = i * 256;
    
    const gradient = ctx.createRadialGradient(x + 128, 256, 0, x + 128, 256, 120);
    gradient.addColorStop(0, icon.color + 'FF');
    gradient.addColorStop(0.3, icon.color + 'CC');
    gradient.addColorStop(0.7, icon.color + '80');
    gradient.addColorStop(1, icon.color + '40');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + 128, 256, 120, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = icon.color;
    ctx.shadowColor = icon.color;
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(x + 128, 256, 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 128, 256, 100, 0, Math.PI * 2);
    ctx.fill();
  
    ctx.fillStyle = icon.color;
    ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon.symbol, x + 128, 230);

    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';    
    ctx.lineWidth = 6;
    ctx.fillStyle = icon.color;
    ctx.fillText(icon.name, x + 128, 280);
  }
  
  return new CanvasTexture(canvas);
}

function TechBall({ position, index, ballSize, colorChangeMode, ballShape, glowIntensity, colorPreset }: { 
  position: any; 
  index: number; 
  ballSize: number; 
  colorChangeMode?: boolean;
  ballShape?: BallShape;
  glowIntensity?: number;
  colorPreset?: ColorPreset;
}) {
  const meshRef = useRef<Mesh>(null);
  
  const getPresetIcon = () => {
    const baseIcon = TECH_ICONS[index % TECH_ICONS.length];
    if (colorPreset && colorPreset !== 'blue') {
      const presetColor = COLOR_PRESETS[colorPreset as keyof typeof COLOR_PRESETS];
      return { ...baseIcon, color: presetColor };
    }
    return baseIcon;
  };
  
  const icon = getPresetIcon();
  const texture = useMemo(() => createIconTexture(icon), [icon]);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5 + index * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + index * 0.2;
      if (colorChangeMode && meshRef.current.material) {
        const material = meshRef.current.material as any;
        if (colorPreset && colorPreset !== 'blue') {
          const presetColor = COLOR_PRESETS[colorPreset as keyof typeof COLOR_PRESETS];
          material.emissive = new Color(presetColor);
          material.emissiveIntensity = (glowIntensity || ANIMATION_DEFAULTS.glowIntensity) + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
        } else {
          const hue = (state.clock.elapsedTime * 0.5 + index * 0.3) % 1;
          const color = new Color(`hsl(${hue * 360}, 70%, 50%)`);
          material.emissive = color;
          material.emissiveIntensity = (glowIntensity || ANIMATION_DEFAULTS.glowIntensity) + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
        }
      }
    }
  });

  const getGeometry = () => {
    switch (ballShape) {
      case 'cube':
        return <boxGeometry args={[ballSize * 2, ballSize * 2, ballSize * 2]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[ballSize * 1.5]} />;
      case 'octahedron':
        return <octahedronGeometry args={[ballSize * 1.5]} />;
      case 'torus':
        return <torusGeometry args={[ballSize, ballSize * 0.4, 16, 32]} />;
      case 'cone':
        return <coneGeometry args={[ballSize, ballSize * 2, 8]} />;
      default:
        return <sphereGeometry args={[ballSize, 64, 64]} />;
    }
  };
 
  return (
    <mesh ref={meshRef} position={position}>
      {getGeometry()}
      <meshStandardMaterial 
        map={texture}
        metalness={0.05}
        roughness={0.1}
      />
    </mesh>
  );
}

export default function OrbitingBalls({ 
  centerPosition, 
  radius, 
  ballCount, 
  ballSize, 
  orbitSpeed = ANIMATION_DEFAULTS.orbitSpeed,
  colorChangeMode,
  ballShape = 'sphere' as BallShape,
  glowIntensity = ANIMATION_DEFAULTS.glowIntensity,
  colorPreset = 'blue' as ColorPreset
}: OrbitingBallsProps) {
  const groupRef = useRef<Group>(null);

  const ballPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < ballCount; i++) {
      const angle = (i / ballCount) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: (Math.random() - 0.5) * radius * 0.3,
        phase: Math.random() * Math.PI * 2,
        rotationOffset: Math.random() * Math.PI * 2
      });
    }
    return positions;
  }, [ballCount, radius]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime * orbitSpeed;
      
      groupRef.current.children.forEach((ball: Object3D, index: number) => {
        const ballData = ballPositions[index];
        const angle = time + ballData.phase;
        
        // Stable orbital motion - no group rotation drift
        ball.position.x = centerPosition[0] + Math.cos(angle) * ballData.x;
        ball.position.z = centerPosition[2] + Math.sin(angle) * ballData.z;
        ball.position.y = centerPosition[1] + ballData.y + Math.sin(time * 0.3 + index) * 0.15;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {ballPositions.map((_, index) => (
        <TechBall
          key={index}
          position={[0, 0, 0]}
          index={index}
          ballSize={ballSize}
          colorChangeMode={colorChangeMode}
          ballShape={ballShape}
          glowIntensity={glowIntensity}
          colorPreset={colorPreset}
        />
      ))}
    </group>
  );
}
