import styles from "../../styles/components/carousel/Carousel.module.css";
import { useEffect, useRef, useState } from "react";
import { projects } from "../../data/projects";
import { FaArrowRight, FaArrowLeft, FaGithub, FaPlay } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import ProjectPopup from "../projects/ProjectPopup";
export default function Carousel() {
  const { theme } = useTheme();
  const [translateX, setTranslateX] = useState(0);
  const [webpReady, setWebpReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTranslateX = (newX: number) => {
    setTranslateX(newX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - currentTranslateX);
    if (containerRef.current) {
      containerRef.current.style.transition = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newTranslateX = e.clientX - dragStartX;
    setCurrentTranslateX(newTranslateX);
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${newTranslateX}px)`;
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setTranslateX(currentTranslateX);
      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 0.5s ease';
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartX(touch.clientX - currentTranslateX);
    if (containerRef.current) {
      containerRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newTranslateX = touch.clientX - dragStartX;
    setCurrentTranslateX(newTranslateX);
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${newTranslateX}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setTranslateX(currentTranslateX);
      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 0.5s ease';
      }
    }
  };

  const handleProjectMouseEnter = (projectId: string, e: React.MouseEvent) => {
    setHoveredProjectId(projectId);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const relativeX = rect.left - containerRect.left;
      const progress = relativeX / containerRect.width;
      const width = isDragging ? 15 + (progress * 15) : 30;
      target.style.width = `${width}rem`;
    }
  };

  const handleProjectMouseMove = (e: React.MouseEvent) => {
    if (!hoveredProjectId) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const relativeX = rect.left - containerRect.left;
      const progress = relativeX / containerRect.width;
      const width = isDragging ? 15 + (progress * 15) : 30;
      target.style.width = `${width}rem`;
    }
  };

  const handleProjectMouseLeave = (e: React.MouseEvent) => {
    setHoveredProjectId(null);
    (e.currentTarget as HTMLElement).style.width = "15rem";
  };

  useEffect(() => {
    const preloadWebp = () => {
      const webpImages = [
        "/videos/js-homepage.webp",
        "/videos/signal-ui.webp", 
        "/videos/study-stream.webp",
        "/videos/dsa-in-3d.webp"
      ];
      
      let loadedCount = 0;
      const totalImages = webpImages.length;
      
      webpImages.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setWebpReady(true);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setWebpReady(true);
          }
        };
        img.src = src;
      });
    };

    if (document.readyState === "complete") {
      setTimeout(preloadWebp, 500);
    } else {
      window.addEventListener("load", () => {
        setTimeout(preloadWebp, 500);
      });
      return () => window.removeEventListener("load", preloadWebp);
    }
  }, []);
  return (
    <>
      <h2 className={`${styles.title} ${theme === "dark" ? styles.dark : ""}`}>Projects</h2>
      <div
        ref={containerRef}
        data-section="projects"
        className={styles.container}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: `transform 0.5s ease`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {projects.map((project, index) => {
          const staticImage = 
            project.id === "signal-ui" ? "/images/signal-ui.png" :
            project.id === "js-homepage" ? "/images/js-homepage.png" :
            project.id === "dsa-in-3d" ? "/images/dsa-in-3d.jpg" :
            project.id === "studystream" ? "/images/study-stream.png" :
            project.id === "java-3d-engine" ? "/images/java-3d-engine.jpg" :
            null;
          
          const webpImage = 
            project.id === "signal-ui" ? "/videos/signal-ui.webp" :
            project.id === "js-homepage" ? "/videos/js-homepage.webp" :
            project.id === "studystream" ? "/videos/study-stream.webp" :
            project.id === "dsa-in-3d" ? "/videos/dsa-in-3d.webp" :
            null;

          return (
            <div
              key={project.id}
              className={`${styles.carousel} ${project.id === "js-homepage" ? styles.jsHomepage : ""}`}
              onClick={() => setSelectedProject(project)}
              style={{
                cursor: isDragging ? "grabbing" : "pointer",
                '--static-image': staticImage ? `url(${staticImage})` : 'transparent',
                '--webp-image': webpImage && webpReady ? `url(${webpImage})` : 'none',
              } as React.CSSProperties}
              onMouseEnter={(e) => handleProjectMouseEnter(project.id, e)}
              onMouseMove={handleProjectMouseMove}
              onMouseLeave={handleProjectMouseLeave}
            >
            <div className={styles.content}>
              <div className={styles.links}>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <FaGithub
                      style={{
                        color: index < 2 ? "black" : "white",
                      }}
                    />
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <FaPlay
                      style={{
                        color: index < 2 ? "black" : "white",
                      }}
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      <div className={styles.buttons}>
        <button
          className={`${styles.button} ${theme === "dark" ? styles.darkButton : ""}`}
          onClick={() => handleTranslateX(translateX + 250)}
        >
          <FaArrowLeft style={{ transform: "translateY(1px)" }} />
        </button>
        <button
          className={`${styles.button} ${theme === "dark" ? styles.darkButton : ""}`}
          onClick={() => handleTranslateX(translateX - 250)}
        >
          <FaArrowRight style={{ transform: "translateY(1px)" }} />
        </button>
      </div>
      <ProjectPopup 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </>
  );
}
