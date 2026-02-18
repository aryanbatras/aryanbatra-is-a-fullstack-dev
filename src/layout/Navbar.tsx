
import { useState } from "react";
import styles from "../styles/layout/Navbar.module.css";
import ToggleTheme from "../components/utility/ToggleTheme.jsx";
import TogglePanel from "../components/utility/TogglePanel";
import { useTheme } from "../context/ThemeContext";
export default function Navbar() {
  const [active, setActive] = useState("_aryan");
  const [navOpen, setNavOpen] = useState(false);
  const { theme } = useTheme();
  function handleChangeState(e: string) {
    setActive(e);
    setNavOpen(false);
  }
  return (
    <>
      <nav className={`${styles.navbar} ${theme === "dark" && styles.dark}`}>
        <div className={styles.header}>
          Aryan Batra
          <div className={styles.theme}>
            <ToggleTheme />
          </div>
          <button 
            className={`${styles.burgerBtn} ${navOpen ? styles.closed : ""}`}
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <ul className={styles.list}>
          <li
            onClick={() => handleChangeState("_aryan")}
            className={`${styles.item} ${active === "_aryan" ? styles.item__active : ""}`}
          >
            _aryan
          </li>
          <li
            onClick={() => {
              handleChangeState("_projects");
              const projectsSection = document.querySelector('[data-section="projects"]');
              projectsSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`${styles.item} ${active === "_projects" ? styles.item__active : ""}`}
          >
            _projects
          </li>
          <li
            onClick={() => handleChangeState("_articles")}
            className={`${styles.item} ${active === "_articles" ? styles.item__active : ""}`}
          >
            _articles
          </li>
        </ul>
        <div className={styles.theme} onClick={(e) => {
            e.stopPropagation();
            const threejsSection = document.querySelector('[data-section="threejs"]');
            threejsSection?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <div className={styles.settingsIcon}>
              <TogglePanel />
            </div>
          </div>
      </nav>
      
      <div className={`${styles.navContainer} ${navOpen ? styles.opened : ""}`}>
        <button 
          className={styles.burgerBtnClose}
          onClick={() => setNavOpen(false)}
          aria-label="Close menu"
        >
          ×
        </button>
        <ul className={styles.navList}>
          <li onClick={() => handleChangeState("_aryan")}>_aryan</li>
          <li onClick={() => {
            handleChangeState("_projects");
            const projectsSection = document.querySelector('[data-section="projects"]');
            projectsSection?.scrollIntoView({ behavior: 'smooth' });
          }}>_projects</li>
          <li onClick={() => handleChangeState("_articles")}>_articles</li>
        </ul>
      </div>

    </>
  );
}
