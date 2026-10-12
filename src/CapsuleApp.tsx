import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentWindow, LogicalPosition, LogicalSize, currentMonitor, Window } from "@tauri-apps/api/window";
import { IslandCapsule, CapsuleState } from "./components/capsule/IslandCapsule";
import { useAgentChat } from "./hooks/useAgentChat";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useInactivityTimer } from "./hooks/useInactivityTimer";
import "./App.css";

export const CapsuleApp: React.FC = () => {
  const [isDormant, setIsDormant] = useState(false);
  const { messages, isLoading, sendVoiceMessage } = useAgentChat("rufus-capsule-session");
  const { isRecording, waveformBars, startRecording, stopRecording } = useAudioRecorder();
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for cross-window sync
  useEffect(() => {
    document.body.classList.add("capsule-active");

    const channel = new BroadcastChannel("rufus_agent_sync");
    broadcastRef.current = channel;

    // Listen for events from main window
    channel.onmessage = (event) => {
      if (event.data?.type === "SHOW_CAPSULE") {
        exitDormant();
      }
    };

    return () => {
      document.body.classList.remove("capsule-active");
      channel.close();
    };
  }, []);

  // Center capsule under top bezel on boot
  useEffect(() => {
    const alignWindow = async () => {
      try {
        const win = getCurrentWindow();
        await win.setSize(new LogicalSize(420, 48));
        await win.setAlwaysOnTop(true);

        const monitor = await currentMonitor();
        if (monitor) {
          const scale = monitor.scaleFactor || 1;
          const monWidth = monitor.size.width / scale;
          const x = Math.max(0, Math.round((monWidth - 420) / 2));
          await win.setPosition(new LogicalPosition(x, 14));
        }
      } catch (err) {
        console.warn("[CapsuleApp] Alignment warning:", err);
      }
    };
    alignWindow();
  }, []);

  // Enter dormant pill (140x36)
  const enterDormant = useCallback(async () => {
    setIsDormant(true);
    try {
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(140, 36));

      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor || 1;
        const monWidth = monitor.size.width / scale;
        const x = Math.max(0, Math.round((monWidth - 140) / 2));
        await win.setPosition(new LogicalPosition(x, 14));
      }
    } catch (err) {
      console.error("[CapsuleApp] enterDormant error:", err);
    }
  }, []);

  // Exit dormant pill back to active (420x48)
  const exitDormant = useCallback(async () => {
    setIsDormant(false);
    try {
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(420, 48));

      const monitor = await currentMonitor();
      if (monitor) {
        const scale = monitor.scaleFactor || 1;
        const monWidth = monitor.size.width / scale;
        const x = Math.max(0, Math.round((monWidth - 420) / 2));
        await win.setPosition(new LogicalPosition(x, 14));
      }
    } catch (err) {
      console.error("[CapsuleApp] exitDormant error:", err);
    }
  }, []);

  // 15-Second Inactivity Auto-Collapse
  useInactivityTimer({
    timeoutMs: 15000,
    enabled: !isRecording && !isLoading && !isDormant,
    onTimeout: () => {
      enterDormant();
    },
    onActivity: () => {
      if (isDormant) {
        exitDormant();
      }
    },
  });

  // Calculate capsule visual state
  const getCapsuleState = (): CapsuleState => {
    if (isDormant) return "dormant";
    if (isRecording) return "listening";
    if (isLoading) return "processing";
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.actions && lastMsg.actions.length > 0) return "responding";
    if (lastMsg && lastMsg.sender === "rufus") return "idle";
    return "idle";
  };

  const getSubtitle = (): string => {
    if (isLoading) return "Executing & reasoning...";
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.actions && lastMsg.actions.length > 0) return "Action complete!";
    return "Rufus is ready";
  };

  // Toggle Mic / Push-to-Talk
  const handleToggleMic = async () => {
    if (isLoading) return;
    if (isDormant) {
      await exitDormant();
    }
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        await sendVoiceMessage(blob);
        // Broadcast voice action to main workstation window
        broadcastRef.current?.postMessage({ type: "VOICE_ACTION_TRIGGERED" });
      }
    } else {
      await startRecording();
    }
  };

  // Expand to Main Workstation Window
  const handleExpandToWorkstation = async () => {
    try {
      const mainWin = await Window.getByLabel("main");
      if (mainWin) {
        await mainWin.show();
        await mainWin.setFocus();
      }
    } catch (err) {
      console.error("[CapsuleApp] Failed to show main window:", err);
    }
  };

  return (
    <IslandCapsule
      state={getCapsuleState()}
      subtitle={getSubtitle()}
      isRecording={isRecording}
      waveformBars={waveformBars}
      onToggleMic={handleToggleMic}
      onExpandToWorkstation={handleExpandToWorkstation}
      onWakeFromDormant={exitDormant}
    />
  );
};
export default CapsuleApp;
