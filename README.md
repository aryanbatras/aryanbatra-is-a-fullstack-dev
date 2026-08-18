# Aryan OS — Portfolio Desktop

A macOS-style desktop operating system built with Next.js, featuring 42+ applications powered by WebAssembly (WASM) engines running entirely in the browser.

**Live:** [aryanbatra.vercel.app](https://aryanbatra.vercel.app)

## Features

### Desktop Environment
- Full macOS-style desktop with wallpaper, dock, menu bar, and windows
- Mission Control, Launchpad, Spotlight search, and notifications
- Drag & drop files, right-click context menus, and keyboard shortcuts
- Multiple desktop spaces with different wallpapers

### WASM-Powered Applications

#### Engineering Tools
| App | Engine | Description |
|-----|--------|-------------|
| **Postgres** | PGlite WASM | Full PostgreSQL database running in browser |
| **SQLite Studio** | sql.js WASM | SQLite with SQL editor and table browser |
| **Bundler** | esbuild WASM | JavaScript/TypeScript bundler |
| **AI Lab** | Transformers.js | Hugging Face ML models (sentiment, summarization, NER) |
| **Terminal** | Pyodide WASM | Real CPython 3 interpreter |
| **VS Code** | Monaco Editor | Full VS Code editor with IntelliSense |

#### Emulators & Runners
| App | Engine | Description |
|-----|--------|-------------|
| **BoxedWine** | Wine WASM | Run 16/32-bit Windows programs |
| **Virtual x86** | v86 | Full x86 PC emulator |
| **EmulatorJS** | RetroArch | NES, SNES, Game Boy, GBA, N64, Sega |
| **Ruffle** | Flash WASM | Flash Player emulator |
| **DOS** | js-dos | DOSBox for classic DOS games |
| **TIC-80** | TIC-80 WASM | Fantasy computer for tiny games |
| **ClassiCube** | Emscripten | Minecraft Classic client |
| **Quake III** | Emscripten | Quake III Arena in browser |

#### Productivity
| App | Description |
|-----|-------------|
| **Finder** | File browser with drag & drop, archive extraction (7z WASM) |
| **TextEdit** | Code editor with syntax highlighting |
| **Vim** | Real vim.js editor |
| **TinyMCE** | WYSIWYG rich-text editor |
| **Winamp** | Webamp audio player |
| **VLC** | Dark media player |
| **DevTools** | Eruda developer console |
| **IRC** | KiwiIRC chat client |

## Architecture

### Performance Optimizations

#### CDN Offloading (~61MB moved to public CDNs)
Heavy WASM binaries are served from free public CDNs instead of the Vercel deployment:

| Asset | Size | CDN |
|-------|------|-----|
| Stockfish WASM | 7MB | unpkg.com |
| Pyodide | 13MB | cdn.jsdelivr.net |
| Monaco VS | 9.9MB | cdn.jsdelivr.net |
| Ruffle | 26MB | unpkg.com |
| v86 | 3.7MB | cdn.jsdelivr.net |
| EmulatorJS | 1MB | cdn.jsdelivr.net |
| Eruda | 500KB | cdn.jsdelivr.net |

#### Code-Splitting (36 lazy-loaded apps)
Only 6 lightweight shell apps load at boot. All 36 other apps are lazy-loaded via `React.lazy` + `Suspense`, downloading only when the user opens them.

```
Main Bundle: Finder, Settings, About, Resume, Projects, Notes
Code-Split:  All other apps (36 chunks)
```

#### Immutable Caching
All `/aryan/*` static assets have `Cache-Control: public, max-age=31536000, immutable` headers, giving instant loads on repeat visits.

### Tech Stack
- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS 4 + CSS Modules
- **Animation:** GSAP, Framer Motion
- **3D:** Three.js, React Three Fiber
- **WASM Engines:** PGlite, sql.js, esbuild-wasm, Pyodide, Stockfish, v86, Ruffle, EmulatorJS, and more

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the desktop.

## Deployment

```bash
npm run build
npm run start
```

Or deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aryanbatras/aryanbatra-is-a-fullstack-dev)

## License

MIT
