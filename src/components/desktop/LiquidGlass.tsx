import { useEffect, useMemo, useRef, useState } from "react";

/**
 * LiquidGlass — refraction + specular highlight, built from the technique in
 * "Liquid Glass in the Browser: Refraction with CSS and SVG":
 *
 *  1. Pre-compute the refractive displacement along a single radius: the glass
 *     surface is a height function (Apple's convex squircle), the surface
 *     tilt gives the angle of incidence, Snell's law (n1 = 1, n2 = 1.5) gives
 *     the refracted ray, and the ray's lateral drift through the glass is the
 *     displacement magnitude. 127 ray samples, exactly like the article.
 *  2. Encode the displacement vector field into an image: red channel = X,
 *     green channel = Y, 128 = no displacement. Convex glass bends rays
 *     inward, so each vector points at the shape's interior.
 *  3. Feed that map to an SVG <feDisplacementMap /> (scale 1px, because the
 *     channel already holds real pixel deltas) and blend a specular rim light
 *     on top with <feBlend mode="screen">.
 *  4. Apply it as `backdrop-filter: url(#id)` (Chrome), falling back to a
 *     layered blur in the CSS class for other browsers.
 *
 * The displacement map only has to be rebuilt when the element's size changes
 * (the article's one real cost), so it is generated per measured size.
 */

type Surface = "squircle" | "convex" | "concave" | "lip";

interface LiquidGlassProps {
  /** Unique filter id — referenced by `backdrop-filter: url(#id)`. */
  id: string;
  /** Corner radius of the glass shape in px (half the width = circle). */
  radius: number;
  /** Refractive bezel band width in px (0 at the rim → bezel end is flat). */
  bezel: number;
  /** Glass surface profile. "squircle" is Apple's. */
  surface?: Surface;
  /** Multiplier on the glass height — stronger refraction when larger. */
  thickness?: number;
  /** Max displacement in px — the "effect scale" knob. */
  maxShift?: number;
  /** Specular rim-light intensity (0 disables the highlight). */
  highlight?: number;
  /** Extra CSS class (positioning, border-radius, fallback blur…). */
  className?: string;
  style?: React.CSSProperties;
}

const N = 127; // ray samples per radius — the article's number

function smootherstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Height of the glass surface at normalized distance x from the rim (0→1). */
function surfaceHeight(x: number, surface: Surface): number {
  const c = Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))); // convex circle
  switch (surface) {
    case "convex":
      return c;
    case "concave":
      return 1 - c;
    case "lip":
      return c + (1 - 2 * c) * smootherstep(x);
    case "squircle":
    default:
      return Math.pow(1 - Math.pow(1 - x, 4), 0.25); // Apple's squircle
  }
}

/**
 * Snell's-law ray trace across one radius: tilt of the surface = incidence
 * angle, refraction into the glass bends the ray, and the lateral drift
 * through `thickness` units of glass is the displacement magnitude. Returns
 * magnitudes normalized to [0, 1].
 */
function precomputeMagnitudes(surface: Surface, thickness: number): number[] {
  const mags: number[] = [];
  const delta = 0.002; // tiny step for the derivative
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N;
    const y1 = surfaceHeight(Math.max(0, x - delta), surface);
    const y2 = surfaceHeight(Math.min(1, x + delta), surface);
    const deriv = (y2 - y1) / (2 * delta);
    const theta1 = Math.atan(deriv); // incidence angle = surface tilt
    const sinT2 = Math.sin(theta1) / 1.5; // n1=1 (air), n2=1.5 (glass)
    const theta2 = sinT2 >= 1 ? Math.PI / 2 : Math.asin(sinT2);
    const deviation = theta1 - theta2;
    const height = surfaceHeight(x, surface) * thickness;
    mags.push(Math.tan(deviation) * height);
  }
  const max = Math.max(...mags.map(Math.abs), 1e-6);
  return mags.map((m) => m / max);
}

interface MapResult {
  /** Displacement map data URL (R=X, G=Y, 128 neutral). */
  map: string;
  /** Specular rim-light map data URL (grayscale). */
  spec: string;
}

function buildMaps(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  surface: Surface,
  thickness: number,
  maxShift: number,
  highlight: number,
): MapResult {
  const mags = precomputeMagnitudes(surface, thickness);
  const dispCanvas = document.createElement("canvas");
  const specCanvas = document.createElement("canvas");
  dispCanvas.width = specCanvas.width = width;
  dispCanvas.height = specCanvas.height = height;
  const dispCtx = dispCanvas.getContext("2d")!;
  const specCtx = specCanvas.getContext("2d")!;
  const dispImg = dispCtx.createImageData(width, height);
  const specImg = specCtx.createImageData(width, height);
  const d = dispImg.data;
  const s = specImg.data;

  const cx = width / 2;
  const cy = height / 2;
  const isCircle = radius >= Math.min(width, height) / 2 - 1;
  const halfW = width / 2;
  const halfH = height / 2;
  const corner = Math.min(radius, Math.min(halfW, halfH));

  // Signed distance to the glass border (positive inside).
  const sdf = (px: number, py: number): number => {
    if (isCircle) {
      return Math.hypot(px - cx, py - cy) - Math.min(width, height) / 2;
    }
    const qx = Math.abs(px - cx) - (halfW - corner);
    const qy = Math.abs(py - cy) - (halfH - corner);
    const ax = Math.max(qx, 0);
    const ay = Math.max(qy, 0);
    return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - corner;
  };

  // Outward normal via finite differences of the SDF.
  const grad = (px: number, py: number): [number, number] => {
    const gx = sdf(px + 1, py) - sdf(px - 1, py);
    const gy = sdf(px, py + 1) - sdf(px, py - 1);
    const len = Math.hypot(gx, gy) || 1;
    return [gx / len, gy / len];
  };

  // Key light from the top-left for the specular rim.
  const ll = Math.hypot(0.5, 0.62);
  const lx = -0.5 / ll;
  const ly = -0.62 / ll;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = sdf(x + 0.5, y + 0.5);
      const i = (y * width + x) * 4;
      // Neutral (no displacement) outside the glass or past the bezel end.
      let r = 128;
      let g = 128;
      let spec = 0;

      if (dist >= 0 && dist <= bezel) {
        const t = dist / bezel;
        const mag = mags[Math.round(t * (N - 1))] * maxShift;
        const [nx, ny] = grad(x + 0.5, y + 0.5);
        // Convex glass bends rays inward → vectors point at the interior.
        r = 128 + Math.max(-127, Math.min(127, nx * mag));
        g = 128 + Math.max(-127, Math.min(127, ny * mag));
        if (highlight > 0) {
          const dot = nx * lx + ny * ly; // lit arc faces the key light
          const rim = 1 - t; // brightest right at the rim
          spec = Math.pow(Math.max(0, dot), 6) * rim * highlight;
        }
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = 128;
      d[i + 3] = 255;
      const v = Math.round(Math.min(1, spec) * 255);
      s[i] = s[i + 1] = s[i + 2] = v;
      s[i + 3] = 255;
    }
  }

  dispCtx.putImageData(dispImg, 0, 0);
  specCtx.putImageData(specImg, 0, 0);
  return { map: dispCanvas.toDataURL(), spec: specCanvas.toDataURL() };
}

export default function LiquidGlass({
  id,
  radius,
  bezel,
  surface = "squircle",
  thickness = 4,
  maxShift = 9,
  highlight = 0.7,
  className,
  style,
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  /* On mobile the canvas displacement maps + SVG filters are too heavy for
     the GPU — fall back to a simple CSS blur which looks close enough and
     keeps the frame rate above 60. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maps = useMemo(() => {
    if (!size) return null;
    return buildMaps(
      size.w,
      size.h,
      radius,
      bezel,
      surface,
      thickness,
      maxShift,
      highlight,
    );
  }, [size, radius, bezel, surface, thickness, maxShift, highlight]);

  return (
    <>
      {/* Hidden SVG holding the filter — the element references it by id.
          The displacement map image is baked at the measured element size. */}
      {maps && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter
              id={id}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={maps.map}
                x="0"
                y="0"
                width={size!.w}
                height={size!.h}
                preserveAspectRatio="none"
                result="dispMap"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale="1"
                xChannelSelector="R"
                yChannelSelector="G"
                result="refracted"
              />
              <feImage
                href={maps.spec}
                x="0"
                y="0"
                width={size!.w}
                height={size!.h}
                preserveAspectRatio="none"
                result="spec"
              />
              <feBlend in="refracted" in2="spec" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}
      {/* The glass surface. The CSS class supplies the non-Chrome layered-blur
          fallback; once the maps exist we switch Chrome over to the real
          refraction. A faint blur in the list reads as frosted glass. */}
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          backdropFilter: isMobile
            ? "blur(12px) saturate(1.3)"
            : maps
              ? `url(#${id}) blur(2px) saturate(1.35)`
              : undefined,
        }}
        aria-hidden="true"
      />
    </>
  );
}
