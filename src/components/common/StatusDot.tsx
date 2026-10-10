import React from "react";

export interface StatusDotProps {
  label: string;
  status: "online" | "offline" | "busy";
  detail?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ label, status, detail }) => {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "var(--status-online, #10b981)";
      case "busy":
        return "var(--status-busy, #f59e0b)";
      case "offline":
      default:
        return "var(--status-offline, #ef4444)";
    }
  };

  return (
    <div className="status-pill" title={detail || `${label}: ${status}`}>
      <span
        className={`status-indicator ${status}`}
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-label">{label}</span>
      {detail && <span className="status-detail">({detail})</span>}
    </div>
  );
};
