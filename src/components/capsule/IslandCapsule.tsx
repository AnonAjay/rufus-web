import React from "react";
import "./IslandCapsule.css";

export type CapsuleState = "idle" | "listening" | "processing" | "responding" | "dormant";

export interface IslandCapsuleProps {
  state: CapsuleState;
  subtitle?: string;
  isRecording: boolean;
  waveformBars: number[];
  onToggleMic: () => void;
  onExpandToWorkstation: () => void;
  onWakeFromDormant?: () => void;
}

export const IslandCapsule: React.FC<IslandCapsuleProps> = ({
  state,
  subtitle,
  isRecording,
  waveformBars,
  onToggleMic,
  onExpandToWorkstation,
  onWakeFromDormant,
}) => {
  const isDormant = state === "dormant";

  const getStatusText = (): { text: string; shimmer: boolean } => {
    if (state === "listening" || isRecording) {
      return { text: "Listening to you...", shimmer: false };
    }
    if (state === "processing") {
      return { text: "Thinking & reasoning...", shimmer: true };
    }
    if (state === "responding") {
      return { text: subtitle || "Speaking...", shimmer: false };
    }
    return { text: subtitle || "Rufus is ready", shimmer: false };
  };

  const statusInfo = getStatusText();

  // Normalize audio bars for compact visualizer
  const displayBars = waveformBars.length >= 8 
    ? waveformBars.slice(0, 8) 
    : [0.1, 0.2, 0.4, 0.2, 0.5, 0.3, 0.1, 0.2];

  return (
    <div className="rufus-capsule-overlay">
      <div
        className={`island-capsule ${isDormant ? "mode-dormant" : "mode-active"} state-${state}`}
        onClick={isDormant ? onWakeFromDormant : undefined}
        title={isDormant ? "Click to wake Rufus" : "Rufus Dynamic Island"}
      >
        {/* Left Segment: Animated OLED Eyes (drag handle) */}
        <div className="capsule-left" data-tauri-drag-region>
          <div className="capsule-eyes" data-tauri-drag-region>
            <div className="capsule-eye left" />
            <div className="capsule-eye right" />
          </div>
        </div>

        {/* Center Segment: Live Status & Audio Visualizer (drag region) */}
        {!isDormant ? (
          <div className="capsule-center" data-tauri-drag-region>
            {isRecording || state === "listening" ? (
              <div className="capsule-audio-bars" data-tauri-drag-region>
                {displayBars.map((val, idx) => (
                  <div
                    key={idx}
                    className="capsule-bar"
                    style={{
                      height: `${Math.max(4, Math.min(18, Math.round(val * 18)))}px`,
                    }}
                  />
                ))}
              </div>
            ) : null}

            <span
              className={`capsule-status-text ${state !== "idle" ? "active" : ""} ${statusInfo.shimmer ? "shimmer" : ""}`}
              data-tauri-drag-region
            >
              {statusInfo.text}
            </span>
          </div>
        ) : (
          <div className="capsule-center" data-tauri-drag-region style={{ cursor: "pointer" }}>
            <span className="dormant-label" data-tauri-drag-region>
              zzZ • Wake
            </span>
          </div>
        )}

        {/* Right Segment: Action Controls (Interactive - never drag) */}
        <div className="capsule-right" data-tauri-drag-region="false">
          {/* Quick Mic / Push-to-Talk Toggle (Always available) */}
          <button
            type="button"
            className={`capsule-btn ${isRecording ? "active" : ""}`}
            data-tauri-drag-region="false"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMic();
            }}
            title={isRecording ? "Stop listening" : "Push to talk / Listen"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          {/* Expand to Full Workstation (active mode only) */}
          {!isDormant && (
            <button
              type="button"
              className="capsule-btn"
              data-tauri-drag-region="false"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onExpandToWorkstation();
              }}
              title="Expand to Full Workstation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
