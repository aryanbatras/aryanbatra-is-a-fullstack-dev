import styles from "@/styles/pages/index.module.css";
import One from "@/components/homepage/segments/one";
import { useTheme } from "@/context/ThemeContext";
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
      <div className={styles.content}></div>
      <div className={styles.content}></div>
      <div className={styles.content}></div>
    </div>
  );
}
