import styles from "../../styles/components/utility/ToggleTheme.module.css";
import { MdOutlineLightMode, MdOutlineDarkMode } from "react-icons/md";
import { useTheme } from "../../context/ThemeContext";
export default function ToggleTheme() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className={styles.icon} onClick={() => toggleTheme()}>
      {theme === "light" ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
    </div>
  );
}
