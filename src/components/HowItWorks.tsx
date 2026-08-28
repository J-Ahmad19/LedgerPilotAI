import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Zap, CheckCircle } from 'lucide-react';
import gsap from 'gsap';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Ingest',
    description: 'Upload CSV/JSON or connect via API.',
    gradient: 'from-blue-600 to-blue-400',
    shadow: '0 0 40px rgba(37,99,235,0.2)',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    numColor: 'text-blue-400',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Reconcile',
    description: 'The engine scores and matches transactions instantly.',
    gradient: 'from-emerald-600 to-emerald-400',
    shadow: '0 0 40px rgba(5,150,105,0.2)',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    numColor: 'text-emerald-400',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Resolve',
    description: 'Review AI-flagged exceptions in a clean queue.',
    gradient: 'from-violet-600 to-violet-400',
    shadow: '0 0 40px rgba(124,58,237,0.2)',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    numColor: 'text-violet-400',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const connectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Animate the connector line
      if (connectorRef.current) {
        gsap.fromTo(
          connectorRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: connectorRef.current,
              start: 'top 75%',
            },
          }
        );
      }

      // Pulse effect on step icons
      gsap.to('.step-icon-pulse', {
        scale: 1.15,
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.5,
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-ledger-emerald/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-charm-border text-charm-heading shadow-sm text-sm font-semibold mb-6 uppercase tracking-wider"
          >
            How It Works
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 text-charm-heading font-display"
          >
            Three steps to{' '}
            <span className="text-charm-brand">automated reconciliation</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-charm-muted max-w-2xl mx-auto"
          >
            Get started in minutes. No complex setup required.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px] -translate-y-1/2">
            <div
              ref={connectorRef}
              className="w-full h-full origin-left"
              style={{
                background: '#E7E6E5',
              }}
            />
            {/* Moving dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-charm-brand" style={{ animation: 'shimmerBar 4s ease-in-out infinite' }} />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: index * 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative text-center group"
            >
              {/* Icon */}
              <div className="relative inline-flex mb-8">
                {/* Pulse rings */}
                <div className="step-icon-pulse absolute inset-0 rounded-2xl opacity-0" style={{ boxShadow: step.shadow }} />

                <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <step.icon className="w-10 h-10 text-white" />

                  {/* Step number */}
                  <div className={`absolute -top-3 -right-3 w-9 h-9 rounded-xl bg-[#0a0a2e] border border-white/10 flex items-center justify-center text-xs font-bold ${step.numColor} shadow-lg`}>
                    {step.number}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-charm-heading mb-3">{step.title}</h3>
              <p className="text-charm-muted max-w-[240px] mx-auto text-[15px] leading-relaxed">{step.description}</p>

              {/* Bottom accent */}
              <div className={`mt-6 h-[2px] w-0 group-hover:w-16 mx-auto bg-gradient-to-r ${step.gradient} transition-all duration-500`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
