import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/layout/Navbar.module.css";
import ToggleTheme from "../components/utility/ToggleTheme.jsx";
import TogglePanel from "../components/utility/TogglePanel";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const [active, setActive] = useState("_aryan");
  const [navOpen, setNavOpen] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const path = router.pathname;
    if (path === "/3d") {
      setActive("_3d");
    } else if (path === "/") {
      setActive("_aryan");
    }
  }, [router.pathname]);

  function handleChangeState(e: string) {
    setActive(e);
    setNavOpen(false);

    if (e === "_3d") {
      router.push("/3d");
    } else if (e === "_aryan") {
      router.push("/");
    } else if (e === "_projects" || e === "_contact") {
      if (router.pathname === "/3d") {
        router.push("/");
        setTimeout(() => {
          const section = document.querySelector(
            `[data-section="${e === "_projects" ? "projects" : "contact"}"]`,
          );
          section?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const section = document.querySelector(
          `[data-section="${e === "_projects" ? "projects" : "contact"}"]`,
        );
        section?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }
  return (
    <>
      <nav className={`${styles.navbar} ${theme === "dark" && styles.dark}`}>
        <div className={styles.header}>
          <button
            className={`${styles.burgerBtn} ${navOpen ? styles.closed : ""}`}
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={styles.theme}>
            <ToggleTheme />
          </div>
          <button
            onClick={() => handleChangeState("_aryan")}
            className={styles.nameButton}
            aria-label="Go to home"
          >
            Aryan Batra
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
            onClick={() => handleChangeState("_projects")}
            className={`${styles.item} ${active === "_projects" ? styles.item__active : ""}`}
          >
            _projects
          </li>
          <li
            onClick={() => handleChangeState("_contact")}
            className={`${styles.item} ${active === "_contact" ? styles.item__active : ""}`}
          >
            _contact
          </li>
          <li
            onClick={() => handleChangeState("_3d")}
            className={`${styles.item} ${active === "_3d" ? styles.item__active : ""}`}
          >
            _3d
          </li>
        </ul>
        <div
          className={styles.theme}
          onClick={(e) => {
            e.stopPropagation();
            const threejsSection = document.querySelector(
              '[data-section="threejs"]',
            );
            threejsSection?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {router.pathname === "/3d" && (
            <div className={styles.settingsIcon}>
              <TogglePanel />
            </div>
          )}
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
          <li onClick={() => handleChangeState("_projects")}>_projects</li>
          <li onClick={() => handleChangeState("_contact")}>_contact</li>
          <li onClick={() => handleChangeState("_3d")}>_3d</li>
        </ul>
      </div>
    </>
  );
}
