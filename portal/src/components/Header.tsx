import React from 'react';
import { Search, Bell, Moon, Sun, Menu, User, LogOut, Settings } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import './Header.css';

export const Header = () => {
  const { session, isConnected, user } = useSession();
  const [darkMode, setDarkMode] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="tf-header">
      <div className="tf-header-left">
        <button className="tf-header-btn" aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div className="tf-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations, tables, anomalies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tf-search-input"
          />
        </div>
      </div>

      <div className="tf-header-center">
        <div className={`tf-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="tf-status-dot" />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {session && (
          <span className="tf-session-id">Session: {session.id.slice(0, 8)}...</span>
        )}
      </div>

      <div className="tf-header-right">
        <button
          className="tf-header-btn"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="tf-header-btn notification-btn">
          <Bell size={20} />
          <span className="tf-notification-badge">3</span>
        </button>

        <div className="tf-user-menu">
          <button
            className="tf-user-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
          >
            <div className="tf-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="tf-user-name">{user?.name || 'Guest'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="tf-user-dropdown">
              <div className="tf-dropdown-header">
                <div className="tf-avatar lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                <div>
                  <div className="tf-dropdown-name">{user?.name || 'Guest User'}</div>
                  <div className="tf-dropdown-email">{user?.email || 'guest@example.com'}</div>
                </div>
              </div>
              <div className="tf-dropdown-divider" />
              <button className="tf-dropdown-item">
                <User size={16} />
                <span>Profile</span>
              </button>
              <button className="tf-dropdown-item">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="tf-dropdown-divider" />
              <button className="tf-dropdown-item danger">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

