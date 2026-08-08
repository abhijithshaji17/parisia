import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles, Compass, Menu, X, Check, Mail, Globe, ChevronRight, Hotel, Landmark, Utensils, ShieldCheck, Clock, MapPin, Award, Key } from 'lucide-react';

// Reusable Scroll Reveal Animation Component using Intersection Observer
function Reveal({ 
  children, 
  className = '', 
  delay = 0, 
  direction = 'up',
  threshold = 0.05,
  initialVisible = false
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number; 
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'none';
  threshold?: number;
  initialVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    if (initialVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold, rootMargin: '50px 0px 50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    
    // Safety fallback: ensure elements become visible even if scroll observer is delayed
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000 + delay);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [threshold, initialVisible, delay]);

  const getAnimationStyles = () => {
    if (isVisible) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100';
    }
    switch (direction) {
      case 'up': return 'opacity-0 translate-y-8 scale-[0.99]';
      case 'down': return 'opacity-0 -translate-y-8 scale-[0.99]';
      case 'left': return 'opacity-0 -translate-x-8';
      case 'right': return 'opacity-0 translate-x-8';
      case 'zoom': return 'opacity-0 scale-95';
      case 'none': return 'opacity-0';
      default: return 'opacity-0 translate-y-8';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${getAnimationStyles()} ${className}`}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('Home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  // Animation & Canvas Loading States
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const smoothScrollRef = useRef({
    targetFrame: 1,
    currentFrame: 1,
    ease: 0.08
  });

  const navItems = ['Home', 'Clients', 'Services', 'About us', 'Contact'];

  const handleNavClick = (item: string) => {
    setActiveNav(item);
    if (item === 'Contact') {
      setIsContactOpen(true);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setIsContactOpen(false);
    }, 2000);
  };

  // Preload scroll animation images
  useEffect(() => {
    const frameCount = 300;
    const loadedImages: HTMLImageElement[] = new Array(frameCount).fill(null as unknown as HTMLImageElement);
    let loadedCount = 0;
    let dismissed = false;

    const currentFrame = (index: number) => {
      const paddedIndex = String(index).padStart(3, '0');
      return `/ezgif-861934f1fd27dda8-jpg/ezgif-frame-${paddedIndex}.jpg`;
    };

    const dismissPreloader = () => {
      if (dismissed) return;
      dismissed = true;
      setIsLoaded(true);
    };

    // Load Frame 1 FIRST so UI renders immediately
    const firstImg = new Image();
    firstImg.onload = () => {
      loadedImages[0] = firstImg;
      loadedCount++;
      setProgress(1);
      setTimeout(dismissPreloader, 200);

      // Load remaining frames in background
      for (let i = 2; i <= frameCount; i++) {
        const img = new Image();
        const handleLoad = () => {
          loadedCount++;
          loadedImages[i - 1] = img;
          const percent = Math.round((loadedCount / frameCount) * 100);
          setProgress(percent);
          if (loadedCount >= 10 && !dismissed) {
            dismissPreloader();
          }
        };
        img.onload = handleLoad;
        img.onerror = handleLoad;
        img.src = currentFrame(i);
      }
    };
    firstImg.onerror = () => {
      dismissPreloader();
    };
    firstImg.src = currentFrame(1);

    imagesRef.current = loadedImages;
  }, []);

  // Set up canvas sizing, scroll listener, and smooth lerping animation loop
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
      smoothScrollRef.current.targetFrame = 1 + scrollFraction * 299;
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(Math.round(smoothScrollRef.current.currentFrame));
    };

    const renderFrame = (index: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const images = imagesRef.current;
      if (!canvas || !context || images.length === 0) return;

      const imgIndex = Math.max(1, Math.min(300, index));
      let img = images[imgIndex - 1];

      // Fallback to nearest loaded image if current frame is not ready
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < 300; offset++) {
          const prev = images[imgIndex - 1 - offset];
          if (prev && prev.complete && prev.naturalWidth > 0) {
            img = prev;
            break;
          }
          const next = images[imgIndex - 1 + offset];
          if (next && next.complete && next.naturalWidth > 0) {
            img = next;
            break;
          }
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      // High quality smoothing to remove pixelation
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Aspect ratio covering logic
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Initial canvas sizing setup
    handleResize();

    let animationFrameId: number;
    const animate = () => {
      const diff = smoothScrollRef.current.targetFrame - smoothScrollRef.current.currentFrame;
      smoothScrollRef.current.currentFrame += diff * smoothScrollRef.current.ease;

      if (Math.abs(diff) > 0.01) {
        renderFrame(Math.round(smoothScrollRef.current.currentFrame));
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoaded]);

  return (
    <div className="w-full min-h-screen bg-transparent text-white font-['DM_Sans',sans-serif] flex flex-col items-center justify-start p-0 md:p-4 selection:bg-white selection:text-black gap-8 md:gap-12 relative">
      
      {/* Background Fixed Canvas Container with Grain Texture & Smoothing Filters */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-black overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover block filter contrast-[1.02] brightness-[0.98] blur-[0.25px]" 
        />
        {/* Subtle Film Grain Noise Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.045] mix-blend-overlay z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Preloader Overlay */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center w-full max-w-xs px-4">
            <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-lg font-light tracking-widest uppercase mb-4 text-white">Preparing Flight</h2>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-indigo-500 transition-all duration-100 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-neutral-400 font-mono">{progress}% loaded</p>
          </div>
        </div>
      )}

      {/* Hero Banner Container */}
      <div className="w-full max-w-[1440px] h-[900px] text-white flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Top Header Navigation */}
        <Reveal direction="down" delay={100} className="w-full">
          <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between relative z-20">
            {/* Logo */}
            <div className="flex items-center">
              <a href="#" className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white hover:opacity-90 transition-opacity">
                PARISIA
              </a>
            </div>

            {/* Center Navigation Bar - Absolute Centered & strictly single line */}
            <nav className="hidden md:flex items-center gap-1 bg-black/30 border border-white/12 p-1.5 rounded-full backdrop-blur-md absolute left-1/2 -translate-x-1/2 whitespace-nowrap flex-nowrap">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeNav === item
                      ? 'bg-white text-black shadow-md'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Right Actions - Menu Button Only */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Menu</span>
                <Menu className="w-4 h-4 md:hidden" />
              </button>
            </div>
          </header>
        </Reveal>

        {/* Main Hero Banner Center Content - Centered in plane window */}
        <main className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 max-w-3xl mx-auto w-full my-auto py-2">
          {/* Main Display Headline - 3 lines */}
          <Reveal direction="up" delay={200}>
            <h1 className="text-3xl sm:text-[48px] md:text-[52px] font-medium tracking-tight text-white leading-[1.14] max-w-xl mx-auto">
              Discover Paris<br />
              Beyond the<br />
              Ordinary
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal direction="up" delay={350}>
            <p className="mt-3.5 text-sm sm:text-base md:text-[17px] text-white font-normal max-w-xl mx-auto leading-relaxed opacity-90">
              From moonlit views of the Eiffel Tower to hidden cafés tucked along cobblestone streets, experience Paris through thoughtfully curated journeys designed for unforgettable moments.
            </p>
          </Reveal>

          {/* CTA Button */}
          <Reveal direction="up" delay={500}>
            <div className="mt-5 sm:mt-6">
              <button
                onClick={() => setIsContactOpen(true)}
                className="group bg-white text-black hover:bg-neutral-100 font-medium pl-6 pr-2 py-2 rounded-full inline-flex items-center gap-3 transition-all duration-300 shadow-xl shadow-white/5 cursor-pointer text-sm sm:text-base hover:scale-105"
              >
                <span className="font-medium text-black">Book Your Paris Escape</span>
                <div className="w-8 h-8 rounded-full bg-[#0066ff] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </Reveal>
        </main>

        {/* Bottom Floating Cards Layout */}
        <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-0 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto items-stretch">
            {/* Bottom Left Card: Luxury Meets Discovery */}
            <Reveal direction="up" delay={650}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  {/* Icon Box */}
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                  </div>
                  
                  {/* Card Title */}
                  <h2 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Luxury Meets Discovery
                  </h2>

                  {/* Card Body Paragraph */}
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    From boutique hotels to private city experiences, every detail is thoughtfully planned for a seamless Parisian escape.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Bottom Right Card: Where Dreams Meet Destination */}
            <Reveal direction="up" delay={800}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  {/* Icon Box */}
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Compass className="w-4 h-4 text-black stroke-[2.5]" />
                  </div>

                  {/* Card Title */}
                  <h2 className="text-lg sm:text-xl font-medium text-white mb-2">
                    Where Dreams Meet Destination
                  </h2>

                  {/* Card Body Paragraph */}
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    From moonlit Eiffel Tower views to enchanting Parisian streets, every moment is designed to inspire wonder.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </footer>

        {/* Slide-over Navigation Menu Modal */}
        {isMenuOpen && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 sm:p-10 justify-between animate-in fade-in duration-200">
            <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
              <span className="text-2xl font-extrabold tracking-wider text-white">PARISIA</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full max-w-6xl mx-auto my-auto py-4">
              <div className="flex flex-col gap-5 text-left">
                {navItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setActiveNav(item);
                      setIsMenuOpen(false);
                      if (item === 'Contact') setIsContactOpen(true);
                    }}
                    className={`text-3xl sm:text-4xl font-medium text-left transition-colors flex items-center justify-between group cursor-pointer ${
                      activeNav === item ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <span>{item}</span>
                    <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-6xl mx-auto pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs sm:text-sm text-white/70">
              <p>Thoughtfully curated journeys designed for unforgettable moments.</p>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Paris, France</span>
                <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> concierge@paris-escape.com</span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Consultation Modal ("Book Your Paris Escape") */}
        {isContactOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-white/20 rounded-3xl p-6 max-w-lg w-full relative text-left animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsContactOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {contactSubmitted ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mb-4">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Reservation Request Received!</h3>
                  <p className="text-white/80 text-sm">Thank you for reaching out. Our Paris travel specialist will contact you shortly.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl sm:text-2xl font-medium text-white mb-1.5">
                    Book Your Paris Escape
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mb-5">
                    Fill out the form below to begin planning your bespoke Parisian journey.
                  </p>

                  <form onSubmit={handleContactSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-white/80 mb-1 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Eleanor Vance"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/80 mb-1 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/80 mb-1 uppercase tracking-wider">
                        Travel Dates & Preferences
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Preferred dates, boutique hotel requests, private tour interests..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-colors resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black font-medium py-2.5 rounded-xl hover:bg-neutral-100 text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <span>Request Reservation</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Proudly Partnered by Premier Airline Partners Section */}
      <section className="w-full max-w-[1440px] text-white relative overflow-hidden flex flex-col justify-between py-16 sm:py-24 px-4 sm:px-8">
        {/* Soft Background Warm Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-700/15 via-red-900/15 to-orange-800/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Center Content: Headline & Subtext */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center mb-16 sm:mb-20">
          <Reveal direction="up" delay={100}>
            {/* Main Headline with exact mixed typography */}
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-normal leading-[1.15] text-white tracking-tight">
              <span className="font-['Playfair_Display',serif] italic block sm:inline">Proudly Partnered </span>
              <span className="font-['Playfair_Display',serif] italic">with </span>
              <span className="font-['DM_Sans',sans-serif]">Premier Airlines </span>
              <br className="hidden sm:block" />
              <span className="font-['DM_Sans',sans-serif]">Across </span>
              <span className="font-['Playfair_Display',serif] italic">the Globe</span>
              <sup className="text-[#ff3b30] font-sans text-xl sm:text-3xl font-semibold ml-0.5 select-none inline-block -translate-y-2">®</sup>
            </h2>
          </Reveal>

          <Reveal direction="up" delay={250}>
            {/* Subtext with mixed typography */}
            <p className="mt-8 text-base sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto leading-relaxed text-center font-normal">
              <span className="font-['Playfair_Display',serif] italic text-white/95">We've partnered with world-class </span>
              <span className="font-['DM_Sans',sans-serif]">airline partners to deliver seamless, luxury flight experiences and effortless journeys to Paris</span>
            </p>
          </Reveal>
        </div>

        {/* Bottom Airline Partner Logos Bar */}
        <div className="relative z-10 w-full pt-8 border-t border-white/15">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-8 sm:gap-10 opacity-85 hover:opacity-100 transition-opacity">
            
            {/* Airline 1: Air France */}
            <Reveal direction="up" delay={150}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M2.5 19.5L21.5 4.5H16L2 16.5v3zM5 19.5h16.5L9.5 10 5 19.5z"/>
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black tracking-[0.2em] uppercase font-['DM_Sans',sans-serif]">AIR FRANCE</span>
                  <span className="text-[8px] tracking-widest uppercase opacity-70">OFFICIAL PARTNER</span>
                </div>
              </div>
            </Reveal>

            {/* Airline 2: Emirates */}
            <Reveal direction="up" delay={250}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center font-serif text-white font-extrabold text-xs tracking-tighter shadow-sm">
                  EK
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold tracking-widest uppercase font-['DM_Sans',sans-serif]">Emirates</span>
                  <span className="text-[8px] tracking-widest uppercase opacity-75">FLY BETTER</span>
                </div>
              </div>
            </Reveal>

            {/* Airline 3: Qatar Airways */}
            <Reveal direction="up" delay={350}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8] text-amber-300" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 14l4-5 4 5M12 9v6" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-widest uppercase font-['DM_Sans',sans-serif]">QATAR</span>
                  <span className="text-[8px] tracking-widest uppercase opacity-75">AIRWAYS</span>
                </div>
              </div>
            </Reveal>

            {/* Airline 4: Singapore Airlines */}
            <Reveal direction="up" delay={450}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 fill-current text-amber-400" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-wider uppercase font-['DM_Sans',sans-serif]">SINGAPORE</span>
                  <span className="text-[8px] tracking-widest uppercase opacity-70">AIRLINES</span>
                </div>
              </div>
            </Reveal>

            {/* Airline 5: Delta Air Lines */}
            <Reveal direction="up" delay={550}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 fill-current text-sky-400" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 5l7 12H5l7-12z"/>
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold tracking-widest uppercase font-['DM_Sans',sans-serif]">DELTA</span>
                  <span className="text-[8px] tracking-wider uppercase opacity-70">SKYTEAM ALLIANCE</span>
                </div>
              </div>
            </Reveal>

            {/* Airline 6: British Airways */}
            <Reveal direction="up" delay={650}>
              <div className="flex items-center gap-2.5 text-white hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 stroke-current fill-none stroke-[2] text-blue-400" viewBox="0 0 24 24">
                  <path d="M4 16c6-4 10-4 16 0M4 12c6-4 10-4 16 0" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-wider uppercase font-['DM_Sans',sans-serif]">BRITISH AIRWAYS</span>
                  <span className="text-[8px] tracking-widest uppercase opacity-70">CLUB WORLD</span>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* SECTION 3: Four Feature Cards Section */}
      <section className="w-full max-w-[1440px] text-white relative overflow-hidden py-16 sm:py-20 px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <Reveal direction="up" delay={100} className="relative z-10 max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.18] text-white tracking-tight">
            <span className="font-['Playfair_Display',serif] italic">Crafting </span>
            <span className="font-['DM_Sans',sans-serif]">Unforgettable </span>
            <span className="font-['Playfair_Display',serif] italic">Parisian </span>
            <span className="font-['DM_Sans',sans-serif]">Experiences</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-xl mx-auto font-normal leading-relaxed">
            Four tailored pillars designed to elevate every moment of your journey.
          </p>
        </Reveal>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 max-w-7xl mx-auto items-stretch relative z-10">
          
          {/* Card 1 */}
          <Reveal direction="up" delay={150}>
            <div className="bg-gradient-to-b from-[#0c2340]/50 via-[#09182a]/75 to-[#040a14]/95 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/40 hover:-translate-y-2 hover:from-[#0c2340]/65 transition-all duration-300 shadow-xl shadow-blue-950/20 group h-full">
              <div>
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                  <Hotel className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                  Curated Accommodations
                </h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-90">
                  Stay in handpicked boutique hotels and private penthouses with unmatched views and exceptional service tailored to your preference.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 2 */}
          <Reveal direction="up" delay={300}>
            <div className="bg-gradient-to-b from-[#0c2340]/50 via-[#09182a]/75 to-[#040a14]/95 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/40 hover:-translate-y-2 hover:from-[#0c2340]/65 transition-all duration-300 shadow-xl shadow-blue-950/20 group h-full">
              <div>
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                  <Landmark className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                  Private Guided Journeys
                </h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-90">
                  Explore hidden historical treasures and iconic landmarks accompanied by local experts who bring Paris to life.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 3 */}
          <Reveal direction="up" delay={450}>
            <div className="bg-gradient-to-b from-[#0c2340]/50 via-[#09182a]/75 to-[#040a14]/95 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/40 hover:-translate-y-2 hover:from-[#0c2340]/65 transition-all duration-300 shadow-xl shadow-blue-950/20 group h-full">
              <div>
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                  Exclusive Dining Access
                </h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-90">
                  Savor Michelin-starred culinary creations and reserve private dining tables at the city's most coveted gastronomy spots.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 4 */}
          <Reveal direction="up" delay={600}>
            <div className="bg-gradient-to-b from-[#0c2340]/50 via-[#09182a]/75 to-[#040a14]/95 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/40 hover:-translate-y-2 hover:from-[#0c2340]/65 transition-all duration-300 shadow-xl shadow-blue-950/20 group h-full">
              <div>
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                  Bespoke Concierge
                </h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-90">
                  From seamless private transfers to VIP access passes, our dedicated 24/7 team handles every detail effortlessly.
                </p>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* SECTION 4: Parisia Accomplishments & Testimonial Section */}
      <section className="w-full max-w-[1440px] text-white relative overflow-hidden py-12 sm:py-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Eiffel Tower Photo Card */}
          <Reveal direction="left" delay={200} className="lg:col-span-5 h-full w-full">
            <div className="border border-white/15 rounded-2xl sm:rounded-3xl overflow-hidden relative min-h-[420px] lg:min-h-full h-full w-full flex items-center justify-center group shadow-xl">
              <img 
                src="/eiffel-night.jpg" 
                alt="Eiffel Tower Parisia" 
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Reveal>

          {/* Right Column: Blue Gradient Accomplishments & Testimonial Card */}
          <Reveal direction="right" delay={350} className="lg:col-span-7 h-full w-full">
            <div className="bg-gradient-to-br from-[#0c2340]/55 via-[#09182a]/60 to-[#040a14]/65 backdrop-blur-md border border-white/15 rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col justify-between text-left relative overflow-hidden shadow-[0_0_50px_rgba(0,102,255,0.15)] hover:border-white/35 hover:-translate-y-1 transition-all duration-300 h-full">
              {/* Soft subtle blue radial background blur accent */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[90px] pointer-events-none" />

              {/* Top Quote Block */}
              <div className="relative z-10 mb-8 sm:mb-12">
                <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-white leading-snug uppercase font-['DM_Sans',sans-serif]">
                  " PARISIA CURATED AN UNPARALLELED BESPOKE JOURNEY FOR OUR ESCAPE. FROM PRIVATE LOUVRE ACCESS TO COVETED DINING RESERVATIONS, EVERY MOMENT WAS EXQUISITE "
                </blockquote>
              </div>

              {/* Bottom Content: Accomplishment Stats Row & Author Signature */}
              <div className="relative z-10 space-y-8 sm:space-y-10">
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/10 pt-6 sm:pt-8">
                  <div>
                    <div className="text-2xl sm:text-4xl lg:text-5xl font-medium text-white tracking-tight font-['DM_Sans',sans-serif]">
                      500+
                    </div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mt-1 font-normal">
                      Curated Escapes
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-4xl lg:text-5xl font-medium text-white tracking-tight font-['DM_Sans',sans-serif]">
                      99.4%
                    </div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mt-1 font-normal">
                      5-Star Rating
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-4xl lg:text-5xl font-medium text-white tracking-tight font-['DM_Sans',sans-serif]">
                      100%
                    </div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mt-1 font-normal">
                      VIP Access Rate
                    </div>
                  </div>
                </div>

                {/* Author Info */}
                <div className="pt-2">
                  <div className="text-sm sm:text-base font-medium text-white tracking-wider uppercase font-['DM_Sans',sans-serif]">
                    — CLAIRE DUBOIS
                  </div>
                  <div className="text-xs text-white/75 mt-0.5 font-normal">
                    Paris Concierge Client & Private Member
                  </div>
                </div>
              </div>

            </div>
          </Reveal>

        </div>
      </section>

      {/* SECTION 5: 4 Cards with Center Empty Space */}
      <section className="w-full max-w-[1440px] text-white relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <Reveal direction="up" delay={100} className="relative z-10 max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.18] text-white tracking-tight">
            <span className="font-['Playfair_Display',serif] italic">Excellence </span>
            <span className="font-['DM_Sans',sans-serif]">in Every </span>
            <span className="font-['Playfair_Display',serif] italic">Detail</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-xl mx-auto font-normal leading-relaxed">
            Four pillars of uncompromising quality crafted for the discerning traveler.
          </p>
        </Reveal>

        {/* 3-Column Layout: Left (2 cards), Center (Empty Space), Right (2 cards) */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
          
          {/* Left Column (2 Cards) */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            {/* Left Card 1 */}
            <Reveal direction="up" delay={150}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                    Seamless 24/7 Service
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    Instant response concierge available around the clock to meet every request and itinerary adjustment.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Left Card 2 */}
            <Reveal direction="up" delay={300}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                    Prime Destinations
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    Access to ultra-exclusive addresses across Paris, from historic Le Marais to prestigious Place Vendôme.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Center Column: Empty Space for Visual */}
          <div className="hidden lg:block lg:col-span-4 min-h-[350px] pointer-events-none" />

          {/* Right Column (2 Cards) */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            {/* Right Card 1 */}
            <Reveal direction="up" delay={250}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                    Tailored Curations
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    Every itinerary is bespoke, designed specifically around your lifestyle preferences and unique desires.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Right Card 2 */}
            <Reveal direction="up" delay={400}>
              <div className="bg-black/30 border border-white/12 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-white/35 hover:-translate-y-1.5 hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-lg group h-full">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-4 shadow-md text-black group-hover:scale-110 transition-transform duration-300">
                    <Key className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">
                    Complete Privacy
                  </h3>
                  <p className="text-white text-xs sm:text-sm leading-relaxed font-normal opacity-85">
                    Discreet high-level security and confidential arrangements for complete peace of mind.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>
    </div>
  );
}

