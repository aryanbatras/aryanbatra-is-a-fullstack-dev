# Architecture — Aryan Batra Portfolio OS

## Overview

This is a Next.js portfolio website that presents itself as a macOS-style desktop operating system. The site boots into a working desktop with a Dock, Finder, apps, and a lock screen.

---

## Directory Structure

```
src/
├── pages/                  # Next.js routes
│   ├── index.tsx           # HOME → boots MacDesktop directly (no video scroll)
│   ├── desktop.tsx         # /desktop → same MacDesktop, no lock screen
│   ├── legacy/index.tsx    # /legacy → old portfolio (hero, projects, contact)
│   └── 3d/index.tsx        # /3d → Three.js 3D portfolio experience
│
├── layout/
│   ├── Navbar.tsx          # Global navbar (used by legacy + 3d pages)
│   ├── homepage/           # LEGACY — old portfolio layout segments
│   │   └── segments/
│   │       ├── one/        # Hero section (AnimatedText)
│   │       └── two/        # Projects, testimonials, profile
│   └── new/
│       └── segments/
│           ├── MacDesktop.tsx      # CORE — the entire desktop OS
│           ├── VideoShowcase.tsx   # Scroll-scrubbed showreel (LEGACY — not used on homepage anymore)
│           ├── LaptopEntry.tsx     # Laptop entry animation (LEGACY)
│           └── DesktopPreview.tsx  # Desktop preview for laptop entry (LEGACY)
│
├── components/
│   ├── desktop/            # CORE — all desktop OS components
│   │   ├── Window.tsx      # Window manager (drag, resize, maximize, minimize)
│   │   ├── Dock.tsx        # macOS Dock with magnification
│   │   ├── MenuBar.tsx     # Top menu bar (Apple menu, status icons, clock)
│   │   ├── LockScreen.tsx  # Lock screen (clock, avatar, login, Watch Video)
│   │   ├── Spotlight.tsx   # Spotlight search (⌘K)
│   │   ├── Launchpad.tsx   # Launchpad app grid (F4)
│   │   ├── MissionControl.tsx  # Mission Control (F3)
│   │   ├── AppSwitcher.tsx # ⌘Tab app switcher
│   │   ├── NotificationCenter.tsx  # Notification center
│   │   ├── LiquidGlass.tsx # Liquid Glass refraction effect (macOS Tahoe)
│   │   ├── Glyph.tsx       # Semantic icon renderer (lucide + react-icons)
│   │   ├── AppIcon.tsx     # App icon renderer
│   │   ├── FolderIcon.tsx  # macOS folder icon with color/emoji
│   │   ├── WidgetStack.tsx # Desktop widgets (clock, weather, calendar)
│   │   ├── StageStrip.tsx  # Stage Manager side strip
│   │   ├── AboutThisMac.tsx # About This Mac dialog
│   │   ├── AlertDialog.tsx  # macOS-style alert dialogs
│   │   ├── QuickLook.tsx   # Quick Look preview (Space bar)
│   │   ├── EmojiPicker.tsx # Emoji & Symbols picker
│   │   ├── RunDialog.tsx   # Run dialog (⌘⇧R)
│   │   ├── Screensaver.tsx # Screensaver animations
│   │   ├── MarkdownPreview.tsx # Markdown renderer
│   │   └── apps/           # All desktop applications (40+ apps)
│   │       ├── FinderApp.tsx      # File browser (sidebar, grid/list, drag, sort)
│   │       ├── TerminalApp.tsx    # Terminal with real commands
│   │       ├── WebsiteApp.tsx     # Safari/iframe browser
│   │       ├── ResumeApp.tsx      # Resume viewer
│   │       ├── ProjectsApp.tsx    # Projects gallery
│   │       ├── SettingsApp.tsx    # System Settings
│   │       ├── MonacoApp.tsx      # VS Code editor
│   │       ├── VimApp.tsx         # Vim editor
│   │       ├── PhotosApp.tsx      # Photo gallery
│   │       ├── VideosApp.tsx      # Video player
│   │       ├── GamesApp.tsx       # Games launcher
│   │       ├── NotesApp.tsx       # Notes
│   │       ├── TextEditApp.tsx    # Text editor
│   │       └── ... (30+ more apps)
│   │
│   ├── animations/         # LEGACY — animation components (not used on homepage)
│   │   ├── ScrollFloat.tsx # Scroll-triggered text float
│   │   ├── FoldText.tsx    # Fold text animation
│   │   └── AnimatedText.tsx # Animated text reveal
│   │
│   ├── loader/             # LEGACY — video loader (not used on homepage)
│   │   ├── VideoLoader.tsx # Video loading curtain
│   │   ├── CountUp.tsx     # Counter animation
│   │   └── TerminalLoader.tsx # Terminal-style loader
│   │
│   ├── contact/            # LEGACY — used only by /legacy
│   ├── testimonials/       # LEGACY — used only by /legacy
│   ├── projects/           # LEGACY — used only by /legacy
│   ├── profile/            # LEGACY — used only by /legacy
│   ├── carousel/           # LEGACY — used only by /legacy
│   ├── threejs/            # LEGACY — used only by /3d
│   └── utility/            # Shared utilities (LevaPanel, TogglePanel)
│
├── hooks/
│   ├── useWindowManager.ts # CORE — window state (open, close, focus, minimize, maximize)
│   ├── useWallpaperTint.ts # CORE — extract dominant color from wallpaper
│   ├── useScrubVideo.ts    # LEGACY — scroll-scrub video hook
│   ├── useScreenWidth.ts   # LEGACY — viewport width hook
│   ├── useLiveWeather.ts   # CORE — live weather data
│   └── useSystemInfo.ts    # CORE — system info (battery, connection)
│
├── utils/
│   ├── sounds.ts           # CORE — sound effects (boot, click, error)
│   ├── finderStorage.ts    # CORE — localStorage file system
│   ├── archives.ts         # CORE — zip/iso archive parsing
│   ├── unarchive.ts        # CORE — 7z/tar/gz extraction (WASM)
│   ├── clipboardHistory.ts # CORE — clipboard watcher
│   ├── screenCapture.ts    # CORE — screen recording
│   ├── sheep.ts            # CORE — eSheep desktop pet
│   ├── ntp.ts              # CORE — network time protocol
│   ├── music.ts            # CORE — music playback
│   ├── pyodide.ts          # CORE — Python interpreter
│   └── syntaxHighlight.tsx # CORE — code highlighting
│
├── constants/
│   ├── desktop.ts          # CORE — all app configs, wallpapers, resume, projects
│   └── video.ts            # CORE — video timeline (still used by VLC, Photos, LockScreen)
│
├── context/
│   ├── ThemeContext.tsx     # Theme provider (dark/light)
│   ├── PanelContext.tsx     # Leva panel toggle
│   └── ScrollSmootherContext.tsx  # LEGACY — GSAP ScrollSmoother
│
├── data/
│   ├── projects.ts         # LEGACY — project data for old portfolio
│   ├── profile.ts          # LEGACY — profile data for old portfolio
│   └── testimonials.ts     # LEGACY — testimonials data for old portfolio
│
├── styles/
│   ├── globals.css         # Global styles, CSS variables, resets
│   ├── components/
│   │   ├── desktop/        # CORE — desktop component styles
│   │   │   ├── MacDesktop.module.css  # Main desktop + lock screen + dock + menu bar
│   │   │   ├── Window.module.css      # Window frame, titlebar, traffic lights
│   │   │   ├── apps.module.css        # All 40+ app styles (Finder, Terminal, etc.)
│   │   │   └── AppIcon.module.css     # App icon styles
│   │   ├── animation/      # LEGACY — animation styles
│   │   ├── contact/        # LEGACY — contact form styles
│   │   ├── testimonials/   # LEGACY — testimonials styles
│   │   ├── projects/       # LEGACY — project gallery styles
│   │   ├── profile/        # LEGACY — profile styles
│   │   ├── carousel/       # LEGACY — carousel styles
│   │   ├── threejs/        # LEGACY — 3D portfolio styles
│   │   ├── new/            # LEGACY — video showcase + laptop entry styles
│   │   ├── loader/         # LEGACY — video loader styles
│   │   └── utility/        # Utility component styles
│   ├── pages/
│   │   ├── index.module.css    # LEGACY — old homepage styles
│   │   ├── 3d.module.css       # 3D page styles
│   │   └── new.module.css      # LEGACY — new homepage styles
│   └── layout/
│       └── Navbar.module.css   # Navbar styles
│
├── lib/                    # Third-party library wrappers
└── types/                  # TypeScript type definitions
```

---

## Active Code Paths

### Primary: Desktop OS (what users see)
```
pages/index.tsx
  → MacDesktop (dynamic import, ssr: false)
    → LockScreen (wallpaper, clock, avatar, login, Watch Video)
    → MenuBar (Apple menu, status icons, clock)
    → Dock (Finder, Terminal, Safari, LinkedIn, GitHub)
    → Window (drag, resize, maximize, minimize)
    → FinderApp (file browser, sidebar, grid/list)
    → 40+ other apps
    → Spotlight, Launchpad, MissionControl, etc.
```

### Secondary: Legacy Portfolio (/legacy)
```
pages/legacy/index.tsx
  → One (hero with AnimatedText)
  → Two (Projects, Testimonials, Profile)
  → Contact
```

### Tertiary: 3D Portfolio (/3d)
```
pages/3d/index.tsx
  → ModelContainer (Three.js scene)
  → LevaPanel (debug controls)
```

---

## Key Architectural Decisions

1. **Dynamic imports**: MacDesktop is the heaviest module (window manager, Dock, 40+ apps). It's loaded via `next/dynamic` with `ssr: false` so the initial JS bundle stays small.

2. **localStorage file system**: Finder has a real file system backed by localStorage. Users can create folders, rename files, drag to arrange. All persisted across sessions.

3. **Liquid Glass**: The macOS Tahoe frosted glass effect uses SVG displacement maps (Chrome) with CSS blur fallback (other browsers). Simplified on mobile for GPU performance.

4. **Wallpaper tint**: Each wallpaper's dominant color is extracted and used to tint UI elements (menu bar, dock, widgets). Custom wallpapers work too.

5. **Sound system**: Boot chime, click, error, and other sounds play on user interactions. Muted by default on mobile.

---

## What's Legacy (not used on homepage)

These components/styles are only used by `/legacy` or `/3d` routes, or were part of the removed video scroll flow:

- `src/components/animations/*` (ScrollFloat, FoldText, AnimatedText)
- `src/components/loader/*` (VideoLoader, CountUp, TerminalLoader)
- `src/components/contact/*`
- `src/components/testimonials/*`
- `src/components/projects/*`
- `src/components/profile/*`
- `src/components/carousel/*`
- `src/components/threejs/*`
- `src/layout/homepage/*`
- `src/layout/new/segments/VideoShowcase.tsx`
- `src/layout/new/segments/LaptopEntry.tsx`
- `src/layout/new/segments/DesktopPreview.tsx`
- `src/hooks/useScrubVideo.ts`
- `src/hooks/useScreenWidth.ts`
- `src/context/ScrollSmootherContext.tsx`
- `src/data/*` (projects.ts, profile.ts, testimonials.ts)
- `src/styles/components/animation/*`
- `src/styles/components/contact/*`
- `src/styles/components/testimonials/*`
- `src/styles/components/projects/*`
- `src/styles/components/profile/*`
- `src/styles/components/carousel/*`
- `src/styles/components/threejs/*`
- `src/styles/components/new/*`
- `src/styles/components/loader/*`
- `src/styles/pages/index.module.css`
- `src/styles/pages/new.module.css`

**These files are NOT deleted** — they remain for the `/legacy` and `/3d` routes. They could be lazy-loaded or removed in a future cleanup.

---

## Mobile vs Desktop

The desktop OS adapts to screen size:
- **Desktop (>767px)**: Full macOS experience — sidebar in Finder, magnified dock, hover menus
- **Mobile (≤767px)**: iOS blend — Finder has bottom tab bar, bigger touch targets, simplified toolbar, no dock magnification, always-visible menu bar

---

## Mobile Components (iOS-style)

Located in `src/components/mobile/` with styles in `src/styles/components/mobile/`.

| Component | Purpose |
|-----------|---------|
| `MobileTabBar` | iOS bottom tab bar (always visible, Liquid Glass) |
| `MobileNavBar` | Collapsible large title navigation bar |
| `MobileList` | Grouped list with sections, rows, chevrons |
| `MobileCard` | Featured content card |
| `MobileSearchBar` | Prominent search with scope buttons |
| `MobileBottomSheet` | Slide-up action sheet |

**Utilities:**
- `src/hooks/useIsMobile.ts` — Mobile detection (matchMedia listener)
- `src/utils/touch.ts` — Haptic feedback, press scale, spring physics

**Design principles:**
- 44pt minimum touch targets
- Spring physics on all animations
- Liquid Glass on navigation layer only (tab bar, nav bar)
- Safe area padding for notched phones
- Grouped list sections (iOS Files/Settings pattern)
- Bottom tab bar for primary navigation (never hidden)
- Large title that collapses on scroll

## Adding New Apps

1. Create `src/components/desktop/apps/YourApp.tsx`
2. Add config to `src/constants/desktop.ts` in `DESKTOP_APPS`
3. Add view to `APP_VIEWS` in `src/layout/new/segments/MacDesktop.tsx`
4. Add styles to `src/styles/components/desktop/apps.module.css`
5. Wire up in MacDesktop's render section
