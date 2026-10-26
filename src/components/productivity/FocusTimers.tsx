import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

// Mathematically exact perimeter point along clockwise stadium path
// Path: 680x350, inset 16, corner radius 48
const computeStadiumPoint = (t: number) => {
  const arcLen = (Math.PI / 2) * 48; // ~75.398
  const totalLen = 276 + arcLen + 222 + arcLen + 552 + arcLen + 222 + arcLen + 276; // ~1849.59
  let d = (((t % 1) + 1) % 1) * totalLen;

  // 1. Top-Right Straight: (340, 16) -> (616, 16)
  if (d <= 276) return { x: 340 + d, y: 16 };
  d -= 276;

  // 2. Top-Right Corner Arc: (616, 16) -> (664, 64)
  if (d <= arcLen) {
    const angle = d / 48 - Math.PI / 2;
    return { x: 616 + 48 * Math.cos(angle), y: 64 + 48 * Math.sin(angle) };
  }
  d -= arcLen;

  // 3. Right Vertical Edge: (664, 64) -> (664, 286)
  if (d <= 222) return { x: 664, y: 64 + d };
  d -= 222;

  // 4. Bottom-Right Corner Arc: (664, 286) -> (616, 334)
  if (d <= arcLen) {
    const angle = d / 48;
    return { x: 616 + 48 * Math.cos(angle), y: 286 + 48 * Math.sin(angle) };
  }
  d -= arcLen;

  // 5. Bottom Horizontal Edge: (616, 334) -> (64, 334)
  if (d <= 552) return { x: 616 - d, y: 334 };
  d -= 552;

  // 6. Bottom-Left Corner Arc: (64, 334) -> (16, 286)
  if (d <= arcLen) {
    const angle = d / 48 + Math.PI / 2;
    return { x: 64 + 48 * Math.cos(angle), y: 286 + 48 * Math.sin(angle) };
  }
  d -= arcLen;

  // 7. Left Vertical Edge: (16, 286) -> (16, 64)
  if (d <= 222) return { x: 16, y: 286 - d };
  d -= 222;

  // 8. Top-Left Corner Arc: (16, 64) -> (64, 16)
  if (d <= arcLen) {
    const angle = d / 48 + Math.PI;
    return { x: 64 + 48 * Math.cos(angle), y: 64 + 48 * Math.sin(angle) };
  }
  d -= arcLen;

  // 9. Top-Left Straight back to center: (64, 16) -> (340, 16)
  return { x: 64 + d, y: 16 };
};

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
  const [modeToast, setModeToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

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

  // Bottom-Right Trophy HUD Popover State
  const [isTrophyOpen, setIsTrophyOpen] = useState<boolean>(false);
  const [isTrophyHovered, setIsTrophyHovered] = useState<boolean>(false);

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

  // Hold-to-repeat timer state
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  // Adjust time in Selection Mode
  const adjustTime = useCallback((deltaSeconds: number) => {
    if (canvasMode !== "selection") return;
    setTotalSeconds((prev) => {
      const nextVal = Math.max(60, Math.min(24 * 3600, prev + deltaSeconds));
      setRemainingSeconds(nextVal);
      return nextVal;
    });
  }, [canvasMode]);

  // Hold-to-repeat interaction engine
  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback((deltaSeconds: number) => {
    if (canvasMode !== "selection") return;
    // 1. Instant response on tap
    adjustTime(deltaSeconds);
    stopHold();

    // 2. Debounce hold before repeating
    holdTimeoutRef.current = setTimeout(() => {
      let ticks = 0;
      let intervalMs = 90;

      const runTick = () => {
        adjustTime(deltaSeconds);
        ticks++;
        if (ticks === 10 && intervalMs > 35) {
          intervalMs = 40;
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = setInterval(runTick, intervalMs);
        }
      };

      holdIntervalRef.current = setInterval(runTick, intervalMs);
    }, 280);
  }, [canvasMode, adjustTime, stopHold]);

  useEffect(() => {
    return () => stopHold();
  }, [stopHold]);

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

  // Focus Mode Profile Toggle (Bullseye Target vs Arrows Only)
  const handleToggleProfile = () => {
    const next = profile === "deep" ? "casual" : "deep";
    setProfile(next);
    setModeToast(next === "deep" ? "🎯 DEEP FOCUS • BULLSEYE ACTIVE" : "🏹 CASUAL FLOW • ARROWS ACTIVE");
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setModeToast(null);
    }, 2200);
  };

  // Reset / Replay Handler
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    pauseTimestampRef.current = null;
    setRemainingSeconds(totalSeconds);
    setCanvasMode("selection");
  };

  // Quick Extension (+5m)
  const handleAddMinutes = (mins: number) => {
    setTotalSeconds((prev) => prev + mins * 60);
    setRemainingSeconds((prev) => prev + mins * 60);
  };

  // Early Complete Handler (Flag action)
  const handleCompleteEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    pauseTimestampRef.current = null;
    setRemainingSeconds(0);
    setCompletedSessions((c) => c + 1);
    setTotalFocusMinutes((m) => m + Math.max(1, Math.round((totalSeconds - remainingSeconds) / 60)));
    setCanvasMode("finished");

    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      // Audio fallback
    }
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

  // Exact Ray-Cast Eye Tracking toward the laser on the perimeter
  const pupilOffset = useMemo(() => {
    if (canvasMode !== "running" && canvasMode !== "paused") {
      return { x: 0, y: 0 };
    }
    const pt = computeStadiumPoint(progressRatio);
    // Vector from center of OLED display (340, 165) to target point
    const dx = pt.x - 340;
    const dy = pt.y - 165;
    const angle = Math.atan2(dy, dx);
    return {
      x: Math.round(Math.cos(angle) * 11),
      y: Math.round(Math.sin(angle) * 7),
    };
  }, [canvasMode, progressRatio]);

  return (
    <div className="focus-timers-container">
      {/* Top Navigation & Status Bar */}
      <div className="focus-top-nav-bar">
        <div className="focus-title-cluster">
          <h2 className="focus-main-heading">Focus & Timer</h2>
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
            {/* SVG Stadium Perimeter Progress Track (680x350) */}
            <svg
              className="stadium-track-svg"
              viewBox="0 0 680 350"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="stadium-flag-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e5ff" />
                  <stop offset="100%" stopColor="#00b4d8" />
                </linearGradient>
              </defs>

              {/* Checkered Start / Finish Gate Line */}
              <line
                x1="340"
                y1="6"
                x2="340"
                y2="26"
                stroke="#00e5ff"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                opacity="0.85"
              />

              {/* Top Finish Flag (🏁) raised prominently above the track */}
              <g className="stadium-finish-flag" transform="translate(340, -10)">
                {/* Extended mast from perimeter track (y=16 -> local y=26) to mast tip (local y=0) */}
                <line x1="0" y1="26" x2="0" y2="0" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" />
                {/* Anchor dot on perimeter track */}
                <circle cx="0" cy="26" r="2" fill="#00e5ff" />
                {/* Mast top finial */}
                <circle cx="0" cy="0" r="2.2" fill="#00e5ff" />
                {/* Waving cyber pennant flying above perimeter */}
                <path
                  d="M0 13s1.2-1 4.2-1 5.4 1.8 8.4 1.8 4.2-0.9 4.2-0.9V2s-1.2 0.9-4.2 0.9-5.4-1.8-8.4-1.8-4.2 1-4.2 1z"
                  fill="url(#stadium-flag-grad)"
                />
                {/* Checkered accents on waving flag */}
                <path d="M 4 4.5 L 8 5.8 L 8 12.8 L 4 11.5 Z" fill="rgba(9, 14, 24, 0.45)" />
                <path d="M 12.6 3.4 L 16.8 2.5 L 16.8 9.5 L 12.6 10.4 Z" fill="rgba(9, 14, 24, 0.45)" />
              </g>

              {/* Background Inactive Track (Clockwise loop starting at top-center) */}
              <path
                d="M 340 16 L 616 16 A 48 48 0 0 1 664 64 L 664 286 A 48 48 0 0 1 616 334 L 64 334 A 48 48 0 0 1 16 286 L 16 64 A 48 48 0 0 1 64 16 L 340 16 Z"
                className="stadium-track-bg"
                pathLength="1000"
              />

              {/* Glowing Laser Progress Stroke (Clockwise) */}
              <path
                d="M 340 16 L 616 16 A 48 48 0 0 1 664 64 L 664 286 A 48 48 0 0 1 616 334 L 64 334 A 48 48 0 0 1 16 286 L 16 64 A 48 48 0 0 1 64 16 L 340 16 Z"
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
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(3600); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="+1 Hour (Hold to fast-forward)"
                    >
                      ▲
                    </button>
                    <span className="digit-value">{pad2(hours)}</span>
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(-3600); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="-1 Hour (Hold to fast-rewind)"
                    >
                      ▼
                    </button>
                    <span className="digit-unit-label">HOURS</span>
                  </div>

                  <span className="stopwatch-colon">:</span>

                  {/* Minutes */}
                  <div className="stopwatch-digit-unit">
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(60); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="+1 Min (Hold to fast-forward)"
                    >
                      ▲
                    </button>
                    <span className="digit-value">{pad2(minutes)}</span>
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(-60); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="-1 Min (Hold to fast-rewind)"
                    >
                      ▼
                    </button>
                    <span className="digit-unit-label">MINUTES</span>
                  </div>

                  <span className="stopwatch-colon">:</span>

                  {/* Seconds */}
                  <div className="stopwatch-digit-unit">
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(1); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="+1 Sec (Hold to fast-forward)"
                    >
                      ▲
                    </button>
                    <span className="digit-value">{pad2(seconds)}</span>
                    <button
                      type="button"
                      className="digit-adjust-btn"
                      onPointerDown={(e) => { e.preventDefault(); startHold(-1); }}
                      onPointerUp={stopHold}
                      onPointerLeave={stopHold}
                      onPointerCancel={stopHold}
                      title="-1 Sec (Hold to fast-rewind)"
                    >
                      ▼
                    </button>
                    <span className="digit-unit-label">SECONDS</span>
                  </div>
                </div>

                <span className="stadium-selection-hint">Tap or hold arrows to adjust • Select quick presets below</span>
              </div>

              {/* STATE 2: RUNNING & PAUSED MODES (Canonical Rufus OLED Face Tracking Perimeter Laser) */}
              <div className={`stadium-mode-running ${canvasMode === "running" || canvasMode === "paused" ? "visible" : "hidden"}`}>
                <div className="stadium-oled-screen-frame">
                  {/* Left Eye */}
                  <div
                    className="stadium-rufus-eye-socket"
                    style={{
                      transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                    }}
                  >
                    <div className="stadium-rufus-eye" />
                  </div>

                  {/* Right Eye */}
                  <div
                    className="stadium-rufus-eye-socket"
                    style={{
                      transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
                    }}
                  >
                    <div className="stadium-rufus-eye" />
                  </div>
                </div>

                <div className="stadium-running-time-display">
                  <span className={`running-digital-text ${canvasMode === "paused" ? "paused" : ""}`}>
                    {pad2(Math.floor(remainingSeconds / 60))}:{pad2(remainingSeconds % 60)}
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

          {/* BOTTOM 5 ACTION BUTTONS (Refined Vector SVGs) */}
          <div className="focus-action-bar-cluster">
            {/* Mode Switch Toast Pill */}
            {modeToast && <div className="focus-mode-toast-pill">{modeToast}</div>}

            {/* Button 1: Focus Profile Toggle (Bullseye Target w/ 2 Arrows for Deep Focus, Dual Arrows for Casual) */}
            <button
              type="button"
              className={`focus-action-btn btn-mode-toggle ${profile === "deep" ? "mode-deep" : "mode-casual"}`}
              onClick={handleToggleProfile}
              title={profile === "deep" ? "Deep Focus: Bullseye Active (Zero Distraction)" : "Casual Mode: Dual Arrows Active (Break Leniency)"}
            >
              {profile === "deep" ? (
                /* Bullseye Target with Two Piercing Arrows */
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  {/* Concentric Bullseye Rings */}
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
                  <circle cx="12" cy="12" r="5" stroke="#00e5ff" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="1.6" fill="#00e5ff" />
                  {/* Arrow 1 striking bullseye from top-left */}
                  <path d="M3 3l6.5 6.5" stroke="#00e5ff" strokeWidth="2.1" />
                  <path d="M5.5 9.5H9.5V5.5" stroke="#00e5ff" strokeWidth="2.1" />
                  {/* Arrow 2 striking bullseye from top-right */}
                  <path d="M21 3l-6.5 6.5" stroke="#00e5ff" strokeWidth="2.1" />
                  <path d="M18.5 9.5h-4V5.5" stroke="#00e5ff" strokeWidth="2.1" />
                </svg>
              ) : (
                /* Dual Arrows Only (Casual Flow Mode) */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Flow Arrow 1 */}
                  <path d="M4 8h12" />
                  <path d="M12 4l4 4-4 4" />
                  {/* Flow Arrow 2 */}
                  <path d="M8 16h12" />
                  <path d="M16 12l4 4-4 4" />
                </svg>
              )}
            </button>

            {/* Button 2: Replay / Reset */}
            <button
              type="button"
              className="focus-action-btn btn-reset"
              onClick={handleReset}
              title="Reset Timer to Initial Duration"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            {/* Button 4: +5m Fast-Forward Extend */}
            <button
              type="button"
              className="focus-action-btn btn-extend"
              onClick={() => handleAddMinutes(5)}
              title="Add 5 Minutes to Timer"
            >
              <span className="btn-extend-typography">+5m</span>
            </button>

            {/* Button 5: Early Complete / Flag */}
            <button
              type="button"
              className="focus-action-btn btn-finish-early"
              onClick={handleCompleteEarly}
              title="Finish Session Early & Claim Session"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </button>
          </div>

          {/* BOTTOM DOCK: Selectable Timers (Left) & Expandable Trophies (Right) */}
          <div className="focus-bottom-dock">
            {/* Left Section: Selectable Timers Capsules */}
            <div className="dock-timers-section">
              <div className="dock-section-header">
                <div className="dock-header-title-row">
                  <span className="dock-section-title">Selectable Timers</span>
                  <span className="dock-section-badge">{presets.length} options</span>
                </div>
                <button
                  type="button"
                  className="dock-add-preset-btn"
                  onClick={() => setIsAddingPreset((p) => !p)}
                  title="Add Custom Timer Preset"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add</span>
                </button>
              </div>

              {/* Inline Add Preset Form */}
              {isAddingPreset && (
                <form className="dock-inline-add-form" onSubmit={handleCreatePreset}>
                  <input
                    type="text"
                    className="dock-preset-input"
                    placeholder="Timer label..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    autoFocus
                  />
                  <div className="dock-form-row">
                    <input
                      type="number"
                      className="dock-preset-number"
                      min="1"
                      max="180"
                      value={newPresetMinutes}
                      onChange={(e) => setNewPresetMinutes(Number(e.target.value))}
                    />
                    <span className="dock-mins-label">mins</span>
                    <button type="submit" className="dock-save-btn">Save</button>
                    <button type="button" className="dock-cancel-btn" onClick={() => setIsAddingPreset(false)}>✕</button>
                  </div>
                </form>
              )}

              {/* Timer Capsules Track */}
              <div className="dock-capsules-track">
                {presets.map((p) => {
                  const isSelected = totalSeconds === p.seconds;
                  return (
                    <div
                      key={p.id}
                      className={`dock-timer-capsule ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectPreset(p)}
                      title={`Click to set timer to ${Math.round(p.seconds / 60)} minutes`}
                    >
                      <span className="capsule-name">{p.name}</span>
                      <span className="capsule-time-tag">{Math.round(p.seconds / 60)}m</span>
                      {p.isCustom && (
                        <button
                          type="button"
                          className="capsule-delete-btn"
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

            {/* Right Section: Compact Award Pill with Upward-Expanding Flyout HUD */}
            <div
              className={`dock-trophy-widget ${isTrophyOpen || isTrophyHovered ? "open" : ""}`}
              onClick={() => setIsTrophyOpen((prev) => !prev)}
              onMouseEnter={() => setIsTrophyHovered(true)}
              onMouseLeave={() => setIsTrophyHovered(false)}
            >
              {/* Flyout Popover: Expands Upward */}
              <div
                className={`trophy-flyout-hud ${isTrophyOpen || isTrophyHovered ? "visible" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flyout-hud-header">
                  <div className="flyout-hud-title-wrap">
                    <span className="flyout-hud-icon">🏆</span>
                    <span className="flyout-hud-title">Achievement & Focus Metrics</span>
                  </div>
                  <button
                    type="button"
                    className="flyout-hud-close-btn"
                    onClick={() => { setIsTrophyOpen(false); setIsTrophyHovered(false); }}
                    title="Close metrics"
                  >
                    ✕
                  </button>
                </div>

                <div className="flyout-stats-grid">
                  {/* Streak */}
                  <div className="flyout-stat-card streak">
                    <div className="flyout-stat-icon-wrap fire">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </svg>
                    </div>
                    <div className="flyout-stat-content">
                      <span className="flyout-stat-value">{streakDays} Days</span>
                      <span className="flyout-stat-label">Current Streak</span>
                    </div>
                  </div>

                  {/* Sessions Completed Today */}
                  <div className="flyout-stat-card sessions">
                    <div className="flyout-stat-icon-wrap target">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flyout-stat-content">
                      <span className="flyout-stat-value">{completedSessions} Sessions</span>
                      <span className="flyout-stat-label">Completed Today</span>
                    </div>
                  </div>

                  {/* Focus Hours Logged */}
                  <div className="flyout-stat-card time">
                    <div className="flyout-stat-icon-wrap clock">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="flyout-stat-content">
                      <span className="flyout-stat-value">{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</span>
                      <span className="flyout-stat-label">Focus Logged</span>
                    </div>
                  </div>

                  {/* Break Leniency Stats */}
                  <div className="flyout-stat-card breaks">
                    <div className="flyout-stat-icon-wrap coffee">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                    <div className="flyout-stat-content">
                      <span className="flyout-stat-value">{breakCount} ({Math.round(totalBreakSeconds / 60)}m)</span>
                      <span className="flyout-stat-label">Break Leniency</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Award Capsule Button */}
              <div className="trophy-award-pill">
                <div className="trophy-glow-icon">
                  🏆
                </div>
                <div className="trophy-pill-text">
                  <span className="trophy-pill-label">Trophies</span>
                  <span className="trophy-pill-val">{streakDays}d Streak • {completedSessions} Done</span>
                </div>
                <span className="trophy-pill-caret">▲</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
