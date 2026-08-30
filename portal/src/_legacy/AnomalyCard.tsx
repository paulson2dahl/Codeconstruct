import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Eye, CheckCircle } from 'lucide-react';
import './AnomalyCard.css';

interface Anomaly {
  type: string;
  column: string;
  table?: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  sample_rows?: any[];
}

interface AnomalyCardProps {
  title: string;
  data: {
    anomalies: Anomaly[];
    summary?: {
      total: number;
      errors: number;
      warnings: number;
      info: number;
    };
  };
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: '#d0021b', bg: '#d0021b22', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#f5a623', bg: '#f5a62322', label: 'Warning' },
  info: { icon: Info, color: '#4a90d9', bg: '#4a90d922', label: 'Info' },
};

export const AnomalyCard = ({ title, data }: AnomalyCardProps) => {
  const [expanded, setExpanded] = React.useState(true);
  const [filterSeverity, setFilterSeverity] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');
  const anomalies = data.anomalies || [];

  const filtered = filterSeverity === 'all'
    ? anomalies
    : anomalies.filter(a => a.severity === filterSeverity);

  const grouped = filtered.reduce((acc, a) => {
    const key = a.table || 'Unknown Table';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, Anomaly[]>);

  return (
    <div className="tf-anomaly-card">
      <div className="tf-anomaly-header">
        <div className="tf-anomaly-title-row">
          <AlertTriangle size={18} className="tf-anomaly-icon" />
          <h3 className="tf-anomaly-title">{title}</h3>
          <span className="tf-anomaly-count">{anomalies.length} anomalies</span>
        </div>
        <div className="tf-anomaly-controls">
          <div className="tf-severity-filter">
            {(['all', 'error', 'warning', 'info'] as const).map(sev => (
              <button
                key={sev}
                className={`tf-filter-btn ${filterSeverity === sev ? 'active' : ''}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev === 'all' ? 'All' : SEVERITY_CONFIG[sev].label}
                <span className="tf-filter-count">
                  {sev === 'all' ? anomalies.length : anomalies.filter(a => a.severity === sev).length}
                </span>
              </button>
            ))}
          </div>
          <button className="tf-anomaly-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {data.summary && (
        <div className="tf-anomaly-summary">
          <div className="tf-summary-item error">
            <span className="tf-summary-count">{data.summary.errors}</span>
            <span className="tf-summary-label">Errors</span>
          </div>
          <div className="tf-summary-item warning">
            <span className="tf-summary-count">{data.summary.warnings}</span>
            <span className="tf-summary-label">Warnings</span>
          </div>
          <div className="tf-summary-item info">
            <span className="tf-summary-count">{data.summary.info}</span>
            <span className="tf-summary-label">Info</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="tf-anomaly-body">
          {Object.entries(grouped).map(([tableName, tableAnomalies]) => (
            <div key={tableName} className="tf-anomaly-table-group">
              <div className="tf-anomaly-table-header">
                <span className="tf-table-name">{tableName}</span>
                <span className="tf-table-count">{tableAnomalies.length} issues</span>
              </div>
              <div className="tf-anomaly-list">
                {tableAnomalies.map((anomaly, idx) => (
                  <AnomalyRow key={`${tableName}-${idx}`} anomaly={anomaly} />
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="tf-anomaly-empty">
              <CheckCircle size={32} />
              <p>No anomalies found for selected filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnomalyRow = ({ anomaly }: { anomaly: Anomaly }) => {
  // AnomalyRow component - uses icons from SEVERITY_CONFIG
  const [showDetails, setShowDetails] = React.useState(false);
  const config = SEVERITY_CONFIG[anomaly.severity];
  const Icon = config.icon;

  return (
    <div className={`tf-anomaly-row ${anomaly.severity}`}>
      <div className="tf-anomaly-main" onClick={() => setShowDetails(!showDetails)}>
        <div className="tf-anomaly-severity" style={{ background: config.bg, borderColor: config.color }}>
          <Icon size={14} style={{ color: config.color }} />
        </div>
        <div className="tf-anomaly-info">
          <div className="tf-anomaly-message">{anomaly.message}</div>
          <div className="tf-anomaly-meta">
            <span className="tf-anomaly-type">{anomaly.type}</span>
            <span className="tf-anomaly-column">{anomaly.column}</span>
            <span className="tf-anomaly-count-badge">{anomaly.count} occurrences</span>
          </div>
        </div>
        <div className="tf-anomaly-actions">
          <button className="tf-icon-btn" title="View details" onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}>
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button className="tf-icon-btn" title="View sample rows">
            <Eye size={14} />
          </button>
        </div>
      </div>

      {showDetails && anomaly.details && (
        <div className="tf-anomaly-details">
          <pre>{JSON.stringify(anomaly.details, null, 2)}</pre>
          {anomaly.sample_rows && anomaly.sample_rows.length > 0 && (
            <div className="tf-anomaly-samples">
              <h5>Sample affected rows:</h5>
              <div className="tf-sample-rows">
                {anomaly.sample_rows.slice(0, 3).map((row, i) => (
                  <pre key={i}>{JSON.stringify(row, null, 2)}</pre>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};