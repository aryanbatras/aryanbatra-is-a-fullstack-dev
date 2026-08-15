/**
 * Content + configuration for the macOS-style desktop on /new.
 * Everything the desktop renders (icons, dock, documents, projects) is
 * declared here so it can be edited in one place.
 */

/** System-wide toggle/slider state shared by the menu bar, Control Center and System Settings. */
export type ClockStyle = "default" | "numeric" | "analog" | "world";

/** macOS Tahoe: Settings → Appearance → Icon & Widget Style. */
export type WidgetStyle = "default" | "dark" | "tinted";

export type DockPosition = "bottom" | "left" | "right";

export type MinimizeEffect = "genie" | "scale";

/** macOS Spaces: a desktop with its own wallpaper. */
export interface SpaceConfig {
  id: number;
  name: string;
  wallpaperIndex: number;
}

export const DEFAULT_SPACES: SpaceConfig[] = [
  { id: 1, name: "Desktop 1", wallpaperIndex: 0 },
  { id: 2, name: "Desktop 2", wallpaperIndex: 4 },
  { id: 3, name: "Desktop 3", wallpaperIndex: 6 },
];

/** Hot Corner actions (Desktop & Dock → Hot Corners…). */
export type HotCornerAction =
  | "none"
  | "mission-control"
  | "show-desktop"
  | "launchpad"
  | "lock"
  | "screensaver"
  | "next-space"
  | "prev-space";

export type CornerId = "tl" | "tr" | "bl" | "br";

export const DEFAULT_HOT_CORNERS: Record<CornerId, HotCornerAction> = {
  tl: "none",
  tr: "mission-control",
  bl: "none",
  br: "none",
};

/** macOS Notifications: alert style when unlocked, per app. */
export type NotifStyle = "none" | "banners" | "alerts";

export interface NotifPref {
  allow: boolean;
  style: NotifStyle;
}

export const DEFAULT_NOTIF_PREF: NotifPref = { allow: true, style: "banners" };

/** Desktop widgets available for the right-column stack (Settings → Wallpaper → Widgets). */
export const WIDGET_IDS = ["clock", "weather", "calendar", "stats"] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/** Ordered ids of the visible desktop widgets — editable + draggable. */
export const DEFAULT_WIDGETS: WidgetId[] = ["clock", "weather", "calendar"];

/** Control Center tile ids in their default order (Settings → Control Center).
 *  Only tiles backed by something REAL are kept: Wi-Fi reports the actual
 *  connection, focus/display/sound/stage-manager control real OS state, and
 *  mission control / app switcher perform real actions. Bluetooth, AirDrop
 *  and screen mirroring can't be controlled from a web page, so they're
 *  not offered as fake tiles. */
export const CONTROL_TILE_IDS = [
  "wifi",
  "focus",
  "display",
  "sound",
  "music",
  "stage-manager",
  "mission-control",
  "app-switcher",
] as const;

export type ControlTileId = (typeof CONTROL_TILE_IDS)[number];

export interface SystemState {
  wifiOn: boolean;
  bluetoothOn: boolean;
  airdropOn: boolean;
  darkMode: boolean;
  soundOn: boolean;
  /** 0-100 */
  volume: number;
  /** 0-100 */
  brightness: number;
  /** Lock-screen clock appearance (macOS Tahoe: Settings → Wallpaper → Clock). */
  clockStyle: ClockStyle;
  /** Tahoe accessibility: replaces Liquid Glass with near-solid fills. */
  reduceTransparency: boolean;
  /** Desktop widgets (top-right column, like real macOS). */
  showWidgets: boolean;
  /** Tahoe: Icon & Widget Style — default glass, solid dark, or wallpaper-tinted. */
  widgetStyle: WidgetStyle;
  /** Desktop & Dock: base icon size in px (macOS Dock Size slider). */
  dockSize: number;
  /** Desktop & Dock: magnify icons on hover. */
  dockMagnify: boolean;
  /** Desktop & Dock: magnified icon size in px. */
  dockMagnifySize: number;
  /** Desktop & Dock: position on screen. */
  dockPosition: DockPosition;
  /** Desktop & Dock: minimize-window effect. */
  minimizeEffect: MinimizeEffect;
  /** Desktop & Dock: automatically hide and show the Dock. */
  dockAutoHide: boolean;
  /** Stage Manager — focused app front and center, others in the side strip. */
  stageManager: boolean;
  /** Settings → Battery: show the percentage in the menu bar. */
  showBatteryPct: boolean;
  /** Settings → Desktop & Dock → Screen Saver: which saver to play. */
  screensaverStyle: "flurry" | "aerial" | "clock";
  /** Minutes of inactivity before the saver starts (0 = Never). */
  screensaverDelay: number;
  /** Settings → Notifications: per-app alert style. Absent = default banners. */
  notifPrefs: Record<string, NotifPref>;
  /** Control Center: ordered visible tile ids. Empty = the default layout. */
  controlTiles: ControlTileId[];
  /** Desktop widgets: ordered visible ids (empty = none). */
  widgets: WidgetId[];
  /** macOS Spaces: desktops with their own wallpaper. */
  spaces: SpaceConfig[];
  /** Desktop & Dock → Hot Corners: corner → action. */
  hotCorners: Record<CornerId, HotCornerAction>;
}

export interface DesktopAppConfig {
  id: string;
  title: string;
  icon: string;
  /** Path to the original macOS app icon (extracted from macOS Tahoe 26). */
  iconUrl: string;
  /** Default window size in px. */
  width: number;
  height: number;
  /** Minimum window size in px. */
  minWidth: number;
  minHeight: number;
  /** Show on the desktop grid (Finder-style icons). */
  onDesktop: boolean;
  /** Show in the dock. */
  inDock: boolean;
}

export const DESKTOP_APPS: DesktopAppConfig[] = [
  { id: "finder", title: "Finder", icon: "", iconUrl: "/aryan/icons/finder.png", width: 720, height: 500, minWidth: 520, minHeight: 380, onDesktop: true, inDock: true },
  { id: "about", title: "About Me", icon: "🧑", iconUrl: "/aryan/icons/contacts.png", width: 560, height: 420, minWidth: 420, minHeight: 320, onDesktop: true, inDock: true },
  { id: "resume", title: "Resume", icon: "📄", iconUrl: "/aryan/icons/preview.png", width: 680, height: 560, minWidth: 480, minHeight: 400, onDesktop: true, inDock: true },
  { id: "projects", title: "Projects", icon: "🗂️", iconUrl: "/aryan/icons/folder.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: true, inDock: true },
  { id: "notes", title: "Notes", icon: "📝", iconUrl: "/aryan/icons/notes.png", width: 620, height: 460, minWidth: 440, minHeight: 340, onDesktop: true, inDock: true },
  { id: "photos", title: "Photos", icon: "🖼️", iconUrl: "/aryan/icons/photos.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: true, inDock: true },
  { id: "videos", title: "Videos", icon: "🎬", iconUrl: "/aryan/icons/quicktime.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: true, inDock: true },
  { id: "maps", title: "Maps", icon: "🗺️", iconUrl: "/aryan/icons/maps.png", width: 720, height: 520, minWidth: 520, minHeight: 380, onDesktop: true, inDock: true },
  { id: "readme", title: "Read Me", icon: "📖", iconUrl: "/aryan/icons/textedit.png", width: 600, height: 460, minWidth: 440, minHeight: 340, onDesktop: true, inDock: true },
  { id: "terminal", title: "Terminal", icon: ">_", iconUrl: "/aryan/icons/terminal.png", width: 620, height: 400, minWidth: 440, minHeight: 280, onDesktop: false, inDock: true },
  { id: "games", title: "Games", icon: "🎮", iconUrl: "/aryan/icons/games.svg", width: 560, height: 500, minWidth: 420, minHeight: 360, onDesktop: true, inDock: true },
  { id: "settings", title: "System Settings", icon: "⚙️", iconUrl: "/aryan/icons/settings.png", width: 760, height: 520, minWidth: 600, minHeight: 420, onDesktop: false, inDock: true },
  // The classic portfolio website, rendered as a web page inside the machine.
  { id: "website", title: "Portfolio", icon: "🌐", iconUrl: "/aryan/icons/safari.png", width: 960, height: 640, minWidth: 640, minHeight: 460, onDesktop: true, inDock: true },
  // Hidden helper app: renders a PDF document (Finder Downloads etc.).
  { id: "pdf", title: "PDF", icon: "📄", iconUrl: "/aryan/icons/preview.png", width: 720, height: 560, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
];

/* ------------------------------------------------------------------ */
/* Wallpapers                                                          */
/* ------------------------------------------------------------------ */

export interface Wallpaper {
  id: string;
  name: string;
  /** Path to the real macOS wallpaper image. */
  src: string;
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "windows11", name: "Windows 11", src: "/aryan/wallpapers/windows11.jpg" },
  { id: "tahoe-dark", name: "Tahoe Dark", src: "/aryan/wallpapers/tahoe-dark.jpg" },
  { id: "tahoe-light", name: "Tahoe Light", src: "/aryan/wallpapers/tahoe-light.jpg" },
  { id: "tahoe-beach-dawn", name: "Tahoe Beach — Dawn", src: "/aryan/wallpapers/tahoe-beach-Dawn.jpg" },
  { id: "tahoe-beach-day", name: "Tahoe Beach — Day", src: "/aryan/wallpapers/tahoe-beach-Day.jpg" },
  { id: "tahoe-beach-dusk", name: "Tahoe Beach — Dusk", src: "/aryan/wallpapers/tahoe-beach-Dusk.jpg" },
  { id: "tahoe-beach-night", name: "Tahoe Beach — Night", src: "/aryan/wallpapers/tahoe-beach-Night.jpg" },
];

/* ------------------------------------------------------------------ */
/* Spotlight                                                           */
/* ------------------------------------------------------------------ */

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  /** appId to open, or a special action. */
  action: string;
}

export const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  ...DESKTOP_APPS.filter((a) => a.id !== "pdf").map((a) => ({
    id: `app-${a.id}`,
    title: a.title,
    subtitle: "Application",
    icon: a.icon,
    action: `app:${a.id}`,
  })),
  { id: "file-resume", title: "Resume.pdf", subtitle: "Document — 2 MB", icon: "📄", action: "app:resume" },
  { id: "file-showreel", title: "showreel.mp4", subtitle: "Movie — 24s · 46 MB", icon: "🎬", action: "app:videos" },
  { id: "file-readme", title: "README.txt", subtitle: "Plain text — 2 KB", icon: "📖", action: "app:readme" },
  { id: "sys-about", title: "About This Mac", subtitle: "System information", icon: "", action: "about" },
  { id: "sys-settings", title: "System Settings", subtitle: "System preferences", icon: "⚙️", action: "app:settings" },
  { id: "action-dark", title: "Toggle Dark Mode", subtitle: "Action — Appearance", icon: "🌙", action: "toggle-dark" },
  { id: "action-lock", title: "Lock Screen", subtitle: "Action — Security", icon: "🔒", action: "lock" },
];

export const APP_ICON: Record<string, string> = Object.fromEntries(
  DESKTOP_APPS.map((a) => [a.id, a.icon]),
);

/* ------------------------------------------------------------------ */
/* Web shortcuts — .url files that open the Browser at a site          */
/* ------------------------------------------------------------------ */

export interface WebShortcut {
  id: string;
  /** File name shown on the desktop / in Finder (like a real .url file). */
  name: string;
  /** Where the Browser navigates when the file is opened. */
  url: string;
  /** Emoji thumbnail for the file tile. */
  icon: string;
  /** Finder subtitle. */
  hint: string;
}

/** Internet-location files — double-click one and the Browser opens there. */
export const WEB_SHORTCUTS: WebShortcut[] = [
  { id: "web-portfolio", name: "Portfolio.url", url: "/legacy", icon: "🌐", hint: "The classic portfolio website" },
  { id: "web-3d", name: "3D Experience.url", url: "/3d", icon: "🧊", hint: "The interactive 3D portfolio" },
  { id: "web-piano", name: "Online Piano.url", url: "https://online-piano-two.vercel.app", icon: "🎹", hint: "Play the piano with your keyboard" },
  { id: "web-browser-ai", name: "Browser AI.url", url: "https://browser-ai-dun.vercel.app", icon: "🤖", hint: "AI that runs on your machine" },
  { id: "web-movers", name: "Weekend Movers.url", url: "https://weekend-movers.vercel.app", icon: "🚚", hint: "The GSAP re-design, live" },
  { id: "web-startx", name: "StartX.url", url: "https://startx-zeta.vercel.app", icon: "🚀", hint: "AI startup validation platform" },
  { id: "web-bookofrose", name: "Book of Rose.url", url: "https://bookofrose.vercel.app", icon: "🌹", hint: "The philosophical book, live" },
  { id: "web-github", name: "GitHub.url", url: "https://github.com/aryanbatras", icon: "🐙", hint: "All my repositories" },
];

/* ------------------------------------------------------------------ */
/* Resume                                                              */
/* ------------------------------------------------------------------ */

export const RESUME = {
  name: "Aryan Batra",
  title: "Software Engineer",
  contact:
    "Jammu & Kashmir, India · (+91) 9149469833 · batraaryan03@gmail.com · 100xsystems.dev · linkedin.com/in/aryanbatra",
  summary:
    "My dev journey started out of pure curiosity — diving headfirst into graphics, systems, and low-level mechanics. I ended up building a multithreaded 3D ray tracing engine from scratch in pure Java (zero engine libraries) and turning it into a 3D data structure visualizer just to see how far I could push pure math and concurrency.\n\nFrom there, I moved into production backend and cloud architectures. At Sashel, I worked on a 30+ microservice Java ecosystem on AWS, designing database schemas from scratch and building custom automation pipelines with n8n and Activepieces to optimize multi-vendor order flows.\n\nAround the same time, I started exploring global tech and developer education — engineering automated social media distribution tools for an international team at Polarions (Sweden), authoring a 240-page Spring Boot curriculum at CodeVeda, and co-building JU Learning using React and Supabase for university students. Recently at A2B Digital Solutions, I went all-in on production-grade microservices — building 50+ Spring Boot APIs, setting up schema migrations with Flyway, automating document pipelines with Thymeleaf, and configuring full system observability using Prometheus, Grafana, and Loki.\n\nToday, I'm the Founder & Lead Systems Engineer at 100xsystems, building an open EdTech ecosystem focused on deep systems engineering. From custom Node.js CLI tools (Ink/Pastel) to automated test evaluators (Vitest/JUnit5) and feed aggregators, I spend my time building developer tools and mastering clean architecture.",
  experience: [
    {
      role: "Founder",
      company: "JU Learning",
      period: "Jul 2026 — Present",
      points: [
        "Building a centralized student learning platform using React and Supabase.",
        "Designing structured academic repositories and resource-sharing tools for university students.",
      ],
    },
    {
      role: "Founder & Lead Systems Engineer",
      company: "100xsystems",
      period: "Feb 2026 — Present",
      points: [
        "Architected an open EdTech ecosystem and SDE bootcamp focused on deep systems engineering.",
        "Worked on GitHub Organisation, CLI System (Ink + Pastel), Custom CMS (React Quill), Feed Generators, Massive Course Handling, and Custom Testing Libraries (Vitest, JUnit5) and more.",
      ],
    },
    {
      role: "Software Engineer Intern",
      company: "A2B Digital Solutions",
      period: "May 2026 — Jul 2026",
      points: [
        "Built 50+ production-grade Spring Boot APIs with Hibernate, PostgreSQL, and AWS SNS/SQS, managing schema migrations via Flyway.",
        "Configured full system observability and log aggregation using Prometheus, Grafana, and Loki.",
        "Automated document pipelines using OpenHtmlToPdf, JTE, and Thymeleaf, cutting document overhead by 40%.",
        "Established strict CI/CD and unit testing standards using Jenkins, Docker, JUnit5, JaCoCo, OpenAPI Swagger, Storybook, and Chromatic.",
      ],
    },
    {
      role: "Robotics Engineer",
      company: "e-Yantra, IIT Bombay",
      period: "Dec 2025",
      points: [
        "Worked on Python, Coppelia Simulator, Ubuntu, and Bash scripts — building a self-balancing bot.",
      ],
    },
    {
      role: "Technical Writer",
      company: "Codeveda",
      period: "Nov 2025",
      points: [
        "Authored comprehensive curriculum and documentation for a 240-page Spring Boot course covering REST APIs, AOP, Transactions, Caching, Redis, Spring Security (JWT), and AWS integrations.",
      ],
    },
    {
      role: "Automation Engineer",
      company: "Polarions (Sweden)",
      period: "Oct 2025",
      points: [
        "Engineered an automated social media distribution system orchestrating n8n, OpenRouter, Meta API, Facebook Graph, Google Docs/Sheets/Drive APIs, Mistral AI, and Groq AI.",
        "Mentored junior developers and led cross-border technical workflows.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Sashel",
      period: "Jul 2025 — Oct 2025",
      points: [
        "Contributed to a 30+ microservices architecture built in Java deployed on AWS.",
        "Worked on Shopify, Shiprocket, Razorpay, Activepieces, Spring Boot, React.js and microservices.",
        "Designed relational database schemas from scratch and deployed 4 production microservices.",
      ],
    },
  ],
  skillGroups: [
    {
      category: "Languages",
      items: ["Java", "JavaScript (ES6+)", "TypeScript", "C/C++", "Python", "Lua", "SQL", "HTML/CSS", "Bash"],
    },
    {
      category: "Backend & Cloud",
      items: ["Spring Boot", "Hibernate", "Node.js", "Cloudflare Workers", "REST APIs", "Microservices", "PostgreSQL", "Turso Cloud DB", "Supabase", "Firebase", "AWS (EC2, S3, SQS/SNS)", "Docker", "CI/CD", "Jenkins", "Jfrog", "Shiprocket", "Razorpay"],
    },
    {
      category: "Observability & Tooling",
      items: ["Prometheus", "Grafana", "Loki", "Axiom Monitoring", "Flyway", "CMake", "FFmpeg", "Git", "Swagger", "Storybook", "Chromatic"],
    },
    {
      category: "AI & Automation",
      items: ["n8n", "Activepieces", "OpenRouter", "Meta API", "Google Docs/Sheets/Drive APIs", "Groq AI", "Mistral AI", "Cerebras AI", "Zai API", "Instamojo", "Resend API"],
    },
    {
      category: "Frontend",
      items: ["React.js", "Next.js", "SolidJS", "Three.js", "React Three Fiber", "Tailwind CSS", "GSAP", "React Flow", "Motion", "Mermaid.js", "styled-components", "SASS", "Monaco Editor", "shadcn", "npm", "BlueSky Client"],
    },
    {
      category: "Core CS",
      items: ["Data Structures", "Algorithms", "Systems Design", "Ray Tracing", "Computer Graphics", "Concurrency"],
    },
  ],
  skills: [
    "Java", "JavaScript (ES6+)", "TypeScript", "C/C++", "Python", "Lua", "SQL", "HTML/CSS", "Bash",
    "Spring Boot", "Hibernate", "Node.js", "Cloudflare Workers", "REST APIs", "Microservices",
    "PostgreSQL", "Turso Cloud DB", "Supabase", "Firebase", "AWS (EC2, S3, SQS/SNS)", "Docker", "CI/CD",
    "Jenkins", "Jfrog", "Shiprocket", "Razorpay",
    "Prometheus", "Grafana", "Loki", "Axiom Monitoring", "Flyway", "CMake", "FFmpeg", "Git", "Swagger", "Storybook", "Chromatic",
    "n8n", "Activepieces", "OpenRouter", "Meta API", "Google Docs/Sheets/Drive APIs", "Groq AI", "Mistral AI", "Cerebras AI", "Zai API", "Instamojo", "Resend API",
    "React.js", "Next.js", "SolidJS", "Three.js", "React Three Fiber", "Tailwind CSS", "GSAP", "React Flow",
    "Motion", "Mermaid.js", "styled-components", "SASS", "Monaco Editor", "shadcn", "npm", "BlueSky Client",
    "Data Structures", "Algorithms", "Systems Design", "Ray Tracing", "Computer Graphics", "Concurrency",
  ],
  education: [
    {
      institution: "MBS College of Engg. & Technology",
      degree: "Bachelor of Technology — BTech",
      field: "Computer Science",
      period: "2023 — 2027",
    },
  ],
  certifications: [
    {
      name: "DevOps for beginners: Docker, K8s, Cloud, CI/CD & 4 Projects",
      issuer: "Udemy",
      period: "Sep 2025",
    },
  ],
  honors: [
    {
      title: "Author — The Book of Rose",
      issuer: "Self-published · Jun 2024",
      period: "Jun 2024",
      description:
        "A philosophical book exploring the meaning of life and love, written for those who wished they had this book when they started their journey. Later pages hold the raw, unfiltered diary of the author. The book now lives as a website.",
      url: "https://bookofrose.vercel.app/",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface Project {
  name: string;
  tagline: string;
  tech: string[];
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  dateRange: string;
  category: string;
}

export const PROJECTS: Project[] = [
  {
    name: "Bluesky Client — Social Media",
    tagline: "Bluesky social media client with an Instagram adaptation",
    tech: ["Next.js", "BlueSky Client"],
    description:
      "Bluesky social media client with Instagram adaptation — multiple custom feeds, NSFW filter, bookmarks, downloading, dark mode, immersive mode and much more.",
    dateRange: "Jul 2026 — Present",
    category: "web",
  },
  {
    name: "Rose Social Media",
    tagline: "An RPG game built from scratch in Next.js",
    tech: ["Next.js", "Artificial Intelligence (AI)", "Game Design"],
    description:
      "An RPG game built from scratch in Next.js. During the course of building this game, I learned game mechanics, asset building using AI and Google Flow, and how to design a great storyline — all while having fun mini-games in it.",
    githubUrl: "https://github.com/aryanbatras/rose",
    dateRange: "Jul 2026",
    category: "game",
  },
  {
    name: "College Girl RPG Game",
    tagline: "An RPG game built from scratch in Next.js",
    tech: ["Next.js", "Game Design"],
    description:
      "An RPG game built from scratch in Next.js with game mechanics, AI-assisted asset building, and a designed storyline.",
    githubUrl: "https://github.com/aryanbatras/college-girl-rpg-game",
    dateRange: "Jul 2026",
    category: "game",
  },
  {
    name: "Weekend Movers Re-design",
    tagline: "A redesign of weekendmovers.com.au",
    tech: ["GSAP", "Image Generation", "AI Video Generation", "Storybook", "Web Design"],
    description:
      "A complete re-design of the Weekend Movers website (weekendmovers.com.au) — rebuilt with GSAP animations and AI-assisted image and video generation.",
    liveUrl: "https://weekend-movers.vercel.app/",
    imageUrl: "/images/weekend-movers.jpg",
    dateRange: "Jun 2026",
    category: "web",
  },
  {
    name: "The Book of Rose",
    tagline: "A live website of the philosophical book I wrote",
    tech: ["Next.js", "Technical Writing"],
    description:
      "A live website of the philosophical book I wrote named \"The Book of Rose\" — a journey through the meaning of life and love.",
    liveUrl: "https://bookofrose.vercel.app/",
    imageUrl: "/images/book-of-rose.jpg",
    dateRange: "Jun 2026",
    category: "web",
  },
  {
    name: "Browser AI",
    tagline: "AI that runs on your machine — no server required",
    tech: ["Next.js", "JavaScript", "ONNX Runtime Web", "Small Language Models (SLMs)"],
    description:
      "AI that runs on your browser using the latest ONNX Runtime Web technology for daily tools such as image background remover, object detection and much more — no server required. Flagship feature: summarize long PDF books and documents completely client-side using a 300 MB T5-Small Model downloaded and stored in the browser's IndexedDB.",
    liveUrl: "https://browser-ai-dun.vercel.app/",
    imageUrl: "/images/browser-ai.jpg",
    dateRange: "May 2026",
    category: "web",
  },
  {
    name: "Browser Tools for Everyday Files",
    tagline: "Free browser tools for everyday files",
    tech: ["Next.js", "JavaScript"],
    description:
      "Image compression, PDF compression, PDF merge and more tools fully client-side with 100% privacy.",
    dateRange: "May 2026",
    category: "web",
  },
  {
    name: "Curated Design Skills — Installed as Code",
    tagline: "Curated design skills installed as code",
    tech: ["shadcn", "npm", "Web Design"],
    description:
      "Entire websites, images, videos, illustrations and much more as shadcn-like packs to be downloaded — a new AI-native way with all code and information directly in the repo, consumed as part of a spec-driven instruction.",
    dateRange: "Apr 2026",
    category: "library",
  },
  {
    name: "My Blogging Website",
    tagline: "Aryan Batra's blog",
    tech: ["Next.js", "Technical Writing"],
    description:
      "My blogging website — writing about engineering, systems, and everything in between.",
    dateRange: "Apr 2026",
    category: "web",
  },
  {
    name: "StartX — AI Startup Validation Platform",
    tagline: "Validate your startup idea with AI",
    tech: ["Next.js", "Turso Cloud DB", "Groq AI", "Zai API", "Mistral AI", "Cerebras AI", "Instamojo", "Resend API", "Axiom Monitoring", "Pexels API", "Microsoft Clarity", "Mermaid.js", "React Flow", "GSAP", "Motion"],
    description:
      "A platform built on Turso DB, Groq API, Zai API, Mistral API, Cerebras API, Instamojo payment gateway, Resend API for email, Axiom monitoring, dynamic images using Pexels API, Microsoft Clarity integration, Mermaid.js, React Flow, GSAP, Motion and Next.js.",
    liveUrl: "https://startx-zeta.vercel.app/",
    imageUrl: "/images/startx.jpg",
    dateRange: "Apr 2026",
    category: "web",
  },
  {
    name: "Pixel Perfect Advanced UI Calendar",
    tagline: "My calendar — a pixel perfect advanced UI",
    tech: ["Tailwind CSS", "CSS"],
    description:
      "Built a pixel perfect advanced UI calendar.",
    dateRange: "Mar 2026",
    category: "web",
  },
  {
    name: "C Compiler",
    tagline: "Ultra simple C compiler for learning purposes",
    tech: ["CMake", "C (Programming Language)"],
    description:
      "Ultra simple C compiler for learning purposes with lexer, parser, and semantic analysis.",
    githubUrl: "https://github.com/aryanbatras/c-compiler",
    dateRange: "Mar 2026",
    category: "other",
  },
  {
    name: "Creative 3D Portfolio",
    tagline: "This very portfolio — a creative 3D experience",
    tech: ["Three.js", "React Three Fiber", "Next.js", "GSAP", "Motion"],
    description:
      "A creative 3D portfolio experience — the site you are inside right now, built with Three.js and React Three Fiber.",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "Online Piano With Keyboard",
    tagline: "Play piano with your keyboard",
    tech: ["Next.js", "FFmpeg"],
    description:
      "Found piano sounds, highly compressed them using FFmpeg, and built piano keys that run with keyboard input with audio synchronization.",
    githubUrl: "https://github.com/aryanbatras/online-piano",
    liveUrl: "https://online-piano-two.vercel.app/",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "Turbo C++ Graphics in Web Container",
    tagline: "Computer Graphics Lab — Turbo C++ online",
    tech: ["Next.js", "TypeScript", "Computer Graphics", "Webpack"],
    description:
      "A web-based Turbo C++ IDE that runs entirely in the browser using modern web technologies — bringing the classic DOS-based Turbo C++ compiler to modern devices without any installation requirements.",
    githubUrl: "https://github.com/aryanbatras/turboc-graphics",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "JS Homepage — Interactive Coding Platform",
    tagline: "React JS Leetcode platform with 60+ challenges and AI assistance",
    tech: ["React.js", "JavaScript", "TypeScript", "SASS", "Monaco Editor", "Three.js", "React Three Fiber", "Cloudflare Workers", "React Hooks"],
    description:
      "A comprehensive interactive coding platform designed to help developers master JavaScript and React through hands-on practice — 60+ coding challenges across 20+ categories, AI-powered assistance, and real-time code editing.",
    githubUrl: "https://github.com/aryanbatras/js-homepage",
    liveUrl: "https://js-homepage.vercel.app",
    imageUrl: "/images/js-homepage.png",
    dateRange: "Jan 2026",
    category: "web",
  },
  {
    name: "Signal UI — Signal Layers",
    tagline: "A minimalist, intent-driven UI system where components are laws, not presets",
    tech: ["React.js", "Tailwind CSS", "Node.js", "Open-Source Software"],
    description:
      "A minimalist, intent-driven UI system where components are laws, not presets. You copy the code. You own it. You change it. Built on a revolutionary signal-based architecture where props are signals of intention, not configuration — separated into 4 explicit layers (Input, Dimensions, Data, State) and distributed via a custom CLI (npx signal-layers copy).",
    githubUrl: "https://github.com/aryanbatras/signal-ui",
    liveUrl: "https://aryanbatras.github.io/signal-ui/",
    imageUrl: "/images/signal-ui.png",
    dateRange: "Dec 2025",
    category: "library",
  },
  {
    name: "StudyFlow WebApp",
    tagline: "Study Stream alternative — 24x7 live study rooms",
    tech: ["Solid.js", "State Management", "YouTube API"],
    description:
      "A web app that lets you stream live YouTube study videos as study buddies, pin them, go live on YouTube and pin yourself alongside them — a perfect open source clone of StudyStream, built in Solid JS.",
    githubUrl: "https://github.com/aryanbatras/study-stream-youtube",
    liveUrl: "https://aryanbatras.github.io/study-stream-youtube/",
    imageUrl: "/images/study-stream.png",
    dateRange: "Nov 2025",
    category: "web",
  },
  {
    name: "DSA-IN-3D — Ray Tracing Engine",
    tagline: "3D data structure visualizer in Java",
    tech: ["Java", "Ray Tracing", "Concurrent Programming", "Data Structures", "Algorithms", "Java Swing"],
    description:
      "A full-fledged 3D data structure visualizer built from scratch in Java — ray tracing, realistic rendering, camera animations, interactive and video modes, and an intuitive .with() API inspired by the Java Collections framework. Engineered from a multithreaded 3D ray tracing engine (>5,000 LOC, zero third-party engines) with photon light bouncing physics and spatial controls.",
    githubUrl: "https://github.com/aryanbatras/DSA-IN-3D",
    imageUrl: "/images/dsa-in-3d.jpg",
    dateRange: "Jul 2024 — Aug 2024",
    category: "desktop",
  },
  {
    name: "Java 3D Ray Tracing Engine",
    tagline: "3D interactive ray tracing engine built from scratch in Java",
    tech: ["Java", "Ray Tracing", "Concurrent Programming"],
    description:
      "A 3D interactive ray tracing engine built entirely from scratch in Java. It simulates the physics of light using pure ray tracing principles in a self-built 3D environment — realistic rendering, user interaction, procedural scenes, object dragging, and multithreaded performance in a single, powerful, extensible codebase.",
    githubUrl: "https://github.com/aryanbatras/JavaReflect-3D-Engine",
    imageUrl: "/images/java-3d-engine.jpg",
    dateRange: "Jun 2024 — Jul 2024",
    category: "desktop",
  },
];

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export interface Note {
  title: string;
  date: string;
  body: string;
}

export const NOTES: Note[] = [
  {
    title: "Why this desktop exists",
    date: "Today",
    body: "Every portfolio shows a timeline. I wanted to show a workspace — the machine where the work actually happens. Every icon on this desktop opens a real file: my resume, my projects, photos and videos straight from the showreel.",
  },
  {
    title: "On smooth scroll video",
    date: "Yesterday",
    body: "The trick is keyframes: encode the whole film as ONE file where every single frame is a keyframe (an all-intra encode). Scrubbing then decodes exactly one frame per seek — instant, frame-accurate, no buffering and no flicker. The chapters (and the black break between the two acts) are stitched into that one file, so the transitions are seamless by construction.",
  },
  {
    title: "Design rules I keep",
    date: "Last week",
    body: "1. One accent colour max. 2. Motion explains hierarchy. 3. Black and white first, colour only when it earns its place. 4. Every animation must answer to the scroll, not the clock.",
  },
  {
    title: "Reading list",
    date: "Last month",
    body: "Designing Data-Intensive Applications — Kleppmann. The Mythical Man-Month — Brooks. Creative Selection — Kocienda. Refactoring UI — Wathan & Schoger.",
  },
];

/* ------------------------------------------------------------------ */
/* Read Me (TextEdit file)                                             */
/* ------------------------------------------------------------------ */

export const README_TEXT = `ARYAN BATRA — PORTFOLIO OS
==========================

Welcome to my desktop. This is a fully interactive take on my
portfolio, built as a macOS-style operating system.

WHAT'S HERE
-----------
  · Finder        — the file browser; every file on this machine is real
  · About Me      — who I am and what I care about
  · Resume        — experience, education, skills
  · Projects      — a few things I've shipped
  · Notes         — things I think about
  · Photos        — frames pulled straight from the showreel
  · Videos        — the full scroll-scrubbed showreel, with sound
  · Maps          — where I work, think and wander
  · Portfolio     — the classic site, rendered as a web page (in Safari)
  · Games         — mini arcade: 2048, Memory, Heap Worm, Binary Pong and
                    a real Online Piano — plus my live projects to play with
  · Terminal      — type 'help' and see what happens

TIPS
----
  · ⌘K or ⌘Space  — Spotlight search
  · F3 or ⌃↑      — Mission Control
  · F4            — Launchpad
  · ⌃⌘Q           — Lock the screen
  · Esc           — close the machine (or dismiss the topmost surface)
  · ⌃⌘Space       — Emoji & Symbols
  · ⌃⌘F           — Enter / exit full screen
  · ⌘\`           — Cycle windows of the frontmost app
  · Space         — Quick Look (select a file in Finder)
  · F11 / F12     — Volume down / up (with on-screen display)
  · F1 / F2       — Brightness down / up (with on-screen display)
  · Green ▸ button — tiling menu (Fill, Tile Left/Right, Full Screen)
  · ⌘Tab (via Control Center) — app switcher
  · ⌘,            — System Settings
  · Right-click anything — menus everywhere
  · Drag a window to the left/right edge — macOS-style tiling preview
  · Drag a window to the very top — it zooms to full screen

HOW IT'S BUILT
--------------
  · Next.js (pages router) — same architecture as the rest of the site
  · GSAP ScrollTrigger    — pins + scrubs the video section
  · FFmpeg                — stitches the films into one all-intra
                            (every-frame-keyframe) file, so scroll-scrubbing
                            decodes exactly one frame per seek — no
                            buffering, no flicker, seamless chapters
  · CSS Modules           — every window, icon and menu hand-rolled

TIPS
----
  · Double-click desktop icons to open files
  · Drag windows by their title bar — they're fully movable
  · Use the traffic lights to close, minimise or zoom a window
  · Hover the dock — it magnifies

Enjoy the machine.
— Aryan
`;

/* ------------------------------------------------------------------ */
/* Terminal commands                                                   */
/* ------------------------------------------------------------------ */

export interface TerminalCommand {
  name: string;
  help: string;
  /** Real system info read from the browser — passed in so `uname` and
   *  `neofetch` report the visitor's actual hardware, not a scripted one. */
  run: (raw: string, sys: {
    platform: string;
    platformVersion: string | null;
    cpuCores: number | null;
    memoryGB: number | null;
    gpu: string | null;
    online: boolean;
    network: { effectiveType: string; downlink: number; rtt: number } | null;
    screen: { width: number; height: number };
  }) => string;
}

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    name: "help",
    help: "List available commands",
    run: () =>
      Object.keys(TERMINAL_HELP)
        .map((k) => `${k.padEnd(12)} ${TERMINAL_HELP[k]}`)
        .join("\n"),
  },
  {
    name: "whoami",
    help: "Who is using this machine",
    run: () => "aryan — software engineer, full-stack developer, 3D enthusiast.",
  },
  {
    name: "skills",
    help: "Show tech stack",
    run: () => RESUME.skills.join("  ·  "),
  },
  {
    name: "projects",
    help: "List notable projects",
    run: () => PROJECTS.map((p) => `· ${p.name} — ${p.tagline}`).join("\n"),
  },
  {
    name: "resume",
    help: "Print a summary of experience",
    run: () =>
      RESUME.experience
        .map((e) => `${e.role} @ ${e.company} (${e.period})`)
        .join("\n"),
  },
  {
    name: "contact",
    help: "How to reach me",
    run: () => RESUME.contact,
  },
  {
    name: "clear",
    help: "Clear the terminal",
    run: () => "__CLEAR__",
  },
  {
    name: "ls",
    help: "List files in the current directory",
    run: () =>
      "Resume.pdf   showreel.mp4   README.txt   Projects/   Notes/   Photos/   Maps/",
  },
  {
    name: "cat",
    help: "Print a file — e.g. cat README.txt",
    run: (raw: string) => {
      const file = raw.split(/\s+/)[1];
      if (!file) return "usage: cat <file>";
      if (file === "README.txt")
        return (
          README_TEXT.split("\n").slice(0, 14).join("\n") +
          "\n… (full file in the Read Me app)"
        );
      if (file === "Resume.pdf")
        return "Resume.pdf is a binary document — open the Resume app to view it.";
      return `cat: ${file}: No such file or directory`;
    },
  },
  {
    name: "pwd",
    help: "Print working directory",
    run: () => "/Users/aryan",
  },
  {
    name: "date",
    help: "Show the current date and time",
    run: () => new Date().toString(),
  },
  {
    name: "echo",
    help: "Echo text back — e.g. echo hello",
    run: (raw: string) => raw.split(/\s+/).slice(1).join(" "),
  },
  {
    name: "uname",
    help: "Show real system information",
    run: (_raw, sys) =>
      `AryanOS 2027 — running on ${sys.platform}${
        sys.platformVersion ? ` ${sys.platformVersion}` : ""
      }${sys.cpuCores != null ? ` · ${sys.cpuCores} cores` : ""}`,
  },
  {
    name: "neofetch",
    help: "Real system info with a touch of ASCII art",
    run: (_raw, sys) =>
      [
        "            AryanOS 2027",
        "            --------------",
        `            Platform: ${sys.platform}${sys.platformVersion ? ` ${sys.platformVersion}` : ""}`,
        "            Shell: zsh 5.9",
        `            Resolution: ${sys.screen.width}x${sys.screen.height}`,
        "            DE: AryanOS (Liquid Glass)",
        `            CPU: ${sys.cpuCores != null ? `${sys.cpuCores} logical cores` : "not reported"}`,
        `            GPU: ${sys.gpu ?? "not reported"}`,
        `            Memory: ${sys.memoryGB != null ? `${sys.memoryGB} GB` : "not reported"}`,
        `            Network: ${sys.online ? "online" : "offline"}${sys.network?.downlink ? ` @ ${sys.network.downlink} Mbps` : ""}`,
      ].join("\n"),
  },
  {
    name: "say",
    help: "Speak text aloud — e.g. say hello there",
    run: (raw: string) => {
      const text = raw.split(/\s+/).slice(1).join(" ");
      if (!text) return "usage: say <text>";
      try {
        window.speechSynthesis?.cancel();
        window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
        return `Speaking: “${text}”`;
      } catch {
        return "say: speech synthesis unavailable";
      }
    },
  },
];

const TERMINAL_HELP: Record<string, string> = Object.fromEntries(
  TERMINAL_COMMANDS.map((c) => [c.name, c.help]),
);
