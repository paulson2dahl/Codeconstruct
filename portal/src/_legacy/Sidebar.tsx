import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, AlertTriangle, Settings, ChevronLeft, ChevronRight, Upload, BarChart3, Link as LinkIcon } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Chat', icon: LayoutDashboard, badge: null },
  { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle, badge: '3' },
  { path: '/schema', label: 'Schema', icon: Database, badge: null },
  { path: '/approvals', label: 'Approvals', icon: FileText, badge: '1' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside className={`tf-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="tf-sidebar-header">
        {!collapsed && (
          <div className="tf-logo">
            <div className="tf-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="18" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <line x1="6" y1="9" x2="18" y2="9" />
                <line x1="6" y1="13" x2="18" y2="13" />
              </svg>
            </div>
            <span className="tf-logo-text">School Ops</span>
          </div>
        )}
        <button
          className="tf-sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="tf-sidebar-nav" role="navigation" aria-label="Main navigation">
        <ul>
          {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => `tf-nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? label : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                {!collapsed && <span className="tf-nav-label">{label}</span>}
                {!collapsed && badge && <span className="tf-badge">{badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="tf-sidebar-footer">
        {!collapsed && (
          <div className="tf-quick-actions">
            <span className="tf-section-label">Quick Actions</span>
            <div className="tf-action-buttons">
              <button className="tf-action-btn" title="Upload Data">
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <button className="tf-action-btn" title="Web Search">
                <LinkIcon size={16} />
                <span>Search</span>
              </button>
              <button className="tf-action-btn" title="Analytics">
                <BarChart3 size={16} />
                <span>Analyze</span>
              </button>
            </div>
          </div>
        )}
        {!collapsed && (
          <NavLink to="/settings" className="tf-settings-link">
            <Settings size={20} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};