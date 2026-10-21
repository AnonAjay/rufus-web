import React, { useState, useEffect } from "react";
import "./SecurityApprovalBox.css";

export type ApprovalStatus = "pending" | "approved" | "denied";

export interface SecurityApprovalBoxProps {
  id?: string;
  task: string;
  risk: string;
  initialExpiresInSeconds?: number;
  initialStatus?: ApprovalStatus;
  onDecision?: (decision: "approved" | "denied" | "edited", details?: string) => void;
}

export const SecurityApprovalBox: React.FC<SecurityApprovalBoxProps> = ({
  task,
  risk,
  initialExpiresInSeconds = 30,
  initialStatus = "pending",
  onDecision,
}) => {
  const [status, setStatus] = useState<ApprovalStatus>(initialStatus);
  const [timeLeft, setTimeLeft] = useState<number>(initialExpiresInSeconds);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTask, setEditedTask] = useState<string>(task);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    if (status !== "pending") return;

    if (timeLeft <= 0) {
      handleDeny("Expired (Timeout)");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleApprove = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTimestamp(timeStr);
    setStatus("approved");
    onDecision?.("approved", editedTask);
  };

  const handleDeny = (reason?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTimestamp(timeStr);
    setStatus("denied");
    onDecision?.("denied", reason || "Denied by Pilot");
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onDecision?.("edited", editedTask);
  };

  // State 2: Decision Sealed (Audit State)
  if (status === "approved" || status === "denied") {
    const isApproved = status === "approved";
    return (
      <div className={`security-box-sealed ${isApproved ? "approved" : "denied"}`}>
        <div className="sealed-left">
          <span className="sealed-icon">{isApproved ? "✓" : "✕"}</span>
          <span className="sealed-status-badge">
            {isApproved ? "Authorized" : "Denied"}
          </span>
          <span className="sealed-task-name">{editedTask}</span>
        </div>
        <div className="sealed-right">
          <span className="sealed-timestamp">{timestamp}</span>
        </div>
      </div>
    );
  }

  // State 1: Action Authorization (Asking State)
  return (
    <div className="security-box-asking">
      {/* Header: Task Required & Expiration Timer */}
      <div className="security-box-header">
        <div className="security-box-title-group">
          <span className="security-shield-icon">🛡️</span>
          <div className="security-header-text">
            <span className="security-header-tag">Action Authorization Required</span>
            {isEditing ? (
              <input
                type="text"
                className="security-edit-input"
                value={editedTask}
                onChange={(e) => setEditedTask(e.target.value)}
                autoFocus
              />
            ) : (
              <h4 className="security-task-title">{editedTask}</h4>
            )}
          </div>
        </div>

        <div className={`security-timer-pill ${timeLeft <= 10 ? "urgent" : ""}`}>
          <span className="timer-dot" />
          <span className="timer-text">Expires: {timeLeft}s</span>
        </div>
      </div>

      {/* Body: Risk factor summarization */}
      <div className="security-box-body">
        <div className="security-risk-label">Risk Assessment & Details:</div>
        <p className="security-risk-text">{risk}</p>
      </div>

      {/* Footer: Action Buttons */}
      <div className="security-box-footer">
        {isEditing ? (
          <div className="security-btn-group">
            <button type="button" className="security-btn save" onClick={handleSaveEdit}>
              Save Changes
            </button>
            <button type="button" className="security-btn edit" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="security-btn-group">
            <button type="button" className="security-btn approve" onClick={handleApprove}>
              <span className="btn-glyph">✓</span> Approve
            </button>
            <button type="button" className="security-btn edit" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button type="button" className="security-btn deny" onClick={() => handleDeny("Rejected by Pilot")}>
              <span className="btn-glyph">✕</span> Deny
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
