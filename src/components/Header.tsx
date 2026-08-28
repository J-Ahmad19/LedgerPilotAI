import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import gsap from 'gsap';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Magnetic button effect for CTA
    const cta = ctaRef.current;
    if (!cta) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cta.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(cta, {
        x: x * 0.15,
        y: y * 0.15,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(cta, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    };

    cta.addEventListener('mousemove', handleMouseMove);
    cta.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cta.removeEventListener('mousemove', handleMouseMove);
      cta.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-2xl border-b border-charm-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img src="/logo.jpg" alt="LedgerPilot Logo" className="w-9 h-9 rounded-xl shadow-brand group-hover:shadow-lg transition-shadow duration-300" />
            </div>
            <span className="text-lg font-bold tracking-tight text-charm-heading font-display">
              Ledger<span className="text-charm-brand">Pilot</span>AI
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 text-sm text-charm-muted hover:text-charm-heading rounded-lg transition-colors duration-200 group/link"
              >
                <span className="relative z-10">{link.name}</span>
                <div className="absolute inset-0 bg-charm-muted/5 rounded-lg opacity-0 group-hover/link:opacity-100 transition-opacity duration-200" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-charm-muted hover:text-charm-heading transition-colors duration-200"
            >
              Log In
            </a>
            <a
              ref={ctaRef}
              href="/signup"
              className="px-6 py-2.5 text-sm font-semibold charm-btn-primary"
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-charm-muted hover:text-charm-heading transition-colors rounded-lg hover:bg-charm-muted/5"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden bg-charm-panel/95 backdrop-blur-2xl border-t border-charm-border overflow-hidden shadow-float"
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="block px-4 py-3.5 text-charm-body hover:text-charm-heading hover:bg-charm-muted/5 rounded-xl transition-all"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="pt-4 space-y-2">
                <a
                  href="/login"
                  className="block w-full text-center px-4 py-3.5 text-charm-heading hover:bg-charm-muted/5 border border-charm-border rounded-full transition-all"
                >
                  Log In
                </a>
                <a
                  href="/signup"
                  className="block w-full text-center px-4 py-3.5 charm-btn-primary"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
