import { RESUME } from "@/constants/desktop";
import styles from "@/styles/components/desktop/apps.module.css";

const LINKS = [
  { label: "Website", href: "https://100xsystems.dev" },
  { label: "GitHub", href: "https://github.com/aryanbatras" },
  { label: "LinkedIn", href: "https://linkedin.com/in/aryanbatra" },
  { label: "Email", href: "mailto:batraaryan03@gmail.com" },
];

export default function AboutApp() {
  return (
    <div className={styles.about}>
      <div className={styles.aboutHero}>
        <img
          src="/aryan/aryan_avatar.jpg"
          alt="Aryan Batra"
          className={styles.aboutAvatarImg}
          draggable={false}
        />
        <h3>{RESUME.name}</h3>
        <p className={styles.aboutTitle}>{RESUME.title}</p>
      </div>

      <p className={styles.aboutBio}>{RESUME.summary}</p>

      <div className={styles.specTable}>
        <div className={styles.specRow}>
          <span>Location</span>
          <span>Jammu &amp; Kashmir, India</span>
        </div>
        <div className={styles.specRow}>
          <span>Phone</span>
          <span>(+91) 9149469833</span>
        </div>
        <div className={styles.specRow}>
          <span>Education</span>
          <span>BTech CS · MBS College (2023–2027)</span>
        </div>
        <div className={styles.specRow}>
          <span>Email</span>
          <span>batraaryan03@gmail.com</span>
        </div>
        <div className={styles.specRow}>
          <span>OS</span>
          <span>Aryan OS 2027 · build 0.1.0</span>
        </div>
      </div>

      <div className={styles.aboutLinks}>
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className={styles.aboutLink}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
