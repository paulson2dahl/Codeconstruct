import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatWorkspace } from './components/ChatWorkspace';
import { AnomalyReport } from './components/AnomalyReport';
import { SchemaExplorer } from './components/SchemaExplorer';
import { ApprovalGate } from './components/ApprovalGate';
import './App.css';

function App() {
  return (
    <div className="tf-app">
      <Header />
      <div className="tf-app-body">
        <Sidebar />
        <main className="tf-main">
          <Routes>
            <Route path="/" element={<ChatWorkspace />} />
            <Route path="/anomalies" element={<AnomalyReport />} />
            <Route path="/schema" element={<SchemaExplorer />} />
            <Route path="/approvals" element={<ApprovalGate />} />
            <Route path="/s/:sessionId" element={<ChatWorkspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;