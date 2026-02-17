import styles from './Experience.module.css';

const experiences = [
  {
    title: "Founder",
    company: "100xengineer",
    period: "Jan 2026 - Present",
    description: "Offering SDE I Bootcamps 100% Free",
  },
  {
    title: "Robotics Engineer",
    company: "e-Yantra, IIT Bombay",
    period: "Dec 2025 - Dec 2025",
    description: "Self balancing bot on coppelia simulator & python",
  },
  {
    title: "Technical Writer",
    company: "Codeveda",
    period: "Nov 2025 - Nov 2025",
    description: "Spring Boot course",
  },
  {
    title: "Automation Engineer",
    company: "Polarions",
    period: "Oct 2025 - Oct 2025",
    description: "Worked on n8n automation",
  },
  {
    title: "Software Engineer",
    company: "Sashel",
    period: "Jul 2025 - Oct 2025",
    description: "microservice backend and automation workflows",
  },
];

export default function Experience() {
  return (
    <div className={styles.experienceSection}>
      <h2 className={styles.title}>Experience</h2>
      <div className={styles.timeline}>
        {experiences.map((exp, index) => (
          <div key={index} className={styles.timelineItem}>
            <h3 className={styles.itemTitle}>{exp.title}</h3>
            <h4 className={styles.itemCompany}>{exp.company}</h4>
            <p className={styles.itemPeriod}>{exp.period}</p>
            <p className={styles.itemDescription}>{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
