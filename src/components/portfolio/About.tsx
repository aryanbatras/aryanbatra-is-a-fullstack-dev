import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.aboutSection}>
      <div className={styles.aboutCard}>
        <h2 className={styles.title}>About</h2>
        <p className={styles.highlight}>
          🚀 Backend & Systems Engineer | Scalable Architectures | Automation-Driven Systems
        </p>
        <p className={styles.text}>
          I am a Backend & Systems Engineer passionate about building scalable architectures, automation-driven systems, and developer-focused learning ecosystems. I enjoy thinking in systems — designing software that is resilient, efficient, and built to scale.
        </p>
        <p className={styles.text}>
          I believe strong systems thinking, clear abstractions, and continuous learning are the foundations of great engineering. I am always exploring deeper layers — from distributed systems to automation to education at scale.
        </p>
      </div>
    </div>
  );
}
