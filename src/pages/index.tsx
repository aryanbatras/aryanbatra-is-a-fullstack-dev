import styles from "../styles/pages/index.module.css";
import AnimatedText from "../components/animations/AnimatedText";
import { useTheme } from "../context/ThemeContext";
import ModelContainer from "../components/threejs/ModelContainer";
import LevaPanel from "../components/utility/LevaPanel";

export default function Home() {
  const { theme } = useTheme();
  return (
    <div
      className={`${styles.container} 
            ${theme === "dark" && styles.dark}`}
    >
      <div className={styles.content}>
        <LevaPanel />
        <AnimatedText
          content={["Frontend Engineer", "Systems Engineer", "Architect"]}
        />
        <ModelContainer />
      </div>
      <div className={styles.content}></div>
      <div className={styles.content}></div>
      <div className={styles.content}></div>
    </div>
  );
}
