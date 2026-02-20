import { useTheme } from "@/context/ThemeContext";
import styles from "@/styles/pages/3d.module.css";
import LevaPanel from "@/components/utility/LevaPanel";
import ModelContainer from "@/components/threejs/ModelContainer";

export default function ThreeDPage() {
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.container} ${
        theme === "dark" ? styles.dark : ""
      }`}
    >
      <LevaPanel />
      <ModelContainer />
    </div>
  );
}
