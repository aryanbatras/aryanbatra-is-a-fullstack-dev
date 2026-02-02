import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { Group, Mesh, Object3D, CanvasTexture, Color, SphereGeometry, BoxGeometry, TetrahedronGeometry, OctahedronGeometry, TorusGeometry, ConeGeometry } from "three";

interface OrbitingBallsProps {
  centerPosition: [number, number, number];
  radius: number;
  ballCount: number;
  ballSize: number;
  orbitSpeed: number;
  colorChangeMode?: boolean;
  ballShape?: string;
  glowIntensity?: number;
  colorPreset?: string;
}

const techIcons = [
  { name: "JavaScript", color: "#007ACC", symbol: "JS", bgColor: "white" },
  { name: "TypeScript", color: "#007ACC", symbol: "TS", bgColor: "white" },
  { name: "React", color: "#007ACC", symbol: "⚛️", bgColor: "white" },
  { name: "Next.js", color: "#007ACC", symbol: "▲", bgColor: "red" },
  { name: "Redux", color: "#007ACC", symbol: "RX", bgColor: "red" },
  { name: "SolidJS", color: "#00B4D8", symbol: "S", bgColor: "red" },
  { name: "Tailwind", color: "#007ACC", symbol: "TW", bgColor: "red" },
  { name: "Zustand", color: "#007ACC", symbol: "ZT", bgColor: "red" }
];

const colorPresets = {
  blue: "#007ACC",
  red: "#DC2626",
  orange: "#FF9900",
  purple: "#764ABC",
  green: "#4FC08D",
  yellow: "#FFCA28",
  pink: "#E10098",
  white: "#FFFFFF"
};

function createIconTexture(icon: typeof techIcons[0]) {
  
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillRect(0, 0, 1024, 512);
  
  // Create pattern for sphere wrapping
  for (let i = 0; i < 4; i++) {
    const x = i * 256;
    
    // Super vibrant gradient circle background
    const gradient = ctx.createRadialGradient(x + 128, 256, 0, x + 128, 256, 120);
    gradient.addColorStop(0, icon.color + 'FF');
    gradient.addColorStop(0.3, icon.color + 'CC');
    gradient.addColorStop(0.7, icon.color + '80');
    gradient.addColorStop(1, icon.color + '40');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + 128, 256, 120, 0, Math.PI * 2);
    ctx.fill();
    
    // Super bright glowing border
    ctx.strokeStyle = icon.color;
    ctx.shadowColor = icon.color;
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(x + 128, 256, 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Bright white inner circle
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 128, 256, 100, 0, Math.PI * 2);
    ctx.fill();
    
    // // Maximum contrast shadow for text
    // ctx.shadowColor = '#000000';
    // ctx.shadowBlur = 2;
    // ctx.shadowOffsetX = 2;
    // ctx.shadowOffsetY = 2;
    
    // Super bright icon/symbol
    ctx.fillStyle = icon.color;
    ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon.symbol, x + 128, 230);
    
    // // Enhanced shadow for name
    // ctx.shadowColor = '#000000';
    // ctx.shadowBlur = 6;
    // ctx.shadowOffsetX = 3;
    // ctx.shadowOffsetY = 3;
    
    // Tech name with maximum contrast
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
  ballShape?: string;
  glowIntensity?: number;
  colorPreset?: string;
}) {
  const meshRef = useRef<Mesh>(null);
  
  // Create icon with preset color
  const getPresetIcon = () => {
    const baseIcon = techIcons[index % techIcons.length];
    if (colorPreset && colorPreset !== 'blue') {
      const presetColor = colorPresets[colorPreset as keyof typeof colorPresets];
      return { ...baseIcon, color: presetColor };
    }
    return baseIcon;
  };
  
  const icon = getPresetIcon();
  const texture = useMemo(() => createIconTexture(icon), [icon]);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Self rotation
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5 + index * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + index * 0.2;
      
      // Color changing effect
      if (colorChangeMode && meshRef.current.material) {
        const material = meshRef.current.material as any;
        if (colorPreset && colorPreset !== 'blue') {
          // Use preset color
          const presetColor = colorPresets[colorPreset as keyof typeof colorPresets];
          material.emissive = new Color(presetColor);
          material.emissiveIntensity = (glowIntensity || 0.2) + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
        } else {
          // Original disco mode (random colors)
          const hue = (state.clock.elapsedTime * 0.5 + index * 0.3) % 1;
          const color = new Color(`hsl(${hue * 360}, 70%, 50%)`);
          material.emissive = color;
          material.emissiveIntensity = (glowIntensity || 0.2) + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
        }
      }
    }
  });
  
  // Get geometry based on shape
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
  
  // Get the base color from preset or default
  const getBaseColor = () => {
    if (colorPreset && colorPreset !== 'blue') {
      return colorPresets[colorPreset as keyof typeof colorPresets];
    }
    return icon.color;
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
  orbitSpeed,
  colorChangeMode,
  ballShape = 'sphere',
  glowIntensity = 0.2,
  colorPreset = 'blue'
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
