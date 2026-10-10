import React from "react";

export interface ActionBadgeProps {
  action: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action }) => {
  const getIcon = () => {
    const lower = action.toLowerCase();
    if (lower.includes("whatsapp")) return "💬";
    if (lower.includes("code") || lower.includes("antigravity")) return "⚡";
    if (lower.includes("search")) return "🔍";
    if (lower.includes("spotify")) return "🎵";
    if (lower.includes("website") || lower.includes("opened http")) return "🌐";
    return "⚙️";
  };

  return (
    <div className="action-badge">
      <span className="action-badge-icon">{getIcon()}</span>
      <span className="action-badge-text">{action}</span>
    </div>
  );
};
