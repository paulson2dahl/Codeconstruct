import React from 'react';
import { RefreshCw, Download, AlertTriangle, Database } from 'lucide-react';
import { AnomalyCard } from './AnomalyCard';
import './AnomalyReport.css';

export const AnomalyReport = () => {
  const [anomalies, setAnomalies] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<string>('all');
  const [filterSeverity, setFilterSeverity] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');

  const runValidation = async () => {
    setLoading(true);
    try {
      // This would call the sandbox validation scripts
      // For now, mock data
      const mockData = {
        anomalies: [
          { type: 'duplicate', column: 'student_id', table: 'students', count: 3, severity: 'error', message: 'Duplicate student IDs found', details: { duplicate_values: ['STU001', 'STU002', 'STU003'] } },
          { type: 'null_values', column: 'email', table: 'students', count: 12, severity: 'warning', message: '12 students missing email addresses', details: {} },
          { type: 'numeric_outliers', column: 'marks', table: 'marks', count: 5, severity: 'warning', message: '5 outlier marks detected (IQR method)', details: { bounds: { lower: 0, upper: 100 }, outlier_values: [150, -5, 200] } },
          { type: 'future_dates', column: 'exam_date', table: 'exams', count: 2, severity: 'info', message: '2 exams scheduled in the future', details: {} },
        ],
        summary: { total: 22, errors: 3, warnings: 17, info: 2 }
      };
      setAnomalies(mockData);
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runValidation();
  }, []);

  return (
    <div className="tf-anomaly-report">
      <div className="tf-report-header">
        <div className="tf-report-title">
          <AlertTriangle size={24} />
          <h1>Anomaly Report</h1>
        </div>
        <div className="tf-report-actions">
          <button className="tf-btn secondary" onClick={runValidation} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Running...' : 'Re-run Validation'}
          </button>
          <button className="tf-btn primary">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div className="tf-report-toolbar">
        <div className="tf-toolbar-filters">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="tf-filter-select"
          >
            <option value="all">All Tables</option>
            <option value="students">Students</option>
            <option value="marks">Marks</option>
            <option value="exams">Exams</option>
            <option value="attendance">Attendance</option>
          </select>
          <div className="tf-severity-pills">
            {(['all', 'error', 'warning', 'info'] as const).map(sev => (
              <button
                key={sev}
                className={`tf-severity-pill ${filterSeverity === sev ? 'active' : ''}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="tf-toolbar-stats">
          {anomalies && (
            <>
              <span className="tf-stat error">{anomalies.summary.errors} Errors</span>
              <span className="tf-stat warning">{anomalies.summary.warnings} Warnings</span>
              <span className="tf-stat info">{anomalies.summary.info} Info</span>
            </>
          )}
        </div>
      </div>

      <div className="tf-report-content">
        {anomalies ? (
          <AnomalyCard title="Database Validation Results" data={anomalies} />
        ) : (
          <div className="tf-report-empty">
            <Database size={48} />
            <h3>No validation run yet</h3>
            <p>Click "Re-run Validation" to scan your database for anomalies</p>
          </div>
        )}
      </div>
    </div>
  );
};