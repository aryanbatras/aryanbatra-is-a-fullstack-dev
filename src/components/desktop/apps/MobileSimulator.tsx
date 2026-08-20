import { useEffect, useRef, useState } from "react";
import { Smartphone, RotateCcw } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * MobileSimulator — a fully interactive mobile shell rendered inside
 * a phone frame on the desktop. Desktop users can experience the mobile
 * shell as an app-within-an-app-within-an-app.
 *
 * Maximises phone frame size with minimal padding to fill the window.
 */
export default function MobileSimulator() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [rotation, setRotation] = useState<"portrait" | "landscape">("portrait");
  const [loading, setLoading] = useState(true);

  const src = typeof window !== "undefined"
    ? `${window.location.origin}/?embed=1`
    : "/?embed=1";

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const onLoad = () => setLoading(false);
    frame.addEventListener("load", onLoad);
    return () => frame.removeEventListener("load", onLoad);
  }, []);

  const isLandscape = rotation === "landscape";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1e",
        gap: 6,
        padding: "4px 4px 8px",
        overflow: "hidden",
      }}
    >
      {/* Minimal toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          flexShrink: 0,
        }}
      >
        <Smartphone size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
          Mobile
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setRotation((r) => r === "portrait" ? "landscape" : "portrait")}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            padding: 3,
            display: "flex",
            alignItems: "center",
            borderRadius: 4,
          }}
          title="Rotate"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Phone frame — maximised to fill available space */}
      <div
        style={{
          position: "relative",
          width: isLandscape ? "min(100%, 90%)" : "min(100%, 90%)",
          maxWidth: isLandscape ? 600 : 380,
          aspectRatio: isLandscape ? "16 / 10" : "9 / 19.5",
          borderRadius: isLandscape ? 20 : 40,
          border: "3px solid #333",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
          background: "#000",
          flex: 1,
          minHeight: 0,
          maxHeight: "100%",
        }}
      >
        {/* Dynamic Island */}
        {!isLandscape && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 90,
              height: 24,
              borderRadius: 12,
              background: "#000",
              zIndex: 10,
            }}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              zIndex: 5,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500 }}>
              Loading mobile shell…
            </div>
          </div>
        )}

        {/* The actual mobile shell iframe */}
        <iframe
          ref={iframeRef}
          src={src}
          title="Mobile Simulator"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#000",
          }}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Home indicator bar */}
      <div
        style={{
          width: isLandscape ? 100 : 120,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.15)",
          flexShrink: 0,
        }}
      />
    </div>
  );
}
