import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitingBallsProps, TechIcon, BallShape, ColorPreset } from "@/types";
import { Group, Mesh, Object3D, CanvasTexture, Color, Vector3 } from "three";
import { Html } from "@react-three/drei";
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

function TechBall({ 
  position, 
  index, 
  ballSize, 
  colorChangeMode, 
  ballShape, 
  glowIntensity, 
  colorPreset,
  onHover,
  isHovered
}: { 
  position: any; 
  index: number; 
  ballSize: number; 
  colorChangeMode?: boolean;
  ballShape?: BallShape;
  glowIntensity?: number;
  colorPreset?: ColorPreset;
  onHover?: (hovered: boolean, techName: string) => void;
  isHovered?: boolean;
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
      
      // Simple hover effect - scale up slightly
      const targetScale = isHovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.1);
      
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
    <mesh 
      ref={meshRef} 
      position={position}
      onPointerEnter={() => onHover?.(true, icon.name)}
      onPointerLeave={() => onHover?.(false, icon.name)}
    >
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
  colorPreset = 'blue' as ColorPreset,
  modelPosition
}: OrbitingBallsProps) {
  const groupRef = useRef<Group>(null);
  const [modelBounds, setModelBounds] = useState({ center: new Vector3(0, 0, 0), radius: 0.8 });
  const [hoveredBall, setHoveredBall] = useState<number | null>(null);
  const [hoveredTech, setHoveredTech] = useState<string>('');

  // Update model bounds when position changes
  useMemo(() => {
    if (modelPosition) {
      setModelBounds({ center: modelPosition.clone(), radius: 0.8 });
    }
  }, [modelPosition]);

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

  const checkBallCollision = (pos1: Vector3, pos2: Vector3, size: number) => {
    const distance = pos1.distanceTo(pos2);
    return distance < (size * 2);
  };

  const checkModelCollision = (ballPos: Vector3) => {
    const distance = ballPos.distanceTo(modelBounds.center);
    return distance < (modelBounds.radius + ballSize);
  };

  const resolveBallCollision = (pos1: Vector3, pos2: Vector3, size: number) => {
    const direction = new Vector3().subVectors(pos1, pos2).normalize();
    const minDistance = size * 2;
    const currentDistance = pos1.distanceTo(pos2);
    const overlap = minDistance - currentDistance;
    
    if (overlap > 0) {
      const separation = direction.multiplyScalar(overlap * 0.5);
      pos1.add(separation);
      pos2.sub(separation);
    }
  };

  const resolveModelCollision = (ballPos: Vector3) => {
    const direction = new Vector3().subVectors(ballPos, modelBounds.center).normalize();
    const minDistance = modelBounds.radius + ballSize;
    const currentDistance = ballPos.distanceTo(modelBounds.center);
    const overlap = minDistance - currentDistance;
    
    if (overlap > 0) {
      ballPos.add(direction.multiplyScalar(overlap));
    }
  };

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime * orbitSpeed;
      const ballObjects = groupRef.current.children;
      
      // Update positions
      ballObjects.forEach((ball: Object3D, index: number) => {
        const ballData = ballPositions[index];
        const angle = time + ballData.phase;
        
        // Calculate intended position
        const intendedPos = new Vector3(
          centerPosition[0] + Math.cos(angle) * ballData.x,
          centerPosition[1] + ballData.y + Math.sin(time * 0.3 + index) * 0.15,
          centerPosition[2] + Math.sin(angle) * ballData.z
        );
        
        // Prevent balls from getting too close to camera (camera is at z=0)
        const minZDistance = 0.5; // Minimum distance from camera
        if (Math.abs(intendedPos.z) < minZDistance) {
          intendedPos.z = intendedPos.z < 0 ? -minZDistance : minZDistance;
        }
        
        // Check model collision
        if (checkModelCollision(intendedPos)) {
          resolveModelCollision(intendedPos);
        }
        
        ball.position.copy(intendedPos);
      });
      
      // Check ball-to-ball collisions
      for (let i = 0; i < ballObjects.length; i++) {
        for (let j = i + 1; j < ballObjects.length; j++) {
          if (checkBallCollision(
            ballObjects[i].position, 
            ballObjects[j].position, 
            ballSize
          )) {
            resolveBallCollision(
              ballObjects[i].position,
              ballObjects[j].position,
              ballSize
            );
          }
        }
      }
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
          onHover={(hovered, techName) => {
            setHoveredBall(hovered ? index : null);
            setHoveredTech(hovered ? techName : '');
          }}
          isHovered={hoveredBall === index}
        />
      ))}
      
      {/* Simple Tech Name Display */}
      {hoveredTech && (
        <Html position={[0, 2, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{hoveredTech}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Click to learn more</div>
          </div>
        </Html>
      )}
    </group>
  );
}
