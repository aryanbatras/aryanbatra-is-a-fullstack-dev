"use client";

import { useEffect, useRef, useState } from "react";
import Webamp from "webamp";
import type { Track } from "webamp";
import { Download, Link2, Music2, UploadCloud } from "lucide-react";
import { readFiles } from "@/utils/finderStorage";
import { downloadText } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface WebampAppProps {
  /** A Finder file (mp3 / m3u / wsz) to open — loaded from storage by name. */
  file?: string;
  /** Extra tracks to prepopulate (e.g. an .m3u/.mp3 opened from Finder). */
  initialTracks?: Track[];
}

const AUDIO_RE = /\.(mp3|wav|ogg|oga|flac|aac|m4a|opus|wma|webm)$/i;
const PLAYLIST_RE = /\.m3u8?$/i;
const SKIN_RE = /\.wsz$/i;

const trackOf = (url: string, artist: string, title?: string): Track => ({
  metaData: {
    artist,
    title: title ?? url.split("/").pop()?.split("?")[0] ?? url,
  },
  url,
  duration: 0,
});

/** Parse the lines of an .m3u/.m3u8 file into Webamp tracks. */
const tracksFromPlaylist = (text: string, baseUrl: string): Track[] =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((u) => trackOf(new URL(u, baseUrl).href, "Playlist"));

/** Resolve the Webamp options for a Finder file (daedalOS getUrlOptions). */
const optionsFromFile = (file?: string): { tracks?: Track[]; skin?: { url: string } } => {
  if (!file) return {};
  const f = readFiles().find((x) => x.name === file);
  if (!f) return {};
  const lower = f.name.toLowerCase();
  if (PLAYLIST_RE.test(lower)) {
    const tracks = tracksFromPlaylist(f.content, window.location.href);
    return tracks.length ? { tracks } : {};
  }
  if (SKIN_RE.test(lower)) {
    // The stored content is a data: URL — Winamp skins load straight from it.
    return { skin: { url: f.content } };
  }
  if (AUDIO_RE.test(lower)) {
    return { tracks: [trackOf(f.content, "Local file", f.name.replace(AUDIO_RE, ""))] };
  }
  return {};
};

/**
 * Webamp — the classic Winamp player, ported straight from daedalOS.
 * Opens .mp3/.m3u/.wsz files from Finder (Winamp's own ADD URL / SAVE LIST
 * buttons work too), and accepts dropped audio in the window or the desktop.
 */
export default function WebampApp({ file, initialTracks }: WebampAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const webampRef = useRef<Webamp | null>(null);
  const [trackCount, setTrackCount] = useState(initialTracks?.length ?? 0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || webampRef.current) return;
    let cancelled = false;

    const options = optionsFromFile(file);
    const promptUrlTracks = async (): Promise<Track[] | null> => {
      // eslint-disable-next-line no-alert
      const url = window.prompt(
        "Enter an Internet location to open here:\nFor example: https://server.com/song.mp3 or a .m3u playlist",
      );
      if (!url) return null;
      if (PLAYLIST_RE.test(url)) {
        try {
          const res = await fetch(url);
          const text = await res.text();
          return tracksFromPlaylist(text, url);
        } catch {
          // Fall through to single-track handling
        }
      }
      return [trackOf(url, "URL")];
    };
    const savePlaylist = (tracks: Track[]): null => {
      // URLTrack vs BlobTrack — only URL tracks serialize into a playlist.
      const body = tracks
        .filter((t): t is Track & { url: string } => "url" in t)
        .map((t) => t.url)
        .join("\n");
      downloadText("playlist.m3u", body, "audio/x-mpegurl");
      return null;
    };

    const webamp = new Webamp({
      initialTracks: options.tracks ?? initialTracks,
      initialSkin: options.skin,
      // Winamp's own ADD URL / LOAD LIST / SAVE LIST buttons, wired like
      // daedalOS so the built-in UI works without the custom toolbar.
      handleAddUrlEvent: promptUrlTracks,
      handleLoadListEvent: promptUrlTracks,
      handleSaveListEvent: savePlaylist,
      enableHotkeys: false,
    });
    webampRef.current = webamp;
    setTrackCount((options.tracks?.length ?? initialTracks?.length) ?? 0);

    webamp.renderWhenReady(container).then(() => {
      if (cancelled) return;
      if (options.tracks?.length || initialTracks?.length) webamp.play();
    });

    return () => {
      cancelled = true;
      try {
        webamp.dispose();
      } catch {
        // Already torn down
      }
      webampRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const audio = list.filter((f) => AUDIO_RE.test(f.name));
    if (!audio.length) return;
    const tracks: Track[] = audio.map((f) =>
      trackOf(URL.createObjectURL(f), "Local file", f.name.replace(AUDIO_RE, "")),
    );
    const webamp = webampRef.current;
    if (!webamp) return;
    webamp.appendTracks(tracks);
    setTrackCount((n) => n + tracks.length);
    webamp.play();
  };

  const loadUrl = async () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt(
      "Enter an Internet location to play here:\nFor example: https://server.com/song.mp3 or a .m3u playlist",
    );
    if (!url) return;
    const webamp = webampRef.current;
    if (!webamp) return;
    if (PLAYLIST_RE.test(url)) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const tracks = tracksFromPlaylist(text, url);
        if (tracks.length) {
          webamp.appendTracks(tracks);
          setTrackCount((n) => n + tracks.length);
          webamp.play();
        }
        return;
      } catch {
        // Fall through to single-track handling
      }
    }
    webamp.appendTracks([trackOf(url, "URL")]);
    setTrackCount((n) => n + 1);
    webamp.play();
  };

  return (
    <div
      className={styles.webampApp}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer?.files ?? []);
      }}
    >
      <div className={styles.webampHint}>
        <button
          type="button"
          className={styles.texteditBtn}
          onClick={() => (document.getElementById("webamp-file") as HTMLInputElement | null)?.click()}
        >
          <UploadCloud size={13} /> Open Files…
        </button>
        <button type="button" className={styles.texteditBtn} onClick={loadUrl}>
          <Link2 size={13} /> Play URL…
        </button>
        <span className={styles.webampCount}>
          <Music2 size={12} /> {trackCount} track{trackCount === 1 ? "" : "s"}
        </span>
      </div>
      <input
        id="webamp-file"
        type="file"
        accept="audio/*,.m3u,.m3u8,.wsz"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        ref={containerRef}
        className={`${styles.webampHost} ${dragOver ? styles.webampHostDrag : ""}`}
      >
        <p className={styles.webampEmpty}>
          <Download size={18} />
          Drop audio files here — or click Open Files.
          <br />
          <em>The classic Winamp, running inside the machine.</em>
        </p>
      </div>
    </div>
  );
}
