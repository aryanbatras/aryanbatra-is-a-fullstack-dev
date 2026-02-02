
import { useState } from "react";
import styles from "../styles/layout/Navbar.module.css";
import ToggleTheme from "../components/utility/ToggleTheme.jsx";
import TogglePanel from "../components/utility/TogglePanel";
import { useTheme } from "../context/ThemeContext";
export default function Navbar() {
  const [active, setActive] = useState("_aryan");
  const { theme } = useTheme();
  function handleChangeState(e: string) {
    setActive(e);
  }
  return (
    <nav className={`${styles.navbar} ${theme === "dark" && styles.dark}`}>
      <div className={styles.header}>
        Aryan Batra
        <div className={styles.theme}>
          <ToggleTheme />
        </div>
        <div className={styles.theme}>
          <TogglePanel />
        </div>
      </div>
      <ul className={styles.list}>
        <li
          onClick={() => handleChangeState("_aryan")}
          className={`${styles.item} ${active === "_aryan" ? styles.item__active : ""}`}
        >
          _aryan
        </li>
        <li
          onClick={() => handleChangeState("_projects")}
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
    </nav>
  );
}
