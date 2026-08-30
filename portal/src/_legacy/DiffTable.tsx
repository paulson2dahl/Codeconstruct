import React from 'react';
import { ChevronDown, ChevronUp, Eye, Download, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import './DiffTable.css';

interface DiffTableProps {
  title: string;
  data: {
    before: any[];
    after: any[];
    changes: DiffChange[];
    summary: { added: number; removed: number; modified: number; unchanged: number };
  };
}

interface DiffChange {
  rowId: string | number;
  type: 'added' | 'removed' | 'modified';
  field?: string;
  oldValue?: any;
  newValue?: any;
  rowData?: any;
}

export const DiffTable = ({ title, data }: DiffTableProps) => {
  const [expanded, setExpanded] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'unified' | 'split'>('unified');
  const [filter, setFilter] = React.useState<'all' | 'added' | 'removed' | 'modified'>('all');

  const changes = data.changes || [];
  const filteredChanges = filter === 'all' ? changes : changes.filter(c => c.type === filter);

  const allColumns = new Set<string>();
  [...data.before, ...data.after].forEach(row => Object.keys(row).forEach(k => allColumns.add(k)));
  const columns = Array.from(allColumns);

  return (
    <div className="tf-diff-table">
      <div className="tf-diff-header">
        <div className="tf-diff-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 3v18M3 12h18" />
          </svg>
          <h3 className="tf-diff-title">{title}</h3>
        </div>
        <div className="tf-diff-controls">
          <div className="tf-diff-summary">
            <span className="tf-diff-stat added"><Check size={12} /> +{data.summary.added}</span>
            <span className="tf-diff-stat removed"><X size={12} /> -{data.summary.removed}</span>
            <span className="tf-diff-stat modified"><ArrowRight size={12} /> ~{data.summary.modified}</span>
          </div>
          <div className="tf-diff-view-mode">
            <button className={viewMode === 'unified' ? 'active' : ''} onClick={() => setViewMode('unified')} title="Unified view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
            </button>
            <button className={viewMode === 'split' ? 'active' : ''} onClick={() => setViewMode('split')} title="Split view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="18" rx="1" /><rect x="13" y="3" width="8" height="18" rx="1" /></svg>
            </button>
          </div>
          <button className="tf-diff-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tf-diff-body">
          <div className="tf-diff-toolbar">
            <div className="tf-diff-filter">
              {(['all', 'added', 'removed', 'modified'] as const).map(f => (
                <button
                  key={f}
                  className={`tf-filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="tf-filter-count">{changes.filter(c => c.type === f).length || (f === 'all' ? changes.length : 0)}</span>
                </button>
              ))}
            </div>
            <button className="tf-diff-export" title="Export as CSV">
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>

          {viewMode === 'unified' ? (
            <UnifiedDiffView columns={columns} changes={filteredChanges} before={data.before} after={data.after} />
          ) : (
            <SplitDiffView columns={columns} before={data.before} after={data.after} />
          )}

          {filteredChanges.length === 0 && (
            <div className="tf-diff-empty">
              <Eye size={32} />
              <p>No changes match the current filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UnifiedDiffView = ({ columns, changes, before, after }: {
  columns: string[];
  changes: DiffChange[];
  before: any[];
  after: any[];
}) => {
  const afterMap = new Map(after.map((r, i) => [r.id || i, r]));
  const beforeMap = new Map(before.map((r, i) => [r.id || i, r]));

  return (
    <div className="tf-diff-unified">
      <div className="tf-diff-table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="tf-diff-col-action">Change</th>
              {columns.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {changes.map((change, idx) => {
              const row = change.rowData || afterMap.get(change.rowId) || beforeMap.get(change.rowId);
              if (!row) return null;

              return (
                <tr key={`${change.rowId}-${idx}`} className={`tf-diff-row ${change.type}`}>
                  <td className="tf-diff-action-cell">
                    <span className={`tf-diff-badge ${change.type}`}>
                      {change.type === 'added' && <ArrowRight size={12} />}
                      {change.type === 'removed' && <ArrowLeft size={12} />}
                      {change.type === 'modified' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18" /></svg>}
                    </span>
                  </td>
                  {columns.map(col => {
                    const oldVal = beforeMap.get(change.rowId)?.[col];
                    const newVal = row[col];
                    const isChanged = change.type === 'modified' && change.field === col && oldVal !== newVal;

                    return (
                      <td key={col} className={isChanged ? 'tf-diff-changed' : ''}>
                        {isChanged ? (
                          <div className="tf-diff-value">
                            <span className="tf-diff-old">{oldVal ?? '—'}</span>
                            <span className="tf-diff-arrow"><ArrowRight size={10} /></span>
                            <span className="tf-diff-new">{newVal ?? '—'}</span>
                          </div>
                        ) : (
                          newVal ?? '—'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SplitDiffView = ({ columns, before, after }: {
  columns: string[];
  before: any[];
  after: any[];
}) => {
  return (
    <div className="tf-diff-split">
      <div className="tf-diff-pane">
        <div className="tf-diff-pane-header">Before ({before.length} rows)</div>
        <div className="tf-diff-table-wrapper">
          <table>
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {before.slice(0, 50).map((row, i) => (
                <tr key={i}>{columns.map(c => <td key={c}>{row[c] ?? '—'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="tf-diff-pane">
        <div className="tf-diff-pane-header">After ({after.length} rows)</div>
        <div className="tf-diff-table-wrapper">
          <table>
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {after.slice(0, 50).map((row, i) => (
                <tr key={i}>{columns.map(c => <td key={c}>{row[c] ?? '—'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};