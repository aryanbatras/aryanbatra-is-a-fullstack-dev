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

export const profile: Profile = {
  name: 'Aryan Batra',
  title: 'Backend & Systems Engineer',
  tagline: '🚀 Backend & Systems Engineer | Scalable Architectures | Automation-Driven Systems',
  about: `I am a Backend & Systems Engineer passionate about building scalable architectures, automation-driven systems, and developer-focused learning ecosystems. I enjoy thinking in systems — designing software that is resilient, efficient, and built to scale.

I believe strong systems thinking, clear abstractions, and continuous learning are the foundations of great engineering. I am always exploring deeper layers — from distributed systems to automation to education at scale.`,
  email: 'aryanbatra@example.com',
  location: 'India',
  website: 'https://aryanbatra.dev',
  linkedin: 'https://linkedin.com/in/aryanbatra',
  github: 'https://github.com/aryanbatras',
  skills: [
    {
      category: 'Programming Languages',
      items: ['Java', 'JavaScript', 'TypeScript', 'Python', 'C++', 'C', 'Bash']
    },
    {
      category: 'Frontend Technologies',
      items: ['React.js', 'Next.js', 'Three.js', 'React Three Fiber', 'SASS', 'Tailwind CSS', 'CSS']
    },
    {
      category: 'Backend Technologies',
      items: ['Node.js', 'Spring Boot', 'REST APIs', 'Microservices', 'Systems Design']
    },
    {
      category: 'DevOps & Cloud',
      items: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform', 'Ansible', 'Jenkins', 'Sonarqube']
    },
    {
      category: 'Databases & Storage',
      items: ['PostgreSQL', 'MongoDB', 'Redis', 'Firebase']
    },
    {
      category: 'Tools & Others',
      items: ['Git', 'GitHub Actions', 'Monaco Editor', 'Cloudflare Workers', 'Ray Tracing', 'Data Structures', 'Algorithms']
    }
  ],
  experience: [
    {
      id: '100xengineer',
      company: '100xengineer',
      position: 'Founder',
      type: 'founder',
      location: 'Remote',
      startDate: 'Jan 2026',
      current: true,
      description: 'Offering SDE I Bootcamps 100% Free - Building a completely free 4–6 month Software Development Engineering bootcamp designed to democratize high-quality technical education and make deep system-level learning accessible to everyone.',
      technologies: ['Edtech', 'Start-up Ventures', 'Early Stage Ventures']
    },
    {
      id: 'eyantra',
      company: 'e-Yantra, IIT Bombay',
      position: 'Robotics Engineer',
      type: 'freelance',
      location: 'Remote',
      startDate: 'Dec 2025',
      endDate: 'Dec 2025',
      description: 'Self balancing bot on coppelia simulator & python',
      technologies: ['Lua', 'Robotics']
    },
    {
      id: 'codeveda',
      company: 'Codeveda',
      position: 'Technical Writer',
      type: 'freelance',
      location: 'India · Remote',
      startDate: 'Nov 2025',
      endDate: 'Nov 2025',
      description: 'Contributed as a technical writer for a Spring Boot course and created Python-based educational video content, simplifying complex backend concepts into structured, digestible learning material.',
      technologies: ['Spring Boot']
    },
    {
      id: 'polarions',
      company: 'Polarions',
      position: 'Automation Engineer',
      type: 'parttime',
      location: 'Sweden · Remote',
      startDate: 'Oct 2025',
      endDate: 'Oct 2025',
      description: 'Worked on n8n automation, mentoring developers and building a social media automation system. Strengthened leadership, ownership mindset, and cross-border collaboration skills.',
      technologies: ['n8n', 'Team Leadership']
    },
    {
      id: 'sashel',
      company: 'Sashel',
      position: 'Software Engineer',
      type: 'internship',
      location: 'India · Remote',
      startDate: 'Jul 2025',
      endDate: 'Oct 2025',
      description: 'Worked within a 30+ microservices architecture built in Java. Contributed to system design discussions around distributed systems, load balancing strategies, database architecture, and cloud deployments on AWS. Designed database schemas from scratch and developed four production-grade microservices. Architected a complex backend automation solution for a customized Shopify ecosystem using AI automation tools like n8n and Activepieces.',
      technologies: ['Java', 'REST APIs', 'Software Design', 'Systems Design', 'Software Design Patterns', 'Python', 'Software Infrastructure']
    }
  ],
  education: [
    {
      id: 'mbs-college',
      institution: 'MBS College of Engg. & Technology',
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
  ]
};
