import { motion } from 'framer-motion';

interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  count: number;
  color: string;
  example?: string;
}

const ANOMALIES: Anomaly[] = [
  {
    type: 'out_of_range',
    severity: 'high',
    title: 'Out-of-range mark',
    detail: 'mark=152 in Math Mid Term (max 100)',
    count: 1,
    color: 'var(--danger)',
    example: 'STU-2024-A-003 · Aditya Verma · Mathematics',
  },
  {
    type: 'duplicate',
    severity: 'high',
    title: 'Duplicate roll number',
    detail: 'Two students sharing roll 6',
    count: 1,
    color: 'var(--danger)',
    example: 'Rohan Singh vs Rohan K. Singh',
  },
  {
    type: 'gaps',
    severity: 'medium',
    title: 'Missing roll numbers',
    detail: 'Sequence breaks in student roster',
    count: 3,
    color: 'var(--warn)',
    example: 'Missing: 15, 22, 38',
  },
  {
    type: 'iqr',
    severity: 'medium',
    title: 'IQR outliers (1.5×IQR)',
    detail: 'Statistical extreme values',
    count: 1,
    color: 'var(--warn)',
    example: 'value=152, severity=medium',
  },
  {
    type: 'order',
    severity: 'low',
    title: 'Order check',
    detail: 'No sequence anomalies detected',
    count: 0,
    color: 'var(--accent)',
    example: 'Roster order is correct',
  },
];

export function AnomalyGrid() {
  const total = ANOMALIES.reduce((s, a) => s + a.count, 0);
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Detected Anomalies</h2>
          <p className="serif" style={{ color: 'var(--sub)', fontSize: '1.1rem' }}>
            {total} issues across 5 categories — all in <code className="mono" style={{ color: 'var(--accent)' }}>school_ops.db</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="tag danger">{ANOMALIES.filter((a) => a.severity === 'high').length} high</span>
          <span className="tag warn">{ANOMALIES.filter((a) => a.severity === 'medium').length} medium</span>
          <span className="tag accent">{ANOMALIES.filter((a) => a.severity === 'low').length} clean</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {ANOMALIES.map((a, i) => (
          <motion.div
            key={a.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            className="glass tilt"
            style={{ padding: 28, position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: a.color, opacity: 0.9,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <span
                className="tag"
                style={{
                  background: `${a.color}22`,
                  color: a.color,
                  borderColor: `${a.color}55`,
                }}
              >
                {a.severity}
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: a.color, fontFamily: 'DM Mono, monospace' }}>
                {a.count}
              </span>
            </div>
            <h3 style={{ marginBottom: 6, fontSize: '1.05rem' }}>{a.title}</h3>
            <p style={{ color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 12 }}>{a.detail}</p>
            {a.example && (
              <code
                className="mono"
                style={{
                  display: 'block', padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontSize: '0.75rem', color: 'var(--sub)',
                  border: '1px solid var(--line)',
                }}
              >
                {a.example}
              </code>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass"
        style={{ marginTop: 32, padding: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #f87171, #f0b429)',
            display: 'grid', placeItems: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0c14" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ marginBottom: 4 }}>Human-in-the-loop required</h3>
          <p style={{ color: 'var(--sub)', fontSize: '0.9rem' }}>
            The agent will pause and ask for approval before applying any fix. No silent writes — ever.
          </p>
        </div>
        <a
          href="https://github.com/paulson2dahl/Codeconstruct/blob/main/sandbox/execution/run_validation.py"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
        >
          Source ↗
        </a>
      </motion.div>
    </section>
  );
}
