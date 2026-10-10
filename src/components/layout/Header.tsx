import React from "react";
import { StatusDot } from "../common/StatusDot";
import { SystemStatus } from "../../types/agent";

export interface HeaderProps {
  systemStatus: SystemStatus;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="rufus-brand">
          <span className="brand-icon">🐕</span>
          <div className="brand-text">
            <h1 className="brand-title">Rufus</h1>
            <span className="brand-subtitle">AI Companion & Desktop Assistant</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <StatusDot
          label="Backend"
          status={systemStatus.backendOnline ? "online" : "offline"}
          detail="localhost:8000"
        />
        <StatusDot
          label="Ollama LLM"
          status={systemStatus.ollamaOnline ? "online" : "offline"}
          detail="llama3.2"
        />
        <StatusDot
          label="Robot (ESP32)"
          status="busy"
          detail="Mock / Bench"
        />
      </div>
    </header>
  );
};
