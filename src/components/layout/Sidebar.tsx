import React from "react";
import "./Sidebar.css";

export type NavTab =
  | "assistant"
  | "history"
  | "apps"
  | "missions"
  | "focus"
  | "tasks"
  | "calendar"
  | "smart-home"
  | "robot-telemetry"
  | "personas"
  | "mood"
  | "agent-hub"
  | "memory"
  | "settings";

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
}) => {
  const renderLock = () => (
    <span className="lock-pill" title="Locked capability (Roadmap Phase)">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );

  const renderSectionHeader = (label: string, title: string) => (
    <div className="section-header-divider" title={title}>
      <span className="section-line left" />
      <span className="section-label">{label}</span>
      <span className="section-line right" />
    </div>
  );

  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle Header */}
      <div className="sidebar-top">
        <span className="sidebar-brand">RUFUS OS</span>
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
              transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Main Scrollable Navigation Area */}
      <nav className="sidebar-nav">
        {/* Section 1: CONVERSATIONS */}
        <div className="nav-section">
          {renderSectionHeader("CONVERSATIONS", "Conversations")}

          <button
            type="button"
            className={`nav-item ${activeTab === "assistant" ? "active" : ""}`}
            onClick={() => onSelectTab("assistant")}
            title="Assistant (Main Chat & Tools)"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="nav-text">Assistant</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => onSelectTab("history")}
            title="Conversation History"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="nav-text">History</span>
          </button>
        </div>

        {/* Section 2: ACTIONS */}
        <div className="nav-section">
          {renderSectionHeader("ACTIONS", "Actions & Skills")}

          <button
            type="button"
            className={`nav-item ${activeTab === "apps" ? "active" : ""}`}
            onClick={() => onSelectTab("apps")}
            title="Apps and Skills Registry"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="nav-text">Apps & Skills</span>
          </button>

          <button
            type="button"
            className={`nav-item locked ${activeTab === "missions" ? "active" : ""}`}
            onClick={() => onSelectTab("missions")}
            title="Missions (Autonomous Workflows - Locked)"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </span>
            <span className="nav-text">Missions</span>
            {renderLock()}
          </button>
        </div>

        {/* Section 3: LIFE APPS */}
        <div className="nav-section">
          {renderSectionHeader("LIFE APPS", "Life Apps & Productivity")}

          <button
            type="button"
            className={`nav-item ${activeTab === "focus" ? "active" : ""}`}
            onClick={() => onSelectTab("focus")}
            title="Focus & Timers"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="nav-text">Focus & Timers</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => onSelectTab("tasks")}
            title="Tasks & Reminders"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="nav-text">Tasks & Reminders</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => onSelectTab("calendar")}
            title="Calendar Schedule"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="nav-text">Calendar</span>
          </button>

          <button
            type="button"
            className={`nav-item locked ${activeTab === "smart-home" ? "active" : ""}`}
            onClick={() => onSelectTab("smart-home")}
            title="Smart Home (Home Assistant MCP - Locked)"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="nav-text">Smart Home</span>
            {renderLock()}
          </button>
        </div>

        {/* Section 4: ROBOT */}
        <div className="nav-section">
          {renderSectionHeader("ROBOT", "Robot Telemetry & Hardware")}

          <button
            type="button"
            className={`nav-item ${activeTab === "robot-telemetry" ? "active" : ""}`}
            onClick={() => onSelectTab("robot-telemetry")}
            title="Robot Hardware Telemetry"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
              </svg>
            </span>
            <span className="nav-text">Robot Telemetry</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "personas" ? "active" : ""}`}
            onClick={() => onSelectTab("personas")}
            title="Rufus Personas & Voice"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="nav-text">Personas</span>
          </button>

          <button
            type="button"
            className={`nav-item locked ${activeTab === "mood" ? "active" : ""}`}
            onClick={() => onSelectTab("mood")}
            title="Mood & Vision Context (Locked)"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </span>
            <span className="nav-text">Mood & Vision</span>
            {renderLock()}
          </button>
        </div>

        {/* Section 5: BRAIN */}
        <div className="nav-section">
          {renderSectionHeader("BRAIN", "Brain & Memory Layer")}

          <button
            type="button"
            className={`nav-item locked ${activeTab === "agent-hub" ? "active" : ""}`}
            onClick={() => onSelectTab("agent-hub")}
            title="Agent Hub (Cross-Agent Orchestrator - Locked)"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            <span className="nav-text">Agent Hub</span>
            {renderLock()}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === "memory" ? "active" : ""}`}
            onClick={() => onSelectTab("memory")}
            title="Persistent Memory & Context"
          >
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <span className="nav-text">Memory</span>
          </button>
        </div>
      </nav>

      {/* Pinned Bottom User Profile Footer */}
      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-avatar">
            <span className="avatar-initials">P</span>
            <span className="profile-status-dot" title="Local System Active" />
          </div>
          <div className="profile-info">
            <span className="profile-name">Pilot</span>
            <span className="profile-tier">Local Friend</span>
          </div>
          <button
            type="button"
            className={`profile-settings-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => onSelectTab("settings")}
            title="System Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
