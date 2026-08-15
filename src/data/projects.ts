export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  /** Animated webp preview shown on hover (from public/videos). */
  webpUrl?: string;
  featured: boolean;
  dateRange: string;
  /** ISO date (yyyy-mm-dd) for reliable newest-first sorting. */
  sortDate?: string;
  associatedWith?: string;
  category: 'web' | 'mobile' | 'desktop' | 'library' | 'other';
}

export const projects: Project[] = [
  {
    id: 'startx',
    sortDate: '2026-04-15',
    title: 'StartX - AI Startup Validation Platform',
    description: `Architected a validation platform integrating multiple AI providers (Groq, Mistral, Cerebras) alongside Turso Cloud DB. Integrated Instamojo payment gateways, Resend API, Axiom monitoring, and dynamic diagramming with Mermaid.js, React Flow, GSAP, and Motion in Next.js.`,
    shortDescription: 'AI startup validation platform integrating multiple AI providers, payments, and monitoring',
    technologies: ['Next.js', 'Groq AI', 'Mistral AI', 'Cerebras AI', 'Turso Cloud DB', 'Instamojo', 'Resend API', 'Axiom Monitoring', 'Mermaid.js', 'React Flow', 'GSAP', 'Motion'],
    liveUrl: 'https://startx-zeta.vercel.app/',
    imageUrl: '/images/startx.jpg',
    featured: false,
    dateRange: '2026',
    category: 'web'
  },
  {
    id: 'bluesky-client',
    sortDate: '2026-07-15',
    title: 'Bluesky Client - Social Media Application',
    description: `Built a full-featured Bluesky web client using Next.js featuring an Instagram-inspired UI adaptation. Implemented multi-feed custom streams, built-in NSFW filtering, content bookmarking, direct media downloading, and dark mode.`,
    shortDescription: 'Full-featured Bluesky web client with an Instagram-inspired UI',
    technologies: ['Next.js', 'React.js', 'TypeScript', 'Tailwind CSS'],
    featured: false,
    dateRange: '2026',
    category: 'web'
  },
  {
    id: 'rose-social-media',
    sortDate: '2026-07-15',
    title: 'Rose Social Media',
    description: `An RPG game built from scratch in Next.js. During the course of building this game, I learned game mechanics, asset building using AI and Google Flow, and how to design a great storyline — all while having fun mini-games in it.`,
    shortDescription: 'An RPG game built from scratch in Next.js',
    technologies: ['Next.js', 'Artificial Intelligence (AI)', 'Game Design'],
    githubUrl: 'https://github.com/aryanbatras/rose',
    featured: false,
    dateRange: 'Jul 2026',
    category: 'web'
  },
  {
    id: 'college-girl-rpg-game',
    sortDate: '2026-07-15',
    title: 'College Girl RPG Game',
    description: `An RPG game built from scratch in Next.js with game mechanics, AI-assisted asset building, and a designed storyline.`,
    shortDescription: 'An RPG game built from scratch in Next.js',
    technologies: ['Next.js', 'Game Design'],
    githubUrl: 'https://github.com/aryanbatras/college-girl-rpg-game',
    featured: false,
    dateRange: 'Jul 2026',
    category: 'web'
  },
  {
    id: 'weekend-movers-redesign',
    sortDate: '2026-06-15',
    title: 'Weekend Movers Re-design',
    description: `A complete re-design of the Weekend Movers website (weekendmovers.com.au) — rebuilt with GSAP animations and AI-assisted image and video generation.`,
    shortDescription: 'A redesign of weekendmovers.com.au with GSAP and AI-generated assets',
    technologies: ['GSAP', 'Image Generation', 'AI Video Generation', 'Storybook', 'Web Design'],
    liveUrl: 'https://weekend-movers.vercel.app/',
    imageUrl: '/images/weekend-movers.jpg',
    featured: false,
    dateRange: 'Jun 2026',
    category: 'web'
  },
  {
    id: 'book-of-rose',
    sortDate: '2026-06-15',
    title: 'The Book of Rose',
    description: `A live website of the philosophical book I wrote named "The Book of Rose" — a journey through the meaning of life and love.`,
    shortDescription: 'A live website of the philosophical book I wrote',
    technologies: ['Next.js', 'Technical Writing'],
    liveUrl: 'https://bookofrose.vercel.app/',
    imageUrl: '/images/book-of-rose.jpg',
    featured: false,
    dateRange: 'Jun 2026',
    category: 'web'
  },
  {
    id: 'browser-ai',
    sortDate: '2026-05-15',
    title: 'Browser AI',
    description: `AI that runs on your browser using the latest ONNX Runtime Web technology for daily tools such as image background remover, object detection and much more — no server required. Flagship feature: summarize long PDF books and documents completely client-side using a 300 MB T5-Small Model downloaded and stored in the browser's IndexedDB.`,
    shortDescription: 'AI that runs on your machine — no server required',
    technologies: ['Next.js', 'JavaScript', 'ONNX Runtime Web', 'Small Language Models (SLMs)'],
    liveUrl: 'https://browser-ai-dun.vercel.app/',
    imageUrl: '/images/browser-ai.jpg',
    featured: false,
    dateRange: 'May 2026',
    category: 'web'
  },
  {
    id: 'browser-tools',
    sortDate: '2026-05-15',
    title: 'Browser Tools for Everyday Files',
    description: `Image compression, PDF compression, PDF merge and more tools fully client-side with 100% privacy.`,
    shortDescription: 'Free browser tools for everyday files — 100% client-side',
    technologies: ['Next.js', 'JavaScript'],
    featured: false,
    dateRange: 'May 2026',
    category: 'web'
  },
  {
    id: 'curated-design-skills',
    sortDate: '2026-04-15',
    title: 'Curated Design Skills — Installed as Code',
    description: `Entire websites, images, videos, illustrations and much more as shadcn-like packs to be downloaded — a new AI-native way with all code and information directly in the repo, consumed as part of a spec-driven instruction.`,
    shortDescription: 'Curated design skills installed as code',
    technologies: ['shadcn', 'npm', 'Web Design'],
    featured: false,
    dateRange: 'Apr 2026',
    category: 'library'
  },
  {
    id: 'blogging-website',
    sortDate: '2026-04-15',
    title: 'My Blogging Website',
    description: `My blogging website — writing about engineering, systems, and everything in between.`,
    shortDescription: "Aryan Batra's blog",
    technologies: ['Next.js', 'Technical Writing'],
    featured: false,
    dateRange: 'Apr 2026',
    category: 'web'
  },
  {
    id: 'advanced-ui-calendar',
    sortDate: '2026-03-15',
    title: 'Pixel Perfect Advanced UI Calendar',
    description: `Built a pixel perfect advanced UI calendar.`,
    shortDescription: 'A pixel perfect advanced UI calendar',
    technologies: ['Tailwind CSS', 'CSS'],
    featured: false,
    dateRange: 'Mar 2026',
    category: 'web'
  },
  {
    id: 'c-compiler',
    sortDate: '2026-03-15',
    title: 'C Compiler',
    description: `Ultra simple C compiler for learning purposes with lexer, parser, and semantic analysis.`,
    shortDescription: 'Ultra simple C compiler with lexer, parser, and semantic analysis',
    technologies: ['CMake', 'C (Programming Language)'],
    githubUrl: 'https://github.com/aryanbatras/c-compiler',
    featured: false,
    dateRange: 'Mar 2026',
    category: 'other'
  },
  {
    id: 'creative-3d-portfolio',
    sortDate: '2026-02-15',
    title: 'Creative 3D Portfolio',
    description: `A creative 3D portfolio experience — the site you are inside right now, built with Three.js and React Three Fiber.`,
    shortDescription: 'A creative 3D portfolio experience',
    technologies: ['Three.js', 'React Three Fiber', 'Next.js', 'GSAP', 'Motion'],
    associatedWith: 'MBS College of Engg. & Technology',
    featured: false,
    dateRange: 'Feb 2026',
    category: 'web'
  },
  {
    id: 'online-piano',
    sortDate: '2026-02-15',
    title: 'Online Piano With Keyboard',
    description: `Found piano sounds, highly compressed them using FFmpeg, and built piano keys that run with keyboard input with audio synchronization.`,
    shortDescription: 'Play piano with your keyboard',
    technologies: ['Next.js', 'FFmpeg'],
    githubUrl: 'https://github.com/aryanbatras/online-piano',
    liveUrl: 'https://online-piano-two.vercel.app/',
    featured: false,
    dateRange: 'Feb 2026',
    category: 'web'
  },
  {
    id: 'turboc-graphics',
    sortDate: '2026-02-15',
    title: 'Turbo C++ Graphics in Web Container',
    description: `A web-based Turbo C++ IDE that runs entirely in the browser using modern web technologies — bringing the classic DOS-based Turbo C++ compiler to modern devices without any installation requirements.`,
    shortDescription: 'Computer Graphics Lab — Turbo C++ online',
    technologies: ['Next.js', 'TypeScript', 'Computer Graphics', 'Webpack'],
    githubUrl: 'https://github.com/aryanbatras/turboc-graphics',
    associatedWith: 'MBS College of Engg. & Technology',
    featured: false,
    dateRange: 'Feb 2026',
    category: 'web'
  },
  {
    id: 'js-homepage',
    sortDate: '2026-01-15',
    title: 'JS Homepage - Interactive Coding Platform',
    description: `JS Homepage is a comprehensive interactive coding platform designed to help developers master JavaScript and React through hands-on practice. With 60+ coding challenges across 20+ categories, AI-powered assistance, and real-time code editing, it's the perfect environment for both beginners and experienced developers.

🎯 Key Features
🚀 Interactive Code Editor - Monaco Editor with syntax highlighting and IntelliSense
🤖 AI Assistant - Get real-time help and code suggestions
📚 Extensive Problem Library - 60+ challenges covering JavaScript, React, algorithms, and more
🔗 GitHub Integration - Sync your progress and solutions with GitHub
📱 Responsive Design - Works seamlessly on desktop and mobile devices
🎨 3D Visualizations - Interactive Three.js components for enhanced learning
⏱️ Built-in Timer - Track your coding sessions and improve productivity
🔍 Smart Search - Find problems quickly with intelligent search functionality
📊 Progress Tracking - Monitor your learning journey and achievements

🏗️ Architecture
Technology Stack
Frontend: React 19.2.3 + Vite 6.2.1
Language: JavaScript (with TypeScript support planned)
Styling: SASS/SCSS
Code Editor: Monaco Editor
3D Graphics: Three.js + React Three Fiber + React Three Rapier
Authentication: GitHub OAuth
Backend: Firebase
AI Service: Custom Cloudflare Workers integration
State Management: React Context + Hooks
Build Tool: Vite with PWA support`,
    shortDescription: 'Interactive coding platform with 60+ challenges, AI assistance, and 3D visualizations',
    technologies: ['React.js', 'JavaScript', 'TypeScript', 'SASS', 'Monaco Editor', 'Three.js', 'React Three Fiber', 'styled-components', 'CSS', 'Cloudflare Workers', 'React Hooks'],
    githubUrl: 'https://github.com/aryanbatras/js-homepage',
    liveUrl: 'https://js-homepage.vercel.app',
    imageUrl: '/images/js-homepage.png',
    webpUrl: '/videos/js-homepage.webp',
    featured: true,
    dateRange: 'Jan 2026 - Jan 2026',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'web'
  },
  {
    id: 'signal-ui',
    sortDate: '2025-12-15',
    title: 'Signal UI - Intent-Driven Component Library',
    description: `Created an intent-driven UI architecture built on React and Tailwind CSS v4, separating components into 4 explicit layers (Input, Dimensions, Data, State). Distributed via a custom CLI (npx signal-layers copy) enabling zero-dependency, fully-ownable component layers.`,
    shortDescription: 'Intent-driven component library built on React and Tailwind CSS v4',
    technologies: ['React.js', 'Tailwind CSS', 'Node.js', 'Open-Source Software'],
    githubUrl: 'https://github.com/aryanbatras/signal-ui',
    liveUrl: 'https://aryanbatras.github.io/signal-ui/',
    imageUrl: '/images/signal-ui.png',
    webpUrl: '/videos/signal-ui.webp',
    featured: true,
    dateRange: 'Dec 2025',
    category: 'library'
  },
  {
    id: 'studystream',
    sortDate: '2025-11-15',
    title: 'StudyStream WebApp',
    description: `🚀 Features
🎥 Live Study Sessions
View live study sessions from students worldwide
Seamless YouTube integration for live streaming
📌 Smart Pinning System
Pin your favorite study streams for quick access
Persistent storage of pinned streams across sessions
🎨 Customizable Interface
Light/Dark theme toggle
Adjustable grid layout
Focus mode for distraction-free studying
Responsive design for all devices
⚡ Performance Optimized
Smart caching system for faster load times
Efficient YouTube API usage
Smooth animations and transitions`,
    shortDescription: 'Live study companion platform with YouTube integration and focus modes',
    technologies: ['Solid js', 'State Management', 'JavaScript', 'YouTube API'],
    githubUrl: 'https://github.com/aryanbatras/study-stream-youtube',
    liveUrl: 'https://aryanbatras.github.io/study-stream-youtube/',
    imageUrl: '/images/study-stream.png',
    webpUrl: '/videos/study-stream.webp',
    featured: true,
    dateRange: 'Nov 2025 - Nov 2025',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'web'
  },
  {
    id: 'dsa-in-3d',
    sortDate: '2024-07-15',
    title: 'DSA-IN-3D: 3D Data Structure Visualizer In Java',
    description: `DSA-IN-3D is a full-fledged 3D data structure visualizer built from scratch in Java. It's made to educate, demonstrate, and inspire — perfect for students, teachers, and curious developers who want to see algorithms and data structures come alive in 3D. It features ray tracing, realistic rendering, camera animations, interactive and video modes, and an intuitive .with() API inspired by the Java Collections framework.`,
    shortDescription: '3D data structure visualizer with ray tracing and interactive algorithms',
    technologies: ['Java', 'Data Structures', 'Algorithms', 'Ray Tracing', 'Java Concurrency', 'Java Swing'],
    githubUrl: 'https://github.com/aryanbatras/DSA-IN-3D',
    imageUrl: '/images/dsa-in-3d.jpg',
    webpUrl: '/videos/dsa-in-3d.webp',
    featured: true,
    dateRange: 'Jul 2024 - Aug 2024',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'desktop'
  },
  {
    id: 'java-3d-engine',
    sortDate: '2024-06-15',
    title: 'Java 3D Ray Tracing Engine',
    description: `JavaReflect is a 3D interactive ray tracing engine built entirely from scratch in Java. It features realistic rendering, user interaction, procedural scenes, object dragging, and multithreaded performance — all in a single powerful, extensible codebase. It simulates the physics of light using pure ray tracing principles in a self-built 3D environment. From photon-like rays bouncing off complex surfaces to drag-and-drop interaction and full camera control, this engine showcases the power of modern Java in graphical computing. With over 5,000 lines of handwritten code, no third-party engines, and real-time interaction, this is more than a ray tracer — it's a learning tool, a sandbox, and a platform for 3D innovation.`,
    shortDescription: '3D interactive ray tracing engine built from scratch in Java',
    technologies: ['Java', 'Ray Tracing', 'Concurrent Programming'],
    githubUrl: 'https://github.com/aryanbatras/JavaReflect-3D-Engine',
    imageUrl: '/images/java-3d-engine.jpg',
    featured: true,
    dateRange: 'Jun 2024 - Jul 2024',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'desktop'
  }
];