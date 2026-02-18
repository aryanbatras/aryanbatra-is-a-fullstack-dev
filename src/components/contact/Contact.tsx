import { useState } from "react";
import styles from "@/styles/components/contact/Contact.module.css";
import { useTheme } from "@/context/ThemeContext";

export default function Contact() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const mailtoLink = `mailto:batraaryan03@gmail.com?subject=Contact from ${formData.name}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    
    window.location.href = mailtoLink;
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }, 1000);
  };

  return (
    <div className={`${styles.contact} ${theme === "dark" ? styles.dark : ""}`} data-section="contact">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Let's Talk</h1>
          <p className={styles.subtitle}>Something wonderful awaits. Let's create it together.</p>
        </div>

        <div className={styles.content}>
          <div className={styles.contactInfo}>
            <div className={styles.infoSection}>
              <h2 className={styles.sectionTitle}>Get In Touch</h2>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <a href="mailto:batraaryan03@gmail.com" className={styles.link}>
                  batraaryan03@gmail.com
                </a>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Available for:</span>
                <span className={styles.text}>Freelance projects, collaborations, and interesting conversations</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Response time:</span>
                <span className={styles.text}>Usually within 24-48 hours</span>
              </div>
            </div>
          </div>

          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`${styles.input} ${theme === "dark" ? styles.dark : ""}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`${styles.input} ${theme === "dark" ? styles.dark : ""}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className={`${styles.textarea} ${theme === "dark" ? styles.dark : ""}`}
                placeholder="Tell me about your project, idea, or just say hello..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.submitButton} ${theme === "dark" ? styles.dark : ""}`}
            >
              {isSubmitting ? "Sending..." : submitted ? "Message Sent!" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
