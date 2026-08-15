import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { projects } from "../../data/projects";
import styles from "../../styles/components/projects/AllProjects.module.css";

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
  library: "Library",
  other: "Other",
};

/**
 * The full project list — every project, newest first, with its links.
 * Complements the image carousel (which shows the visually rich ones):
 * each card carries the title, tagline, tech chips, and GitHub/Live links.
 * Search + category filters narrow the grid live.
 */
export default function AllProjects() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(projects.map((p) => p.category)))];
  // Count per category over the FULL list, so pills read e.g. "Web 15".
  const counts: Record<string, number> = {
    all: projects.length,
  };
  for (const p of projects) counts[p.category] = (counts[p.category] ?? 0) + 1;
  const q = query.trim().toLowerCase();
  const visible = projects.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (featuredOnly && !p.featured) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.technologies.some((t) => t.toLowerCase().includes(q))
    );
  });
  // Featured pinned to the top; the rest ordered by sortDate, either
  // newest-first (default) or oldest-first via the toggle.
  const sorted = [...visible].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const cmp = (b.sortDate ?? "").localeCompare(a.sortDate ?? "");
    return sortOrder === "oldest" ? -cmp : cmp;
  });
  // Pinned section (featured) vs the rest — rendered with group headers.
  const featured = sorted.filter((p) => p.featured);
  const rest = sorted.filter((p) => !p.featured);

  const initials = (title: string) =>
    title
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "•";

  return (
    <section className={styles.section}>
      <div className={`${styles.heading} ${dark ? styles.dark : ""}`}>
        <h2 className={styles.title}>All Projects</h2>
        <span className={styles.count}>{projects.length}</span>
      </div>

      <div className={`${styles.filters} ${dark ? styles.dark : ""}`}>
        <div className={styles.search}>
          <input
            type="search"
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.pillRow}>
          <div className={styles.pills}>
            {/* Starred toggle — composes with the category pills below. */}
            <button
              type="button"
              className={`${styles.pill} ${styles.starPill} ${
                featuredOnly ? `${styles.pillActive} ${styles.starPillActive}` : ""
              }`}
              onClick={() => setFeaturedOnly((v) => !v)}
              aria-pressed={featuredOnly}
              title={featuredOnly ? "Show all projects" : "Show only starred projects"}
            >
              <span className={styles.starGlyph} aria-hidden>★</span>
              <span>Featured</span>
              <span className={styles.pillCount}>
                {projects.filter((p) => p.featured).length}
              </span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.pill} ${
                  category === c ? styles.pillActive : ""
                }`}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                <span>{c === "all" ? "All" : (CATEGORY_LABELS[c] ?? c)}</span>
                <span className={styles.pillCount}>{counts[c] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Newest / oldest sort toggle */}
          <div className={`${styles.sortToggle} ${dark ? styles.dark : ""}`} role="group" aria-label="Sort order">
            <button
              type="button"
              className={`${styles.sortBtn} ${
                sortOrder === "newest" ? styles.sortBtnActive : ""
              }`}
              onClick={() => setSortOrder("newest")}
              aria-pressed={sortOrder === "newest"}
            >
              Newest
            </button>
            <button
              type="button"
              className={`${styles.sortBtn} ${
                sortOrder === "oldest" ? styles.sortBtnActive : ""
              }`}
              onClick={() => setSortOrder("oldest")}
              aria-pressed={sortOrder === "oldest"}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${styles.empty} ${dark ? styles.dark : ""}`}>
          <p>No projects match {query ? `“${query.trim()}”` : "this category"}.</p>
          <button
            type="button"
            className={styles.emptyReset}
            onClick={() => {
              setQuery("");
              setCategory("all");
              setFeaturedOnly(false);
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
      <div className={styles.grid}>
        {featured.length > 0 && (
          <div className={`${styles.groupHeader} ${dark ? styles.dark : ""}`}>
            <span className={styles.groupLabel}>★ Featured</span>
            <span className={styles.groupLine} />
          </div>
        )}
        {featured.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            dark={dark}
            hoverId={hoverId}
            onHover={setHoverId}
            initials={initials}
          />
        ))}
        {rest.length > 0 && featured.length > 0 && (
          <div className={`${styles.groupHeader} ${dark ? styles.dark : ""}`}>
            <span className={styles.groupLabel}>More</span>
            <span className={styles.groupLine} />
          </div>
        )}
        {rest.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            dark={dark}
            hoverId={hoverId}
            onHover={setHoverId}
            initials={initials}
          />
        ))}
      </div>
      )}
    </section>
  );
}

/** One project card — shared by the Featured and More sections. */
function ProjectCard({
  project,
  dark,
  hoverId,
  onHover,
  initials,
}: {
  project: (typeof projects)[number];
  dark: boolean;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  initials: (title: string) => string;
}) {
  return (
    <article
      className={`${styles.card} ${dark ? styles.dark : ""}`}
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={styles.thumb}>
        {project.imageUrl ? (
          <img
            src={hoverId === project.id && project.webpUrl ? project.webpUrl : project.imageUrl}
            alt={project.title}
            loading="lazy"
            className={styles.thumbImg}
          />
        ) : (
          <span className={styles.thumbFallback} aria-hidden>
            {initials(project.title)}
          </span>
        )}
      </div>

      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>{project.title}</h3>
        <span className={styles.cardDate}>{project.dateRange}</span>
      </div>

      <p className={styles.cardTagline}>{project.shortDescription}</p>

      <div className={styles.techList}>
        {project.technologies.slice(0, 6).map((tech) => (
          <span key={tech} className={styles.techItem}>
            {tech}
          </span>
        ))}
        {project.technologies.length > 6 && (
          <span className={styles.techItem}>+{project.technologies.length - 6}</span>
        )}
      </div>

      {(project.githubUrl || project.liveUrl) && (
        <div className={styles.links}>
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              GitHub →
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Live Demo →
            </a>
          )}
        </div>
      )}
    </article>
  );
}
