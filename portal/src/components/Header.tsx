import { motion } from 'framer-motion';

interface HeaderProps {
  view: 'home' | 'chat' | 'anomalies';
  setView: (v: 'home' | 'chat' | 'anomalies') => void;
}

export function Header({ view, setView }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '20px 40px',
        background: 'rgba(6, 8, 15, 0.7)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <button
        onClick={() => setView('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <motion.div
          whileHover={{ rotate: 12, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #7ee787, #4f8cff)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 20px rgba(126, 231, 135, 0.3)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0c14" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </motion.div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em' }}>
            School Ops
          </div>
          <div className="mono" style={{ color: 'var(--sub)', fontSize: '0.68rem', marginTop: 1 }}>
            Data Intelligence Portal · v1.0
          </div>
        </div>
      </button>

      <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <NavBtn active={view === 'home'} onClick={() => setView('home')}>
          Home
        </NavBtn>
        <NavBtn active={view === 'chat'} onClick={() => setView('chat')}>
          Chat
        </NavBtn>
        <NavBtn active={view === 'anomalies'} onClick={() => setView('anomalies')}>
          Anomalies
        </NavBtn>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="tag accent">TrueForge</span>
        <span className="tag purple">Qodo</span>
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid var(--line-strong)', flexShrink: 0,
            background: 'linear-gradient(135deg, #7ee787, #d494ff)',
            display: 'grid', placeItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#0a0c14',
          }}
        >
          A
        </div>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '8px 16px',
        borderRadius: 10,
        border: 'none',
        background: active ? 'var(--glass-bg-strong)' : 'transparent',
        color: active ? '#fff' : 'var(--sub)',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-underline"
          style={{
            position: 'absolute',
            bottom: -1, left: 12, right: 12, height: 2,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            borderRadius: 2,
          }}
        />
      )}
      {children}
    </motion.button>
  );
}
