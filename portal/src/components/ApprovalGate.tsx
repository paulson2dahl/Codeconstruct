import React from 'react';
import { Shield, Check, X, Clock, Download } from 'lucide-react';
import { ApprovalRequest } from './ApprovalRequest';
import './ApprovalGate.css';

interface PendingApproval {
  id: string;
  tool: string;
  action: 'write' | 'delete' | 'update' | 'execute';
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sql?: string;
  affectedRows?: number;
  preview?: { before: any[]; after: any[] };
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied';
}

export const ApprovalGate = () => {
  const [approvals, setApprovals] = React.useState<PendingApproval[]>([
    {
      id: 'appr-1',
      tool: 'mcp__sqlite-local__execute',
      action: 'write',
      description: 'Insert 150 new student marks records from uploaded Excel file',
      riskLevel: 'high',
      sql: `INSERT INTO marks (student_id, subject, exam_type, marks, max_marks, date)
VALUES (1, 'Mathematics', 'Midterm', 85, 100, '2024-10-15'),
       (2, 'Mathematics', 'Midterm', 92, 100, '2024-10-15'),
       ... 148 more rows`,
      affectedRows: 150,
      preview: {
        before: [],
        after: [
          { mark_id: 1201, student_id: 1, subject: 'Mathematics', exam_type: 'Midterm', marks: 85, max_marks: 100, date: '2024-10-15' },
          { mark_id: 1202, student_id: 2, subject: 'Mathematics', exam_type: 'Midterm', marks: 92, max_marks: 100, date: '2024-10-15' },
        ],
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'pending',
    },
    {
      id: 'appr-2',
      tool: 'mcp__sqlite-local__execute',
      action: 'update',
      description: 'Update teacher assignments for Class 8A and 8B',
      riskLevel: 'medium',
      sql: `UPDATE classes SET teacher_id = 5 WHERE class_id IN (8, 9)`,
      affectedRows: 2,
      preview: {
        before: [
          { class_id: 8, name: 'Class 8A', teacher_id: 3, room: 'Room 101' },
          { class_id: 9, name: 'Class 8B', teacher_id: 4, room: 'Room 102' },
        ],
        after: [
          { class_id: 8, name: 'Class 8A', teacher_id: 5, room: 'Room 101' },
          { class_id: 9, name: 'Class 8B', teacher_id: 5, room: 'Room 102' },
        ],
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'pending',
    },
  ]);

  const [filterStatus, setFilterStatus] = React.useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [filterRisk, setFilterRisk] = React.useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const filtered = approvals.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterRisk !== 'all' && a.riskLevel !== filterRisk) return false;
    return true;
  });

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'approved' as const } : a
    ));
    // In real implementation: sdk.sendApproval(sessionId, [{ type: 'user.tool_approval', ... }])
  };

  const handleDeny = (id: string, reason?: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'denied' as const } : a
    ));
    console.log('Denied:', id, reason);
  };

  return (
    <div className="tf-approval-gate">
      <div className="tf-gate-header">
        <div className="tf-gate-title">
          <Shield size={24} />
          <h1>Approval Gate</h1>
        </div>
        <div className="tf-gate-stats">
          <span className="tf-stat-item pending">
            <Clock size={14} /> {approvals.filter(a => a.status === 'pending').length} Pending
          </span>
          <span className="tf-stat-item approved">
            <Check size={14} /> {approvals.filter(a => a.status === 'approved').length} Approved
          </span>
          <span className="tf-stat-item denied">
            <X size={14} /> {approvals.filter(a => a.status === 'denied').length} Denied
          </span>
        </div>
      </div>

      <div className="tf-gate-toolbar">
        <div className="tf-gate-filters">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="tf-filter-select">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value as any)} className="tf-filter-select">
            <option value="all">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button className="tf-btn secondary">
          <Download size={16} /> Export Log
        </button>
      </div>

      <div className="tf-gate-list">
        {filtered.length === 0 ? (
          <div className="tf-gate-empty">
            <Shield size={48} />
            <h3>No approvals pending</h3>
            <p>All caught up! New approval requests will appear here.</p>
          </div>
        ) : (
          filtered.map(approval => (
            <ApprovalRequest
              key={approval.id}
              title={`Approval #${approval.id.slice(-6)}`}
              data={{
                tool: approval.tool,
                action: approval.action,
                description: approval.description,
                riskLevel: approval.riskLevel,
                sql: approval.sql,
                affectedRows: approval.affectedRows,
                preview: approval.preview,
                onApprove: () => handleApprove(approval.id),
                onDeny: (reason) => handleDeny(approval.id, reason),
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};