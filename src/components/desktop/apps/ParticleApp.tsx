"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Orbit } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Particle System — GPU-accelerated WebGL particles with physics.
 * Multiple presets, interactive mouse attraction/repulsion.
 */

type Preset = "galaxy" | "fire" | "rain" | "explosion" | "vortex";

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  size: number;
  r: number; g: number; b: number;
}

const PRESETS: Record<Preset, { label: string; emoji: string; count: number; gravity: number; speed: number; life: number; spread: number; colors: [number, number, number][] }> = {
  galaxy: {
    label: "Galaxy", emoji: "🌌", count: 5000, gravity: 0, speed: 0.3, life: 200, spread: 2,
    colors: [[0.4, 0.4, 1.0], [0.6, 0.3, 0.9], [0.8, 0.5, 1.0], [1.0, 1.0, 1.0]],
  },
  fire: {
    label: "Fire", emoji: "🔥", count: 4000, gravity: 0.02, speed: 1.5, life: 60, spread: 0.3,
    colors: [[1.0, 0.8, 0.0], [1.0, 0.4, 0.0], [1.0, 0.1, 0.0], [0.8, 0.0, 0.0]],
  },
  rain: {
    label: "Rain", emoji: "🌧", count: 3000, gravity: -0.15, speed: 0.5, life: 80, spread: 3,
    colors: [[0.3, 0.6, 1.0], [0.5, 0.7, 1.0], [0.7, 0.85, 1.0], [0.9, 0.95, 1.0]],
  },
  explosion: {
    label: "Explosion", emoji: "💥", count: 6000, gravity: 0.005, speed: 3.0, life: 40, spread: 0.1,
    colors: [[1.0, 0.9, 0.2], [1.0, 0.5, 0.1], [1.0, 0.2, 0.05], [0.6, 0.1, 0.0]],
  },
  vortex: {
    label: "Vortex", emoji: "🌀", count: 4500, gravity: 0, speed: 0.8, life: 150, spread: 1.5,
    colors: [[0.0, 1.0, 0.5], [0.0, 0.8, 1.0], [0.3, 0.4, 1.0], [0.6, 0.0, 1.0]],
  },
};

const VERT_SHADER = `
  attribute vec3 a_position;
  attribute vec4 a_color;
  attribute float a_size;
  uniform mat4 u_projection;
  varying vec4 v_color;
  void main() {
    gl_Position = u_projection * vec4(a_position, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
  }
`;

const FRAG_SHADER = `
  precision mediump float;
  varying vec4 v_color;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d) * v_color.a;
    gl_FragColor = vec4(v_color.rgb, alpha);
  }
`;

function perspectiveMatrix(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function rotateY(m: Float32Array, angle: number): Float32Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const r = new Float32Array(m);
  r[0] = m[0] * c + m[8] * s;
  r[8] = m[8] * c - m[0] * s;
  r[2] = m[2] * c + m[10] * s;
  r[10] = m[10] * c - m[2] * s;
  return r;
}

function rotateX(m: Float32Array, angle: number): Float32Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const r = new Float32Array(m);
  r[1] = m[1] * c + m[9] * s;
  r[9] = m[9] * c - m[1] * s;
  r[5] = m[5] * c + m[13] * s;
  r[13] = m[13] * c - m[5] * s;
  return r;
}

export default function ParticleApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [preset, setPreset] = useState<Preset>("galaxy");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseInfluence, setMouseInfluence] = useState(0.5);
  const animRef = useRef<number>(0);
  const rotRef = useRef({ x: 0.3, y: 0 });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  const initParticles = useCallback((p: Preset) => {
    const config = PRESETS[p];
    const particles: Particle[] = [];
    for (let i = 0; i < config.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * config.spread;
      const height = (Math.random() - 0.5) * config.spread * 0.3;
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];

      particles.push({
        x: Math.cos(angle) * radius,
        y: height,
        z: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * config.speed * 0.5,
        vy: (Math.random() - 0.5) * config.speed * 0.5,
        vz: (Math.random() - 0.5) * config.speed * 0.5,
        life: Math.random() * config.life,
        maxLife: config.life,
        size: 1.5 + Math.random() * 2.5,
        r: color[0], g: color[1], b: color[2],
      });
    }
    particlesRef.current = particles;
  }, []);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    glRef.current = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERT_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAG_SHADER);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    programRef.current = prog;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.02, 0.02, 0.05, 1);
  }, []);

  const animate = useCallback(() => {
    const gl = glRef.current;
    const prog = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !prog || !canvas) return;

    const config = PRESETS[preset];
    const particles = particlesRef.current;

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life--;

      if (p.life <= 0) {
        // Respawn
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * config.spread * 0.3;
        p.x = Math.cos(angle) * radius;
        p.y = (Math.random() - 0.5) * config.spread * 0.3;
        p.z = Math.sin(angle) * radius;
        p.vx = (Math.random() - 0.5) * config.speed;
        p.vy = (Math.random() - 0.5) * config.speed;
        p.vz = (Math.random() - 0.5) * config.speed;
        p.life = config.life;
        p.maxLife = config.life;
      }

      // Apply physics
      p.vy += config.gravity;

      // Mouse influence
      if (mouseInfluence > 0) {
        const mx = (mousePos.x - 0.5) * 4;
        const my = -(mousePos.y - 0.5) * 4;
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const force = mouseInfluence * 0.02 / (dist * dist);
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Vortex special: add tangential velocity
      if (preset === "vortex") {
        const angle = Math.atan2(p.z, p.x);
        p.vx += -Math.sin(angle) * 0.02;
        p.vz += Math.cos(angle) * 0.02;
      }

      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.z += p.vz * 0.016;

      // Damping
      p.vx *= 0.998;
      p.vy *= 0.998;
      p.vz *= 0.998;
    }

    // Auto-rotate
    rotRef.current.y += 0.003;

    // Render
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let proj = perspectiveMatrix(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    proj = rotateX(proj, rotRef.current.x);
    proj = rotateY(proj, rotRef.current.y);

    gl.useProgram(prog);
    const projLoc = gl.getUniformLocation(prog, "u_projection");
    gl.uniformMatrix4fv(projLoc, false, proj);

    // Build buffers
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 4);
    const sizes = new Float32Array(particles.length);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const lifeRatio = p.life / p.maxLife;
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 4] = p.r;
      colors[i * 4 + 1] = p.g;
      colors[i * 4 + 2] = p.b;
      colors[i * 4 + 3] = lifeRatio;
      sizes[i] = p.size * lifeRatio;
    }

    // Position buffer
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // Color buffer
    const colBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    const colLoc = gl.getAttribLocation(prog, "a_color");
    gl.enableVertexAttribArray(colLoc);
    gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 0);

    // Size buffer
    const sizeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    const sizeLoc = gl.getAttribLocation(prog, "a_size");
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particles.length);

    gl.deleteBuffer(posBuf);
    gl.deleteBuffer(colBuf);
    gl.deleteBuffer(sizeBuf);

    animRef.current = requestAnimationFrame(animate);
  }, [preset, mousePos, mouseInfluence]);

  // Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    initGL();
    initParticles(preset);
  }, [preset, initGL, initParticles]);

  // Start/stop animation
  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });

    if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      rotRef.current.y += dx * 0.005;
      rotRef.current.x += dy * 0.005;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    }
  };

  return (
    <div className={styles.particleApp}>
      {/* Toolbar */}
      <div className={styles.pgliteToolbar}>
        <Orbit size={12} />
        <span className={styles.pgliteStatus}>
          {PRESETS[preset].emoji} {PRESETS[preset].label} · {PRESETS[preset].count.toLocaleString()} particles
        </span>
      </div>

      {/* Preset bar */}
      <div className={styles.chartTypeBar}>
        {(["galaxy", "fire", "rain", "explosion", "vortex"] as Preset[]).map((p) => (
          <button
            key={p}
            className={`${styles.chartTypeBtn} ${preset === p ? styles.chartTypeBtnActive : ""}`}
            onClick={() => setPreset(p)}
          >
            {PRESETS[p].emoji} {PRESETS[p].label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <label style={{ fontSize: 11, color: "#8888aa", display: "flex", alignItems: "center", gap: 4 }}>
          Mouse force:
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={mouseInfluence}
            onChange={(e) => setMouseInfluence(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={styles.fractalCanvas}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => { dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }; }}
        onMouseUp={() => { dragRef.current.dragging = false; }}
        onMouseLeave={() => { dragRef.current.dragging = false; }}
      />
    </div>
  );
}
