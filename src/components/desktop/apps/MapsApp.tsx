"use client";

import { useMemo, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

interface MapPlace {
  id: string;
  name: string;
  note: string;
  lat: number;
  lon: number;
  color: string;
}

/** Real, verifiable places — real coordinates on the real map. */
const PLACES: MapPlace[] = [
  { id: "jammu", name: "Jammu", note: "Jammu & Kashmir, India — home", lat: 32.7266, lon: 74.857, color: "#ff3b30" },
  { id: "delhi", name: "New Delhi", note: "Where A2B and CodeVeda work happens", lat: 28.6139, lon: 77.209, color: "#0a84ff" },
  { id: "bangalore", name: "Bengaluru", note: "Sashel engineering", lat: 12.9716, lon: 77.5946, color: "#30d158" },
  { id: "stockholm", name: "Stockholm", note: "Polarions (Sweden)", lat: 59.3293, lon: 18.0686, color: "#bf5af2" },
  { id: "mumbai", name: "Mumbai", note: "IIT Bombay — e-Yantra robotics", lat: 19.076, lon: 72.8777, color: "#ff9f0a" },
];

const EMBED = (lat: number, lon: number, zoom: number) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.5}%2C${lat - 0.3}%2C${lon + 0.5}%2C${lat + 0.3}&layer=mapnik&marker=${lat}%2C${lon}&zoom=${zoom}`;

export default function MapsApp() {
  const [selectedId, setSelectedId] = useState<string>("jammu");
  const [query, setQuery] = useState("");

  const selected = PLACES.find((p) => p.id === selectedId) ?? PLACES[0];
  const filtered = PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.note.toLowerCase().includes(query.toLowerCase()),
  );

  // Rebuild the iframe only when the place changes.
  const src = useMemo(() => EMBED(selected.lat, selected.lon, 12), [selected]);

  return (
    <div className={styles.maps}>
      <aside className={styles.mapsSidebar}>
        <input
          className={styles.mapsSearch}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Maps"
          spellCheck={false}
        />
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className={selectedId === p.id ? styles.mapsItemActive : styles.mapsItem}
            onClick={() => setSelectedId(p.id)}
          >
            <span className={styles.mapsPinDot} style={{ background: p.color }} />
            <span className={styles.mapsItemText}>
              <strong>{p.name}</strong>
              <small>{p.note}</small>
            </span>
          </button>
        ))}
      </aside>

      <div className={styles.mapsCanvas}>
        <iframe
          key={selected.id}
          src={src}
          title={`OpenStreetMap — ${selected.name}`}
          className={styles.mapsFrame}
          loading="lazy"
          allowFullScreen
        />

        <div className={styles.mapsCard}>
          <span className={styles.mapsCardDot} style={{ background: selected.color }} />
          <div>
            <strong>{selected.name}</strong>
            <p>{selected.note}</p>
            <p style={{ fontSize: 11, marginTop: 2 }}>
              {selected.lat.toFixed(4)}°, {selected.lon.toFixed(4)}° · real OpenStreetMap
            </p>
          </div>
        </div>

        <div className={styles.mapsZoom}>
          <a
            href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=14/${selected.lat}/${selected.lon}`}
            target="_blank"
            rel="noreferrer"
            className={styles.mapsZoomBtn}
            aria-label="Open in OpenStreetMap"
          >
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}
