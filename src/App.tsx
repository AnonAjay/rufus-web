import React, { useState, useRef, useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { ViewHeader } from "./components/layout/ViewHeader";
import { RufusFace, EyeState } from "./components/robot/RufusFace";
import { ChatBubble } from "./components/chat/ChatBubble";
import { HeroWakeup } from "./components/chat/HeroWakeup";
import { ThinkingIndicator } from "./components/chat/ThinkingIndicator";
import { CommandBar } from "./components/chat/CommandBar";
import { AudioWaveform } from "./components/common/AudioWaveform";
import { useAgentChat } from "./hooks/useAgentChat";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import "./App.css";

export const App: React.FC = () => {
  const { messages, isLoading, sendMessage, sendVoiceMessage, sessionId } = useAgentChat();
  const { isRecording, waveformBars, startRecording, stopRecording } = useAudioRecorder();
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("assistant");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Hardware / Context Toggles
  const [isAlwaysOnMic, setIsAlwaysOnMic] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScreenActive, setIsScreenActive] = useState<boolean>(false);

  // Reminders local state
  const [reminders, setReminders] = useState<Array<{ id: string; title: string; time: string; status: string }>>([
    { id: "rem-1", title: "Review LangGraph acyclic DAG invariants", time: "Tonight 23:59", status: "pending" },
    { id: "rem-2", title: "ESP32 WROOM-32 breadboard bench wiring", time: "Tomorrow 10:00", status: "scheduled" },
  ]);
  const [newReminderTitle, setNewReminderTitle] = useState<string>("");

  // Tasks local state
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: "t-1", text: "Multi-window BroadcastChannel synchronization", done: true },
    { id: "t-2", text: "Brace-depth stack parser for JSON sanitization", done: true },
    { id: "t-3", text: "Sidebar navigation and memory explorer UI", done: true },
    { id: "t-4", text: "Supabase conversation persistence integration", done: false },
    { id: "t-5", text: "Nebius Token Factory / NVIDIA Nemotron provider", done: false },
  ]);

  // Auto-scroll chat feed to bottom on new messages
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Derive eye state based on agent activity
  const getEyeState = (): EyeState => {
    if (isLoading) return "thinking";
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.actions && lastMessage.actions.length > 0) return "happy";
    return "idle";
  };

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

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    setReminders((prev) => [
      ...prev,
      {
        id: `rem-${Date.now()}`,
        title: newReminderTitle.trim(),
        time: "Today",
        status: "pending",
      },
    ]);
    setNewReminderTitle("");
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="rufus-window-shell">
      {/* Frameless Custom TitleBar */}
      <TitleBar
        isAlwaysOnMic={isAlwaysOnMic}
        onToggleAlwaysOnMic={() => setIsAlwaysOnMic((prev) => !prev)}
        isCameraActive={isCameraActive}
        onToggleCamera={() => setIsCameraActive((prev) => !prev)}
        isScreenActive={isScreenActive}
        onToggleScreen={() => setIsScreenActive((prev) => !prev)}
        unreadNotificationsCount={reminders.filter((r) => r.status === "pending").length}
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
          {activeTab !== "assistant" && <ViewHeader activeTab={activeTab} isLive={true} />}

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

            {/* TAB 2: VOICE */}
            {activeTab === "voice" && (
              <div className="views-generic-container" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ maxWidth: 460, padding: 32, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <RufusFace state={isRecording ? "listening" : getEyeState()} subtitle={isRecording ? "Listening to your voice..." : "Voice loop standing by"} />
                  <div style={{ marginTop: 24, marginBottom: 20 }}>
                    <AudioWaveform bars={waveformBars} isActive={isRecording} height={36} />
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                    Push-to-Talk or speak when always-on mic is toggled. Piper synthesizes replies instantly in memory.
                  </p>
                  <button
                    type="button"
                    className={`command-mic-btn ${isRecording ? "recording" : ""}`}
                    onMouseDown={startRecording}
                    onMouseUp={async () => {
                      const blob = await stopRecording();
                      if (blob) sendVoiceMessage(blob);
                    }}
                    style={{ padding: "10px 24px", fontSize: 14 }}
                  >
                    {isRecording ? "Release to Send" : "Hold to Talk"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: HISTORY */}
            {activeTab === "history" && (
              <div className="views-generic-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: "#f8fafc" }}>Conversation Sessions</h3>
                  <span style={{ fontSize: 12, color: "#00e5ff" }}>Current: {sessionId}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      padding: 14,
                      background: "rgba(0, 229, 255, 0.06)",
                      border: "1px solid rgba(0, 229, 255, 0.3)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e5ff" }} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#f8fafc" }}>Active Desktop Session</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                        {messages.length} messages in memory • Last interaction: {messages[messages.length - 1]?.timestamp || "Now"}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(0,229,255,0.15)", color: "#00e5ff" }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: APPS & SKILLS */}
            {activeTab === "apps" && (
              <div className="views-generic-container">
                <h3 style={{ margin: "0 0 4px 0", fontSize: 15, color: "#f8fafc" }}>Registered Local Tools & Allowlist</h3>
                <p style={{ margin: "0 0 14px 0", fontSize: 12.5, color: "#94a3b8" }}>
                  Strict allowlist guarantees no arbitrary shell execution. The model selects intent; tools enforce OS safety.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
                  {[
                    { icon: "💬", title: "WhatsApp", desc: "Launches desktop client or web fallback safely." },
                    { icon: "⚡", title: "Antigravity & VS Code", desc: "Safe process launcher with strict binary path allowlist." },
                    { icon: "🎵", title: "Spotify Player", desc: "Controls track search and playback." },
                    { icon: "🔍", title: "Web Search", desc: "Instant factual definitions and search queries via DuckDuckGo." },
                    { icon: "🔊", title: "System Volume", desc: "Master audio endpoint volume & mute via pycaw." },
                    { icon: "☀️", title: "Screen Brightness", desc: "Hardware monitor brightness control." },
                    { icon: "📸", title: "Inspect Screen", desc: "Visual context analysis via Moondream 2 vision AI." },
                    { icon: "🔒", title: "Workstation Lock", desc: "Protected Win32 session lock with confirmation." },
                  ].map((app, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 14,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{app.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: "#f8fafc" }}>{app.title}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{app.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: REMINDERS & FOCUS */}
            {activeTab === "reminders" && (
              <div className="views-generic-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: "#f8fafc" }}>Reminders & Focus</h3>
                  <span style={{ fontSize: 12, color: "#00e5ff" }}>{reminders.length} Active</span>
                </div>
                <form onSubmit={handleAddReminder} style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                    placeholder="Add a new reminder or focus interval..."
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "#f8fafc",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "rgba(0,229,255,0.15)",
                      border: "1px solid rgba(0,229,255,0.35)",
                      color: "#00e5ff",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Add
                  </button>
                </form>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {reminders.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#f1f5f9" }}>{r.title}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: TASKS & TO-DO */}
            {activeTab === "tasks" && (
              <div className="views-generic-container">
                <h3 style={{ margin: "0 0 10px 0", fontSize: 15, color: "#f8fafc" }}>Engineering Action Items</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      style={{
                        padding: 12,
                        background: task.done ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.03)",
                        border: task.done ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: task.done ? "#10b981" : "#64748b", fontSize: 14 }}>
                        {task.done ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: 13, color: task.done ? "#94a3b8" : "#f1f5f9", textDecoration: task.done ? "line-through" : "none" }}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: ALARMS & CALENDAR */}
            {(activeTab === "alarms" || activeTab === "calendar") && (
              <div className="views-generic-container">
                <div className="telemetry-card" style={{ padding: 24, textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#f8fafc" }}>
                    {activeTab === "alarms" ? "No Active Alarms" : "Calendar Sync Ready"}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                    {activeTab === "alarms"
                      ? "Set Pomodoro focus intervals or scheduled alerts directly via the Assistant."
                      : "Integrates with local system calendar and proactive daily agenda summaries."}
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
