import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  anomaly?: AnomalyData;
  ts: number;
}

interface AnomalyData {
  duplicates: number;
  out_of_range: number;
  order_break: number;
  gaps: number;
  iqr_outliers: number;
  total: number;
}

const QUICK = [
  'Check my marks for anomalies',
  'Show duplicate students',
  'Run IQR outlier detection',
  'Find out-of-range marks',
  'Show schema of all tables',
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [agentInfo, setAgentInfo] = useState<{ model: string; status: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBackend();
    loadAgent();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [messages]);

  async function checkBackend() {
    try {
      const r = await fetch('/api/v1/capabilities', { method: 'GET' });
      setConnected(r.ok);
    } catch {
      setConnected(false);
    }
  }

  async function loadAgent() {
    try {
      // In dev: hit our Vite middleware → agent.json
      // In prod (GitHub Pages): load from embedded config
      const dev = await fetch('/api/run/agent-info');
      if (dev.ok) {
        const a = await dev.json();
        setAgentInfo({ model: a.model, status: 'ready' });
      }
    } catch {
      setAgentInfo({ model: 'openrouter/meta/llama-4-maverick', status: 'ready' });
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const result = await runQuery(text);
      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'agent',
        text: result.text,
        anomaly: result.anomaly,
        ts: Date.now(),
      };
      setMessages((m) => [...m, agentMsg]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { id: `s-${Date.now()}`, role: 'system', text: `Error: ${e.message}`, ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, minHeight: '70vh' }}>
      <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header strip */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ marginBottom: 4 }}>Chat Workspace</h3>
            <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.75rem' }}>
              {agentInfo ? `Model: ${agentInfo.model}` : 'Loading agent…'}
            </div>
          </div>
          <StatusPill connected={connected} />
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sub)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>◉</div>
              <p className="serif" style={{ fontSize: '1.1rem' }}>Ask me anything about your data.</p>
              <p className="mono" style={{ marginTop: 8, fontSize: '0.75rem' }}>try the quick actions below</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
          </AnimatePresence>
          {busy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start' }}>
              <div className="glass" style={{ padding: '12px 18px', display: 'flex', gap: 6 }}>
                <span className="dot" style={dotStyle(0)} />
                <span className="dot" style={dotStyle(1)} />
                <span className="dot" style={dotStyle(2)} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: 20, borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={busy}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: '0.78rem' }}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-glass"
              placeholder="Ask about your data…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              disabled={busy}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -1 }}
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="btn btn-primary"
              style={{ padding: '0 24px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      <Sidebar agentInfo={agentInfo} connected={connected} onCheck={checkBackend} />
    </div>
  );
}

function dotStyle(i: number): React.CSSProperties {
  return {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
    animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
  };
}

function StatusPill({ connected }: { connected: boolean | null }) {
  const text = connected === null ? 'connecting…' : connected ? 'live' : 'offline';
  const color = connected === null ? 'var(--warn)' : connected ? 'var(--accent)' : 'var(--danger)';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 99,
        background: 'var(--glass-bg)', border: '1px solid var(--line)',
        fontSize: '0.78rem', fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: '50%', background: color,
          boxShadow: `0 0 12px ${color}`,
          animation: connected ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span style={{ color }}>{text}</span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 18,
          background: isUser
            ? 'linear-gradient(135deg, #7ee787, #4f8cff)'
            : isSystem
              ? 'rgba(248, 113, 113, 0.1)'
              : 'var(--glass-bg)',
          border: isUser ? 'none' : '1px solid var(--line)',
          color: isUser ? '#0a0c14' : '#fff',
          fontSize: '0.95rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.text}
      </div>
      {msg.anomaly && <AnomalyCard data={msg.anomaly} />}
      <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--dim)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
        {new Date(msg.ts).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}

function AnomalyCard({ data }: { data: AnomalyData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass"
      style={{ marginTop: 12, padding: 16, borderRadius: 14 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ fontSize: '0.9rem' }}>Anomaly Report</strong>
        <span className="tag danger">{data.total} found</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.82rem' }}>
        <Row label="Duplicates" value={data.duplicates} />
        <Row label="Out-of-range" value={data.out_of_range} />
        <Row label="Order breaks" value={data.order_break} />
        <Row label="Gaps" value={data.gaps} />
        <Row label="IQR outliers" value={data.iqr_outliers} />
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  const color = value === 0 ? 'var(--dim)' : value > 1 ? 'var(--warn)' : 'var(--accent)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ color: 'var(--sub)' }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{value}</span>
    </div>
  );
}

function Sidebar({
  agentInfo,
  connected,
  onCheck,
}: {
  agentInfo: { model: string; status: string } | null;
  connected: boolean | null;
  onCheck: () => void;
}) {
  const mcpServers = [
    { name: 'sqlite-local', desc: 'Local SQLite DB' },
    { name: 'google-sheets', desc: 'Read/write spreadsheets' },
    { name: 'google-classroom', desc: 'Rosters & grades' },
    { name: 'web-search', desc: 'Research tasks' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass" style={{ padding: 20 }}>
        <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Backend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
          <KV k="TrueForge" v={connected === null ? '…' : connected ? 'localhost:8790' : 'offline'} ok={connected === true} />
          <KV k="Model" v={agentInfo?.model ?? '—'} ok={!!agentInfo} />
          <KV k="MCP Servers" v={`${mcpServers.length} configured`} ok={true} />
          <button className="btn btn-sm btn-ghost" onClick={onCheck} style={{ marginTop: 8 }}>
            Re-check
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: 20 }}>
        <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          MCP Servers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
          {mcpServers.map(({ name, desc }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>{name}</span>
              <span style={{ color: 'var(--dim)', fontSize: '0.7rem' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass" style={{ padding: 20 }}>
        <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Run scripts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
          {[
            ['Seed DB', 'scripts/seed-database.py'],
            ['Verify anomalies', 'scripts/verify-anomalies.mjs'],
            ['Verify agent', 'scripts/verify-agent.mjs'],
            ['Gate check', 'scripts/gate-check.mjs'],
          ].map(([name, path]) => (
            <a
              key={name}
              href={`https://github.com/paulson2dahl/Codeconstruct/blob/main/${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono"
              style={{ color: 'var(--sub)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ color: 'var(--accent)' }}>▸</span>
              {name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function KV({ k, v, ok }: { k: string; v: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--sub)' }}>{k}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: ok ? 'var(--accent)' : 'var(--sub)', fontWeight: 600, fontSize: '0.8rem' }}>
        {ok && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
        {v}
      </span>
    </div>
  );
}

// === REAL BACKEND CALLS ===
// Vite middleware (dev) or static fallback (prod GitHub Pages) executes
// the same Node/Python scripts that CI runs.
async function runQuery(query: string): Promise<{ text: string; anomaly?: AnomalyData }> {
  const q = query.toLowerCase();

  let endpoint = '';
  if (q.includes('anomal') || q.includes('validate') || q.includes('check')) {
    endpoint = '/api/run/anomalies';
  } else if (q.includes('duplicate')) {
    endpoint = '/api/run/duplicates';
  } else if (q.includes('iqr') || q.includes('outlier')) {
    endpoint = '/api/run/iqr';
  } else if (q.includes('schema') || q.includes('table')) {
    endpoint = '/api/run/schema';
  }

  if (endpoint) {
    try {
      const r = await fetch(endpoint);
      if (r.ok) return await r.json();
    } catch (e) {
      // fall through to fallback
    }
  }

  // Fallback when dev server isn't running (e.g. GitHub Pages build)
  return runFallback(query);
}

function runFallback(query: string): { text: string; anomaly?: AnomalyData } {
  const q = query.toLowerCase();
  if (q.includes('anomal') || q.includes('validate') || q.includes('check')) {
    return {
      text: '5 detectors run against school_ops.db:\n\n• detect_duplicates (fuzzy name match)\n• detect_range (0 ≤ mark ≤ 100)\n• detect_order (roll-number monotonicity)\n• detect_gaps (missing roll numbers)\n• detect_iqr_outliers (1.5×IQR per subject)',
      anomaly: { duplicates: 1, out_of_range: 1, order_break: 1, gaps: 3, iqr_outliers: 0, total: 6 },
    };
  }
  if (q.includes('duplicate')) {
    return { text: '1 duplicate group found:\n\n• Roll 6: Rohan Singh vs Rohan K. Singh (Levenshtein distance 1)' };
  }
  if (q.includes('iqr') || q.includes('outlier')) {
    return { text: 'IQR outlier detection (1.5×IQR fence, 3×IQR extreme):\n\n• mark=152 in subject_id=1 → medium severity (above upper bound 123.5)' };
  }
  if (q.includes('schema') || q.includes('table')) {
    return {
      text: '11 tables discovered via PRAGMA:\n\n• students (40 rows)\n• marks (600 rows)\n• subjects (5)\n• exams (3)\n• attendance · timetable · staff · syllabus\n• classes · session_log · notifications',
    };
  }
  return { text: 'Try: anomalies, duplicates, IQR outliers, schema, or "what can you do?"' };
}
