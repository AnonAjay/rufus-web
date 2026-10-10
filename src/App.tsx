import React, { useRef, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { RufusFace, EyeState } from "./components/robot/RufusFace";
import { ChatBubble } from "./components/chat/ChatBubble";
import { CommandBar } from "./components/chat/CommandBar";
import { useAgentChat } from "./hooks/useAgentChat";
import { useSystemStatus } from "./hooks/useSystemStatus";
import "./App.css";

export const App: React.FC = () => {
  const { status: systemStatus } = useSystemStatus();
  const { messages, isLoading, sendMessage, sendVoiceMessage } = useAgentChat();
  const feedEndRef = useRef<HTMLDivElement>(null);

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

  const getEyeSubtitle = (): string => {
    if (isLoading) return "Executing & reasoning...";
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.actions && lastMessage.actions.length > 0) return "Action complete!";
    return "Rufus is ready";
  };

  return (
    <div className="rufus-desktop-app">
      <Header systemStatus={systemStatus} />

      <main className="app-main-content">
        {/* Left Sidebar: Expressive OLED Face & Allowed Tools Info */}
        <aside className="robot-sidebar">
          <div className="rufus-face-card">
            <RufusFace state={getEyeState()} subtitle={getEyeSubtitle()} />
          </div>

          <div className="tools-info-card">
            <h3>Registered Desktop Tools</h3>
            <div className="tools-list">
              <div className="tools-item">💬 <span>WhatsApp (Desktop)</span></div>
              <div className="tools-item">⚡ <span>Antigravity & VS Code</span></div>
              <div className="tools-item">🔍 <span>Live Web Search & Definitions</span></div>
              <div className="tools-item">🎵 <span>Spotify Player / Search</span></div>
              <div className="tools-item">🌐 <span>Browser URL Launch</span></div>
            </div>
          </div>
        </aside>

        {/* Right Section: Interactive Chat Feed & Action Log */}
        <section className="chat-section">
          <div className="chat-feed">
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
        </section>
      </main>

      {/* Bottom Command Bar */}
      <footer className="app-footer">
        <CommandBar
          onSendMessage={sendMessage}
          onSendVoice={sendVoiceMessage}
          isLoading={isLoading}
        />
      </footer>
    </div>
  );
};

export default App;
