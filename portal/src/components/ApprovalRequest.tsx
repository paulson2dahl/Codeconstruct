import React from 'react';
import { AlertTriangle, X, Check, Code, AlertCircle, Info } from 'lucide-react';
import './ApprovalRequest.css';

interface ApprovalRequestProps {
  title: string;
  data: {
    tool: string;
    action: 'write' | 'delete' | 'update' | 'execute';
    sql?: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedRows?: number;
    preview?: { before: any[]; after: any[] };
    onApprove: () => void;
    onDeny: (reason?: string) => void;
  };
}

const RISK_CONFIG = {
  low: { color: '#7ed321', bg: '#7ed32122', icon: Info, label: 'Low Risk' },
  medium: { color: '#4a90d9', bg: '#4a90d922', icon: AlertTriangle, label: 'Medium Risk' },
  high: { color: '#f5a623', bg: '#f5a62322', icon: AlertTriangle, label: 'High Risk' },
  critical: { color: '#d0021b', bg: '#d0021b22', icon: AlertCircle, label: 'Critical Risk' },
};

export const ApprovalRequest = ({ title, data }: ApprovalRequestProps) => {
  const [expanded] = React.useState(true);
  const [showReason, setShowReason] = React.useState(false);
  const [denyReason, setDenyReason] = React.useState('');
  const riskConfig = RISK_CONFIG[data.riskLevel];

  return (
    <div className={`tf-approval-request ${data.riskLevel}`}>
      <div className="tf-approval-header">
        <div className="tf-approval-icon" style={{ background: riskConfig.bg }}>
          <riskConfig.icon size={20} style={{ color: riskConfig.color }} />
        </div>
        <div className="tf-approval-title-section">
          <h3 className="tf-approval-title">{title}</h3>
          <div className="tf-approval-meta">
            <span className="tf-approval-tool">{data.tool}</span>
            <span className="tf-approval-risk" style={{ color: riskConfig.color, background: riskConfig.bg }}>
              {riskConfig.label}
            </span>
          </div>
        </div>
        <div className="tf-approval-actions">
          <button className="tf-approval-btn deny" onClick={() => setShowReason(true)}>
            <X size={16} />
            <span>Deny</span>
          </button>
          <button className="tf-approval-btn approve" onClick={data.onApprove}>
            <Check size={16} />
            <span>Approve</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tf-approval-body">
          <div className="tf-approval-section">
            <h4>Description</h4>
            <p>{data.description}</p>
          </div>

          {data.sql && (
            <div className="tf-approval-section">
              <div className="tf-section-header">
                <h4>SQL Statement</h4>
                <Code size={14} />
              </div>
              <pre className="tf-sql-preview"><code>{data.sql}</code></pre>
            </div>
          )}

          {data.preview && (
            <div className="tf-approval-section">
              <h4>Preview (Diff)</h4>
              <div className="tf-approval-diff">
                <div className="tf-diff-column">
                  <div className="tf-diff-column-header before">Before</div>
                  <div className="tf-diff-column-content">
                    {data.preview.before.length === 0 ? (
                      <p className="tf-diff-empty">No existing records</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            {data.preview.before[0] && Object.keys(data.preview.before[0]).map(k => <th key={k}>{k}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {data.preview.before.slice(0, 10).map((row, i) => (
                            <tr key={i}>{Object.values(row).map((v: any, j) => <td key={j}>{v ?? '—'}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
                <div className="tf-diff-column">
                  <div className="tf-diff-column-header after">After</div>
                  <div className="tf-diff-column-content">
                    {data.preview.after.length === 0 ? (
                      <p className="tf-diff-empty">No records after operation</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            {data.preview.after[0] && Object.keys(data.preview.after[0]).map(k => <th key={k}>{k}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {data.preview.after.slice(0, 10).map((row, i) => (
                            <tr key={i}>{Object.values(row).map((v: any, j) => <td key={j}>{v ?? '—'}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="tf-approval-section">
            <h4>Details</h4>
            <div className="tf-approval-details">
              <div className="tf-detail-row">
                <span className="tf-detail-label">Action:</span>
                <span className="tf-detail-value">{data.action}</span>
              </div>
              {data.affectedRows !== undefined && (
                <div className="tf-detail-row">
                  <span className="tf-detail-label">Affected Rows:</span>
                  <span className="tf-detail-value">{data.affectedRows.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReason && (
        <div className="tf-deny-modal-overlay" onClick={() => setShowReason(false)}>
          <div className="tf-deny-modal" onClick={e => e.stopPropagation()}>
            <div className="tf-deny-modal-header">
              <h4>Deny Approval</h4>
              <button className="tf-modal-close" onClick={() => setShowReason(false)}>
                <X size={18} />
              </button>
            </div>
            <p>Please provide a reason for denying this request:</p>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Reason for denial..."
              className="tf-deny-reason"
              rows={4}
            />
            <div className="tf-deny-modal-footer">
              <button className="tf-approval-btn secondary" onClick={() => setShowReason(false)}>Cancel</button>
              <button className="tf-approval-btn deny" onClick={() => { data.onDeny(denyReason); setShowReason(false); }}>
                <X size={16} />
                <span>Confirm Deny</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};