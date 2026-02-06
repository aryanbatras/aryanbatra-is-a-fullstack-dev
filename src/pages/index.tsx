import { useEffect, useState } from "react";
import TerminalLoader from "../components/TerminalLoader";
import styles from "../styles/pages/index.module.css";
import AnimatedText from "../components/animations/AnimatedText";
import { useTheme } from "../context/ThemeContext";
import EnhancedModelContainer from "../components/threejs/EnhancedModelContainer";
import LevaPanel from "../components/utility/LevaPanel";

function HomePage() {
  const { theme } = useTheme();
  console.log("Home");
  return (
    <div
      className={`${styles.container} 
      ${theme === "dark" && styles.dark}`}
    >
      <div className={styles.content}>
        <AnimatedText
          content={["Frontend Engineer", "Systems Engineer", "Architect"]}
        />
        <EnhancedModelContainer />
      </div>
    </div>
  );
}

export default function Home() {
  const [showHome, setShowHome] = useState(false);
  console.log("Home");
  useEffect(() => {
    const timer = setTimeout(() => setShowHome(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!showHome ? (
        <>
          <TerminalLoader />
        </>
      ) : (
        <>
          <LevaPanel />
          <HomePage />
        </>
      )}
    </>
  );
}
