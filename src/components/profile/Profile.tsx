import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { profile } from '../../data/profile';
import styles from '../../styles/components/profile/Profile.module.css';
import { MdEmail, MdLocationOn, MdLanguage, MdSchool, MdWork, MdCode, MdLink, MdLaunch, MdDateRange } from 'react-icons/md';
import { FaGithub, FaLinkedin, FaGlobe, FaCertificate } from 'react-icons/fa';

export default function Profile() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'about' | 'experience' | 'education' | 'skills' | 'certifications'>('about');

  const formatDate = (startDate: string, endDate?: string, current?: boolean) => {
    if (current) return `${startDate} - Present`;
    if (endDate) return `${startDate} - ${endDate}`;
    return startDate;
  };

  return (
    <div className={`${styles.profile} ${styles[theme]}`}>
      <div className={styles.header}>
        <div className={styles.basicInfo}>
          <h1 className={styles.name}>{profile.name}</h1>
          <h2 className={styles.title}>{profile.title}</h2>
          <p className={styles.tagline}>{profile.tagline}</p>
        </div>
        
        <div className={styles.contactInfo}>
          <div className={styles.contactItem}>
            <MdEmail className={styles.icon} />
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </div>
          <div className={styles.contactItem}>
            <MdLocationOn className={styles.icon} />
            <span>{profile.location}</span>
          </div>
          {profile.website && (
            <div className={styles.contactItem}>
              <FaGlobe className={styles.icon} />
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                {profile.website.replace('https://', '')}
              </a>
            </div>
          )}
          {profile.linkedin && (
            <div className={styles.contactItem}>
              <FaLinkedin className={styles.icon} />
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          )}
          {profile.github && (
            <div className={styles.contactItem}>
              <FaGithub className={styles.icon} />
              <a href={profile.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {(['about', 'experience', 'education', 'skills', 'certifications'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'about' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>About Me</h3>
            <p className={styles.aboutText}>{profile.about}</p>
            
            <div className={styles.languages}>
              <h4 className={styles.subsectionTitle}>
                <MdLanguage className={styles.sectionIcon} />
                Languages
              </h4>
              <div className={styles.languageList}>
                {profile.languages.map((lang, index) => (
                  <div key={index} className={styles.languageItem}>
                    <span className={styles.languageName}>{lang.language}</span>
                    <span className={styles.proficiency}>
                      {lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdWork className={styles.sectionIcon} />
              Experience
            </h3>
            <div className={styles.timeline}>
              {profile.experience.map((exp) => (
                <div key={exp.id} className={styles.timelineItem}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.timelineInfo}>
                      <h4 className={styles.position}>{exp.position}</h4>
                      <p className={styles.company}>{exp.company}</p>
                      <div className={styles.timelineMeta}>
                        <span className={styles.type}>
                          {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                        </span>
                        <span className={styles.location}>
                          <MdLocationOn className={styles.smallIcon} />
                          {exp.location}
                        </span>
                        <span className={styles.duration}>
                          <MdDateRange className={styles.smallIcon} />
                          {formatDate(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.description}>{exp.description}</p>
                  <div className={styles.technologies}>
                    {exp.technologies.map((tech, index) => (
                      <span key={index} className={styles.tech}>{tech}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdSchool className={styles.sectionIcon} />
              Education
            </h3>
            <div className={styles.timeline}>
              {profile.education.map((edu) => (
                <div key={edu.id} className={styles.timelineItem}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.timelineInfo}>
                      <h4 className={styles.degree}>{edu.degree}</h4>
                      <p className={styles.institution}>{edu.institution}</p>
                      <p className={styles.field}>{edu.field}</p>
                      <div className={styles.timelineMeta}>
                        <span className={styles.duration}>
                          <MdDateRange className={styles.smallIcon} />
                          {formatDate(edu.startDate, edu.endDate, edu.current)}
                        </span>
                        {edu.gpa && (
                          <span className={styles.gpa}>GPA: {edu.gpa}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdCode className={styles.sectionIcon} />
              Skills
            </h3>
            <div className={styles.skillsGrid}>
              {profile.skills.map((category, index) => (
                <div key={index} className={styles.skillCategory}>
                  <h4 className={styles.categoryTitle}>{category.category}</h4>
                  <div className={styles.skillItems}>
                    {category.items.map((skill, skillIndex) => (
                      <span key={skillIndex} className={styles.skill}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FaCertificate className={styles.sectionIcon} />
              Certifications
            </h3>
            <div className={styles.certificationsList}>
              {profile.certifications.map((cert) => (
                <div key={cert.id} className={styles.certificationCard}>
                  <div className={styles.certHeader}>
                    <h4 className={styles.certName}>{cert.name}</h4>
                    {cert.url && (
                      <a 
                        href={cert.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.certLink}
                      >
                        <MdLaunch />
                      </a>
                    )}
                  </div>
                  <p className={styles.certIssuer}>{cert.issuer}</p>
                  <p className={styles.certDate}>
                    <MdDateRange className={styles.smallIcon} />
                    {cert.issueDate}
                  </p>
                  {cert.credentialId && (
                    <p className={styles.certId}>ID: {cert.credentialId}</p>
                  )}
                  <div className={styles.certSkills}>
                    {cert.skills.map((skill, index) => (
                      <span key={index} className={styles.certSkill}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
