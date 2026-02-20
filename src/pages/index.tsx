import { useTheme } from "@/context/ThemeContext";
import { One, Two } from "@/layout/homepage";
import Contact from "@/components/contact/Contact";
import styles from "@/styles/pages/index.module.css";

export default function Home() {
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
