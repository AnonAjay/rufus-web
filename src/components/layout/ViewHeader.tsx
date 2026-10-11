import React from "react";
import { NavTab } from "./Sidebar";
import "./ViewHeader.css";

export interface ViewHeaderProps {
  activeTab: NavTab;
  isLive?: boolean;
}

const TAB_METADATA: Record<NavTab, { title: string; subtitle: string }> = {
  command: {
    title: "Command",
    subtitle: "One conversation. Every capability. You stay in control.",
  },
  voice: {
    title: "Voice Companion",
    subtitle: "Real-time push-to-talk speech and ambient audio pipeline.",
  },
  actions: {
    title: "Action Audit Log",
    subtitle: "Live feed of executed OS applications, web searches, and system controls.",
  },
  approvals: {
    title: "Pending Approvals",
    subtitle: "Human-in-the-loop review gate for sensitive desktop commands.",
  },
  apps: {
    title: "Apps & Skills Registry",
    subtitle: "Registered local tools, system capabilities, and allowlists.",
  },
};

export const ViewHeader: React.FC<ViewHeaderProps> = ({ activeTab, isLive = true }) => {
  const metadata = TAB_METADATA[activeTab];

  return (
    <div className="view-header">
      <div className="view-header-left">
        <div className="view-breadcrumb">
          <span className="breadcrumb-root">RUFUS</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{activeTab.toUpperCase()}</span>
        </div>
        <h2 className="view-title">{metadata.title}</h2>
        <p className="view-subtitle">{metadata.subtitle}</p>
      </div>

      <div className="view-header-right">
        {isLive && (
          <div className="live-status-pill">
            <span className="live-dot" />
            <span className="live-text">Live</span>
          </div>
        )}
      </div>
    </div>
  );
};
