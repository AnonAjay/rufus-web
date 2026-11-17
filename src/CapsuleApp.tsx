import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getCurrentWindow, LogicalPosition, LogicalSize, currentMonitor, Window } from "@tauri-apps/api/window";
import { IslandCapsule, CapsuleMode, CapsuleFace, ActionBadgeInfo } from "./components/capsule/IslandCapsule";
import { useAgentChat } from "./hooks/useAgentChat";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import "./App.css";

interface FocusData {
  active: boolean;
  remainingSeconds: number;
  isPaused: boolean;
  mode: string;
}

interface ActiveAnswer {
  text: string;
  summary: string;
  isLong: boolean;
  badge: ActionBadgeInfo | null;
}

export const CapsuleApp: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [focusData, setFocusData] = useState<FocusData>({
    active: false,
    remainingSeconds: 25 * 60,
    isPaused: false,
    mode: "selection",
  });
  const [activeAnswer, setActiveAnswer] = useState<ActiveAnswer | null>(null);

  const { messages, isLoading, sendVoiceMessage } = useAgentChat("rufus-capsule-session");
  const { isRecording, waveformBars, startRecording, stopRecording } = useAudioRecorder();

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const autoCollapseTimerRef = useRef<number | null>(null);
  const lastProcessedMsgIdRef = useRef<string | null>(null);
  const isHoveredRef = useRef(false);
  isHoveredRef.current = isHovered;

  // Sync window geometry helper
  const updateWindowGeometry = useCallback(async (width: number, height: number) => {
    try {
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(width, height));

      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor || 1;
        const monWidth = monitor.size.width / scale;
        const x = Math.max(0, Math.round((monWidth - width) / 2));
        await win.setPosition(new LogicalPosition(x, 14));
      }
    } catch (err) {
      console.warn("[CapsuleApp] Geometry update failed:", err);
    }
  }, []);

  // Compute active capsule mode
  const currentMode: CapsuleMode = useMemo(() => {
    if (isRecording) return "listening";
    if (isLoading) return "processing";
    if (activeAnswer) {
      if (activeAnswer.badge?.type === "blocked") return "action_blocked";
      if (activeAnswer.badge?.type === "executing") return "action_executing";
      if (activeAnswer.isLong) return "answering_long";
      return "answering_short";
    }
    if (isHovered) return "hover";
    return "ambient";
  }, [isRecording, isLoading, activeAnswer, isHovered]);

  // Compute active OLED face
  const currentFace: CapsuleFace = useMemo(() => {
    if (isRecording) return "listening";
    if (isLoading) return "processing";
    if (activeAnswer?.badge?.type === "blocked") return "blocked";
    if (activeAnswer) return "speaking";
    if (focusData.active) return "focus";
    return "idle";
  }, [isRecording, isLoading, activeAnswer, focusData.active]);

  // Target dimensions lookup
  const getTargetDimensions = useCallback((mode: CapsuleMode, isFocus: boolean): { width: number; height: number } => {
    switch (mode) {
      case "ambient":
        return { width: 76, height: 36 };
      case "hover":
        return isFocus ? { width: 190, height: 40 } : { width: 140, height: 40 };
      case "listening":
        return { width: 260, height: 44 };
      case "processing":
        return { width: 180, height: 40 };
      case "answering_short":
      case "action_executing":
      case "action_blocked":
        return { width: 380, height: 92 };
      case "answering_long":
        return { width: 380, height: 116 };
      default:
        return { width: 76, height: 36 };
    }
  }, []);

  // Trigger geometry update whenever mode or focus state changes
  useEffect(() => {
    const { width, height } = getTargetDimensions(currentMode, focusData.active);
    updateWindowGeometry(width, height);
  }, [currentMode, focusData.active, getTargetDimensions, updateWindowGeometry]);

  // BroadcastChannel Sync setup
  useEffect(() => {
    document.body.classList.add("capsule-active");

    const channel = new BroadcastChannel("rufus_agent_sync");
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "FOCUS_TIMER_UPDATED") {
        setFocusData({
          active: data.mode === "running" || data.mode === "paused",
          remainingSeconds: data.remainingSeconds ?? 25 * 60,
          isPaused: data.mode === "paused",
          mode: data.mode ?? "selection",
        });
      } else if (data.type === "SHOW_CAPSULE") {
        setActiveAnswer(null);
        setIsHovered(false);
      }
    };

    return () => {
      document.body.classList.remove("capsule-active");
      channel.close();
    };
  }, []);

  // Center on mount
  useEffect(() => {
    updateWindowGeometry(80, 36);
  }, [updateWindowGeometry]);

  // Clear auto-collapse helper
  const clearAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  }, []);

  // Start 6-Second Inactivity Auto-Collapse Timer for answers
  const scheduleAutoCollapse = useCallback(() => {
    clearAutoCollapse();
    autoCollapseTimerRef.current = window.setTimeout(() => {
      // If user cursor is currently hovering, wait until mouse leaves
      if (!isHoveredRef.current) {
        setActiveAnswer(null);
      }
    }, 6000);
  }, [clearAutoCollapse]);

  // Detect new responses from Rufus
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (messages.length === 0) return;

    // Ignore existing historical messages on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const last = messages[messages.length - 1];
      if (last) {
        lastProcessedMsgIdRef.current = last.id;
      }
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== "rufus" || lastMsg.id === lastProcessedMsgIdRef.current) return;

    lastProcessedMsgIdRef.current = lastMsg.id;

    // Detect blocked action vs allowed action
    let badge: ActionBadgeInfo | null = null;
    const isBlocked =
      (lastMsg.actions && lastMsg.actions.some((a) => a.toLowerCase().includes("blocked"))) ||
      lastMsg.text.toLowerCase().includes("blocked by permissions") ||
      lastMsg.text.toLowerCase().includes("permission denied");

    if (isBlocked) {
      const actionName = lastMsg.actions?.[0]?.replace(/^Blocked:\s*/i, "") || "App Action";
      badge = {
        type: "blocked",
        name: actionName,
        details: "Blocked by tool permissions allowlist.",
      };
    } else if (lastMsg.actions && lastMsg.actions.length > 0) {
      badge = {
        type: "executing",
        name: lastMsg.actions[0],
        details: lastMsg.text,
      };
    }

    const isLong = lastMsg.text.length >= 140 || lastMsg.text.includes("```");
    const summary = lastMsg.text.slice(0, 110).trim();

    setActiveAnswer({
      text: lastMsg.text,
      summary,
      isLong,
      badge,
    });

    scheduleAutoCollapse();
  }, [messages, scheduleAutoCollapse]);

  // Hover handlers with collapse pause
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearAutoCollapse();
  }, [clearAutoCollapse]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // If an answer card is active, resume the 6-second collapse timer
    if (activeAnswer) {
      scheduleAutoCollapse();
    }
  }, [activeAnswer, scheduleAutoCollapse]);

  // Voice Push-to-Talk Handlers
  const handleStartVoice = async () => {
    if (isLoading) return;
    clearAutoCollapse();
    setActiveAnswer(null);
    await startRecording();
  };

  const handleCancelVoice = async () => {
    await stopRecording();
    clearAutoCollapse();
    setActiveAnswer(null);
  };

  const handleSubmitVoice = async () => {
    const blob = await stopRecording();
    if (blob) {
      await sendVoiceMessage(blob);
      broadcastRef.current?.postMessage({ type: "VOICE_ACTION_TRIGGERED" });
    }
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      await handleSubmitVoice();
    } else {
      await handleStartVoice();
    }
  };

  // Expand to Main Workstation Window
  const handleExpandToWorkstation = async () => {
    try {
      const mainWin = await Window.getByLabel("main");
      if (mainWin) {
        await mainWin.unminimize();
        await mainWin.show();
        await mainWin.setFocus();
      }
      const win = getCurrentWindow();
      await win.hide();
    } catch (err) {
      console.error("[CapsuleApp] Failed to show main window:", err);
    }
  };

  // Focus Timer Pause/Play toggle
  const handleToggleFocusPause = () => {
    broadcastRef.current?.postMessage({ type: "TOGGLE_FOCUS_TIMER" });
    setFocusData((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  // Global Keyboard Shortcuts (Alt + , for Push-to-Talk; Escape to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "," || e.code === "Comma")) {
        e.preventDefault();
        handleToggleMic();
      } else if (e.key === "Escape") {
        if (isRecording) {
          e.preventDefault();
          handleCancelVoice();
        } else if (activeAnswer) {
          e.preventDefault();
          setActiveAnswer(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, activeAnswer, handleToggleMic]);

  // Format focus countdown time
  const focusTimeFormatted = useMemo(() => {
    const minutes = Math.floor(focusData.remainingSeconds / 60);
    const seconds = focusData.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [focusData.remainingSeconds]);

  return (
    <IslandCapsule
      mode={currentMode}
      face={currentFace}
      responseText={activeAnswer?.text}
      responseSummary={activeAnswer?.summary}
      actionBadge={activeAnswer?.badge}
      waveformBars={waveformBars}
      focusTimeFormatted={focusTimeFormatted}
      isFocusPaused={focusData.isPaused}
      onToggleFocusPause={handleToggleFocusPause}
      onToggleMic={handleToggleMic}
      onCancelVoice={handleCancelVoice}
      onSubmitVoice={handleSubmitVoice}
      onExpandToWorkstation={handleExpandToWorkstation}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default CapsuleApp;
