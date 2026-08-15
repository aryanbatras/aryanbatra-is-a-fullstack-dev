export interface Profile {
  name: string;
  title: string;
  tagline: string;
  about: string;
  email: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  skills: {
    category: string;
    items: string[];
  }[];
  experience: Experience[];
  education: Education[];
  languages: Language[];
  certifications: Certification[];
  honors?: Honor[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  type: 'fulltime' | 'parttime' | 'internship' | 'freelance' | 'founder';
  location: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  technologies: string[];
  logo?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  gpa?: string;
  logo?: string;
}

export interface Language {
  language: string;
  proficiency: 'native' | 'bilingual' | 'professional' | 'limited';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  url?: string;
  skills: string[];
}

export interface Honor {
  title: string;
  issuer: string;
  date: string;
  description: string;
  url?: string;
}

export const profile: Profile = {
  name: 'Aryan Batra',
  title: 'Software Engineer',
  tagline: 'Systems-focused Software Engineer | Backend Infrastructure | Distributed Microservices',
  about: `My dev journey started out of pure curiosity — diving headfirst into graphics, systems, and low-level mechanics. I ended up building a multithreaded 3D ray tracing engine from scratch in pure Java (zero engine libraries) and turning it into a 3D data structure visualizer just to see how far I could push pure math and concurrency.

From there, I moved into production backend and cloud architectures. At Sashel, I worked on a 30+ microservice Java ecosystem on AWS, designing database schemas from scratch and building custom automation pipelines with n8n and Activepieces to optimize multi-vendor order flows.

Around the same time, I started exploring global tech and developer education — engineering automated social media distribution tools for an international team at Polarions (Sweden), authoring a 240-page Spring Boot curriculum at CodeVeda, and co-building JU Learning using React and Supabase for university students. Recently at A2B Digital Solutions, I went all-in on production-grade microservices — building 50+ Spring Boot APIs, setting up schema migrations with Flyway, automating document pipelines with Thymeleaf, and configuring full system observability using Prometheus, Grafana, and Loki.

Today, I'm the Founder & Lead Systems Engineer at 100xsystems, building an open EdTech ecosystem focused on deep systems engineering. From custom Node.js CLI tools (Ink/Pastel) to automated test evaluators (Vitest/JUnit5) and feed aggregators, I spend my time building developer tools and mastering clean architecture.`,
  email: 'batraaryan03@gmail.com',
  location: 'Jammu & Kashmir, India',
  website: 'https://100xsystems.dev',
  linkedin: 'https://linkedin.com/in/aryanbatra',
  github: 'https://github.com/aryanbatras',
  skills: [
    {
      category: 'Languages',
      items: ['Java', 'JavaScript (ES6+)', 'TypeScript', 'C/C++', 'Python', 'Lua', 'SQL', 'HTML/CSS', 'Bash']
    },
    {
      category: 'Backend & Cloud',
      items: ['Spring Boot', 'Hibernate', 'Node.js', 'Cloudflare Workers', 'REST APIs', 'Microservices', 'PostgreSQL', 'Turso Cloud DB', 'Supabase', 'Firebase', 'AWS (EC2, S3, SQS/SNS)', 'Docker', 'CI/CD', 'Jenkins', 'Jfrog', 'Shiprocket', 'Razorpay']
    },
    {
      category: 'Observability & Tooling',
      items: ['Prometheus', 'Grafana', 'Loki', 'Axiom Monitoring', 'Flyway', 'CMake', 'FFmpeg', 'Git', 'Swagger', 'Storybook', 'Chromatic']
    },
    {
      category: 'AI & Automation',
      items: ['n8n', 'Activepieces', 'OpenRouter', 'Meta API', 'Google Docs/Sheets/Drive APIs', 'Groq AI', 'Mistral AI', 'Cerebras AI', 'Zai API', 'Instamojo', 'Resend API']
    },
    {
      category: 'Frontend',
      items: ['React.js', 'Next.js', 'SolidJS', 'Three.js', 'React Three Fiber', 'Tailwind CSS', 'GSAP', 'React Flow', 'Motion', 'Mermaid.js', 'styled-components', 'SASS', 'Monaco Editor', 'shadcn', 'npm', 'BlueSky Client']
    },
    {
      category: 'Core CS',
      items: ['Data Structures', 'Algorithms', 'Systems Design', 'Ray Tracing', 'Computer Graphics', 'Concurrency']
    }
  ],
  experience: [
    {
      id: 'ju-learning',
      company: 'JU Learning',
      position: 'Founder',
      type: 'founder',
      location: 'Jammu & Kashmir, India · Remote',
      startDate: 'Jul 2026',
      current: true,
      description: 'Building a centralized student learning platform using React and Supabase, designing structured academic repositories and resource-sharing tools for university students.',
      technologies: ['React', 'Supabase']
    },
    {
      id: '100xsystems',
      company: '100xsystems',
      position: 'Founder & Lead Systems Engineer',
      type: 'founder',
      location: 'Remote',
      startDate: 'Feb 2026',
      current: true,
      description: 'Architected an open EdTech ecosystem and SDE bootcamp focused on deep systems engineering. Worked on GitHub Organisation, CLI System (Ink + Pastel), Custom CMS (React Quill), Feed Generators, Massive Course Handling, and Custom Testing Libraries (Vitest, JUnit5) and more.',
      technologies: ['Edtech', 'Ink', 'Pastel', 'React Quill', 'Vitest', 'JUnit5', 'Start-up Ventures']
    },
    {
      id: 'a2b-digital',
      company: 'A2B Digital Solutions',
      position: 'Software Engineer Intern',
      type: 'internship',
      location: 'Andhra Pradesh, India · Remote',
      startDate: 'May 2026',
      endDate: 'Jul 2026',
      description: 'Built 50+ production-grade Spring Boot APIs with Hibernate, PostgreSQL, and AWS SNS/SQS, managing schema migrations via Flyway. Configured full system observability and log aggregation using Prometheus, Grafana, and Loki. Automated document pipelines using OpenHtmlToPdf, JTE, and Thymeleaf, cutting document overhead by 40%. Established strict CI/CD and unit testing standards using Jenkins, Docker, JUnit5, JaCoCo, OpenAPI Swagger, Storybook, and Chromatic.',
      technologies: ['Spring Boot', 'Hibernate', 'PostgreSQL', 'Flyway', 'AWS SNS/SQS', 'Prometheus', 'Grafana', 'Loki', 'Jenkins', 'Docker', 'JUnit5', 'JaCoCo', 'Swagger', 'Storybook', 'Chromatic', 'Jfrog', 'Next.js']
    },
    {
      id: 'eyantra',
      company: 'e-Yantra, IIT Bombay',
      position: 'Robotics Engineer',
      type: 'freelance',
      location: 'Remote',
      startDate: 'Dec 2025',
      endDate: 'Dec 2025',
      description: 'Worked on Python, Coppelia Simulator, Ubuntu, and Bash scripts — building a self-balancing bot.',
      technologies: ['Python', 'Coppelia Simulator', 'Ubuntu', 'Bash', 'Robotics']
    },
    {
      id: 'codeveda',
      company: 'Codeveda',
      position: 'Technical Writer',
      type: 'freelance',
      location: 'India · Remote',
      startDate: 'Nov 2025',
      endDate: 'Nov 2025',
      description: 'Authored comprehensive curriculum and documentation for a 240-page Spring Boot course covering REST APIs, AOP, Transactions, Caching, Redis, Spring Security (JWT), and AWS integrations.',
      technologies: ['Spring Boot', 'REST APIs', 'Spring Security', 'Redis', 'AWS']
    },
    {
      id: 'polarions',
      company: 'Polarions',
      position: 'Automation Engineer',
      type: 'parttime',
      location: 'Sweden · Remote',
      startDate: 'Oct 2025',
      endDate: 'Oct 2025',
      description: 'Engineered an automated social media distribution system orchestrating n8n, OpenRouter, Meta API, Facebook Graph, Google Docs/Sheets/Drive APIs, Mistral AI, and Groq AI. Mentored junior developers and led cross-border technical workflows.',
      technologies: ['n8n', 'OpenRouter', 'Meta API', 'Google APIs', 'Mistral AI', 'Groq AI', 'Team Leadership']
    },
    {
      id: 'sashel',
      company: 'Sashel',
      position: 'Software Engineer',
      type: 'internship',
      location: 'India · Remote',
      startDate: 'Jul 2025',
      endDate: 'Oct 2025',
      description: 'Contributed to a 30+ microservices architecture built in Java deployed on AWS. Worked on Shopify, Shiprocket, Razorpay, Activepieces, Spring Boot, React.js and microservices. Designed relational database schemas from scratch and deployed 4 production microservices.',
      technologies: ['Java', 'Microservices', 'AWS', 'Shopify', 'Shiprocket', 'Razorpay', 'Activepieces', 'Spring Boot', 'React.js', 'Systems Design']
    }
  ],
  education: [
    {
      id: 'mbs-college',
      institution: 'MBS College of Eng. & Tech',
      degree: 'Bachelor of Technology - BTech',
      field: 'Computer Science',
      startDate: '2023',
      endDate: '2027',
      current: true
    }
  ],
  languages: [
    {
      language: 'English',
      proficiency: 'professional'
    },
    {
      language: 'Hindi',
      proficiency: 'native'
    }
  ],
  certifications: [
    {
      id: 'devops-beginners',
      name: 'DevOps for beginners: Docker, K8s, Cloud, CI/CD & 4 Projects',
      issuer: 'Udemy',
      issueDate: 'Sep 2025',
      credentialId: 'UC-9d8f6f12-a657-477b-8569-e2ebd7e8d8bf',
      skills: ['Continuous Integration and Continuous Delivery (CI/CD)', 'Amazon Web Services (AWS)', 'Microsoft Azure', 'Github Actions', 'Jenkins', 'DevOps', 'Terraform', 'Ansible', 'Docker', 'Sonarqube', 'Kubernetes']
    }
  ],
  honors: [
    {
      title: 'Author — The Book of Rose',
      issuer: 'Self-published',
      date: 'Jun 2024',
      description: 'A philosophical book exploring the meaning of life and love — written for those who wished they had this book when they started their journey. Later pages hold the raw, unfiltered diary of the author. The book now lives as a website.',
      url: 'https://bookofrose.vercel.app/'
    }
  ]
};
