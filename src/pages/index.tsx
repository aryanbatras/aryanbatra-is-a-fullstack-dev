import styles from "@/styles/pages/index.module.css";
import { useTheme } from "@/context/ThemeContext";
import { One, Two } from "@/layout/homepage";
export default function Home() {
  const { theme } = useTheme();
  return (
    <div
      className={`${styles.container} 
            ${theme === "dark" && styles.dark}`}
    >
      <div className={styles.content}>
        <One />
      </div>
      <div className={styles.content}>
        <Two />
      </div>
      <div className={styles.content}></div>
      <div className={styles.content}></div>
    </div>
  );
}
