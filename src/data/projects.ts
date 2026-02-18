export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
  dateRange: string;
  associatedWith?: string;
  category: 'web' | 'mobile' | 'desktop' | 'library' | 'other';
}

export const projects: Project[] = [
  {
    id: 'js-homepage',
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
    featured: true,
    dateRange: 'Jan 2026 - Jan 2026',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'web'
  },
  {
    id: 'signal-ui',
    title: 'Signal UI - Minimalist Component Library',
    description: `Signal Layers
A minimalist, intent-driven UI system where components are laws, not presets. You copy the code. You own it. You change it. The system guides you instead of trapping you.

Signal Layers exists because modern frontend UI has become over-configured, over-abstracted, and under-owned. This library fixes that through a revolutionary signal-based architecture where props are signals of intention, not configuration

Architecture
Signal Layers introduces a revolutionary four-signal architecture:

Signal Types
Input Signals (inputSignal)
Raw props passed to components
User intention for styling
Example: primary, lg, onClick, disabled
Layer Signals (layerSignal)
Mapped CSS classes and styling layers
Visual presentation logic
Example: Maps primary → "bg-blue-500 text-white"
Data Signals (dataSignal)
Processed and validated data
Component state and computed values
Example: Validated form values, computed dimensions
State Signals (stateSignal)
React hooks for interactivity
Hover, focus, ripple states
Example: stateSignal.hover.get, stateSignal.ripples.set
Signal Resolution Rules
One signal per layer: If multiple signals from the same layer are passed, the last one is applied
Deterministic: No magic, no warnings, predictable behavior
Composable: Signals can be combined freely
Optional: All signals are opt-in

📦 Available Components
Component Description
Button Interactive button with ripple effects
Card Content container with layered styling
CheckBox Custom checkbox with animations
Dropdown Select dropdown with keyboard navigation
FabMenu Floating action button menu
ProgressBar Animated progress indicator
Slider Range slider with drag interaction
Spinner Loading spinner animations
Switch Toggle switch with smooth transitions
TextField Input field with validation states`,
    shortDescription: 'Revolutionary signal-based UI component library with minimal configuration',
    technologies: ['React.js', 'Tailwind CSS', 'Node.js', 'Microsoft Visual Studio Code', 'Open-Source Software'],
    githubUrl: 'https://github.com/aryanbatras/signal-ui',
    liveUrl: 'https://aryanbatras.github.io/signal-ui/',
    featured: true,
    dateRange: 'Dec 2025 - Dec 2025',
    category: 'library'
  },
  {
    id: 'studystream',
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
    featured: true,
    dateRange: 'Nov 2025 - Nov 2025',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'web'
  },
  {
    id: 'dsa-in-3d',
    title: 'DSA-IN-3D: 3D Data Structure Visualizer',
    description: `🔥 What is DSA-IN-3D?
DSA-IN-3D is a full-fledged 3D data structure visualizer built from scratch in Java.

It's made to educate, demonstrate, and inspire—perfect for students, teachers, and curious developers who want to see algorithms and data structures come alive in 3D

It features ray tracing, realistic rendering, camera animations, interactive and video modes, and an intuitive .with() API inspired by the Java Collections framework.

💡 Features & Customizations
🧱 Supported Data Structures
JLinkedList<T> ✅
JArrayList<T> ✅
JAVLTree<T> ✅
JStack<T> ✅
JQueue<T> ✅
JTrees<T> ✅
JGraph<T> ✅
JHeap<T> ✅

🎞️ Operation Visualizers
.get(), .set(), for JArrayList and JLinkedList
.add(), .remove(), for JArrayList, JLinkedList, JHeaps, JAVLTree
.push(), .pop(), for JStack and .offer() and .poll() for JQueue
.isGreater(), .isSmaller(), .isGreaterOrEqual(), .isSmallerOrEqual() for JArrayList
.addVertex(), .removeVertex(), .addEdge(), .removeEdge(), .dfs(), .bfs() for JGraph
.getMin(), .getMax(), .getHeight(), .search(), .leaves(), .preorder(), .postorder(), .inorder() for JAVLTree and JTrees`,
    shortDescription: '3D data structure visualizer with ray tracing and interactive algorithms',
    technologies: ['Data Structures', 'Algorithms', 'Java', 'Ffmpeg', 'Java Concurrency', 'Java Swing'],
    githubUrl: 'https://github.com/aryanbatras/DSA-IN-3D',
    featured: true,
    dateRange: 'Jul 2024 - Aug 2024',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'desktop'
  },
  {
    id: 'java-3d-engine',
    title: 'Java 3D Ray Tracing Engine',
    description: `JavaReflect is a 3D interactive ray tracing engine built entirely from scratch in Java. It features realistic rendering, user interaction, procedural scenes, object dragging, and multithreaded performance — all in a single powerful, extensible codebase.

🚀 Overview
JavaReflect simulates the physics of light using pure ray tracing principles in a self-built 3D environment. From photon-like rays bouncing off complex surfaces to drag-and-drop interaction and full camera control, this engine showcases the power of modern Java in graphical computing.

With over 5,000 lines of handwritten code, no third-party engines, and real-time interaction, this is more than a ray tracer — it's a learning tool, a sandbox, and a platform for 3D innovation.

🎯 Features
🔷 Core Engine
✅ Ray tracing from scratch (primary, reflection, shadows planned)
✅ Multithreaded rendering loop (fast, scalable)
✅ Antialiasing with random sampling
✅ Camera with free movement, 360° mouse control, zoom, and orientation
✅ Ground plane, multiple visible objects, materials, and scene realism

🔷 Object System
✅ Spheres, Planes, Triangles, Boxes, Cones, Cylinders
✅ Unified object interface for movement, hit detection, scaling, center & radius manipulation
✅ Collision detection support between any shape combinations
✅ Mouse selection + dragging (intuitive user interaction)
✅ Fully OO design for extensibility

🔷 Scene & World
✅ Procedural scene generation with tunable randomness:
Sphere count, radius, position, fuzziness, materials, etc.
✅ Reflective ground support
✅ Reusable scene loaders
✅ Clean camera injection into render pipeline

🔷 Interface & Interaction
✅ AWT-based Java window
✅ Keyboard + Mouse control
✅ Realtime interaction and live rendering updates
✅ Scene redraw on interaction or camera shift
✅ Camera & object debug information printing`,
    shortDescription: '3D interactive ray tracing engine with realistic rendering and multithreading',
    technologies: ['Java', 'Ray Tracing', 'Concurrent Programming'],
    githubUrl: 'https://github.com/aryanbatras/JavaReflect-3D-Engine',
    featured: true,
    dateRange: 'Jun 2024 - Jul 2024',
    associatedWith: 'MBS College of Engg. & Technology',
    category: 'desktop'
  }
];