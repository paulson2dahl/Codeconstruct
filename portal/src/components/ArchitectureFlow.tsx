import { motion } from 'framer-motion';

const STEPS = [
  {
    n: '01',
    label: 'DISCOVER',
    color: 'var(--accent)',
    title: 'Schema discovery',
    body: 'Agent queries sqlite-local MCP at runtime. Discovers all 11 tables, columns, types, foreign keys — no hardcoded assumptions about your domain.',
    code: 'PRAGMA table_info(students)',
  },
  {
    n: '02',
    label: 'VALIDATE',
    color: 'var(--accent-3)',
    title: 'Sandbox validation',
    body: '5 pure-Python detectors run deterministically inside an isolated sandbox. Same algorithm every time — no LLM guessing.',
    code: 'python3 detect_iqr_outliers.py --group-by subject_id',
  },
  {
    n: '03',
    label: 'APPROVE',
    color: 'var(--warn)',
    title: 'Human-in-the-loop',
    body: 'Every write tool pauses for human approval. Agent renders a DiffTable and asks "Approve? (y/n)". Nothing changes silently.',
    code: 'await promptUser("Approve? (y/n)")',
  },
  {
    n: '04',
    label: 'REVIEW',
    color: 'var(--accent-2)',
    title: 'Qodo auto-review',
    body: 'Every PR reviewed by Qodo. 9 bugs found → fixed → resolved → merged. Closed loop, no manual gate-keeping.',
    code: 'gh pr checks 1',
  },
];

export function ArchitectureFlow() {
  return (
    <section style={{ marginBottom: 100 }}>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 8 }}>How it works</h2>
        <p className="serif" style={{ color: 'var(--sub)', fontSize: '1.1rem', maxWidth: 640 }}>
          From a user message to a fully-validated, code-reviewed, deployed agent in 4 steps.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, position: 'relative' }}>
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="glass tilt"
            style={{ padding: 28, position: 'relative' }}
          >
            <div
              style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
                color: s.color, marginBottom: 12, letterSpacing: '0.1em',
              }}
            >
              {s.n} — {s.label}
            </div>
            <h3 style={{ marginBottom: 12, fontSize: '1.15rem' }}>{s.title}</h3>
            <p style={{ color: 'var(--sub)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16 }}>{s.body}</p>
            <code
              className="mono"
              style={{
                display: 'block', padding: '8px 10px', borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.3)', fontSize: '0.72rem',
                color: 'var(--accent)', border: '1px solid var(--line)',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.code}
            </code>
            {i < STEPS.length - 1 && (
              <div
                aria-hidden
                style={{
                  position: 'absolute', right: -10, top: '50%',
                  transform: 'translateY(-50%)', zIndex: 5,
                  width: 20, height: 20, borderRadius: '50%',
                  background: s.color, opacity: 0.6,
                  boxShadow: `0 0 20px ${s.color}`,
                  display: 'grid', placeItems: 'center',
                  color: '#0a0c14', fontSize: '0.7rem', fontWeight: 800,
                }}
                className="flow-arrow"
              >
                →
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 1100px) { .flow-arrow { display: none !important; } }
      `}</style>
    </section>
  );
}
