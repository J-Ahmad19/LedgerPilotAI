import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import gsap from 'gsap';
import DashboardMockup from './DashboardMockup';

function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-ledger-blue/20"
      style={{ left: `${x}%`, width: size, height: size, bottom: '10%' }}
      animate={{
        y: [0, -400, -800],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1, 0.3],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const setupGSAP = useCallback(() => {
    const ctx = gsap.context(() => {
      // Background glow breathing
      gsap.to('.hero-glow-primary', {
        scale: 1.3,
        opacity: 0.6,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.hero-glow-secondary', {
        scale: 1.2,
        opacity: 0.4,
        duration: 7,
        delay: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Headline word-by-word reveal
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        gsap.fromTo(
          words,
          { opacity: 0, y: 40, rotationX: -40 },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.3,
          }
        );
      }

      // Badge slide in
      if (badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.8, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)', delay: 0.1 }
        );
      }

      // Subtitle fade up
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.8 }
        );
      }

      // CTA buttons stagger
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out', delay: 1 }
        );
      }

      // Parallax on mouse move
      if (glowRef.current && heroRef.current) {
        const heroEl = heroRef.current;
        const handleMouseMove = (e: MouseEvent) => {
          const rect = heroEl.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(glowRef.current, {
            x: x * 60,
            y: y * 60,
            duration: 1.2,
            ease: 'power2.out',
          });
        };
        heroEl.addEventListener('mousemove', handleMouseMove);
        return () => heroEl.removeEventListener('mousemove', handleMouseMove);
      }
    }, heroRef);
    return ctx;
  }, []);

  useEffect(() => {
    const ctx = setupGSAP();
    return () => ctx.revert();
  }, [setupGSAP]);

  const particles = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 0.5,
    x: Math.random() * 100,
    size: Math.random() * 4 + 2,
  }));

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          ref={glowRef}
          className="hero-glow-primary absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="hero-glow-secondary absolute top-[40%] left-[30%] w-[500px] h-[400px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(ellipse, rgba(5,150,105,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="hero-glow-secondary absolute top-[30%] right-[20%] w-[400px] h-[350px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <FloatingParticle key={i} delay={p.delay} x={p.x} size={p.size} />
        ))}
      </div>

      {/* Orbit Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 border border-ledger-blue/[0.06] rounded-full animate-counter-spin" />
        <div className="absolute inset-8 border border-ledger-emerald/[0.04] rounded-full animate-counter-spin" style={{ animationDuration: '30s' }} />
        <div className="absolute top-1/2 left-0 w-2 h-2 -ml-1 -mt-1 bg-ledger-blue/40 rounded-full" style={{ animation: 'orbitGlow 12s linear infinite' }} />
        <div className="absolute top-0 right-1/4 w-1.5 h-1.5 bg-ledger-emerald/30 rounded-full" style={{ animation: 'orbitGlow 16s linear infinite reverse' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-ledger-blue/10 border border-ledger-blue/20 text-ledger-blue-glow text-sm font-medium mb-8 opacity-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Now with AI-Powered Exception Resolution
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
            style={{ perspective: '1000px' }}
          >
            <span className="word inline-block opacity-0">Automate&nbsp;</span>
            <span className="word inline-block opacity-0">Your&nbsp;</span>
            <span className="word inline-block text-gradient-primary opacity-0">Financial&nbsp;</span>
            <span className="word inline-block text-gradient-primary opacity-0">Reconciliation&nbsp;</span>
            <br className="hidden sm:block" />
            <span className="word inline-block opacity-0">with&nbsp;</span>
            <span className="word inline-block text-gradient-emerald opacity-0">AI</span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl text-slate-400/90 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0"
          >
            Eliminate manual data entry, resolve exceptions instantly, and get a crystal-clear view of your cash position—all powered by intelligent matching.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ledger-blue to-ledger-blue-light rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-ledger-blue-light to-ledger-emerald opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <span className="relative z-10">Book a Demo</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </a>
            <a
              href="#"
              className="group inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-slate-300 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ledger-blue/10 border border-ledger-blue/20">
                <Play className="w-3.5 h-3.5 text-ledger-blue-glow ml-0.5" />
              </span>
              Explore the Dashboard
            </a>
          </div>
        </div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
