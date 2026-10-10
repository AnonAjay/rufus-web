import React, { useState } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";

export interface CommandBarProps {
  onSendMessage: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
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
  onSendVoice,
  isLoading,
  disabled,
}) => {
  const [input, setInput] = useState("");
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder();

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

  const handleMicDown = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isLoading || disabled) return;
    await startRecording();
  };

  const handleMicUp = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording) return;
    const blob = await stopRecording();
    if (blob) {
      onSendVoice(blob);
    }
  };

  return (
    <div className="command-bar-wrapper">
      {micError && <div className="mic-error-banner">Microphone Error: {micError}</div>}

      <div className="quick-commands-row">
        {QUICK_COMMANDS.map((cmd, i) => (
          <button
            key={i}
            type="button"
            className="quick-cmd-chip"
            onClick={() => handleQuickCommand(cmd)}
            disabled={isLoading || disabled || isRecording}
          >
            {cmd}
          </button>
        ))}
      </div>

      <form className="command-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="command-input"
          placeholder={isRecording ? "Listening... Release button to send" : "Ask Rufus or type a command..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || disabled || isRecording}
          autoFocus
        />

        <button
          type="button"
          className={`command-mic-btn ${isRecording ? "recording" : ""}`}
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          onTouchStart={handleMicDown}
          onTouchEnd={handleMicUp}
          disabled={isLoading || disabled}
          title="Click and hold to speak"
        >
          {isRecording ? "🔴 Speaking..." : "🎙️ Push-to-Talk"}
        </button>

        <button
          type="submit"
          className="command-submit-btn"
          disabled={!input.trim() || isLoading || disabled || isRecording}
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
