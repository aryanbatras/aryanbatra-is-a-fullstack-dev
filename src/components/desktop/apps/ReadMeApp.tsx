import { README_TEXT } from "@/constants/desktop";
import styles from "@/styles/components/desktop/apps.module.css";

export default function ReadMeApp() {
  return (
    <div className={styles.readmeScroll}>
      <div className={styles.readme}>
        <pre>{README_TEXT}</pre>
      </div>
    </div>
  );
}
