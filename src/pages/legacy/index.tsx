import { useTheme } from "@/context/ThemeContext";
import { One, Two } from "@/layout/homepage";
import Contact from "@/components/contact/Contact";
import styles from "@/styles/pages/index.module.css";

/**
 * The classic portfolio (hero, projects, contact) as its own route.
 * The desktop's Portfolio app embeds this page in an iframe, so the whole
 * site lives inside the machine.
 */
export default function LegacyHome() {
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.container} ${
        theme === "dark" ? styles.dark : ""
      }`}
    >
      <div className={styles.content}>
        <One />
      </div>
      <div className={`${styles.content} ${theme === "dark" ? styles.dark : ""}`}>
        <Two />
      </div>
      <div className={styles.content}>
        <Contact />
      </div>
    </div>
  );
}
