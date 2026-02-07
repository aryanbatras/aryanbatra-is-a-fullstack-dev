import styles from "@/styles/components/animation/AnimatedText.module.css";
import { useTheme } from "@/context/ThemeContext";
import { useRef, useEffect, useState } from "react";

interface AnimatedTextProps {
  content: string[];
}

export default function AnimatedText({ content }: AnimatedTextProps) {
  const { theme } = useTheme();
  const wordIndex = useRef(0);
  const arrayIndex = useRef(0);
  const directionRef = useRef(0);
  const [animatedTextArray, setAnimatedTextArray] = useState<string[]>([]);
  useEffect(() => {
    if (arrayIndex.current < content.length) {
      const words = content[arrayIndex.current];
      const timer = setTimeout(() => {
        if (
          animatedTextArray.length < words.length &&
          directionRef.current === 0
        ) {
          wordIndex.current++;
          setAnimatedTextArray((e) => [...e, words[wordIndex.current - 1]]);
        } else {
          if (wordIndex.current > 0) {
            setAnimatedTextArray((e) => e.slice(0, -1));
            wordIndex.current--;
            directionRef.current = 1;
          } else {
            arrayIndex.current++;
            setAnimatedTextArray([]);
            directionRef.current = 0;
          }
        }
      }, (animatedTextArray?.length < words?.length && animatedTextArray?.length !== 0) ? 90 : 750);
      return () => clearTimeout(timer);
    } else {
      arrayIndex.current = 0;
      wordIndex.current = 0;
      directionRef.current = 0;
      setAnimatedTextArray([]);
    }
  }, [animatedTextArray]);
  return (
    <div className={`${styles.container} ${theme === "dark" ? styles.dark : ""}`}>
      {animatedTextArray.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
      <span className={styles.caret}></span>
    </div>
  );
}