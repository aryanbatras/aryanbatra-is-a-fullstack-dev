"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "../../styles/components/testimonials/AnimatedTestimonials.module.css";

export type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

import { useTheme } from "@/context/ThemeContext";

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const { theme } = useTheme();
  const [active, setActive] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  const handleDrag = (event: any, info: any) => {
    setDragOffset({ x: info.offset.x, y: 0 });
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <>
      <h2 className={`${styles.title} ${theme === "dark" ? styles.dark : ""}`}>Testimonials</h2>
      <div className={styles.container}>
      <div className={styles.grid}>
        <div>
          <div className={styles.imageContainer}>
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index)
                      ? 40
                      : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                    x: isActive(index) ? dragOffset.x : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  drag={isActive(index) ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className={styles.motionImage}
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className={styles.testimonialImage}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className={styles.contentContainer}>
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <h3 className={styles.name}>
              {testimonials[active].name}
            </h3>
            <p className={styles.designation}>
              {testimonials[active].designation}
            </p>
            <motion.p className={styles.quote}>
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className={styles.wordSpan}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>
          <div className={styles.buttonContainer}>
            <button
              onClick={handlePrev}
              className={`${styles.navButton} ${theme === "dark" ? styles.darkButton : ""}`}
            >
              <IconArrowLeft className={styles.arrowIcon} />
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navButton} ${theme === "dark" ? styles.darkButton : ""}`}
            >
              <IconArrowRight className={styles.arrowIcon} />
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
