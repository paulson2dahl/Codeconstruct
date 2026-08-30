import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Hero3D } from './components/Hero3D';
import { ChatPanel } from './components/ChatPanel';
import { AnomalyGrid } from './components/AnomalyGrid';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { QodoStats } from './components/QodoStats';

type View = 'home' | 'chat' | 'anomalies';

function App() {
  const [view, setView] = useState<View>('home');

  return (
    <div className="mesh-bg">
      <div className="blob" />
      <div className="blob" />
      <div className="blob" />
      <div className="grain" />

      <Header view={view} setView={setView} />

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.main
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="page-wrap"
          >
            <Hero3D onLaunch={() => setView('chat')} onAnomalies={() => setView('anomalies')} />
            <ArchitectureFlow />
            <QodoStats />
          </motion.main>
        )}

        {view === 'chat' && (
          <motion.main
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="page-wrap"
          >
            <ChatPanel />
          </motion.main>
        )}

        {view === 'anomalies' && (
          <motion.main
            key="anomalies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="page-wrap"
          >
            <AnomalyGrid />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
