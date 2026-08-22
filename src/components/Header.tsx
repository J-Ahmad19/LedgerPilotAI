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
          ? 'bg-[#06060f]/70 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ledger-blue to-ledger-emerald flex items-center justify-center shadow-lg group-hover:shadow-ledger-blue/20 transition-shadow duration-300">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ledger-blue to-ledger-emerald opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Ledger<span className="text-ledger-blue-glow">Pilot</span>AI
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition-colors duration-200 group/link"
              >
                <span className="relative z-10">{link.name}</span>
                <div className="absolute inset-0 bg-white/[0.04] rounded-lg opacity-0 group-hover/link:opacity-100 transition-opacity duration-200" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#"
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
            >
              Log In
            </a>
            <a
              ref={ctaRef}
              href="#"
              className="relative px-6 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden group/cta"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ledger-blue to-ledger-blue-light rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-ledger-emerald to-ledger-blue opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500 rounded-xl" />
              <span className="relative z-10">Start Free Trial</span>
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
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
            className="lg:hidden bg-[#06060f]/95 backdrop-blur-2xl border-t border-white/[0.05] overflow-hidden"
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
                  className="block px-4 py-3.5 text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="pt-4 space-y-2">
                <a
                  href="#"
                  className="block w-full text-center px-4 py-3.5 text-slate-300 hover:text-white border border-white/[0.08] rounded-xl transition-all hover:bg-white/[0.03]"
                >
                  Log In
                </a>
                <a
                  href="#"
                  className="block w-full text-center px-4 py-3.5 text-white bg-gradient-to-r from-ledger-blue to-ledger-blue-light rounded-xl font-semibold hover:shadow-lg hover:shadow-ledger-blue/20 transition-all"
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
