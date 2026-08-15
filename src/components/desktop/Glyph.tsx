"use client";

import {
  Apple,
  Archive,
  Bell,
  BookOpen,
  Bot,
  Box,
  Brain,
  Calendar,
  Clock,
  CloudSun,
  Coffee,
  Compass,
  FileText,
  Film,
  Flower2,
  Folder,
  Gamepad2,
  Globe,
  HardDrive,
  Image,
  Info,
  Lock,
  Map,
  MessageSquare,
  Monitor,
  Moon,
  Piano,
  Rocket,
  Settings,
  StickyNote,
  Terminal,
  Trash2,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

/**
 * Semantic icon keys used across the desktop data (constants, notifications,
 * files, web shortcuts). Real icons everywhere — no emoji placeholders.
 */
export type GlyphKey =
  | "apple"
  | "bell"
  | "book-open"
  | "bot"
  | "box"
  | "brain"
  | "calendar"
  | "clock"
  | "cloud-sun"
  | "coffee"
  | "compass"
  | "file-text"
  | "film"
  | "folder"
  | "gamepad"
  | "github"
  | "globe"
  | "hard-drive"
  | "image"
  | "info"
  | "linkedin"
  | "lock"
  | "map"
  | "message-square"
  | "monitor"
  | "moon"
  | "piano"
  | "rocket"
  | "settings"
  | "sticky-note"
  | "terminal"
  | "trash"
  | "truck"
  | "user"
  | string;

/** Keys that render a real image instead of a lucide icon — WASM game icons
 *  extracted from the daedalOS machine. */
const IMAGES: Record<string, string> = {
  pinball: "/aryan/icons/pinball.png",
  quake: "/aryan/icons/quake3.png",
  chess: "/aryan/icons/chess.png",
  webamp: "/aryan/icons/webamp.png",
  emulator: "/aryan/icons/emulator.png",
  ruffle: "/aryan/icons/ruffle.png",
  jsdos: "/aryan/icons/jsdos.png",
};

const LUCIDE: Record<string, LucideIcon> = {
  apple: Apple,
  archive: Archive,
  bell: Bell,
  "book-open": BookOpen,
  bot: Bot,
  box: Box,
  brain: Brain,
  calendar: Calendar,
  clock: Clock,
  "cloud-sun": CloudSun,
  coffee: Coffee,
  compass: Compass,
  "file-text": FileText,
  film: Film,
  flower: Flower2,
  folder: Folder,
  gamepad: Gamepad2,
  globe: Globe,
  "hard-drive": HardDrive,
  image: Image,
  info: Info,
  lock: Lock,
  map: Map,
  "message-square": MessageSquare,
  monitor: Monitor,
  moon: Moon,
  piano: Piano,
  rocket: Rocket,
  settings: Settings,
  "sticky-note": StickyNote,
  terminal: Terminal,
  trash: Trash2,
  truck: Truck,
  user: User,
};

interface GlyphProps {
  id: GlyphKey;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Renders the real icon for a semantic key. Web links fall back to a browser
 * (globe) icon when no specific glyph is mapped; unknown keys get the globe.
 */
export default function Glyph({ id, size = 18, className, strokeWidth = 1.8 }: GlyphProps) {
  if (id === "github") return <FaGithub size={size} className={className} aria-hidden />;
  if (id === "linkedin") return <FaLinkedin size={size} className={className} aria-hidden />;
  if (IMAGES[id]) {
    return (
      <img
        src={IMAGES[id]}
        width={size}
        height={size}
        alt=""
        aria-hidden
        className={className}
        style={{ objectFit: "contain", borderRadius: size * 0.22 }}
      />
    );
  }
  const Icon = LUCIDE[id] ?? Globe;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
