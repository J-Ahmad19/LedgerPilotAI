import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  accent: string;
  delay: number;
}

function StatCard({ label, value, trend, accent, delay }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const valueRef = useRef<HTMLDivElement>(null);

  const accentColors: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    emerald: {
      text: 'text-charm-heading',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
      glow: 'none',
    },
    blue: {
      text: 'text-charm-heading',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      glow: 'none',
    },
    amber: {
      text: 'text-charm-heading',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      glow: 'none',
    },
  };

  const colors = accentColors[accent] || accentColors.blue;

  useEffect(() => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');

    gsap.fromTo(
      {},
      { val: 0 },
      {
        val: numericValue,
        duration: 1.5,
        delay,
        ease: 'power2.out',
        onUpdate: function () {
          const current = Math.round(this.targets()[0].val);
          if (current >= 1000) {
            setDisplayValue(current.toLocaleString() + suffix);
          } else {
            setDisplayValue(current + suffix);
          }
        },
      }
    );
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay - 0.3 }}
      className="charm-panel p-4 hover:border-charm-brand transition-all duration-300"
      style={{ boxShadow: colors.glow }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-charm-muted font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
      </div>
      <div ref={valueRef} className={`text-2xl font-bold ${colors.text} font-display`}>
        {displayValue}
      </div>
      <div className={`text-xs font-semibold mt-1 text-charm-muted`}>{trend}</div>
    </motion.div>
  );
}

export default function DashboardMockup() {
  const barData = [45, 58, 52, 72, 65, 78, 70, 88, 82, 92, 86, 98];
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const bars = chartRef.current.querySelectorAll('.chart-bar');
    gsap.fromTo(
      bars,
      { scaleY: 0, transformOrigin: 'bottom' },
      { scaleY: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 1.2 }
    );
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto group">
      {/* Outer Glow */}
      <div className="absolute -inset-6 bg-charm-brand/5 rounded-[2rem] blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700" />

      {/* Main Dashboard */}
      <div className="relative charm-panel overflow-hidden shadow-float">
        {/* Browser Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-charm-border bg-charm-surface">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.3)]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.3)]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.3)]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-charm-border shadow-sm">
              <svg className="w-3 h-3 text-charm-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-charm-muted font-mono">app.ledgerpilotai.com/dashboard</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Match Rate" value="99.8%" trend="+0.3% vs last week" accent="emerald" delay={0.8} />
            <StatCard label="Transactions" value="12847" trend="Today" accent="blue" delay={1.0} />
            <StatCard label="Exceptions" value="23" trend="-12 resolved today" accent="amber" delay={1.2} />
          </div>

          {/* Reconciliation Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="charm-panel p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-charm-heading">Reconciliation Progress</span>
              </div>
              <span className="text-lg font-bold text-charm-heading">98.2%</span>
            </div>
            <div className="h-3 bg-charm-surface rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '98.2%' }}
                transition={{ duration: 2.5, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: '#34d399' }}
              >
                <div className="absolute inset-0 animate-shimmer-bar" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              </motion.div>
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-xs text-charm-muted">12,615 matched</span>
              <span className="text-xs text-charm-muted">232 pending</span>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="charm-panel p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-charm-heading">Cash Position Variance</span>
              </div>
              <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-semibold border border-emerald-200">
                Real-time
              </span>
            </div>
            <div ref={chartRef} className="h-36 flex items-end gap-1.5">
              {barData.map((height, i) => (
                <div
                  key={i}
                  className="chart-bar flex-1 rounded-t-md relative overflow-hidden group/bar"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(180deg, ${i >= 9 ? '#10b981' : '#2563eb'}, ${i >= 9 ? '#059669' : '#1d4ed8'})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/0 group-hover/bar:to-white/10 transition-all duration-300" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/0 group-hover/bar:bg-white/40 transition-all duration-300" />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-charm-muted font-mono">
              <span>Jan</span>
              <span>Mar</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Dec</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Badge - Auto-Matched */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 2.2, type: 'spring', bounce: 0.3 }}
        className="absolute -left-6 lg:-left-12 top-[30%] charm-panel p-3.5 hidden lg:block animate-float shadow-float"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-charm-muted uppercase tracking-wider font-medium">Auto-Matched</div>
            <div className="text-sm font-bold text-charm-heading">+2,847</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Badge - AI Resolving */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 2.5, type: 'spring', bounce: 0.3 }}
        className="absolute -right-6 lg:-right-12 bottom-[25%] charm-panel p-3.5 hidden lg:block animate-float-delayed shadow-float"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-charm-muted uppercase tracking-wider font-medium">AI Resolving</div>
            <div className="text-sm font-bold text-charm-heading">3 in queue</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Badge - Cash Sync */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.8, type: 'spring', bounce: 0.3 }}
        className="absolute left-1/2 -translate-x-1/2 -bottom-6 charm-panel px-4 py-2.5 shadow-float hidden md:block"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-charm-muted">Cash sync</span>
          <span className="text-xs font-bold text-emerald-600">Live</span>
        </div>
      </motion.div>
    </div>
  );
}
