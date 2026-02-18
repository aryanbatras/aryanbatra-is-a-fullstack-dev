import { Project } from "../../data/projects";
import { useTheme } from "../../context/ThemeContext";
import styles from "../../styles/components/projects/ProjectPopup.module.css";
import { FaGithub, FaExternalLinkAlt, FaTimes } from "react-icons/fa";

interface ProjectPopupProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectPopup({ project, onClose }: ProjectPopupProps) {
  const { theme } = useTheme();

  if (!project) return null;

  return (
    <div 
      className={`${styles.overlay} ${theme === "dark" ? styles.dark : ""}`}
      onClick={onClose}
    >
      <div 
        className={`${styles.popup} ${theme === "dark" ? styles.dark : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close popup"
        >
          <FaTimes />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>{project.title}</h2>
          <div className={styles.meta}>
            <span className={styles.category}>{project.category}</span>
            <span className={styles.date}>{project.dateRange}</span>
          </div>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{project.shortDescription}</p>
          
          <div className={styles.details}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            <div className={styles.descriptionText}>
              {project.description.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>

          <div className={styles.technologies}>
            <h3 className={styles.sectionTitle}>Technologies</h3>
            <div className={styles.techList}>
              {project.technologies.map((tech, index) => (
                <span key={index} className={styles.techItem}>{tech}</span>
              ))}
            </div>
          </div>

          {project.associatedWith && (
            <div className={styles.association}>
              <h3 className={styles.sectionTitle}>Associated With</h3>
              <p className={styles.associationText}>{project.associatedWith}</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {project.githubUrl && (
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.actionButton}
            >
              <FaGithub />
              <span>View Code</span>
            </a>
          )}
          {project.liveUrl && (
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.actionButton}
            >
              <FaExternalLinkAlt />
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
