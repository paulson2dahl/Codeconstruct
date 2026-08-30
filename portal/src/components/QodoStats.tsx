import { motion } from 'framer-motion';

const ROUNDS = [
  { n: 1, bugs: 4, found: 4, color: 'var(--danger)' },
  { n: 2, bugs: 4, found: 4, color: 'var(--warn)' },
  { n: 3, bugs: 1, found: 1, color: 'var(--accent-3)' },
];

export function QodoStats() {
  return (
    <section style={{ marginBottom: 100 }}>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 8 }}>Qodo code review</h2>
        <p className="serif" style={{ color: 'var(--sub)', fontSize: '1.1rem', maxWidth: 640 }}>
          Every PR is auto-reviewed. Bugs come with copy-paste agent prompts so the fix is just one click away.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="metric-card"
        >
          <div className="label">Bugs Found</div>
          <div className="num" style={{ color: 'var(--danger)' }}>9</div>
          <div className="sub">4 + 4 + 1 across 3 rounds</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="metric-card"
        >
          <div className="label">Bugs Fixed</div>
          <div className="num" style={{ color: 'var(--accent)' }}>9</div>
          <div className="sub">agent implemented all fixes</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="metric-card"
        >
          <div className="label">Remaining</div>
          <div className="num" style={{ color: 'var(--accent-2)' }}>0</div>
          <div className="sub">all marked ✓ Resolved</div>
        </motion.div>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          Review rounds
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {ROUNDS.map((r, i) => (
            <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{
                  flex: 1, minWidth: 200,
                  padding: '16px 20px', borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${r.color}22`, border: `1px solid ${r.color}55`,
                    display: 'grid', placeItems: 'center',
                    fontWeight: 800, color: r.color, fontFamily: 'DM Mono, monospace',
                  }}
                >
                  R{r.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Round {r.n}</div>
                  <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.72rem' }}>{r.bugs} new bugs → {r.found} fixed</div>
                </div>
              </motion.div>
              {i < ROUNDS.length - 1 && (
                <span style={{ color: 'var(--dim)', fontSize: '1.2rem' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
