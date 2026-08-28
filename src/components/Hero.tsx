import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import gsap from 'gsap';
import DashboardMockup from './DashboardMockup';

// Removed FloatingParticle for cleaner Charm aesthetic

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
    }, heroRef);
    return ctx;
  }, []);

  useEffect(() => {
    const ctx = setupGSAP();
    return () => ctx.revert();
  }, [setupGSAP]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-charm-band">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-charm-border text-charm-heading shadow-sm text-sm font-medium mb-8 opacity-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-charm-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-charm-brand" />
            </span>
            Now with AI-Powered Exception Resolution
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-charm-heading font-display"
            style={{ perspective: '1000px' }}
          >
            <span className="word inline-block opacity-0">Automate&nbsp;</span>
            <span className="word inline-block opacity-0">Your&nbsp;</span>
            <span className="word inline-block text-charm-brand opacity-0">Financial&nbsp;</span>
            <span className="word inline-block text-charm-brand opacity-0">Reconciliation&nbsp;</span>
            <br className="hidden sm:block" />
            <span className="word inline-block opacity-0">with&nbsp;</span>
            <span className="word inline-block text-charm-brand opacity-0">AI</span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl text-charm-muted max-w-2xl mx-auto mb-10 leading-relaxed opacity-0"
          >
            Eliminate manual data entry, resolve exceptions instantly, and get a crystal-clear view of your cash position—all powered by intelligent matching.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base charm-btn-primary w-full sm:w-auto"
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </a>
            <a
              href="/login"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base charm-btn-secondary w-full sm:w-auto"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-charm-muted/10 border border-charm-border">
                <Play className="w-3.5 h-3.5 text-charm-heading ml-0.5" />
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
