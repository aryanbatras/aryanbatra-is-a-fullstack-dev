import { useState } from "react";
import { projects, type Project } from "@/data/projects";
import styles from "@/styles/components/desktop/apps.module.css";

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
  library: "Library",
  other: "Other",
};

/** Mirrors the home page All Projects grid: search, category pills,
    featured-pinned + newest-first sorting, cards with real thumbnails. */
export default function ProjectsApp() {
  const [selected, setSelected] = useState<Project | null>(null);
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

  if (selected) {
    return (
      <div className={styles.projects}>
        <aside className={styles.sidebar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setSelected(null)}
          >
            ← All Projects
          </button>
        </aside>
        <div className={styles.projectDetail}>
          {selected.imageUrl && (
            <img
              src={selected.imageUrl}
              alt={selected.title}
              className={styles.projectDetailThumb}
            />
          )}
          <h3>{selected.title}</h3>
          <p className={styles.projectTagline}>{selected.shortDescription}</p>
          <p className={styles.projectMeta}>
            {selected.dateRange} · {selected.category}
          </p>
          <p className={styles.projectDescription}>{selected.description}</p>
          <div className={styles.chips}>
            {selected.technologies.map((t) => (
              <span key={t} className={styles.chip}>
                {t}
              </span>
            ))}
          </div>
          {(selected.githubUrl || selected.liveUrl) && (
            <div className={styles.projectLinks}>
              {selected.githubUrl && (
                <a
                  href={selected.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.projectLink}
                >
                  GitHub →
                </a>
              )}
              {selected.liveUrl && (
                <a
                  href={selected.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.projectLink}
                >
                  Live Demo →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectsCol}>
      <div className={styles.projFilterBar}>
        <div className={styles.projSearch}>
          <input
            type="search"
            className={styles.projSearchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className={styles.projSearchClear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.projPillRow}>
          <div className={styles.projPills}>
            {/* Starred toggle — composes with the category pills below. */}
            <button
              type="button"
              className={`${styles.projPill} ${styles.projStarPill} ${
                featuredOnly ? `${styles.projPillActive} ${styles.projStarPillActive}` : ""
              }`}
              onClick={() => setFeaturedOnly((v) => !v)}
              aria-pressed={featuredOnly}
              title={featuredOnly ? "Show all projects" : "Show only starred projects"}
            >
              <span className={styles.projStarGlyph} aria-hidden>★</span>
              <span>Featured</span>
              <span className={styles.projPillCount}>
                {projects.filter((p) => p.featured).length}
              </span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.projPill} ${
                  category === c ? styles.projPillActive : ""
                }`}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                <span>{c === "all" ? "All" : (CATEGORY_LABELS[c] ?? c)}</span>
                <span className={styles.projPillCount}>{counts[c] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Newest / oldest sort toggle */}
          <div className={styles.projSortToggle} role="group" aria-label="Sort order">
            <button
              type="button"
              className={`${styles.projSortBtn} ${
                sortOrder === "newest" ? styles.projSortBtnActive : ""
              }`}
              onClick={() => setSortOrder("newest")}
              aria-pressed={sortOrder === "newest"}
            >
              Newest
            </button>
            <button
              type="button"
              className={`${styles.projSortBtn} ${
                sortOrder === "oldest" ? styles.projSortBtnActive : ""
              }`}
              onClick={() => setSortOrder("oldest")}
              aria-pressed={sortOrder === "oldest"}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.projEmpty}>
          <p>No projects match {query ? `“${query.trim()}”` : "this category"}.</p>
          <button
            type="button"
            className={styles.projEmptyReset}
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
        <div className={styles.projGrid}>
          {featured.length > 0 && (
            <div className={styles.projGroupHeader}>
              <span className={styles.projGroupLabel}>★ Featured</span>
              <span className={styles.projGroupLine} />
            </div>
          )}
          {featured.map((p) => (
            <ProjectRow
              key={p.id}
              p={p}
              hoverId={hoverId}
              onHover={setHoverId}
              onSelect={setSelected}
              initials={initials}
            />
          ))}
          {rest.length > 0 && featured.length > 0 && (
            <div className={styles.projGroupHeader}>
              <span className={styles.projGroupLabel}>More</span>
              <span className={styles.projGroupLine} />
            </div>
          )}
          {rest.map((p) => (
            <ProjectRow
              key={p.id}
              p={p}
              hoverId={hoverId}
              onHover={setHoverId}
              onSelect={setSelected}
              initials={initials}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** One project row — shared by the Featured and More sections. */
function ProjectRow({
  p,
  hoverId,
  onHover,
  onSelect,
  initials,
}: {
  p: Project;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (p: Project) => void;
  initials: (title: string) => string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.projCard}
      onClick={() => onSelect(p)}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(p);
        }
      }}
    >
      <span className={styles.projCardThumb}>
        {p.imageUrl ? (
          <img
            src={hoverId === p.id && p.webpUrl ? p.webpUrl : p.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className={styles.projMono} aria-hidden>
            {initials(p.title)}
          </span>
        )}
      </span>
      <span className={styles.projCardBody}>
        <span className={styles.projCardHead}>
          <strong className={styles.projCardTitle}>{p.title}</strong>
          <span className={styles.projCardDate}>{p.dateRange}</span>
        </span>
        <span className={styles.projCardTagline}>{p.shortDescription}</span>
        <span className={styles.projCardChips}>
          {p.technologies.slice(0, 4).map((t) => (
            <span key={t} className={styles.chip}>
              {t}
            </span>
          ))}
          {p.technologies.length > 4 && (
            <span className={styles.chip}>
              +{p.technologies.length - 4}
            </span>
          )}
        </span>
        {(p.githubUrl || p.liveUrl) && (
          <span
            className={styles.projCardLinks}
            onClick={(e) => e.stopPropagation()}
          >
            {p.githubUrl && (
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.projLinkTag}
              >
                GitHub ↗
              </a>
            )}
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.projLinkTag}
              >
                Live ↗
              </a>
            )}
          </span>
        )}
      </span>
    </div>
  );
}
