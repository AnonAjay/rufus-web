import React, { useState } from "react";

export interface CommandBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  "Open WhatsApp",
  "What does entropy mean?",
  "Play Daft Punk on Spotify",
  "Open Antigravity",
  "Open VS Code",
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onSendMessage,
  isLoading,
  disabled,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleQuickCommand = (cmd: string) => {
    if (isLoading || disabled) return;
    onSendMessage(cmd);
  };

  return (
    <div className="command-bar-wrapper">
      <div className="quick-commands-row">
        {QUICK_COMMANDS.map((cmd, i) => (
          <button
            key={i}
            type="button"
            className="quick-cmd-chip"
            onClick={() => handleQuickCommand(cmd)}
            disabled={isLoading || disabled}
          >
            {cmd}
          </button>
        ))}
      </div>

      <form className="command-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="command-input"
          placeholder="Ask Rufus or give a command (e.g. 'open whatsapp', 'what is entropy')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || disabled}
          autoFocus
        />
        <button
          type="submit"
          className="command-submit-btn"
          disabled={!input.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <span className="spinner" />
          ) : (
            <span>Send ⏎</span>
          )}
        </button>
      </form>
    </div>
  );
};
