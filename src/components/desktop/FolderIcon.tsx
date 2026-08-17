import { FOLDER_COLOR_FILL } from "@/constants/desktop";

interface FolderIconProps {
  size?: number;
  /** macOS folder color id; defaults to the system blue. */
  color?: string;
  /** Optional emoji badge (Tahoe folder emoji). */
  emoji?: string;
  className?: string;
  /** Drop-shadow strength — wallpaper icons want a light shadow. */
  shadow?: boolean;
}

/** macOS Tahoe folder tint shades, keyed by color id. */
const FOLDER_SHADES: Record<string, { top: string; bottom: string; dark: string }> = {
  blue: { top: "#6ea8ff", bottom: "#0a63e0", dark: "#08398a" },
  gray: { top: "#b6b6bb", bottom: "#6b6b70", dark: "#3f3f44" },
  green: { top: "#5fd97a", bottom: "#1e9e3e", dark: "#12642a" },
  orange: { top: "#ffb340", bottom: "#dd7a00", dark: "#8f4f00" },
  pink: { top: "#ff8ab5", bottom: "#e33b74", dark: "#92224b" },
  purple: { top: "#c48bf0", bottom: "#8642bd", dark: "#572a7d" },
  red: { top: "#ff7a7d", bottom: "#d62e36", dark: "#8c1b21" },
  yellow: { top: "#ffd968", bottom: "#e6a700", dark: "#946c00" },
};

/**
 * The macOS folder icon, tinted like Tahoe folders. Matches the shape of the
 * real Finder folder (tab + body) so wallpaper folders never look different
 * from ones in Finder, and supports the Tahoe color + emoji customization.
 */
export default function FolderIcon({
  size = 48,
  color = "blue",
  emoji,
  className,
  shadow = true,
}: FolderIconProps) {
  const shades = FOLDER_SHADES[color] ?? FOLDER_SHADES.blue;
  const fill = FOLDER_COLOR_FILL[color] ?? FOLDER_COLOR_FILL.blue;

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        filter: shadow ? "drop-shadow(0 2px 5px rgba(0,0,0,0.28))" : undefined,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label="Folder"
      >
        {/* Tab */}
        <path
          d="M8 20c0-3.3 2.7-6 6-6h14l4 6h18c3.3 0 6 2.7 6 6v2H8v-8Z"
          fill={shades.top}
        />
        {/* Body */}
        <path
          d="M6 24h52a2 2 0 0 1 2 2v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V26a2 2 0 0 1 2-2Z"
          fill={fill}
        />
        {/* Body highlight */}
        <path
          d="M8 26h48v4a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6v-4Z"
          fill={shades.top}
          opacity="0.55"
        />
        {/* Body shading at the bottom */}
        <path
          d="M10 50h44a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6Z"
          fill={shades.dark}
          opacity="0.4"
        />
      </svg>
      {/* Emoji badge — sits in the lower area of the folder, like Tahoe. */}
      {emoji && (
        <span
          style={{
            position: "absolute",
            bottom: size * 0.1,
            fontSize: size * 0.34,
            lineHeight: 1,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
          }}
        >
          {emoji}
        </span>
      )}
    </span>
  );
}
