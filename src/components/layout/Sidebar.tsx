import React from "react";
import "./Sidebar.css";

export type NavTab = "command" | "voice" | "actions" | "approvals" | "apps";

export interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  approvalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  approvalsCount = 3,
}) => {
  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle Header */}
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* Section 1: TALK */}
        <div className="nav-section">
          {!isCollapsed && <span className="section-label">TALK</span>}

          <button
            type="button"
            className={`nav-item ${activeTab === "command" ? "active" : ""}`}
            onClick={() => onSelectTab("command")}
            title="Command (⌘)"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
            </span>
            {!isCollapsed && <span className="nav-text">Command</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "voice" ? "active" : ""}`}
            onClick={() => onSelectTab("voice")}
            title="Voice"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </span>
            {!isCollapsed && <span className="nav-text">Voice</span>}
          </button>
        </div>

        {/* Section 2: DO */}
        <div className="nav-section">
          {!isCollapsed && <span className="section-label">DO</span>}

          <button
            type="button"
            className={`nav-item ${activeTab === "actions" ? "active" : ""}`}
            onClick={() => onSelectTab("actions")}
            title="Actions"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </span>
            {!isCollapsed && <span className="nav-text">Actions</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "approvals" ? "active" : ""}`}
            onClick={() => onSelectTab("approvals")}
            title="Approvals"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </span>
            {!isCollapsed && (
              <>
                <span className="nav-text">Approvals</span>
                {approvalsCount > 0 && <span className="badge-pill">{approvalsCount}</span>}
              </>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "apps" ? "active" : ""}`}
            onClick={() => onSelectTab("apps")}
            title="Apps and Skills"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            {!isCollapsed && <span className="nav-text">Apps and Skills</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};
