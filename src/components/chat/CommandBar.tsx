import React, { useState, useEffect, useRef } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import "./CommandBar.css";

export interface AIModelOption {
  id: string;
  name: string;
  tag: string;
  provider: "Local" | "Cloud";
  badgeColor: string;
}

export const PLACEHOLDER_MODELS: AIModelOption[] = [
  {
    id: "llama3.2:latest",
    name: "Llama 3.2: latest",
    tag: "3B",
    provider: "Local",
    badgeColor: "#00e5ff",
  },
  {
    id: "nemotron-4:340b",
    name: "Nemotron-4 340B",
    tag: "340B",
    provider: "Cloud",
    badgeColor: "#818cf8",
  },
  {
    id: "llama3.1:70b",
    name: "Meta Llama 3.1 70B",
    tag: "70B",
    provider: "Cloud",
    badgeColor: "#a78bfa",
  },
  {
    id: "moondream2:latest",
    name: "Moondream 2: 1.8B",
    tag: "Vision",
    provider: "Local",
    badgeColor: "#10b981",
  },
];

export interface CommandBarProps {
  onSendMessage: (text: string) => void;
  onSendVoice: (blob: Blob) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedModelId?: string;
  onSelectModel?: (modelId: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSendMessage,
  onSendVoice,
  isLoading,
  disabled,
  selectedModelId: externalSelectedModel,
  onSelectModel,
}) => {
  const [input, setInput] = useState("");
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useState("llama3.2:latest");
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; type: string }>>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const activeModelId = externalSelectedModel || localSelectedModel;
  const activeModel = PLACEHOLDER_MODELS.find((m) => m.id === activeModelId) || PLACEHOLDER_MODELS[0];

  const popoverRef = useRef<HTMLDivElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const modelPopoverRef = useRef<HTMLDivElement>(null);
  const modelBtnRef = useRef<HTMLButtonElement>(null);

  const {
    isRecording,
    waveformBars,
    startRecording,
    stopRecording,
    error: micError,
  } = useAudioRecorder();

  // Track elapsed recording time
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Click outside listener for attachment popover and model popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        plusBtnRef.current &&
        !plusBtnRef.current.contains(target)
      ) {
        setIsAttachOpen(false);
      }
      if (
        modelPopoverRef.current &&
        !modelPopoverRef.current.contains(target) &&
        modelBtnRef.current &&
        !modelBtnRef.current.contains(target)
      ) {
        setIsModelOpen(false);
      }
    };

    if (isAttachOpen || isModelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAttachOpen, isModelOpen]);

  // Model selection handler
  const handleSelectModel = (modelId: string) => {
    setLocalSelectedModel(modelId);
    onSelectModel?.(modelId);
    setIsModelOpen(false);
  };

  // Text submit handler
  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading || disabled) return;

    if (isRecording) {
      handleStopAndSendVoice();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    let finalPrompt = trimmed;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map((f) => f.name).join(", ");
      finalPrompt = trimmed ? `[Attached: ${fileNames}] ${trimmed}` : `[Attached: ${fileNames}] Please analyze these files.`;
    }

    onSendMessage(finalPrompt);
    setInput("");
    setAttachedFiles([]);
    setIsAttachOpen(false);
  };

  // Toggle voice recording
  const handleToggleVoice = async () => {
    if (isLoading || disabled) return;

    if (!isRecording) {
      await startRecording();
    } else {
      await handleStopAndSendVoice();
    }
  };

  // Stop recording and send audio
  const handleStopAndSendVoice = async () => {
    const blob = await stopRecording();
    if (blob) {
      onSendVoice(blob);
    }
  };

  // Discard/Cancel voice recording
  const handleCancelVoice = async () => {
    await stopRecording();
    setRecordingSeconds(0);
  };

  // Attachment option select
  const handleSelectAttachment = (option: string) => {
    setIsAttachOpen(false);
    if (option === "screenshot") {
      setAttachedFiles((prev) => [...prev, { name: "desktop_capture.png", type: "image" }]);
    } else if (option === "pdf") {
      setAttachedFiles((prev) => [...prev, { name: "document.pdf", type: "pdf" }]);
    } else if (option === "file") {
      setAttachedFiles((prev) => [...prev, { name: "local_asset.dat", type: "file" }]);
    } else if (option === "code") {
      setAttachedFiles((prev) => [...prev, { name: "snippet.py", type: "code" }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Use all live 24 waveform bars from the Web Audio Analyser
  const displayWaveform = waveformBars.length > 0 ? waveformBars : Array(24).fill(0.12);

  return (
    <div className={`command-bar-wrapper ${isRecording ? "recording-active" : ""}`}>
      {micError && <div className="mic-error-banner">Microphone Notice: {micError}</div>}

      {/* Attachments Preview Row */}
      {attachedFiles.length > 0 && (
        <div className="command-attachments-preview">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="attach-chip">
              <span>{file.type === "image" ? "📸" : file.type === "pdf" ? "📄" : "📎"}</span>
              <span>{file.name}</span>
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => removeAttachment(idx)}
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Popover (Plus Menu) */}
      {isAttachOpen && (
        <div className="command-attach-popover" ref={popoverRef}>
          <button
            type="button"
            className="attach-option-btn"
            onClick={() => handleSelectAttachment("screenshot")}
          >
            <span className="attach-icon">📸</span>
            <div className="attach-title">
              <span className="attach-label">Take Screenshot</span>
              <span className="attach-desc">Capture & analyze display</span>
            </div>
          </button>

          <button
            type="button"
            className="attach-option-btn"
            onClick={() => handleSelectAttachment("pdf")}
          >
            <span className="attach-icon">📄</span>
            <div className="attach-title">
              <span className="attach-label">Upload Document</span>
              <span className="attach-desc">PDF, Markdown or text</span>
            </div>
          </button>

          <button
            type="button"
            className="attach-option-btn"
            onClick={() => handleSelectAttachment("file")}
          >
            <span className="attach-icon">📎</span>
            <div className="attach-title">
              <span className="attach-label">Attach Local File</span>
              <span className="attach-desc">Select from Explorer</span>
            </div>
          </button>

          <button
            type="button"
            className="attach-option-btn"
            onClick={() => handleSelectAttachment("code")}
          >
            <span className="attach-icon">💻</span>
            <div className="attach-title">
              <span className="attach-label">Code Snippet</span>
              <span className="attach-desc">Paste script or traceback</span>
            </div>
          </button>
        </div>
      )}

      {/* Model Selector Drop-up Popover */}
      {isModelOpen && (
        <div className="command-model-popover" ref={modelPopoverRef}>
          <div className="model-popover-header">
            <span className="model-popover-title">SELECT INFERENCE MODEL</span>
            <span className="model-popover-badge">DB Placeholder</span>
          </div>
          <div className="model-options-list">
            {PLACEHOLDER_MODELS.map((model) => {
              const isSelected = model.id === activeModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  className={`model-option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectModel(model.id)}
                >
                  <div className="model-option-left">
                    <div className="model-status-indicator">
                      <span
                        className="model-dot"
                        style={{
                          background: isSelected ? model.badgeColor : "rgba(255,255,255,0.25)",
                          boxShadow: isSelected ? `0 0 8px ${model.badgeColor}` : "none",
                        }}
                      />
                    </div>
                    <div className="model-option-info">
                      <div className="model-option-name-row">
                        <span className="model-option-name">{model.name}</span>
                        <span
                          className="model-provider-badge"
                          style={{
                            color: model.badgeColor,
                            borderColor: `${model.badgeColor}40`,
                            background: `${model.badgeColor}15`,
                          }}
                        >
                          {model.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="model-check-icon" style={{ color: model.badgeColor }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form className="command-form" onSubmit={handleTextSubmit}>
        {/* Left: Plus Attachment Button with + to X rotation */}
        <button
          ref={plusBtnRef}
          type="button"
          className={`command-action-circle-btn command-plus-btn ${isAttachOpen ? "open" : ""}`}
          onClick={() => setIsAttachOpen((prev) => !prev)}
          disabled={isLoading || disabled}
          title={isAttachOpen ? "Close attachment options" : "Add context (screenshot, docs, code)"}
        >
          <span className="command-plus-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span>
        </button>

        {/* Center: Two States (Text Bar vs Voice Waveform Bar) */}
        {!isRecording ? (
          <div className="command-input-container">
            <input
              type="text"
              className="command-input"
              placeholder="Ask Rufus or type a command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || disabled}
              autoFocus
            />
          </div>
        ) : (
          <div className="command-voice-display">
            <div className="voice-live-badge">
              <span className="voice-pulse-dot" />
              <span className="voice-time-label">{formatRecordingTime(recordingSeconds)}</span>
            </div>

            <div className="voice-waveform-stream">
              {displayWaveform.map((bar, idx) => (
                <div
                  key={idx}
                  className="voice-wave-bar"
                  style={{
                    height: `${Math.max(4, Math.min(26, Math.round(bar * 28)))}px`,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="voice-cancel-btn"
              onClick={handleCancelVoice}
              title="Cancel recording"
            >
              ✕
            </button>
          </div>
        )}

        {/* Right: Three Circular Buttons (Model, Voice, Send) - Icons Only */}
        <div className="command-right-cluster">
          {/* Button 1: AI Model Selector Drop-up */}
          <button
            ref={modelBtnRef}
            type="button"
            className={`command-action-circle-btn btn-model ${isModelOpen ? "open" : ""}`}
            onClick={() => {
              setIsAttachOpen(false);
              setIsModelOpen((prev) => !prev);
            }}
            disabled={isLoading || disabled}
            title={`Select Model (Active: ${activeModel.name})`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          </button>

          {/* Button 2: Voice Input / Waveform Toggle */}
          <button
            type="button"
            className={`command-action-circle-btn btn-voice ${isRecording ? "recording" : ""}`}
            onClick={handleToggleVoice}
            disabled={isLoading || disabled}
            title={isRecording ? "Click to Stop & Send Voice" : "Click to Speak (Voice Input)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>

          {/* Button 3: Send Command */}
          <button
            type="submit"
            className="command-action-circle-btn btn-send"
            disabled={(!input.trim() && !isRecording && attachedFiles.length === 0) || isLoading || disabled}
            title={isRecording ? "Send Voice Recording" : "Send Command (Enter)"}
          >
            {isLoading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
