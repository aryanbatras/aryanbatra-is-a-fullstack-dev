import { RESUME } from "@/constants/desktop";
import styles from "@/styles/components/desktop/apps.module.css";

export default function ResumeApp() {
  return (
    <div className={styles.resumeScroll}>
      <div className={styles.resume}>
        <header className={styles.resumeHeader}>
          <h2>{RESUME.name}</h2>
          <p className={styles.resumeTitle}>{RESUME.title}</p>
          <p className={styles.resumeContact}>{RESUME.contact}</p>
        </header>

        <section className={styles.resumeSection}>
          <h4>SUMMARY</h4>
          <p>{RESUME.summary}</p>
        </section>

        <section className={styles.resumeSection}>
          <h4>EXPERIENCE</h4>
          {RESUME.experience.map((job) => (
            <div key={job.role} className={styles.job}>
              <div className={styles.jobHead}>
                <strong>{job.role}</strong>
                <span className={styles.jobPeriod}>{job.period}</span>
              </div>
              <p className={styles.jobCompany}>{job.company}</p>
              <ul className={styles.jobPoints}>
                {job.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className={styles.resumeSection}>
          <h4>SKILLS</h4>
          {RESUME.skillGroups.map((g) => (
            <div key={g.category} className={styles.skillGroup}>
              <p className={styles.skillGroupLabel}>{g.category}</p>
              <div className={styles.chips}>
                {g.items.map((s) => (
                  <span key={s} className={styles.chip}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className={styles.resumeSection}>
          <h4>EDUCATION</h4>
          {RESUME.education.map((edu) => (
            <div key={edu.institution} className={styles.job}>
              <div className={styles.jobHead}>
                <strong>{edu.degree}</strong>
                <span className={styles.jobPeriod}>{edu.period}</span>
              </div>
              <p className={styles.jobCompany}>{edu.institution} · {edu.field}</p>
            </div>
          ))}
        </section>

        <section className={styles.resumeSection}>
          <h4>CERTIFICATIONS</h4>
          {RESUME.certifications.map((cert) => (
            <div key={cert.name} className={styles.job}>
              <div className={styles.jobHead}>
                <strong>{cert.name}</strong>
                <span className={styles.jobPeriod}>{cert.period}</span>
              </div>
              <p className={styles.jobCompany}>{cert.issuer}</p>
            </div>
          ))}
        </section>

        <section className={styles.resumeSection}>
          <h4>HONORS &amp; AWARDS</h4>
          {RESUME.honors.map((h) => (
            <div key={h.title} className={styles.job}>
              <div className={styles.jobHead}>
                <strong>{h.title}</strong>
                <span className={styles.jobPeriod}>{h.period}</span>
              </div>
              <p className={styles.jobCompany}>{h.issuer}</p>
              <p className={styles.resumeHonorDesc}>{h.description}</p>
              {h.url && (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.projectLink}
                >
                  Read the Book →
                </a>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
