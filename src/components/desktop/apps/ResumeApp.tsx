import { Download } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

const PDF_PATH = "/aryan/aryan_resume.pdf";

export default function ResumeApp() {
  return (
    <div className={styles.finder} style={{ flexDirection: "column" }}>
      {/* Toolbar — download only */}
      <div className={styles.finderToolbar} style={{ gap: 12 }}>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>
          Resume
        </span>
        <div style={{ flex: 1 }} />
        <a
          href={PDF_PATH}
          download="Aryan_Batra_Resume.pdf"
          style={{
            color: "#6aa1ff",
            fontSize: 12,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <Download size={12} /> Download PDF
        </a>
      </div>

      {/* Full PDF embed */}
      <iframe
        src={PDF_PATH}
        title="Aryan Batra — Resume"
        className={styles.pdfEmbed}
        style={{ flex: 1, border: "none", background: "#fff" }}
      />
    </div>
  );
}
