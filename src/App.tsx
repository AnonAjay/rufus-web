import React, { useState, useRef, useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { ViewHeader } from "./components/layout/ViewHeader";
import { ChatBubble } from "./components/chat/ChatBubble";
import { HeroWakeup } from "./components/chat/HeroWakeup";
import { ThinkingIndicator } from "./components/chat/ThinkingIndicator";
import { CommandBar } from "./components/chat/CommandBar";
import { HistoryView } from "./components/history/HistoryView";
import { FocusTimers } from "./components/productivity/FocusTimers";
import { TasksReminders } from "./components/productivity/TasksReminders";
import { AppsSkillsView } from "./components/apps/AppsSkillsView";
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
          {activeTab !== "assistant" && activeTab !== "history" && activeTab !== "focus" && activeTab !== "apps" && (
            <ViewHeader activeTab={activeTab} isLive={true} />
          )}

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

            {/* TAB: CALENDAR */}
            {activeTab === "calendar" && (
              <div className="views-generic-container">
                <div className="telemetry-card" style={{ padding: 24, textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#f8fafc" }}>Calendar Sync Ready</h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                    Integrates with local system calendar and proactive daily agenda summaries.
                  </p>
                </div>
              </div>
            )}


            {/* TAB 8: ROBOT TELEMETRY */}
            {activeTab === "robot-telemetry" && (
              <div className="views-generic-container">
                <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#f8fafc" }}>ESP32 Companion Telemetry</h3>
                <div className="telemetry-grid">
                  <div className="telemetry-card">
                    <div className="telemetry-header">
                      <span className="telemetry-title">ESP32 Core</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                    </div>
                    <span className="telemetry-value">WROOM-32</span>
                    <span className="telemetry-sub">FreeRTOS • Single Board Architecture</span>
                  </div>
                  <div className="telemetry-card">
                    <div className="telemetry-header">
                      <span className="telemetry-title">MQTT Broker</span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e5ff" }} />
                    </div>
                    <span className="telemetry-value">localhost:1883</span>
                    <span className="telemetry-sub">Topic: rufus/+/status</span>
                  </div>
                  <div className="telemetry-card">
                    <div className="telemetry-header">
                      <span className="telemetry-title">SG90 Servos</span>
                      <span style={{ fontSize: 11, color: "#00e5ff" }}>LEDC PWM</span>
                    </div>
                    <span className="telemetry-value">4x Active</span>
                    <span className="telemetry-sub">GPIO 18, 19, 21, 22</span>
                  </div>
                  <div className="telemetry-card">
                    <div className="telemetry-header">
                      <span className="telemetry-title">Display & Audio</span>
                      <span style={{ fontSize: 11, color: "#10b981" }}>I2C / I2S</span>
                    </div>
                    <span className="telemetry-value">SSD1306 + INMP441</span>
                    <span className="telemetry-sub">SDA: 23, SCL: 5 • I2S Mic: 14/15/32</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: PERSONAS */}
            {activeTab === "personas" && (
              <div className="views-generic-container">
                <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#f8fafc" }}>Rufus Personality Profiles</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                  {[
                    { name: "Desktop Companion", tone: "Warm, brief, voice-optimized (Current)", active: true },
                    { name: "Technical Peer", tone: "Blunt, engineering-focused, no filler", active: false },
                    { name: "Playful Pup", tone: "Expressive, animated OLED eye barks", active: false },
                  ].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 16,
                        background: p.active ? "rgba(0, 229, 255, 0.06)" : "rgba(255,255,255,0.03)",
                        border: p.active ? "1px solid rgba(0, 229, 255, 0.3)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#f8fafc" }}>{p.name}</span>
                        {p.active && <span style={{ fontSize: 11, color: "#00e5ff", fontWeight: 700 }}>ACTIVE</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{p.tone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 10: MEMORY EXPLORER (MAIN TASK) */}
            {activeTab === "memory" && (
              <div className="views-generic-container">
                <div className="memory-stat-card">
                  <div className="memory-stat-info">
                    <h4>Persistent Memory Layer</h4>
                    <p>Session ID: <code>{sessionId}</code> • Memory Backend: In-Memory / Supabase Postgres Ready</p>
                  </div>
                  <button type="button" className="memory-action-btn">
                    Sync to Supabase
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#cbd5e1" }}>Context Turns in Memory ({messages.length})</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          padding: 10,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: m.sender === "user" ? "#38bdf8" : "#00e5ff" }}>
                            {m.sender.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 12.5, color: "#f1f5f9" }}>
                            {m.text.length > 80 ? `${m.text.slice(0, 80)}...` : m.text}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{m.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: LOCKED ROADMAP CAPABILITIES */}
            {(activeTab === "missions" ||
              activeTab === "smart-home" ||
              activeTab === "mood" ||
              activeTab === "agent-hub") && (
              <div className="views-generic-container" style={{ justifyContent: "center" }}>
                <div className="locked-view-card">
                  <div className="locked-icon-halo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <span className="locked-phase-badge">
                    {activeTab === "mood"
                      ? "Phase 2 • Hackathon Track"
                      : activeTab === "smart-home"
                      ? "Phase 6 • Home Assistant"
                      : "Phase 3 • Autonomous Workflows"}
                  </span>
                  <h3 className="locked-title">
                    {activeTab === "missions"
                      ? "Autonomous Missions"
                      : activeTab === "smart-home"
                      ? "Smart Home Control"
                      : activeTab === "mood"
                      ? "Mood & Emotion Awareness"
                      : "Agent Hub Orchestrator"}
                  </h3>
                  <p className="locked-desc">
                    {activeTab === "missions"
                      ? "Multi-step scheduled agent tasks executing system actions without manual supervision."
                      : activeTab === "smart-home"
                      ? "Connects Rufus to your local Home Assistant server to control appliances and lights."
                      : activeTab === "mood"
                      ? "Off-device browser webcam feed analyzes user sentiment and adjusts Rufus's OLED eyes."
                      : "Cross-agent unified memory linking Claude, ChatGPT, and Antigravity under one companion umbrella."}
                  </p>
                  <div className="locked-roadmap-pill">
                    Architectural design tracked in <code>PENDING_ARCHITECTURE.md</code>
                  </div>
                </div>
              </div>
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
