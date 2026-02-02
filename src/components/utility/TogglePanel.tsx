import styles from "../../styles/components/utility/ToggleTheme.module.css";
import { IoSettingsOutline, IoSettingsSharp } from "react-icons/io5";
import { usePanelVisible } from "../../context/PanelContext";
import { useTheme } from "../../context/ThemeContext";
export default function TogglePanel() {
  const { visible, setVisible } = usePanelVisible();
  const { theme } = useTheme();
  return (
    <div className={styles.icon} onClick={() => setVisible(!visible)}>
      {theme === "light" ? <IoSettingsOutline /> : <IoSettingsSharp />}
    </div>  
  );
}
