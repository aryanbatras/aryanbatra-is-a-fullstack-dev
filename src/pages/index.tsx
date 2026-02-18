import { useState, useEffect, useRef } from "react";
import styles from "@/styles/pages/index.module.css";
import { useTheme } from "@/context/ThemeContext";
import { One, Two } from "@/layout/homepage";
import Contact from "@/components/contact/Contact";
import TerminalLoader from "@/components/loader/TerminalLoader";

export default function Home() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <TerminalLoader />
      </div>
    );
  }

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
