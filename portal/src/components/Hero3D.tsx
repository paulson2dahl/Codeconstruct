import { motion } from 'framer-motion';

export function Hero3D({ onLaunch, onAnomalies }: { onLaunch: () => void; onAnomalies: () => void }) {
  return (
    <section style={{ marginBottom: 100, position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: 880, position: 'relative', zIndex: 2 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <span className="tag accent">Agent Harness Hackathon</span>
          <span className="tag">Aug 24–30, 2026</span>
          <span className="mono" style={{ color: 'var(--sub)' }}>PR #1 merged · main green</span>
        </div>

        <h1 className="gradient-text" style={{ marginBottom: 28, lineHeight: 0.95 }}>
          Data intelligence.<br />
          <span className="serif" style={{ color: '#fff' }}>Without the noise.</span>
        </h1>

        <p className="serif" style={{ fontSize: '1.35rem', color: 'var(--sub)', maxWidth: 580, lineHeight: 1.5, marginBottom: 40 }}>
          A generic data operations agent that discovers your schema at runtime, detects anomalies with pure statistics, and waits for your approval before anything changes.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 64 }}>
          <motion.button onClick={onLaunch} className="btn btn-primary" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
            Open Chat Workspace
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </motion.button>
          <motion.button onClick={onAnomalies} className="btn" whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }}>
            View Anomalies
          </motion.button>
          <a href="https://github.com/paulson2dahl/Codeconstruct" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
            Source
          </a>
        </div>

        <Metrics />
      </motion.div>

      <HeroVisual />
    </section>
  );
}

function Metrics() {
  const items = [
    { label: 'Gates Passed', value: '7/7', sub: 'G1–G7 verified', color: 'var(--accent)' },
    { label: 'Anomalies', value: '6', sub: 'dup · range · gap · IQR', color: 'var(--warn)' },
    { label: 'Qodo Bugs', value: '9', sub: 'found → fixed', color: 'var(--danger)' },
    { label: 'CI Status', value: '✓', sub: 'main green', color: 'var(--accent)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, maxWidth: 880 }}>
      {items.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
          className="metric-card"
        >
          <div className="label">{m.label}</div>
          <div className="num" style={{ color: m.color }}>{m.value}</div>
          <div className="sub">{m.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: -60, right: -120, width: 560, height: 560,
        pointerEvents: 'none', zIndex: 1,
        perspective: 1000,
      }}
      className="hero-visual-desktop"
    >
      <motion.div
        animate={{ rotateY: [0, 8, -4, 0], rotateX: [0, -3, 2, 0], y: [0, -12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          display: 'grid', placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 380, height: 380, borderRadius: '50%',
            background:
              'conic-gradient(from 90deg at 50% 50%, #7ee787, #4f8cff, #d494ff, #7ee787)',
            filter: 'blur(60px)', opacity: 0.55,
            transform: 'translateZ(-50px)',
          }}
        />
        <motion.div
          animate={{ rotateZ: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', width: 340, height: 340,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            borderTopColor: 'var(--accent)',
            borderRightColor: 'var(--accent-2)',
            transform: 'translateZ(20px)',
          }}
        />
        <motion.div
          animate={{ rotateZ: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', width: 280, height: 280,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            borderBottomColor: 'var(--accent-3)',
            borderLeftColor: 'var(--accent)',
            transform: 'translateZ(40px)',
          }}
        />
        {/* Floating data points */}
        {[
          { x: '20%', y: '20%', color: 'var(--accent)', delay: 0 },
          { x: '70%', y: '30%', color: 'var(--accent-2)', delay: 0.5 },
          { x: '30%', y: '70%', color: 'var(--accent-3)', delay: 1 },
          { x: '80%', y: '75%', color: 'var(--warn)', delay: 1.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: 12, height: 12, borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 30px ${p.color}`,
              transform: `translateZ(${60 + i * 10}px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
