import React from "react";
import "./ThinkingIndicator.css";

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="thinking-row">
      {/* Rufus Logo with Orbiting Loading Ring */}
      <div className="thinking-avatar-wrapper">
        <div className="thinking-orbit-ring" />
        <div className="thinking-avatar-inner">
          <div className="thinking-oled-screen">
            <div className="thinking-eye left">
              <div className="thinking-pupil" />
            </div>
            <div className="thinking-eye right">
              <div className="thinking-pupil" />
            </div>
          </div>
        </div>
      </div>

      {/* Thinking Status Box */}
      <div className="thinking-bubble">
        <div className="thinking-header">
          <span className="thinking-name">Rufus</span>
          <span className="thinking-tag">Thinking mode</span>
        </div>
        <div className="thinking-content">
          <span className="thinking-shimmer-text">
            Reasoning & coordinating tools...
          </span>
          <div className="thinking-dots">
            <span className="t-dot" />
            <span className="t-dot" />
            <span className="t-dot" />
          </div>
        </div>
      </div>
    </div>
  );
};
