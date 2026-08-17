import { useEffect, useMemo, useRef, useState } from "react";
import opentype from "opentype.js";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * OpenType — font viewer (daedalOS). Parses an .otf/.ttf/.woff file with
 * opentype.js and renders the alphabet + pangram at several point sizes
 * straight from the font's vector outlines.
 */

const DEFAULT_MESSAGE = "The quick brown fox jumps over the lazy dog. 1234567890";
const ALPHABETS = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS_SYMBOLS = "1234567890.:,; ' \" (!?) +-*/=";
const FONT_SIZES = [12, 18, 24, 36, 48, 60, 72];
const VISUAL_MODIFIER = 4 / 3;

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const [, b64] = dataUrl.split(",");
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

interface OpenTypeAppProps {
  /** Font file name opened from Finder — resolved from storage by name. */
  file?: string;
}

export default function OpenTypeApp({ file }: OpenTypeAppProps) {
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [specimen, setSpecimen] = useState(DEFAULT_MESSAGE);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (!file) {
      setError("Drop an .otf, .ttf or .woff font file here");
      setFont(null);
      return;
    }
    const stored = readFiles().find((f) => f.name === file);
    if (!stored?.content) {
      setError(`Couldn't read ${file}`);
      return;
    }
    try {
      const parsed = opentype.parse(dataUrlToArrayBuffer(stored.content));
      setFont(parsed);
      setError(null);
    } catch {
      setError(`“${file}” isn't a valid font file`);
      setFont(null);
    }
  }, [file]);

  const info = useMemo(() => {
    if (!font) return null;
    const name = (n?: opentype.LocalizedName) =>
      n?.en || (n && Object.values(n)[0]) || "";
    const types = [
      font.supported ? "OpenType Layout" : null,
      font.outlinesFormat === "truetype" ? "TrueType Outlines" : null,
    ].filter(Boolean);
    return {
      name: name(font.names.fullName),
      version: name(font.names.version),
      types: types.join(", "),
    };
  }, [font]);

  return (
    <div className={styles.openType}>
      {error && <div className={styles.openTypeDrop}>{error}</div>}
      {font && info && (
        <>
          <div className={styles.openTypeMeta}>
            <span>Font name: {info.name}</span>
            <span>Version: {info.version}</span>
            <span>{info.types}</span>
          </div>
          <label className={styles.openTypeSpecimenRow}>
            <span>Specimen</span>
            <input
              value={specimen}
              onChange={(e) => {
                setSpecimen(e.target.value);
                setPreviewKey((k) => k + 1);
              }}
              className={styles.openTypeSpecimenInput}
              aria-label="Specimen text"
            />
          </label>
          <div className={styles.openTypeSamples}>
            <FontPreview font={font} fontSize={14} text={ALPHABETS} />
            <FontPreview font={font} fontSize={14} text={NUMBERS_SYMBOLS} />
            {FONT_SIZES.map((size) => (
              <div key={size} className={styles.openTypeSample}>
                <span className={styles.openTypeSampleSize}>{size}px</span>
                <FontPreview
                  font={font}
                  fontSize={size}
                  text={specimen}
                  bump={previewKey}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Draw the text using the font's own vector paths onto a canvas. */
function FontPreview({
  font,
  fontSize,
  text,
  bump,
}: {
  font: opentype.Font;
  fontSize: number;
  text: string;
  bump?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const viewSize = Math.ceil(fontSize * VISUAL_MODIFIER);
    const path = font.getPath(text || DEFAULT_MESSAGE, 0, viewSize, viewSize);
    const { x1, y1, x2, y2 } = path.getBoundingBox();
    const w = Math.max(1, Math.ceil(x2 - x1));
    const h = Math.max(1, Math.ceil(y2 - y1));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    path.draw(ctx);
  }, [font, fontSize, text, bump]);

  return <canvas ref={canvasRef} className={styles.openTypeCanvas} />;
}
