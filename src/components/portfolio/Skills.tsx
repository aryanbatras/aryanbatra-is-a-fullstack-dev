import styles from './Skills.module.css';

const skills = [
  "Java",
  "REST APIs",
  "Spring Boot",
  "Microservices",
  "AWS",
  "Python",
  "Lua",
  "Robotics",
  "React",
  "Next.js",
  "JavaScript",
  "Firebase",
  "Cloudflare Workers",
  "GitHub OAuth",
  "n8n",
  "Activepieces",
  "Three.js",
  "Tailwind CSS",
  "Docker",
  "Kubernetes",
  "CI/CD",
];

export default function Skills() {
  return (
    <div className={styles.skillsSection}>
      <h2 className={styles.title}>Skills</h2>
      <div className={styles.skillsGrid}>
        {skills.map((skill, index) => (
          <span key={index} className={styles.skillTag}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
