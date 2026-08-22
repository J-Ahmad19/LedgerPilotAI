import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, Target, BarChart3 } from 'lucide-react';
import gsap from 'gsap';

interface FeatureData {
  icon: typeof Link;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  glowColor: string;
}

const features: FeatureData[] = [
  {
    icon: Link,
    title: 'Deterministic & AI Matching',
    description: 'Rule-based exact matching combined with LLM-powered fuzzy logic for edge cases.',
    gradient: 'from-blue-600/20 to-blue-400/5',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    glowColor: '0 0 30px rgba(59,130,246,0.08)',
  },
  {
    icon: Target,
    title: 'Smart Exception Queue',
    description: "Stop hunting for discrepancies. Our AI explains why records don't match and suggests resolutions.",
    gradient: 'from-emerald-600/20 to-emerald-400/5',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    glowColor: '0 0 30px rgba(16,185,129,0.08)',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Cash Position',
    description: "Instantly answer 'Why is my cash off?' with dynamic variance tracking.",
    gradient: 'from-violet-600/20 to-violet-400/5',
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    iconColor: 'text-violet-400',
    glowColor: '0 0 30px rgba(139,92,246,0.08)',
  },
];

function FeatureCard({ feature, index }: { feature: FeatureData; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gsap.to(card, {
        background: `radial-gradient(circle 300px at ${x}px ${y}px, rgba(255,255,255,0.04), transparent)`,
        duration: 0.4,
      });
      gsap.to(card.querySelector('.icon-wrapper'), {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        background: 'transparent',
        duration: 0.4,
      });
      gsap.to(card.querySelector('.icon-wrapper'), {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      {/* Border glow on hover */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.08] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className="relative glass-card p-8 lg:p-10 h-full hover:border-white/[0.12] transition-all duration-500"
        style={{ boxShadow: 'none' }}
        onMouseEnter={(e) => {
          const card = e.currentTarget;
          (card as HTMLElement).style.boxShadow = feature.glowColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Gradient background overlay */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10">
          {/* Icon */}
          <div className="icon-wrapper inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.06] mb-8">
            <div className={`w-12 h-12 rounded-xl ${feature.iconBg} border ${feature.iconBorder} flex items-center justify-center`}>
              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gradient-primary transition-all duration-300">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-slate-400/90 leading-relaxed text-[15px]">{feature.description}</p>

          {/* Bottom accent line */}
          <div className="mt-8 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.features-title-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.features-title-line', start: 'top 80%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-ledger-blue/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6 uppercase tracking-wider"
          >
            Core Features
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            Everything you need to reconcile{' '}
            <span className="text-gradient-primary">faster and smarter</span>
          </motion.h2>

          <div className="features-title-line h-[2px] w-24 mx-auto bg-gradient-to-r from-ledger-blue to-ledger-emerald mb-5 origin-center" />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400/80 max-w-2xl mx-auto"
          >
            Powerful automation meets intelligent AI to transform your financial operations.
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
