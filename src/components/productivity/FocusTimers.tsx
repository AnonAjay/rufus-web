import React, { useState, useEffect, useRef, useCallback } from "react";
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

export interface AppUsageStat {
  id: string;
  name: string;
  timeSpent: string;
  percentage: number;
  category: "editor" | "browser" | "ai" | "terminal" | "other";
  icon: string;
}

export interface DayFocusMetric {
  day: string;
  hours: number;
  isPeak?: boolean;
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: "p-25", name: "Pomodoro Sprint", seconds: 25 * 60, type: "focus" },
  { id: "p-50", name: "Deep Work Core", seconds: 50 * 60, type: "focus" },
  { id: "p-15", name: "Code Review", seconds: 15 * 60, type: "focus" },
  { id: "p-90", name: "Architecture Flow", seconds: 90 * 60, type: "focus" },
];

const WEEKLY_METRICS: DayFocusMetric[] = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 4.8 },
  { day: "Wed", hours: 5.2 },
  { day: "Thu", hours: 4.0 },
  { day: "Fri", hours: 6.4, isPeak: true },
  { day: "Sat", hours: 2.8 },
  { day: "Sun", hours: 3.9 },
];

const APP_USAGE_DATA: AppUsageStat[] = [
  { id: "vscode", name: "Visual Studio Code", timeSpent: "3h 45m", percentage: 46, category: "editor", icon: "💻" },
  { id: "chrome", name: "Google Chrome", timeSpent: "2h 10m", percentage: 27, category: "browser", icon: "🌐" },
  { id: "antigravity", name: "Antigravity IDE", timeSpent: "1h 15m", percentage: 16, category: "ai", icon: "⚡" },
  { id: "terminal", name: "PowerShell & WSL", timeSpent: "45m", percentage: 11, category: "terminal", icon: "📟" },
];

export const FocusTimers: React.FC<FocusTimersProps> = ({
  activeTaskTitle,
  onClearActiveTask,
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
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const toastTimeoutRef = useRef<number | null>(null);

  // Drawer Open/Close State (Trapezoid Slider rides with drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Telemetry & Leniency Tracking
  const [completedSessions, setCompletedSessions] = useState<number>(4);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(100);
  const [streakDays] = useState<number>(3);
  const [breakCount, setBreakCount] = useState<number>(0);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState<number>(0);

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

            // Sound Chime (Synthesized via Web Audio API if sound enabled)
            if (isSoundEnabled) {
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
  }, [canvasMode, isSoundEnabled, totalSeconds]);

  // Time calculations (Hours, Minutes, Seconds)
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const pad2 = (val: number) => val.toString().padStart(2, "0");

  // Hold-to-repeat timer state
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  // Adjust time in Selection Mode - allows down to 1 second
  const adjustTime = useCallback((deltaSeconds: number) => {
    if (canvasMode !== "selection") return;
    setTotalSeconds((prev) => {
      const nextVal = Math.max(1, Math.min(24 * 3600, prev + deltaSeconds));
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
    adjustTime(deltaSeconds);
    stopHold();

    holdTimeoutRef.current = window.setTimeout(() => {
      let ticks = 0;
      let intervalMs = 90;

      const runTick = () => {
        adjustTime(deltaSeconds);
        ticks++;
        if (ticks === 10 && intervalMs > 35) {
          intervalMs = 40;
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = window.setInterval(runTick, intervalMs);
        }
      };

      holdIntervalRef.current = window.setInterval(runTick, intervalMs);
    }, 280);
  }, [adjustTime, canvasMode, stopHold]);

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    if (canvasMode === "selection") {
      setCanvasMode("running");
    } else if (canvasMode === "running") {
      pauseTimestampRef.current = Date.now();
      setCanvasMode("paused");
    } else if (canvasMode === "paused") {
      if (pauseTimestampRef.current) {
        const pauseDurationSec = Math.round((Date.now() - pauseTimestampRef.current) / 1000);
        if (pauseDurationSec > 15) {
          setBreakCount((b) => b + 1);
          setTotalBreakSeconds((s) => s + pauseDurationSec);
        }
        pauseTimestampRef.current = null;
      }
      setCanvasMode("running");
    } else if (canvasMode === "finished") {
      setRemainingSeconds(totalSeconds);
      setCanvasMode("running");
    }
  };

  // Reset Timer
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    pauseTimestampRef.current = null;
    setRemainingSeconds(totalSeconds);
    setCanvasMode("selection");
  };

  // Add Seconds
  const handleAddSeconds = (secs: number) => {
    setRemainingSeconds((prev) => prev + secs);
    setTotalSeconds((prev) => prev + secs);
  };

  // Add Minutes
  const handleAddMinutes = (mins: number) => {
    setRemainingSeconds((prev) => prev + mins * 60);
    setTotalSeconds((prev) => prev + mins * 60);
  };

  // Toggle Deep vs Casual profile
  const handleToggleProfile = () => {
    const next = profile === "deep" ? "casual" : "deep";
    setProfile(next);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setModeToast(next === "deep" ? "Deep Focus: Maximum Shield Active" : "Casual Flow: Ambient Mode Active");
    toastTimeoutRef.current = window.setTimeout(() => {
      setModeToast(null);
    }, 2600);
  };

  // Select Preset & Run
  const handleSelectPreset = (preset: TimerPreset) => {
    setTotalSeconds(preset.seconds);
    setRemainingSeconds(preset.seconds);
    setCanvasMode("selection");
    setIsDrawerOpen(false);
  };

  return (
    <div className="focus-timers-container">
      {/* 1. TOP HEADER (Clean minimalist heading, no lightning badge) */}
      <header className="focus-top-nav-bar">
        <div className="focus-title-cluster">
          <h1 className="focus-main-heading">Focus & Timers</h1>
        </div>

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
                  title="Clear task"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. CENTERPIECE TIMER (ULTRA-SCALED 80% PRESENCE + AMBIENT PULSE HALO) */}
      <main className="focus-centerpiece-stage">
        {/* Ambient Halo Radial Glow Behind Rufus Face & Digits */}
        <div className="centerpiece-ambient-halo" />

        {/* Rufus Solid Electric Cyan OLED Eyes (Scaled Up) */}
        <div className="centerpiece-rufus-face">
          <div className="centerpiece-eye" />
          <div className="centerpiece-eye" />
        </div>

        {/* State 1: SELECTION MODE (Large interactive digits down to 1s) */}
        {canvasMode === "selection" && (
          <div className="centerpiece-digits-selection">
            {/* Hours */}
            <div className="digit-column">
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(3600); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="+1 Hour"
              >
                ▲
              </button>
              <span className="digit-num">{pad2(hours)}</span>
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(-3600); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="-1 Hour"
              >
                ▼
              </button>
              <span className="digit-label">HOURS</span>
            </div>

            <span className="digit-separator">:</span>

            {/* Minutes */}
            <div className="digit-column">
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(60); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="+1 Minute"
              >
                ▲
              </button>
              <span className="digit-num">{pad2(minutes)}</span>
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(-60); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="-1 Minute"
              >
                ▼
              </button>
              <span className="digit-label">MINUTES</span>
            </div>

            <span className="digit-separator">:</span>

            {/* Seconds (Can go down to 1s) */}
            <div className="digit-column">
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(1); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="+1 Second"
              >
                ▲
              </button>
              <span className="digit-num">{pad2(seconds)}</span>
              <button
                type="button"
                className="digit-arrow-btn"
                onPointerDown={(e) => { e.preventDefault(); startHold(-1); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                title="-1 Second"
              >
                ▼
              </button>
              <span className="digit-label">SECONDS</span>
            </div>
          </div>
        )}

        {/* State 2: RUNNING & PAUSED MODES (Massive 156px Typography Spanning 75% Width) */}
        {(canvasMode === "running" || canvasMode === "paused") && (
          <div className="centerpiece-digits-running">
            <span className={`giant-countdown-text ${canvasMode === "paused" ? "is-paused" : ""}`}>
              {hours > 0 ? `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}` : `${pad2(minutes)}:${pad2(seconds)}`}
            </span>
            <span className="countdown-subtext">
              {canvasMode === "paused" ? "TIMER PAUSED • TAP PLAY TO RESUME" : `${profile.toUpperCase()} FOCUS SESSION IN PROGRESS`}
            </span>
          </div>
        )}

        {/* State 3: FINISHED MODE */}
        {canvasMode === "finished" && (
          <div className="centerpiece-finished-banner">
            <div className="finished-badge-icon">🏆</div>
            <h2 className="finished-title">Focus Interval Complete!</h2>
            <p className="finished-desc">
              Logged {Math.round(totalSeconds / 60)} minutes of deep work. Great job!
            </p>
            <button type="button" className="finished-action-btn" onClick={handleReset}>
              Replay Focus Session
            </button>
          </div>
        )}

        {/* 3. 7-BUTTON CRESTING ACTION CLUSTER: 3 LEFT + 1 CENTER + 3 RIGHT */}
        <div className="focus-bubble-dock">
          {modeToast && <div className="bubble-dock-toast">{modeToast}</div>}

          {/* Button 1 (Left - Small 38px): Focus Mode (Deep / Casual) */}
          <button
            type="button"
            className={`bubble-btn bubble-sm ${profile === "deep" ? "mode-deep" : "mode-casual"}`}
            onClick={handleToggleProfile}
            title={profile === "deep" ? "Deep Focus: Bullseye Active (Strict Guard)" : "Casual Flow: Dual Arrows Active (Leniency)"}
          >
            {profile === "deep" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
                <circle cx="12" cy="12" r="5" stroke="#00e5ff" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.6" fill="#00e5ff" />
                <path d="M3 3l6.5 6.5" stroke="#00e5ff" strokeWidth="2.1" />
                <path d="M5.5 9.5H9.5V5.5" stroke="#00e5ff" strokeWidth="2.1" />
                <path d="M21 3l-6.5 6.5" stroke="#00e5ff" strokeWidth="2.1" />
                <path d="M18.5 9.5h-4V5.5" stroke="#00e5ff" strokeWidth="2.1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h12" />
                <path d="M12 4l4 4-4 4" />
                <path d="M8 16h12" />
                <path d="M16 12l4 4-4 4" />
              </svg>
            )}
          </button>

          {/* Button 2 (Left - Medium 44px): Reset / Replay */}
          <button
            type="button"
            className="bubble-btn bubble-md"
            onClick={handleReset}
            title="Reset Timer to Initial Duration"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Button 3 (Left - Medium-Large 48px): Chime Sound Toggle */}
          <button
            type="button"
            className={`bubble-btn bubble-md-lg ${isSoundEnabled ? "sound-active" : "sound-muted"}`}
            onClick={() => setIsSoundEnabled((s) => !s)}
            title={isSoundEnabled ? "Chime Audio: Enabled" : "Chime Audio: Muted"}
          >
            {isSoundEnabled ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* Button 4 (Center - Largest 66px): Play / Pause */}
          <button
            type="button"
            className={`bubble-btn bubble-lg ${canvasMode === "running" ? "running" : ""}`}
            onClick={handleTogglePlay}
            title={canvasMode === "running" ? "Pause Timer" : "Start Focus"}
          >
            {canvasMode === "running" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>

          {/* Button 5 (Right - Medium-Large 48px): +30s Fast Increment */}
          <button
            type="button"
            className="bubble-btn bubble-md-lg"
            onClick={() => handleAddSeconds(30)}
            title="Add 30 Seconds to Timer"
          >
            <span className="bubble-text-btn">+30s</span>
          </button>

          {/* Button 6 (Right - Medium 44px): +5m Increment */}
          <button
            type="button"
            className="bubble-btn bubble-md"
            onClick={() => handleAddMinutes(5)}
            title="Add 5 Minutes to Timer"
          >
            <span className="bubble-text-btn">+5m</span>
          </button>

          {/* Button 7 (Right - Small 38px): +15m Increment */}
          <button
            type="button"
            className="bubble-btn bubble-sm"
            onClick={() => handleAddMinutes(15)}
            title="Add 15 Minutes to Timer"
          >
            <span className="bubble-text-btn">+15m</span>
          </button>
        </div>
      </main>

      {/* 4. SLIDING GLASSMORPHIC DRAWER WITH RIDING CYAN TRAPEZOID HANDLE */}
      <section className={`focus-analytics-drawer ${isDrawerOpen ? "open" : "closed"}`}>
        {/* Cyan Trapezoid Handle attached to the top rim of the drawer */}
        <div
          className="drawer-trapezoid-handle"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          title={isDrawerOpen ? "Slide Down to Timer" : "Slide Up Deep Focus Analytics & History"}
        >
          <span className="trapezoid-arrow">{isDrawerOpen ? "▼" : "▲"}</span>
        </div>

        {/* Drawer Interior: 70% Left Pane (Analytics) / 30% Right Pane (Recent Timers & Trophies) */}
        <div className="drawer-body-grid">
          {/* Left Column (70%): Deep Focus Graph + Most Used Apps & Websites */}
          <div className="drawer-left-pane">
            {/* Deep Focus Velocity Chart */}
            <div className="drawer-card deep-focus-chart-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Deep Focus Velocity</h3>
                  <span className="card-subtitle">Daily focus distribution over the last 7 days</span>
                </div>
                <div className="card-stat-badge">
                  <span className="badge-val">4.4h</span>
                  <span className="badge-lbl">Daily Avg</span>
                </div>
              </div>

              {/* 7-Day Bar Chart */}
              <div className="cyber-bar-chart">
                {WEEKLY_METRICS.map((m) => {
                  const maxH = 8.0;
                  const heightPct = Math.round((m.hours / maxH) * 100);
                  return (
                    <div key={m.day} className={`chart-bar-col ${m.isPeak ? "is-peak" : ""}`}>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${heightPct}%` }}>
                          <span className="bar-tooltip">{m.hours}h</span>
                        </div>
                      </div>
                      <span className="bar-day-label">{m.day}</span>
                      {m.isPeak && <span className="peak-tag">PEAK</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most Used Apps and Websites */}
            <div className="drawer-card app-usage-card">
              <div className="card-header-row">
                <h3 className="card-title">Most Used Apps & Websites</h3>
                <span className="card-subtitle">Tracked focus allocation during active sessions</span>
              </div>

              <div className="app-usage-grid">
                {APP_USAGE_DATA.map((app) => (
                  <div key={app.id} className="app-usage-tile">
                    <div className="tile-top-row">
                      <span className="tile-icon">{app.icon}</span>
                      <span className="tile-name">{app.name}</span>
                      <span className="tile-time">{app.timeSpent}</span>
                    </div>
                    <div className="tile-bar-wrap">
                      <div className="tile-bar-fill" style={{ width: `${app.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (30%): Recent Timers & Trophies Cluster */}
          <div className="drawer-right-pane">
            {/* Recent Timers Section */}
            <div className="drawer-card recent-timers-card">
              <div className="card-header-row">
                <h3 className="card-title">Recent Timers</h3>
                <span className="card-badge">{presets.length} Presets</span>
              </div>

              <div className="recent-timers-list">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="recent-timer-item"
                    onClick={() => handleSelectPreset(preset)}
                    title={`Click to set timer to ${Math.round(preset.seconds / 60)} minutes`}
                  >
                    <div className="item-info">
                      <span className="item-name">{preset.name}</span>
                      <span className="item-duration">{Math.round(preset.seconds / 60)} mins</span>
                    </div>
                    <button type="button" className="item-launch-btn">
                      ▶
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Save Current as Preset Button */}
              <button
                type="button"
                className="save-current-preset-btn"
                onClick={() => {
                  const mins = Math.round(totalSeconds / 60);
                  const newPreset: TimerPreset = {
                    id: `p-${Date.now()}`,
                    name: `Focus ${mins}m`,
                    seconds: totalSeconds,
                    type: "focus",
                    isCustom: true,
                  };
                  setPresets((prev) => [...prev, newPreset]);
                }}
              >
                + Save Current ({Math.round(totalSeconds / 60)}m) as Preset
              </button>
            </div>

            {/* Trophies & Achievements (Bottom Right) */}
            <div className="drawer-card trophies-card">
              <div className="card-header-row">
                <div className="trophy-title-wrap">
                  <span className="trophy-head-icon">🏆</span>
                  <h3 className="card-title">Achievements</h3>
                </div>
                <span className="trophy-streak-pill">🔥 {streakDays}d Streak</span>
              </div>

              <div className="trophies-stats-row">
                <div className="trophy-metric-box">
                  <span className="metric-val">{completedSessions}</span>
                  <span className="metric-lbl">Sessions Done</span>
                </div>
                <div className="trophy-metric-box">
                  <span className="metric-val">{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</span>
                  <span className="metric-lbl">Total Logged</span>
                </div>
                <div className="trophy-metric-box">
                  <span className="metric-val">{breakCount} ({Math.round(totalBreakSeconds / 60)}m)</span>
                  <span className="metric-lbl">Breaks Taken</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
