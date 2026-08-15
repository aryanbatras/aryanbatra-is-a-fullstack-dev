import type { DesktopAppConfig } from "@/constants/desktop";
import styles from "@/styles/components/desktop/AppIcon.module.css";

interface AppIconProps {
  app: DesktopAppConfig;
  size?: number;
}

/** A real macOS app icon (extracted from macOS Tahoe 26), sized to `size` px. */
export default function AppIcon({ app, size = 56 }: AppIconProps) {
  return (
    <img
      src={app.iconUrl}
      alt={app.title}
      width={size}
      height={size}
      draggable={false}
      className={styles.icon}
      style={{ width: size, height: size }}
    />
  );
}
