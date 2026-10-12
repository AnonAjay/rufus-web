import React, { useState, useRef, useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { ViewHeader } from "./components/layout/ViewHeader";
import { RufusFace, EyeState } from "./components/robot/RufusFace";
import { ChatBubble } from "./components/chat/ChatBubble";
import { CommandBar } from "./components/chat/CommandBar";
import { AudioWaveform } from "./components/common/AudioWaveform";
import { useAgentChat } from "./hooks/useAgentChat";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import "./App.css";

export const App: React.FC = () => {
  const { messages, isLoading, sendMessage, sendVoiceMessage } = useAgentChat();
  const { isRecording, waveformBars, startRecording, stopRecording } = useAudioRecorder();
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("command");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Hardware / Context Toggles
  const [isAlwaysOnMic, setIsAlwaysOnMic] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScreenActive, setIsScreenActive] = useState<boolean>(false);

  // Approvals mock state
  const [pendingApprovals, setPendingApprovals] = useState<Array<{ id: string; action: string; desc: string; risk: string }>>([
    { id: "appr-1", action: "Lock Workstation", desc: "User or script requested locking the Windows desktop.", risk: "Low" },
    { id: "appr-2", action: "Execute Screen Capture", desc: "Capture display 1 for Vision Context analysis.", risk: "Low" },
    { id: "appr-3", action: "Launch VS Code", desc: "Open executable 'code' in the current workspace.", risk: "Safe" },
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
        unreadNotificationsCount={pendingApprovals.length}
      />

      {/* Full Workspace Layout with Left Sidebar */}
      <div className="rufus-workspace-layout">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            approvalsCount={pendingApprovals.length}
          />

          <main className="workspace-main-area">
            <ViewHeader activeTab={activeTab} isLive={true} />

            <div className="workspace-content-pane">
              {/* TAB 1: COMMAND */}
              {activeTab === "command" && (
                <>
                  {/* System Notice Card (from mock) */}
                  <div className="system-notice-card">
                    <div className="system-notice-left">
                      <span className="system-notice-icon">⚡</span>
                      <div>
                        <span className="system-notice-title">Handoff active:</span>
                        <span className="system-notice-text">
                          Local Ollama LLM • In-memory conversation state preserved.
                        </span>
                      </div>
                    </div>
                    <span className="system-notice-time">Ready</span>
                  </div>

                  <div className="chat-date-separator">
                    Today • Rufus companion session active
                  </div>

                  {/* Chat Feed */}
                  <div className="chat-scroll-container">
                    {messages.map((msg) => (
                      <ChatBubble key={msg.id} message={msg} />
                    ))}
                    {isLoading && (
                      <div className="chat-bubble-row rufus">
                        <div className="chat-bubble rufus">
                          <div className="chat-sender-name">Rufus</div>
                          <div className="chat-text">
                            <span className="spinner" style={{ display: "inline-block", marginRight: 8 }} />
                            Thinking and executing action...
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={feedEndRef} />
                  </div>

                  {/* Bottom Command Bar */}
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
                  <div style={{ maxWidth: 440, padding: 30, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <RufusFace state={isRecording ? "listening" : getEyeState()} subtitle={isRecording ? "Listening to your voice..." : "Voice loop standing by"} />
                    <div style={{ marginTop: 24, marginBottom: 20 }}>
                      <AudioWaveform bars={waveformBars} isActive={isRecording} height={32} />
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

              {/* TAB 3: ACTIONS */}
              {activeTab === "actions" && (
                <div className="views-generic-container">
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 15, color: "#f8fafc" }}>Recent System Actions</h3>
                  {messages
                    .filter((m) => m.actions && m.actions.length > 0)
                    .flatMap((m) => (m.actions || []).map((act, i) => ({ act, time: m.timestamp, id: `${m.id}-${i}` })))
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "#00e5ff" }}>✓</span>
                          <span style={{ fontSize: 13, color: "#f1f5f9" }}>{item.act}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{item.time}</span>
                      </div>
                    ))}
                  {messages.every((m) => !m.actions || m.actions.length === 0) && (
                    <div style={{ color: "#64748b", fontSize: 13, padding: 20 }}>No actions executed in this session yet.</div>
                  )}
                </div>
              )}

              {/* TAB 4: APPROVALS */}
              {activeTab === "approvals" && (
                <div className="views-generic-container">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "#f8fafc" }}>Pending Policy Approvals</h3>
                    <span style={{ fontSize: 12, color: "#f59e0b" }}>{pendingApprovals.length} pending</span>
                  </div>
                  {pendingApprovals.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#f8fafc" }}>{item.action}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(0,229,255,0.12)", color: "#00e5ff" }}>
                          Risk: {item.risk}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>{item.desc}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setPendingApprovals((prev) => prev.filter((p) => p.id !== item.id))}
                          style={{
                            padding: "6px 14px",
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#10b981",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingApprovals((prev) => prev.filter((p) => p.id !== item.id))}
                          style={{
                            padding: "6px 14px",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <div style={{ color: "#10b981", fontSize: 13, padding: 20 }}>All pending actions reviewed. No approval requests pending.</div>
                  )}
                </div>
              )}

              {/* TAB 5: APPS & SKILLS */}
              {activeTab === "apps" && (
                <div className="views-generic-container">
                  <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#f8fafc" }}>Registered Local Tools & Allowlist</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                    {[
                      { icon: "💬", title: "WhatsApp", desc: "Launches desktop client or web fallback." },
                      { icon: "⚡", title: "Antigravity & VS Code", desc: "Safe process launcher with strict binary allowlist." },
                      { icon: "🎵", title: "Spotify Player", desc: "Controls track search and playback." },
                      { icon: "🔍", title: "Web Search", desc: "Instant factual definitions via DuckDuckGo." },
                      { icon: "🔊", title: "System Volume", desc: "Master audio endpoint volume & mute via pycaw." },
                      { icon: "☀️", title: "Screen Brightness", desc: "Hardware monitor brightness control." },
                      { icon: "📸", title: "Screenshot Capture", desc: "Fast multi-monitor frame grab for Vision Context." },
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
            </div>
          </main>
        </div>
      </div>
    );
  };

export default App;
