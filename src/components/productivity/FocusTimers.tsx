import React, { useState, useEffect, useRef, useMemo } from "react";
import "./FocusTimers.css";

export interface FocusTimersProps {
  activeTaskTitle?: string;
  onClearActiveTask?: () => void;
  onToggleMiniMode?: () => void;
}

export type FocusProfile = "deep" | "casual";
export type TimerCanvasMode = "selection" | "running" | "paused" | "finished";

export interface TimerPreset {
  id: string;
  name: string;
  seconds: number;
  type: "focus" | "break";
  isCustom?: boolean;
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: "p-25", name: "Pomodoro", seconds: 25 * 60, type: "focus" },
  { id: "p-50", name: "Deep Work", seconds: 50 * 60, type: "focus" },
  { id: "p-15", name: "Long Break", seconds: 15 * 60, type: "break" },
  { id: "p-5", name: "Short Rest", seconds: 5 * 60, type: "break" },
];

export const FocusTimers: React.FC<FocusTimersProps> = ({
  activeTaskTitle,
  onClearActiveTask,
  onToggleMiniMode,
}) => {
  // Preset state with CRUD capability
  const [presets, setPresets] = useState<TimerPreset[]>(() => {
    try {
      const saved = localStorage.getItem("rufus_timer_presets");
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  // State Machine
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [canvasMode, setCanvasMode] = useState<TimerCanvasMode>("selection");
  const [profile, setProfile] = useState<FocusProfile>("deep");

  // Telemetry & Leniency Tracking
  const [completedSessions, setCompletedSessions] = useState<number>(4);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(100);
  const [streakDays] = useState<number>(3);
  const [breakCount, setBreakCount] = useState<number>(0);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState<number>(0);

  // New Preset Inline Form
  const [isAddingPreset, setIsAddingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [newPresetMinutes, setNewPresetMinutes] = useState<number>(30);

  // References
  const timerRef = useRef<number | null>(null);
  const pauseTimestampRef = useRef<number | null>(null);

  // Save presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("rufus_timer_presets", JSON.stringify(presets));
    } catch {
      // ignore storage error
    }
  }, [presets]);

  // Synchronize when an active task is passed from TasksReminders
  useEffect(() => {
    if (activeTaskTitle) {
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
      setCanvasMode("selection");
    }
  }, [activeTaskTitle]);

  // Cross-Window Broadcast Sync (Island Capsule & Desktop Windows)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel("rufus_agent_sync");
      channel.postMessage({
        type: "FOCUS_TIMER_UPDATED",
        mode: canvasMode,
        remainingSeconds,
        totalSeconds,
        profile,
      });
      channel.close();
    } catch {
      // fallback
    }
  }, [canvasMode, remainingSeconds, totalSeconds, profile]);

  // Timer Tick Engine
  useEffect(() => {
    if (canvasMode === "running") {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setCanvasMode("finished");
            setCompletedSessions((c) => c + 1);
            setTotalFocusMinutes((m) => m + Math.round(totalSeconds / 60));

            // Sound Chime (Synthesized via Web Audio API)
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.16); // A5
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.7);
            } catch {
              // audio context fallback
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [canvasMode, totalSeconds]);

  // Time calculations (Hours, Minutes, Seconds)
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const pad2 = (val: number) => val.toString().padStart(2, "0");

  // Adjust time in Selection Mode
  const adjustTime = (deltaSeconds: number) => {
    if (canvasMode !== "selection") return;
    const nextVal = Math.max(60, Math.min(24 * 3600, totalSeconds + deltaSeconds));
    setTotalSeconds(nextVal);
    setRemainingSeconds(nextVal);
  };

  // Play / Pause Toggle with 15s Break Leniency Check
  const handleTogglePlay = () => {
    if (canvasMode === "running") {
      // Transition to Paused: record timestamp
      pauseTimestampRef.current = Date.now();
      setCanvasMode("paused");
    } else {
      // Transition from Paused to Running: check leniency
      if (pauseTimestampRef.current) {
        const diffSec = Math.round((Date.now() - pauseTimestampRef.current) / 1000);
        if (diffSec >= 15) {
          // Genuine break registered (>15s)
          setBreakSecondsTracker(diffSec);
        }
        pauseTimestampRef.current = null;
      }
      setCanvasMode("running");
    }
  };

  const setBreakSecondsTracker = (secs: number) => {
    setBreakCount((c) => c + 1);
    setTotalBreakSeconds((b) => b + secs);
  };

  // Reset / Replay Handler
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    pauseTimestampRef.current = null;
    setRemainingSeconds(totalSeconds);
    setCanvasMode("selection");
  };

  // Quick Extension (+5m, +10m)
  const handleAddMinutes = (mins: number) => {
    setTotalSeconds((prev) => prev + mins * 60);
    setRemainingSeconds((prev) => prev + mins * 60);
  };

  // Select Preset
  const handleSelectPreset = (preset: TimerPreset) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTotalSeconds(preset.seconds);
    setRemainingSeconds(preset.seconds);
    setCanvasMode("selection");
  };

  // Preset CRUD Operations
  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || newPresetMinutes <= 0) return;
    const newPreset: TimerPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      seconds: newPresetMinutes * 60,
      type: "focus",
      isCustom: true,
    };
    setPresets((prev) => [...prev, newPreset]);
    setNewPresetName("");
    setNewPresetMinutes(30);
    setIsAddingPreset(false);
    handleSelectPreset(newPreset);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  // Stadium Progress & Pupil Motion Math
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  // Pupil motion: subtle tracking along the perimeter angle
  const pupilOffset = useMemo(() => {
    if (canvasMode !== "running") return { x: 0, y: 0 };
    const angle = progressRatio * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.round(Math.cos(angle) * 7),
      y: Math.round(Math.sin(angle) * 4),
    };
  }, [canvasMode, progressRatio]);

  return (
    <div className="focus-timers-container">
      {/* Top Navigation & Status Bar */}
      <div className="focus-top-nav-bar">
        <div className="focus-title-cluster">
          <h2 className="focus-main-heading">Focus & Timer</h2>
          <span className="focus-time-badge">
            ({pad2(Math.floor(remainingSeconds / 60))}:{pad2(remainingSeconds % 60)})
          </span>
        </div>

        {/* Mode & Mini-Mode Controls */}
        <div className="focus-nav-right">
          {activeTaskTitle && (
            <div className="focus-active-task-pill">
              <span className="task-pill-tag">ACTIVE TASK:</span>
              <span className="task-pill-name">{activeTaskTitle}</span>
              {onClearActiveTask && (
                <button
                  type="button"
                  className="task-pill-clear-btn"
                  onClick={onClearActiveTask}
                  title="Clear task link"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {onToggleMiniMode && (
            <button
              type="button"
              className="focus-float-capsule-btn"
              onClick={onToggleMiniMode}
              title="Collapse to floating Island Capsule"
            >
              <span>Float Capsule</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="focus-workspace-grid">
        {/* Left Column: Stadium Canvas & Bottom 5-Button Action Cluster */}
        <div className="focus-center-stage">
          {/* THE STADIUM CANVAS */}
          <div className="stadium-canvas-container">
            {/* SVG Stadium Perimeter Progress Track */}
            <svg
              className="stadium-track-svg"
              viewBox="0 0 520 290"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Milestone: Top Finish Flag (🏁) */}
              <g className="stadium-finish-flag" transform="translate(252, 6)">
                {/* SVG Finish Flag Icon */}
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="#00e5ff" opacity="0.8" />
                <line x1="4" y1="22" x2="4" y2="15" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Lap Start Tick Marker */}
              <line x1="84" y1="8" x2="84" y2="20" stroke="rgba(0, 229, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />

              {/* Background Inactive Track */}
              <rect
                x="14"
                y="14"
                width="492"
                height="262"
                rx="38"
                className="stadium-track-bg"
                pathLength="1000"
              />

              {/* Glowing Laser Progress Stroke */}
              <rect
                x="14"
                y="14"
                width="492"
                height="262"
                rx="38"
                className={`stadium-track-laser ${canvasMode === "running" ? "active" : ""}`}
                pathLength="1000"
                strokeDasharray="1000"
                strokeDashoffset={1000 * (1 - progressRatio)}
              />
            </svg>

            {/* SCREEN INNER CONTENT: 3 States (Selection, Running/Paused Eyes, Finished) */}
            <div className="stadium-screen-viewport">
              {/* STATE 1: SELECTION MODE (Collapses on start) */}
              <div className={`stadium-mode-selection ${canvasMode === "selection" ? "visible" : "collapsed"}`}>
                <div className="stopwatch-digits-row">
                  {/* Hours */}
                  <div className="stopwatch-digit-unit">
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(3600)} title="+1 Hour">
                      ▲
                    </button>
                    <span className="digit-value">{pad2(hours)}</span>
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(-3600)} title="-1 Hour">
                      ▼
                    </button>
                    <span className="digit-unit-label">HOURS</span>
                  </div>

                  <span className="stopwatch-colon">:</span>

                  {/* Minutes */}
                  <div className="stopwatch-digit-unit">
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(60)} title="+1 Min">
                      ▲
                    </button>
                    <span className="digit-value">{pad2(minutes)}</span>
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(-60)} title="-1 Min">
                      ▼
                    </button>
                    <span className="digit-unit-label">MINUTES</span>
                  </div>

                  <span className="stopwatch-colon">:</span>

                  {/* Seconds */}
                  <div className="stopwatch-digit-unit">
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(1)} title="+1 Sec">
                      ▲
                    </button>
                    <span className="digit-value">{pad2(seconds)}</span>
                    <button type="button" className="digit-adjust-btn" onClick={() => adjustTime(-1)} title="-1 Sec">
                      ▼
                    </button>
                    <span className="digit-unit-label">SECONDS</span>
                  </div>
                </div>

                <span className="stadium-selection-hint">Select duration or choose a preset from the right rail</span>
              </div>

              {/* STATE 2: RUNNING & PAUSED MODES (Rufus OLED Focused Eyes tracking progress) */}
              <div className={`stadium-mode-running ${canvasMode === "running" || canvasMode === "paused" ? "visible" : "hidden"}`}>
                <div className="stadium-focused-eyes-frame">
                  {/* Left Slanted Focus Eye */}
                  <div className="stadium-slanted-eye left">
                    <div
                      className="stadium-slit-pupil"
                      style={{
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                      }}
                    />
                  </div>

                  {/* Right Slanted Focus Eye */}
                  <div className="stadium-slanted-eye right">
                    <div
                      className="stadium-slit-pupil"
                      style={{
                        transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                      }}
                    />
                  </div>
                </div>

                <div className="stadium-running-time-display">
                  <span className="running-digital-text">
                    {pad2(Math.floor(remainingSeconds / 60))}:{pad2(remainingSeconds % 60)}
                  </span>
                  <span className="running-state-caption">
                    {canvasMode === "running" ? "STAY LOCKED IN • TRACKING ACTIVE" : "PAUSED • BREAK LENIENCY ACTIVE"}
                  </span>
                </div>
              </div>

              {/* STATE 3: FINISHED MODE */}
              <div className={`stadium-mode-finished ${canvasMode === "finished" ? "visible" : "hidden"}`}>
                <div className="finished-trophy-icon">
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <h3 className="finished-headline">Focus Interval Completed!</h3>
                <p className="finished-summary">
                  Logged {Math.round(totalSeconds / 60)}m of pure focus • Breaks: {breakCount} ({Math.round(totalBreakSeconds / 60)}m total)
                </p>
                <button type="button" className="finished-replay-btn" onClick={handleReset}>
                  Replay Interval
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM 5 ACTION BUTTONS (Clean Custom Vector SVGs - Zero Emojis) */}
          <div className="focus-action-bar-cluster">
            {/* Button 1: Target / Focus Mode Toggle */}
            <button
              type="button"
              className={`focus-action-btn btn-target ${profile === "deep" ? "active" : ""}`}
              onClick={() => setProfile((p) => (p === "deep" ? "casual" : "deep"))}
              title={profile === "deep" ? "Deep Focus: Strict App Guard Active" : "Casual Timer Active"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            </button>

            {/* Button 2: Replay / Reset */}
            <button
              type="button"
              className="focus-action-btn btn-reset"
              onClick={handleReset}
              title="Reset Timer to Initial Duration"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            {/* Button 3: Main Play / Pause (Enlarged) */}
            <button
              type="button"
              className={`focus-action-btn btn-play-main ${canvasMode === "running" ? "running" : ""}`}
              onClick={handleTogglePlay}
              title={canvasMode === "running" ? "Pause Timer" : "Start Focus"}
            >
              {canvasMode === "running" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            {/* Button 4: +5m Quick Extend */}
            <button
              type="button"
              className="focus-action-btn btn-extend"
              onClick={() => handleAddMinutes(5)}
              title="Add 5 Minutes"
            >
              <span className="btn-extend-typography">+5m</span>
            </button>

            {/* Button 5: +10m Quick Extend */}
            <button
              type="button"
              className="focus-action-btn btn-extend"
              onClick={() => handleAddMinutes(10)}
              title="Add 10 Minutes"
            >
              <span className="btn-extend-typography">+10m</span>
            </button>
          </div>

          {/* COMPANION HARDWARE PRESENCE RIBBON (Section 5.4 & 5.6) */}
          <div className="companion-presence-ribbon">
            <div className="presence-chip">
              <span className={`presence-dot ${canvasMode === "running" ? "pulse-cyan" : "live"}`} />
              <span className="presence-label">ESP32 Robot:</span>
              <span className="presence-val">{canvasMode === "running" ? "OLED Focused" : "Idle Neutral"}</span>
            </div>
            <div className="presence-chip">
              <span className={`presence-dot ${canvasMode === "running" ? "pulse-cyan" : "live"}`} />
              <span className="presence-label">Island Capsule:</span>
              <span className="presence-val">Sync Active</span>
            </div>
            <div className="presence-chip">
              <span className="presence-dot" style={{ background: profile === "deep" ? "#00e5ff" : "#64748b" }} />
              <span className="presence-label">Quiet Mode:</span>
              <span className="presence-val">{profile === "deep" ? "DND On" : "Standard"}</span>
            </div>
          </div>

          {/* DAILY FOCUS GOAL & STREAK PROGRESS BAR (Section 5.6) */}
          <div className="daily-target-streak-bar">
            <div className="target-bar-header">
              <span className="target-bar-title">DAILY FOCUS GOAL</span>
              <span className="target-bar-metric">
                {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m / 3h 00m ({Math.min(100, Math.round((totalFocusMinutes / 180) * 100))}%)
              </span>
            </div>
            <div className="target-progress-track">
              <div
                className="target-progress-fill"
                style={{ width: `${Math.min(100, (totalFocusMinutes / 180) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Auxiliary Rail (Custom Preset CRUD + Trophy / Streak Badges) */}
        <div className="focus-aux-rail">
          {/* TOP SECTION: CUSTOM TIMER CRUD */}
          <div className="aux-panel-card presets-card">
            <div className="aux-card-header">
              <span className="aux-card-title">Timer Presets</span>
              <button
                type="button"
                className="aux-add-preset-btn"
                onClick={() => setIsAddingPreset((p) => !p)}
                title="Add Custom Preset"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            {/* Inline Add Preset Form */}
            {isAddingPreset && (
              <form className="aux-inline-add-form" onSubmit={handleCreatePreset}>
                <input
                  type="text"
                  className="aux-preset-input"
                  placeholder="Preset title..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  autoFocus
                />
                <div className="aux-form-row">
                  <input
                    type="number"
                    className="aux-preset-number"
                    min="1"
                    max="180"
                    value={newPresetMinutes}
                    onChange={(e) => setNewPresetMinutes(Number(e.target.value))}
                  />
                  <span className="aux-mins-label">mins</span>
                  <button type="submit" className="aux-save-btn">Save</button>
                  <button type="button" className="aux-cancel-btn" onClick={() => setIsAddingPreset(false)}>✕</button>
                </div>
              </form>
            )}

            {/* Presets List */}
            <div className="aux-presets-list">
              {presets.map((p) => {
                const isSelected = totalSeconds === p.seconds;
                return (
                  <div
                    key={p.id}
                    className={`aux-preset-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    <div className="aux-preset-info">
                      <span className="aux-preset-name">{p.name}</span>
                      <span className="aux-preset-duration">{Math.round(p.seconds / 60)}m</span>
                    </div>

                    {p.isCustom && (
                      <button
                        type="button"
                        className="aux-preset-delete-btn"
                        onClick={(e) => handleDeletePreset(p.id, e)}
                        title="Delete custom preset"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM SECTION: COLLAPSED TROPHY & STREAK CLUSTER */}
          <div className="aux-panel-card trophy-card">
            <div className="aux-card-header">
              <span className="aux-card-title">Trophy & Streak</span>
              <span className="aux-card-badge">LIVE METRICS</span>
            </div>

            {/* Isometric / Hexagonal Honeycomb Badges */}
            <div className="trophy-hex-grid">
              {/* Hex Badge 1: Streak */}
              <div className="hex-badge-card streak">
                <div className="hex-badge-halo">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                </div>
                <span className="hex-badge-val">{streakDays} Days</span>
                <span className="hex-badge-sub">Current Streak</span>
              </div>

              {/* Hex Badge 2: Today's Focus Sessions */}
              <div className="hex-badge-card sessions">
                <div className="hex-badge-halo">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="hex-badge-val">{completedSessions} Sessions</span>
                <span className="hex-badge-sub">Today's Total</span>
              </div>

              {/* Hex Badge 3: Focus Hours */}
              <div className="hex-badge-card time">
                <div className="hex-badge-halo">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="hex-badge-val">
                  {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
                </span>
                <span className="hex-badge-sub">Focus Logged</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
