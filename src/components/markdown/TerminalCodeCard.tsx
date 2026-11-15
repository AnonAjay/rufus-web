import React, { useState, useMemo } from "react";
import "./MarkdownRenderer.css";

interface TerminalCodeCardProps {
  language?: string;
  code: string;
}

export const TerminalCodeCard: React.FC<TerminalCodeCardProps> = ({
  language = "text",
  code,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const cleanLang = (language || "text").replace(/^language-/, "").toLowerCase();
  const displayLang = cleanLang === "text" ? "CODE" : cleanLang.toUpperCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code to clipboard:", err);
    }
  };

  const lines = useMemo(() => {
    return code.split("\n");
  }, [code]);

  return (
    <div className="terminal-code-card">
      {/* Top Terminal Titlebar */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot dot-red" />
          <span className="terminal-dot dot-yellow" />
          <span className="terminal-dot dot-green" />
        </div>

        <div className="terminal-title">
          <span className="terminal-lang-badge">{displayLang}</span>
        </div>

        <button
          type="button"
          className={`terminal-copy-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Line Numbers & Horizontal Scrolling */}
      <div className="terminal-body">
        <pre className="terminal-pre">
          <code className={`terminal-code language-${cleanLang}`}>
            {lines.map((line, idx) => (
              <div key={idx} className="terminal-line">
                <span className="terminal-line-num">{idx + 1}</span>
                <span className="terminal-line-content">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
