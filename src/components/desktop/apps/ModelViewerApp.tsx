"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Upload, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * 3D Model Viewer — view and interact with 3D models in the browser.
 * Uses Three.js for rendering. Supports OBJ and basic geometry.
 * CDN: three@0.182.0 via jsDelivr
 */

const DEMO_MODELS = [
  {
    id: "cube",
    name: "Cube",
    icon: "📦",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
  {
    id: "sphere",
    name: "Sphere",
    icon: "🔵",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.SphereGeometry(0.7, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ color: 0x10b981, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
  {
    id: "torus",
    name: "Torus",
    icon: "🍩",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.TorusGeometry(0.6, 0.25, 16, 100);
      const mat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
  {
    id: "knot",
    name: "Torus Knot",
    icon: "🔮",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16);
      const mat = new THREE.MeshPhongMaterial({ color: 0xef4444, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
  {
    id: "icosahedron",
    name: "Icosahedron",
    icon: "💎",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.IcosahedronGeometry(0.7, 0);
      const mat = new THREE.MeshPhongMaterial({ color: 0x8b5cf6, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
  {
    id: "octahedron",
    name: "Octahedron",
    icon: "💠",
    create: (scene: any, THREE: any) => {
      const geo = new THREE.OctahedronGeometry(0.7, 0);
      const mat = new THREE.MeshPhongMaterial({ color: 0xec4899, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      return mesh;
    },
  },
];

export default function ModelViewerApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading Three.js…");
  const [loaded, setLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [currentModel, setCurrentModel] = useState("cube");
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, dragging: false });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // @ts-expect-error CDN URL import
        const THREE = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/three@0.182.0/+esm") as any;
        if (!alive) return;

        const container = containerRef.current;
        if (!container) return;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 2.5;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x3b82f6, 1, 100);
        pointLight.position.set(-3, 3, 3);
        scene.add(pointLight);

        // Grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x2a2a4a, 0x1a1a2e);
        gridHelper.position.y = -1;
        scene.add(gridHelper);

        // Load initial model
        const model = DEMO_MODELS.find((m) => m.id === "cube");
        if (model) meshRef.current = model.create(scene, THREE);

        // Animation loop
        const animate = () => {
          frameRef.current = requestAnimationFrame(animate);
          if (meshRef.current && autoRotate) {
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.01;
          }
          renderer.render(scene, camera);
        };
        animate();

        // Mouse controls
        const onPointerDown = (e: PointerEvent) => {
          mouseRef.current.dragging = true;
          mouseRef.current.x = e.clientX;
          mouseRef.current.y = e.clientY;
        };
        const onPointerMove = (e: PointerEvent) => {
          if (!mouseRef.current.dragging || !meshRef.current) return;
          const dx = e.clientX - mouseRef.current.x;
          const dy = e.clientY - mouseRef.current.y;
          meshRef.current.rotation.y += dx * 0.01;
          meshRef.current.rotation.x += dy * 0.01;
          mouseRef.current.x = e.clientX;
          mouseRef.current.y = e.clientY;
        };
        const onPointerUp = () => { mouseRef.current.dragging = false; };
        const onWheel = (e: WheelEvent) => {
          camera.position.z = Math.max(1, Math.min(10, camera.position.z + e.deltaY * 0.01));
        };

        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerup", onPointerUp);
        container.addEventListener("wheel", onWheel, { passive: true });

        // Resize
        const onResize = () => {
          if (!container) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener("resize", onResize);

        setLoaded(true);
        setStatus("3D viewer ready — select a model or drag to rotate");

        return () => {
          cancelAnimationFrame(frameRef.current);
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerup", onPointerUp);
          container.removeEventListener("wheel", onWheel);
          window.removeEventListener("resize", onResize);
          renderer.dispose();
          container.removeChild(renderer.domElement);
        };
      } catch {
        if (alive) setStatus("Failed to load Three.js");
      }
    };

    const cleanupPromise = load();
    return () => {
      alive = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  const switchModel = useCallback(async (modelId: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry?.dispose();
      meshRef.current.material?.dispose();
    }

    // @ts-expect-error CDN URL import
    const THREE = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/three@0.182.0/+esm") as any;
    const model = DEMO_MODELS.find((m) => m.id === modelId);
    if (model) {
      meshRef.current = model.create(scene, THREE);
      meshRef.current.material.wireframe = wireframe;
    }
    setCurrentModel(modelId);
  }, [wireframe]);

  const toggleWireframe = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.material.wireframe = !wireframe;
    }
    setWireframe((w) => !w);
  }, [wireframe]);

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 2.5);
    }
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className={styles.modelViewer}>
      {/* Sidebar */}
      <div className={styles.pgliteSidebar}>
        <div className={styles.pgliteSection}>
          <Box size={12} /> Models
        </div>
        {DEMO_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.pgliteQueryBtn} ${currentModel === m.id ? styles.pgliteQueryBtnActive : ""}`}
            onClick={() => void switchModel(m.id)}
            disabled={!loaded}
          >
            {m.icon} {m.name}
          </button>
        ))}

        <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
          <RotateCw size={12} /> Controls
        </div>
        <button
          type="button"
          className={`${styles.pgliteQueryBtn} ${autoRotate ? styles.pgliteQueryBtnActive : ""}`}
          onClick={() => setAutoRotate((a) => !a)}
        >
          {autoRotate ? "⏸ Pause" : "▶ Auto-Rotate"}
        </button>
        <button
          type="button"
          className={`${styles.pgliteQueryBtn} ${wireframe ? styles.pgliteQueryBtnActive : ""}`}
          onClick={toggleWireframe}
        >
          {wireframe ? "🔲 Solid" : "🔳 Wireframe"}
        </button>
        <button type="button" className={styles.pgliteQueryBtn} onClick={resetView}>
          🔄 Reset View
        </button>
      </div>

      {/* Main */}
      <div className={styles.pgliteMain}>
        <div className={styles.pgliteToolbar}>
          <span className={styles.pgliteStatus}>{status}</span>
          <span className={styles.pgliteStatus} style={{ marginLeft: "auto" }}>
            Drag to rotate · Scroll to zoom
          </span>
        </div>

        <div
          ref={containerRef}
          className={styles.modelViewerCanvas}
          style={{ flex: 1, background: "#1a1a2e" }}
        />
      </div>
    </div>
  );
}
