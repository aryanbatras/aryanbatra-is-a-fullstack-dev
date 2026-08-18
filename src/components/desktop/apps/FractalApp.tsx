"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Fractal Explorer — real-time Mandelbrot & Julia sets using WebGL.
 * Click to zoom, drag to pan, switch between fractal types.
 */

type FractalType = "mandelbrot" | "julia" | "burningship";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRACTAL_SHADERS: Record<FractalType, string> = {
  mandelbrot: `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform int u_maxIter;

    void main() {
      vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
      vec2 c = uv / u_zoom + u_center;
      vec2 z = vec2(0.0);
      int iter = 0;
      for (int i = 0; i < 1000; i++) {
        if (i >= u_maxIter) break;
        float x = z.x * z.x - z.y * z.y + c.x;
        float y = 2.0 * z.x * z.y + c.y;
        z = vec2(x, y);
        if (dot(z, z) > 4.0) break;
        iter++;
      }
      float t = float(iter) / float(u_maxIter);
      vec3 color;
      if (iter >= u_maxIter) {
        color = vec3(0.0);
      } else {
        color = 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 1.0, 1.0) + vec3(0.0, 0.33, 0.67)));
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  julia: `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform int u_maxIter;
    uniform vec2 u_juliaC;

    void main() {
      vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
      vec2 z = uv / u_zoom + u_center;
      vec2 c = u_juliaC;
      int iter = 0;
      for (int i = 0; i < 1000; i++) {
        if (i >= u_maxIter) break;
        float x = z.x * z.x - z.y * z.y + c.x;
        float y = 2.0 * z.x * z.y + c.y;
        z = vec2(x, y);
        if (dot(z, z) > 4.0) break;
        iter++;
      }
      float t = float(iter) / float(u_maxIter);
      vec3 color;
      if (iter >= u_maxIter) {
        color = vec3(0.0);
      } else {
        color = 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 0.8, 0.6) + vec3(0.1, 0.4, 0.7)));
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  burningship: `
    precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform int u_maxIter;

    void main() {
      vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
      vec2 c = uv / u_zoom + u_center;
      vec2 z = vec2(0.0);
      int iter = 0;
      for (int i = 0; i < 1000; i++) {
        if (i >= u_maxIter) break;
        z = abs(z);
        float x = z.x * z.x - z.y * z.y + c.x;
        float y = 2.0 * z.x * z.y + c.y;
        z = vec2(x, y);
        if (dot(z, z) > 4.0) break;
        iter++;
      }
      float t = float(iter) / float(u_maxIter);
      vec3 color;
      if (iter >= u_maxIter) {
        color = vec3(0.0);
      } else {
        color = 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 0.6, 0.3) + vec3(0.0, 0.2, 0.5)));
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export default function FractalApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [fractalType, setFractalType] = useState<FractalType>("mandelbrot");
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [maxIter, setMaxIter] = useState(128);
  const [juliaC, setJuliaC] = useState({ x: -0.7, y: 0.27015 });
  const [dragging, setDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [status, setStatus] = useState("Initializing WebGL…");

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      setStatus("WebGL not available");
      return;
    }
    glRef.current = gl;

    // Create shader program
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRACTAL_SHADERS[fractalType]);
    if (!vs || !fs) {
      setStatus("Shader compilation failed");
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setStatus("Program link failed");
      return;
    }

    gl.useProgram(program);
    programRef.current = program;

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    setStatus("Ready — click to zoom, drag to pan");
  }, [fractalType, compileShader]);

  const renderFractal = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);

    // Set uniforms
    const setUniform2 = (name: string, x: number, y: number) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc) gl.uniform2f(loc, x, y);
    };
    const setUniform1 = (name: string, v: number) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc) gl.uniform1f(loc, v);
    };
    const setUniform1i = (name: string, v: number) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc) gl.uniform1i(loc, v);
    };

    setUniform2("u_resolution", gl.canvas.width, gl.canvas.height);
    setUniform2("u_center", center.x, center.y);
    setUniform1("u_zoom", zoom);
    setUniform1i("u_maxIter", maxIter);

    if (fractalType === "julia") {
      setUniform2("u_juliaC", juliaC.x, juliaC.y);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [center, zoom, maxIter, fractalType, juliaC]);

  // Init on mount and fractal type change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    initGL();
  }, [fractalType, initGL]);

  // Re-render on parameter change
  useEffect(() => {
    renderFractal();
  }, [renderFractal]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      initGL();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initGL]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = 1 / (zoom * Math.min(canvas.clientWidth, canvas.clientHeight));
    setCenter((c) => ({
      x: c.x - dx * scale,
      y: c.y + dy * scale,
    }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setDragging(false);

  const handleClick = (e: React.MouseEvent) => {
    // Don't zoom if we just dragged
    if (Math.abs(e.clientX - lastMouse.current.x) > 3 || Math.abs(e.clientY - lastMouse.current.y) > 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.clientWidth;
    const y = 1 - (e.clientY - rect.top) / canvas.clientHeight;

    const nx = (x - 0.5) * (canvas.clientWidth / Math.min(canvas.clientWidth, canvas.clientHeight));
    const ny = (y - 0.5);

    setCenter((c) => ({
      x: c.x + nx / zoom,
      y: c.y + ny / zoom,
    }));
    setZoom((z) => z * 2);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.8 : 1.25;
    setZoom((z) => Math.min(1e8, Math.max(0.1, z * factor)));
  };

  const resetView = () => {
    if (fractalType === "mandelbrot") {
      setCenter({ x: -0.5, y: 0 });
    } else if (fractalType === "julia") {
      setCenter({ x: 0, y: 0 });
    } else {
      setCenter({ x: -0.4, y: -0.6 });
    }
    setZoom(0.8);
  };

  return (
    <div className={styles.fractalApp}>
      {/* Toolbar */}
      <div className={styles.pgliteToolbar}>
        <Sparkles size={12} />
        <span className={styles.pgliteStatus}>
          {status} · Zoom: {zoom.toExponential(1)} · Iter: {maxIter}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={resetView} className={styles.playgroundBtn}>Reset</button>
        </div>
      </div>

      {/* Controls bar */}
      <div className={styles.fractalControls}>
        {(["mandelbrot", "julia", "burningship"] as FractalType[]).map((type) => (
          <button
            key={type}
            className={`${styles.chartTypeBtn} ${fractalType === type ? styles.chartTypeBtnActive : ""}`}
            onClick={() => {
              setFractalType(type);
              if (type === "mandelbrot") { setCenter({ x: -0.5, y: 0 }); setZoom(0.8); }
              else if (type === "julia") { setCenter({ x: 0, y: 0 }); setZoom(0.8); }
              else { setCenter({ x: -0.4, y: -0.6 }); setZoom(0.8); }
            }}
          >
            {type === "mandelbrot" ? "Mandelbrot" : type === "julia" ? "Julia Set" : "Burning Ship"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <label style={{ fontSize: 11, color: "#8888aa", display: "flex", alignItems: "center", gap: 4 }}>
          Iterations:
          <input
            type="range"
            min={32}
            max={500}
            value={maxIter}
            onChange={(e) => setMaxIter(Number(e.target.value))}
            style={{ width: 80 }}
          />
          {maxIter}
        </label>
        {fractalType === "julia" && (
          <label style={{ fontSize: 11, color: "#8888aa", display: "flex", alignItems: "center", gap: 4 }}>
            Re(c):
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={juliaC.x}
              onChange={(e) => setJuliaC((c) => ({ ...c, x: Number(e.target.value) }))}
              style={{ width: 60 }}
            />
            Im(c):
            <input
              type="range"
              min={-2}
              max={2}
              step={0.01}
              value={juliaC.y}
              onChange={(e) => setJuliaC((c) => ({ ...c, y: Number(e.target.value) }))}
              style={{ width: 60 }}
            />
          </label>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={styles.fractalCanvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
    </div>
  );
}
