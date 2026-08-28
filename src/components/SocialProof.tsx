import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileCheck } from 'lucide-react';
import gsap from 'gsap';

const trustItems = [
  {
    icon: Shield,
    text: 'Bank-Grade Security',
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Lock,
    text: 'Role-Based Access Control',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: FileCheck,
    text: 'Immutable Audit Logs',
    gradient: 'from-violet-500/10 to-violet-600/5',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
  },
];

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !cardRef.current) return;
    const ctx = gsap.context(() => {
      // Shield icon rotation on scroll
      gsap.fromTo(
        '.shield-icon',
        { rotateY: 0 },
        {
          rotateY: 360,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.shield-icon',
            start: 'top 80%',
          },
        }
      );

      // Glow pulse on the card
      gsap.to(cardRef.current, {
        boxShadow: '0 0 60px rgba(37,99,235,0.08), 0 0 120px rgba(5,150,105,0.04)',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Animate trust items counter
      gsap.fromTo(
        '.trust-item',
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.trust-item',
            start: 'top 85%',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-ledger-violet/[0.02] rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative charm-panel border-charm-border p-10 lg:p-14 overflow-hidden"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-charm-band opacity-50 rounded-3xl" />

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-ledger-blue/10 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-ledger-emerald/10 rounded-br-2xl" />

          <div className="relative z-10 text-center">
            {/* Shield */}
            <div className="shield-icon inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-sm border border-charm-border mb-8">
              <Shield className="w-9 h-9 text-charm-heading" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-charm-heading font-display">
              Built for scale and{' '}
              <span className="text-charm-brand">accuracy</span>
            </h2>

            <p className="text-lg text-charm-muted max-w-2xl mx-auto mb-12">
              Bank-grade security with strict role-based access and immutable audit logs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-12">
              {trustItems.map((item, index) => (
                <div
                  key={item.text}
                  className="trust-item flex items-center gap-4 text-charm-body group cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl bg-white border border-charm-border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <item.icon className={`w-5 h-5 text-charm-heading`} />
                  </div>
                  <span className="font-semibold text-[15px]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
