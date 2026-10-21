import React from "react";
import { ChatMessage } from "../../types/agent";
import { SecurityApprovalBox } from "./SecurityApprovalBox";
import "./ChatBubble.css";

export interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="chat-row user-row">
        <div className="user-bubble-container">
          <div className="user-bubble-header">
            <span className="user-sender-label">Pilot</span>
            <span className="user-timestamp">{message.timestamp}</span>
          </div>
          <div className="user-bubble-text">{message.text}</div>
        </div>
        <div className="user-avatar-badge" title="Pilot">
          <span className="user-avatar-glyph">👤</span>
        </div>
      </div>
    );
  }

  // Determine action tag
  const actionText =
    message.actions && message.actions.length > 0
      ? message.actions.join(", ")
      : "direct_reply";

  // Determine accuracy (default to high model confidence if not set)
  const accuracyText = message.accuracy || "99.4%";

  return (
    <div className="chat-row rufus-row">
      {/* Left Column: Rufus Logo & Barely Visible Timestamp Beneath */}
      <div className="rufus-left-col">
        <div className="rufus-dialog-logo" title="Rufus System Core">
          <div className="rufus-mini-oled">
            <div className="mini-eye left" />
            <div className="mini-eye right" />
          </div>
        </div>
        <span className="rufus-logo-time" title="Response Generation Time">
          {message.timestamp}
        </span>
      </div>

      {/* Main Rufus Dialog Box */}
      <div className="rufus-dialog-box">
        {/* Top Header: Right-aligned Action */}
        <div className="rufus-dialog-top">
          <div className="rufus-dialog-name">Rufus</div>
          <div className="rufus-dialog-action">
            <span className="action-prefix">action:</span>
            <span className="action-value">{actionText}</span>
          </div>
        </div>

        {/* Response Body Text */}
        <div className="rufus-dialog-body">
          {message.text}
        </div>

        {/* Optional Security Guardrail Box (HITL Action Authorization) */}
        {message.authorization && (
          <div className="rufus-dialog-security-wrapper">
            <SecurityApprovalBox
              task={message.authorization.task}
              risk={message.authorization.risk}
              initialStatus={message.authorization.status}
              initialExpiresInSeconds={message.authorization.initialExpiresInSeconds}
            />
          </div>
        )}

        {/* Bottom Footer: Super Small Barely Visible Accuracy Text */}
        <div className="rufus-dialog-bottom">
          <div className="rufus-model-crumb">
            {message.modelUsed && <span>{message.modelUsed}</span>}
          </div>
          <div className="rufus-dialog-accuracy">
            <span className="accuracy-label">accuracy:</span>
            <span className="accuracy-value">{accuracyText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
