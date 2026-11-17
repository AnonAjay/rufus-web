import React from "react";
import "./IslandCapsule.css";

export type CapsuleFace = "idle" | "focus" | "listening" | "processing" | "speaking" | "blocked";

export type CapsuleMode =
  | "ambient"
  | "hover"
  | "listening"
  | "processing"
  | "answering_short"
  | "answering_long"
  | "action_executing"
  | "action_blocked";

export interface ActionBadgeInfo {
  type: "executing" | "blocked";
  name: string;
  details?: string;
}

export interface IslandCapsuleProps {
  mode: CapsuleMode;
  face: CapsuleFace;
  responseText?: string;
  responseSummary?: string;
  actionBadge?: ActionBadgeInfo | null;
  waveformBars: number[];
  focusTimeFormatted?: string;
  isFocusPaused?: boolean;
  onToggleFocusPause?: () => void;
  onToggleMic: () => void;
  onCancelVoice: () => void;
  onSubmitVoice: () => void;
  onExpandToWorkstation: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const IslandCapsule: React.FC<IslandCapsuleProps> = ({
  mode,
  face,
  responseText,
  responseSummary,
  actionBadge,
  waveformBars,
  focusTimeFormatted,
  isFocusPaused,
  onToggleFocusPause,
  onToggleMic,
  onCancelVoice,
  onSubmitVoice,
  onExpandToWorkstation,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Normalize 10 waveform bars for Wispr Flow recording bar
  const displayBars =
    waveformBars && waveformBars.length >= 10
      ? waveformBars.slice(0, 10)
      : [0.15, 0.35, 0.65, 0.4, 0.85, 0.7, 0.45, 0.9, 0.5, 0.2];

  // Render OLED Eyes based on active face
  const renderEyes = () => {
    return (
      <div className={`capsule-eyes face-${face}`} data-tauri-drag-region>
        <div className="capsule-eye left" />
        <div className="capsule-eye right" />
      </div>
    );
  };

  return (
    <div
      className="rufus-capsule-overlay"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`island-capsule mode-${mode} face-${face}`}
        data-tauri-drag-region={mode === "ambient" || mode === "hover" ? true : undefined}
      >
        {/* ========================================================
            CASE 1: AMBIENT REST (80x36 Squircle - Minimal Eyes Only)
           ======================================================== */}
        {mode === "ambient" && (
          <div className="capsule-ambient-layout" data-tauri-drag-region>
            {renderEyes()}
          </div>
        )}

        {/* ========================================================
            CASE 2 & 10 (HOVER): HOVERED IDLE / FOCUS (140x40 or 190x40)
           ======================================================== */}
        {mode === "hover" && (
          <div className="capsule-hover-layout" data-tauri-drag-region>
            <div className="capsule-hover-left" data-tauri-drag-region>
              {renderEyes()}
            </div>

            {/* If Focus Mode Active, show countdown and pause toggle */}
            {face === "focus" && focusTimeFormatted ? (
              <div className="capsule-focus-countdown" data-tauri-drag-region="false">
                <span className="focus-time-label">{focusTimeFormatted}</span>
                <button
                  type="button"
                  className="capsule-micro-btn focus-pause-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFocusPause?.();
                  }}
                  title={isFocusPaused ? "Resume focus" : "Pause focus"}
                >
                  {isFocusPaused ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  )}
                </button>
              </div>
            ) : null}

            <div className="capsule-hover-actions" data-tauri-drag-region="false">
              {/* Push-to-Talk Mic Toggle */}
              <button
                type="button"
                className="capsule-micro-btn mic-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMic();
                }}
                title="Push to talk (Alt+,)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" y2="22" />
                </svg>
              </button>

              {/* Expand to Workstation */}
              <button
                type="button"
                className="capsule-micro-btn expand-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandToWorkstation();
                }}
                title="Expand to Full Workstation"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            CASE 3: WISPR FLOW LISTENING BAR (260x44: [✕] Wave [✓])
           ======================================================== */}
        {mode === "listening" && (
          <div className="capsule-listening-layout" data-tauri-drag-region>
            {/* Cancel Button [ ✕ ] */}
            <button
              type="button"
              className="wispr-btn cancel-btn"
              data-tauri-drag-region="false"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onCancelVoice();
              }}
              title="Cancel recording (Esc)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Dynamic Waveform Bars */}
            <div className="wispr-waveform" data-tauri-drag-region>
              {displayBars.map((val, idx) => (
                <div
                  key={idx}
                  className="wispr-bar"
                  style={{
                    height: `${Math.max(4, Math.min(22, Math.round(val * 22)))}px`,
                  }}
                />
              ))}
            </div>

            {/* Submit / Done Button [ ✓ ] */}
            <button
              type="button"
              className="wispr-btn submit-btn"
              data-tauri-drag-region="false"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSubmitVoice();
              }}
              title="Send voice query (Enter)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ========================================================
            CASE 5: PROCESSING & REASONING (180x40 - Radar Glow Bar)
           ======================================================== */}
        {mode === "processing" && (
          <div className="capsule-processing-layout" data-tauri-drag-region>
            <div className="capsule-processing-left" data-tauri-drag-region>
              {renderEyes()}
            </div>
            <div className="capsule-processing-center" data-tauri-drag-region>
              <span className="processing-shimmer-text">Thinking & reasoning...</span>
            </div>
          </div>
        )}

        {/* ========================================================
            CASE 6, 7, 8, 9: TWO-COLUMN ANSWERING / ACTION CARDS
           ======================================================== */}
        {(mode === "answering_short" ||
          mode === "answering_long" ||
          mode === "action_executing" ||
          mode === "action_blocked") && (
          <div className="capsule-card-layout">
            {/* Left Column: Eyes on top, Micro-Controls on bottom */}
            <div className="capsule-card-col-left" data-tauri-drag-region>
              <div className="card-eyes-container" data-tauri-drag-region>
                {renderEyes()}
              </div>

              <div className="card-col-actions" data-tauri-drag-region="false">
                <button
                  type="button"
                  className="capsule-micro-btn mic-btn"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMic();
                  }}
                  title="Push to talk (Alt+,)"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" y2="22" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="capsule-micro-btn expand-btn"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandToWorkstation();
                  }}
                  title="Expand to Full Workstation"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Pane: Badges + Markdown Text or Summary CTA */}
            <div className="capsule-card-col-right" data-tauri-drag-region="false">
              {/* Action Badges */}
              {actionBadge && (
                <div className={`action-badge-pill ${actionBadge.type}`}>
                  {actionBadge.type === "executing" ? (
                    <>
                      <span className="badge-pulse-dot" />
                      <span className="badge-text">⚡ Action: {actionBadge.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="badge-warning-icon">⛔</span>
                      <span className="badge-text">Blocked: {actionBadge.name}</span>
                    </>
                  )}
                </div>
              )}

              {/* Short Answer text bubble */}
              {mode === "answering_short" && (
                <div className="card-response-bubble">
                  <p className="response-text">{responseText || "Rufus processed your request."}</p>
                </div>
              )}

              {/* Long Answer: Summary + CTA */}
              {mode === "answering_long" && (
                <div className="card-response-long">
                  <p className="response-summary-text">
                    {responseSummary || responseText?.slice(0, 110) || "Complete response generated..."}...
                  </p>
                  <button
                    type="button"
                    className="card-workstation-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpandToWorkstation();
                    }}
                  >
                    <span>View in Workstation</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Action Executing / Blocked detailed feedback */}
              {(mode === "action_executing" || mode === "action_blocked") && !responseText && (
                <div className="card-response-bubble">
                  <p className="response-text muted">
                    {actionBadge?.details || (mode === "action_blocked" ? "App disabled in permissions allowlist." : "Running tool...")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IslandCapsule;
