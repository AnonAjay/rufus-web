import React, { useState, useRef, useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { LockedRoadmapView } from "./components/layout/LockedRoadmapView";
import { ChatBubble } from "./components/chat/ChatBubble";
import { HeroWakeup } from "./components/chat/HeroWakeup";
import { ThinkingIndicator } from "./components/chat/ThinkingIndicator";
import { CommandBar } from "./components/chat/CommandBar";
import { HistoryView } from "./components/history/HistoryView";
import { FocusTimers } from "./components/productivity/FocusTimers";
import { TasksReminders } from "./components/productivity/TasksReminders";
import { AppsSkillsView } from "./components/apps/AppsSkillsView";
import { StuntsView } from "./components/stunts/StuntsView";
import { MemoryView } from "./components/memory/MemoryView";
import { useAgentChat } from "./hooks/useAgentChat";
import "./App.css";

export const App: React.FC = () => {
  const {
    messages,
    sessions,
    sessionId,
    isLoading,
    sendMessage,
    sendVoiceMessage,
    loadSession,
    newSession,
    deleteSession,
  } = useAgentChat();
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("assistant");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeFocusTask, setActiveFocusTask] = useState<string | undefined>();

  // Auto-scroll chat feed to bottom on new messages
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cross-window synchronization with Island Capsule
  useEffect(() => {
    const channel = new BroadcastChannel("rufus_agent_sync");
    channel.onmessage = (event) => {
      if (event.data?.type === "VOICE_ACTION_TRIGGERED") {
        // Voice action triggered from mini capsule
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="rufus-window-shell">
      {/* Frameless Custom TitleBar */}
      <TitleBar
        unreadNotificationsCount={1}
        onOpenNotifications={() => setActiveTab("tasks")}
      />

      {/* Full Workspace Layout with Left Sidebar */}
      <div className="rufus-workspace-layout">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="workspace-main-area">
          <div className="workspace-content-pane">
            {/* TAB 1: ASSISTANT (MAIN CHAT) */}
            {activeTab === "assistant" && (
              <>
                <div className="chat-scroll-container">
                  {messages.filter((msg) => msg.id !== "initial-welcome" && !msg.text.includes("Woof! I'm Rufus")).length === 0 ? (
                    <HeroWakeup />
                  ) : (
                    <>
                      {messages
                        .filter((msg) => msg.id !== "initial-welcome" && !msg.text.includes("Woof! I'm Rufus"))
                        .map((msg) => (
                          <ChatBubble key={msg.id} message={msg} />
                        ))}
                      {isLoading && <ThinkingIndicator />}
                    </>
                  )}
                  <div ref={feedEndRef} />
                </div>

                <footer className="app-footer">
                  <CommandBar
                    onSendMessage={sendMessage}
                    onSendVoice={sendVoiceMessage}
                    isLoading={isLoading}
                  />
                </footer>
              </>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === "history" && (
              <HistoryView
                sessions={sessions}
                activeSessionId={sessionId}
                onSelectSession={(id) => {
                  loadSession(id);
                  setActiveTab("assistant");
                }}
                onNewSession={() => {
                  newSession();
                  setActiveTab("assistant");
                }}
                onDeleteSession={deleteSession}
                isLoading={isLoading}
              />
            )}

            {/* TAB 4: APPS & SKILLS (Blank Slate) */}
            {activeTab === "apps" && <AppsSkillsView />}

            {/* TAB: FOCUS & TIMERS */}
            {activeTab === "focus" && (
              <FocusTimers
                activeTaskTitle={activeFocusTask}
                onClearActiveTask={() => setActiveFocusTask(undefined)}
              />
            )}

            {/* TAB: TASKS & REMINDERS */}
            {activeTab === "tasks" && (
              <TasksReminders
                onStartFocusOnTask={(taskTitle) => {
                  setActiveFocusTask(taskTitle);
                  setActiveTab("focus");
                }}
              />
            )}

            {/* TAB 8: STUNTS */}
            {activeTab === "stunts" && <StuntsView />}

            {/* TAB 9: MEMORY EXPLORER */}
            {activeTab === "memory" && <MemoryView />}

            {/* TAB 10: LOCKED ROADMAP CAPABILITIES */}
            {(activeTab === "missions" ||
              activeTab === "calendar" ||
              activeTab === "smart-home" ||
              activeTab === "robot-telemetry" ||
              activeTab === "mood" ||
              activeTab === "agent-hub") && (
              <LockedRoadmapView tabKey={activeTab} />
            )}

            {/* TAB 12: SETTINGS */}
            {activeTab === "settings" && (
              <div className="views-generic-container">
                <h3 style={{ margin: "0 0 14px 0", fontSize: 15, color: "#f8fafc" }}>System & Inference Settings</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="telemetry-card">
                    <span className="telemetry-title">Primary LLM Provider</span>
                    <span style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Ollama (Local) / llama3.2:3b</span>
                    <span className="telemetry-sub">Secondary Provider: Nebius Token Factory (NVIDIA Nemotron 70B)</span>
                  </div>
                  <div className="telemetry-card">
                    <span className="telemetry-title">Speech-to-Text Pipeline</span>
                    <span style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Local faster-whisper (base model)</span>
                    <span className="telemetry-sub">Zero cloud tethering • In-memory WebM streaming</span>
                  </div>
                  <div className="telemetry-card">
                    <span className="telemetry-title">Text-to-Speech Engine</span>
                    <span style={{ fontSize: 14, color: "#f8fafc", fontWeight: 600 }}>Piper ONNX (en_US-amy-medium)</span>
                    <span className="telemetry-sub">In-memory WAV synthesis • Direct Python bindings</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
