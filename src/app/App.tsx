import { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';
import './components/PortfolioComingSoon.css';

interface StickerData {
  id: number;
  emoji: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  rotation: number;
}

interface ThoughtStep {
  text: string;
  width: string;
}

export default function App() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isBroken, setIsBroken] = useState(false);
  const [showRealText, setShowRealText] = useState(false);
  const [currentThought, setCurrentThought] = useState({ text: 'Initializing...', width: '5%' });
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);

  // Physics refs
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<number, Matter.Body>>(new Map());
  const stickerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isDraggingRef = useRef<boolean>(false);

  // Initial sticker config (percentages for initial placement)
  const [stickers] = useState<StickerData[]>([
    { id: 1, emoji: '☕️', top: '10%', left: '10%', rotation: 0 },
    { id: 2, emoji: '📚', top: '15%', left: '20%', rotation: 0 },
    { id: 3, emoji: '🛋️', top: '12%', right: '15%', rotation: 0 },
    { id: 4, emoji: '📺', top: '8%', right: '10%', rotation: 0 }
  ]);

  const languages = [
    'Coming Soon',
    'Próximamente',
    'जल्द आ रहा है'
  ];

  const thoughts: ThoughtStep[] = [
    { text: 'Loading assets...', width: '10%' },
    { text: 'Refining palettes...', width: '25%' },
    { text: 'Distracted by coffee...', width: '25%' },
    { text: 'Aligning grids...', width: '45%' },
    { text: 'Wait, typo.', width: '40%' },
    { text: 'Fixing typo...', width: '55%' },
    { text: 'Rendering pixels...', width: '70%' },
    { text: 'Hyperfocusing...', width: '85%' },
    { text: 'Almost ready...', width: '95%' }
  ];

  // Cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Text split animation
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsBroken(true);
    }, 2000);

    const timer2 = setTimeout(() => {
      setShowRealText(true);
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Progress bar cycling
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      if (step >= thoughts.length) step = 0;
      setCurrentThought(thoughts[step]);
      step++;
    }, Math.random() * 2000 + 1000);

    return () => clearInterval(interval);
  }, []);

  // Language cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguageIndex((prev) => (prev + 1) % languages.length);
    }, 3000); // Change language every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // --- Physics Implementation ---
  useEffect(() => {
    const Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Runner = Matter.Runner,
      Events = Matter.Events;

    const engine = Engine.create();
    engineRef.current = engine;

    // Gravity: positive Y is down
    engine.world.gravity.y = 0.8;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create boundaries
    // Ground is slightly below screen
    const ground = Bodies.rectangle(width / 2, height + 60, width, 120, { isStatic: true, label: 'Ground' });
    const leftWall = Bodies.rectangle(-60, height / 2, 120, height * 2, { isStatic: true, label: 'LeftWall' });
    const rightWall = Bodies.rectangle(width + 60, height / 2, 120, height * 2, { isStatic: true, label: 'RightWall' });

    World.add(engine.world, [ground, leftWall, rightWall]);

    // Create sticker bodies
    stickers.forEach(sticker => {
      // Calculate initial pixel positions based on percentages
      let x = width / 2;
      let y = height / 2;

      if (sticker.left) x = (parseFloat(sticker.left) / 100) * width;
      if (sticker.right) x = width - ((parseFloat(sticker.right) / 100) * width);

      if (sticker.top) y = (parseFloat(sticker.top) / 100) * height;
      if (sticker.bottom) y = height - ((parseFloat(sticker.bottom) / 100) * height);

      // Random scatter
      x += (Math.random() - 0.5) * 100;

      const radius = 35;
      const body = Bodies.circle(x, y, radius, {
        restitution: 0.8, // Bouncy
        friction: 0.05,
        frictionAir: 0.01,
        angle: (sticker.rotation * Math.PI) / 180,
        label: `Sticker-${sticker.id}`
      });

      bodiesRef.current.set(sticker.id, body);
      World.add(engine.world, body);
    });

    // Run the engine
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Sync loop
    Events.on(engine, 'afterUpdate', () => {
      stickers.forEach(sticker => {
        const body = bodiesRef.current.get(sticker.id);
        const el = stickerRefs.current.get(sticker.id);

        if (body && el) {
          const { x, y } = body.position;
          const angle = body.angle;
          // Update DOM directly bypassing React render
          el.style.transform = `translate(${x - 40}px, ${y - 40}px) rotate(${angle}rad)`;
        }
      });
    });

    // Handle Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      Matter.Body.setPosition(ground, { x: w / 2, y: h + 60 });
      Matter.Body.setPosition(rightWall, { x: w + 60, y: h / 2 });
      // We should also potentially rescale bodies or keep them, simpler to just update walls.
    };

    window.addEventListener('resize', handleResize);

    return () => {
      Runner.stop(runner);
      Engine.clear(engine);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Run once on mount

  // --- Interaction Logic ---
  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    const body = bodiesRef.current.get(id);
    if (!body) return;

    isDraggingRef.current = true;
    Matter.Body.setStatic(body, true); // Freeze rotation/physics while dragging

    // Initial position sync
    Matter.Body.setPosition(body, { x: e.clientX, y: e.clientY });

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent, id: number) => {
    if (!isDraggingRef.current) return;
    const body = bodiesRef.current.get(id);
    if (!body) return;

    // Follow mouse directly
    Matter.Body.setPosition(body, { x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent, id: number) => {
    isDraggingRef.current = false;
    const body = bodiesRef.current.get(id);
    if (!body) return;

    Matter.Body.setStatic(body, false); // Re-enable physics

    // Add a velocity throw vector? 
    // For simplicity, just letting go works.

    (e.target as Element).releasePointerCapture(e.pointerId);
  };


  return (
    <div
      className="min-h-screen w-screen flex flex-col items-center justify-center p-4 select-none relative"
      style={{
        fontFamily: "'Outfit', sans-serif",
        backgroundColor: 'var(--bg-color)',
        color: '#e2e8f0'
      }}
    >
      {/* Cursor Glow */}
      <div
        id="cursor-glow"
        className="hidden md:block"
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />

      {/* Background Blobs */}
      <div className="blob bg-indigo-900 w-[600px] h-[600px] rounded-full" style={{ top: '-20%', left: '-10%' }} />
      <div className="blob bg-fuchsia-900 w-[500px] h-[500px] rounded-full" style={{ bottom: '-20%', right: '-10%' }} />

      {/* Physics Stickers */}
      {stickers.map((sticker) => (
        <div
          key={sticker.id}
          ref={(el) => {
            if (el) stickerRefs.current.set(sticker.id, el);
          }}
          className="sticker hidden md:flex items-center justify-center text-6xl lg:text-8xl cursor-grab active:cursor-grabbing absolute z-50"
          style={{
            touchAction: 'none',
            left: 0,
            top: 0,
            width: '80px',
            height: '80px',
            userSelect: 'none'
          }}
          onPointerDown={(e) => handlePointerDown(e, sticker.id)}
          onPointerMove={(e) => handlePointerMove(e, sticker.id)}
          onPointerUp={(e) => handlePointerUp(e, sticker.id)}
          onPointerLeave={(e) => handlePointerUp(e, sticker.id)}
        >
          {sticker.emoji}
        </div>
      ))}

      {/* Browser Window */}
      <div className="browser-window w-full max-w-5xl mx-auto shadow-2xl" style={{ height: 'min(80vh, 600px)', maxHeight: '600px' }}>

        {/* Browser Header (Tabs) */}
        <div className="browser-header">
          {/* Traffic Lights */}
          <div className="flex gap-2 mr-4 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>

          {/* Tabs Container */}
          <div className="flex-1 flex items-end overflow-hidden">
            <div className="tab">
              <div className="favicon bg-blue-400"></div>
              <span className="truncate">Twitter</span>
            </div>
            <div className="tab">
              <div className="favicon bg-green-500"></div>
              <span className="truncate">Spotify</span>
            </div>
            <div className="tab active">
              <div className="favicon bg-emerald-500 animate-pulse"></div>
              <span className="font-medium text-white truncate">Snehal Solanki</span>
              <span className="ml-auto text-xs text-slate-400 hover:text-white">×</span>
            </div>
            <div className="tab">
              <div className="favicon bg-orange-500"></div>
              <span className="truncate">Figma</span>
            </div>
            <div className="tab hidden sm:flex">
              <div className="favicon bg-red-600"></div>
              <span className="truncate">Netflix</span>
            </div>
          </div>

          {/* New Tab Icon */}
          <div className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white mb-1 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
        </div>

        {/* Browser Body (Address Bar Area + Content) */}
        <div className="bg-slate-900/30 border-b border-white/5 p-3 flex items-center gap-4">
          <div className="flex gap-3 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2v6h6M21.5 22v-6h-6" />
              <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
            </svg>
          </div>
          <div className="flex-1 bg-black/40 rounded-lg h-8 flex items-center px-4 text-xs text-slate-400 font-mono">
            <svg width="12" height="12" className="mr-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            snehalsolanki.com/portfolio-v4-final-final-real
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 py-3 md:py-5 relative overflow-hidden bg-[#0f172a] bg-opacity-95">

          {/* Headline */}
          <div className="glitch-wrapper mb-1 md:mb-2 text-center z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white drop-shadow-xl uppercase">
              {languages[currentLanguageIndex]}
            </h1>
            <span className="text-xs font-mono text-emerald-400/80 mt-1.5 block tracking-[0.2em] md:tracking-[0.3em] uppercase">
              Loading Creative Assets...
            </span>
          </div>

          {/* Progress Bar (Retro 3D Style - THIN) */}
          <div className="w-full max-w-xs md:max-w-md mb-2 md:mb-3 relative px-4">
            <div className="retro-loader-container group">
              <div
                className="retro-loader-bar"
                style={{ width: currentThought.width }}
              />
            </div>
            <div className="text-center mt-1.5">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold">
                {currentThought.width}
              </span>
            </div>
          </div>

          {/* Status Text */}
          <div className="h-5 mb-1 md:mb-2 text-center px-4">
            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">
              {currentThought.text}
            </p>
          </div>

          {/* Bio / Text Section */}
          <div className="text-center max-w-2xl z-10 relative flex flex-col items-center px-4 md:px-6">

            {/* 1. Idealistic (The Shell) - Fades out */}
            <div className={`idealistic-text text-sm sm:text-base md:text-xl mb-4 ${isBroken ? 'fade-out' : ''}`}>
              "I am a visionary crafting digital symphonies that disrupt the paradigm."
            </div>

            {/* 2. Realistic (The Core Reveal) - Fades in */}
            <div className={`real-text font-normal text-slate-200 text-sm sm:text-base md:text-xl leading-relaxed ${showRealText ? 'visible' : ''}`}>
              <p>
                Hi, I'm <span className="font-bold text-white">Snehal Solanki</span>.
              </p>
              <p className="mt-2">
                I'm a multi-disciplinary designer trying to solve your business and product problems.
                I succeed most of the time, fail sometimes (like we all do), and I promise I'm just looking for the right shade of hex code #000000 right now.
              </p>
            </div>
          </div>

          {/* Footer / CTA */}
          <div
            className="mt-auto pt-4 md:pt-6 pb-2 flex gap-4 md:gap-6 text-sm md:text-base flex-wrap justify-center"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.5s ease-out 4s forwards'
            }}
          >
            <a href="mailto:hello@snehalsolanki.com" className="cta-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Say Hello
            </a>
            <a href="https://www.linkedin.com/in/snehalsolanki" target="_blank" rel="noopener noreferrer" className="cta-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
              </svg>
              LinkedIn
            </a>
          </div>

        </div>
      </div>

      {/* Floating Dock (macOS style) */}
      <div className="floating-dock hidden md:flex items-end">
        <div className="dock-item group relative" title="Finder">
          <div className="text-3xl mb-1">😊</div>
          <div className="w-1 h-1 rounded-full bg-slate-500 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="dock-item group relative" title="Chrome">
          <div className="text-3xl mb-1">🌐</div>
          <div className="w-1 h-1 rounded-full bg-white mx-auto"></div>
        </div>
        <div className="dock-item group relative" title="Figma">
          <div className="text-3xl mb-1">🎨</div>
          <div className="w-1 h-1 rounded-full bg-white mx-auto"></div>
        </div>
        <div className="dock-item group relative" title="Spotify">
          <div className="text-3xl mb-1">🎵</div>
          <div className="w-1 h-1 rounded-full bg-white mx-auto"></div>
        </div>
        <div className="dock-item group relative" title="Notion">
          <div className="text-3xl mb-1">📝</div>
          <div className="w-1 h-1 rounded-full bg-slate-500 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="dock-divider h-8 bg-white/10 mx-2"></div>
        <div className="dock-item group relative" title="Trash">
          <div className="text-3xl mb-1">🗑️</div>
        </div>
      </div>
    </div>
  );
}