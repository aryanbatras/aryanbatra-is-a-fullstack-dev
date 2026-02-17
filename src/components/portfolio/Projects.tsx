import styles from './Projects.module.css';

const projects = [
  {
    title: "React Js Leetcode Platform",
    description: "A comprehensive interactive coding platform with 60+ challenges, AI assistant, and GitHub integration.",
    techStack: "React, Firebase, Cloudflare, Monaco Editor, Three.js",
    link: "https://github.com/aryanbatra/react-leetcode-platform",
  },
  {
    title: "Signal UI",
    description: "Intent-driven UI component library built on React and Tailwind v4 with four-signal architecture.",
    techStack: "React, Tailwind CSS, Vite",
    link: "https://github.com/aryanbatra/signal-ui",
  },
];

export default function Projects() {
  return (
    <div className={styles.projectsSection}>
      <h2 className={styles.title}>Projects</h2>
      <div className={styles.projectsGrid}>
        {projects.map((project, index) => (
          <div key={index} className={styles.projectCard}>
            <h3 className={styles.projectTitle}>{project.title}</h3>
            <p className={styles.projectDescription}>{project.description}</p>
            <p className={styles.projectTech}>Tech: {project.techStack}</p>
            <a href={project.link} className={styles.projectLink}>View Project</a>
          </div>
        ))}
      </div>
    </div>
  );
}
