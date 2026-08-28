import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin } from 'lucide-react';
import gsap from 'gsap';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Changelog', href: '#' },
    { name: 'Documentation', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Security', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-col',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
          },
        }
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative border-t border-charm-border bg-charm-band">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-charm-brand/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-5"
            >
              <a href="#" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
                  <span className="text-white font-bold text-sm font-display">L</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-charm-heading font-display">
                  Ledger<span className="text-charm-brand">Pilot</span>AI
                </span>
              </a>
            </motion.div>
            <p className="text-sm text-charm-muted mb-6 max-w-[240px] leading-relaxed">
              Automated financial reconciliation powered by deterministic matching and AI.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-white border border-charm-border flex items-center justify-center text-charm-muted hover:text-charm-brand hover:border-charm-brand shadow-sm transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="footer-col">
              <h4 className="text-sm font-semibold text-charm-heading mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-charm-muted hover:text-charm-brand transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-charm-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-charm-muted">
            &copy; {new Date().getFullYear()} LedgerPilotAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-charm-border text-charm-muted font-medium shadow-sm">
              SOC 2 Type II
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-charm-border text-charm-muted font-medium shadow-sm">
              GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
