import React from "react";
import "./PersonasView.css";

export interface PersonaDefinition {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  features: string[];
}

export const PERSONA_DEFINITIONS: PersonaDefinition[] = [
  {
    id: "auto",
    name: "Adaptive (Auto-Detect)",
    tagline: "Dynamic Multi-Criteria Routing per Turn",
    icon: "⚡",
    description:
      "Dynamically routes each utterance based on context: conversational dialogue switches to pedagogical tutoring for learning, technical synthesis for research, code-centric for programming, and short spoken voice for desktop actions.",
    features: ["Auto Intent Detection", "Multi-Persona Switching", "Context Aware", "Optimal Depth"],
  },
  {
    id: "companion",
    name: "Desktop Companion",
    tagline: "Personalized Assistant & Daily Companion",
    icon: "🐕",
    description:
      "Warm, concise, voice-optimized (1-3 spoken sentences). Seamlessly handles local OS app launching, WhatsApp, Spotify, smart controls, and physical companion robot stunts.",
    features: ["Voice-First (1-3 Sentences)", "Direct App Control", "Physical Robot Sync", "Sub-Second Latency"],
  },
  {
    id: "instructor",
    name: "Instructor",
    tagline: "Conceptual Tutor & Technical Educator",
    icon: "🎓",
    description:
      "Pedagogical, clear, patient. Breaks down complex engineering topics step-by-step, surfaces citations, academic references, visual mental models, and probes deep understanding.",
    features: ["Step-by-Step Explanations", "Citations & References", "Socratic Recall Probing", "Mental Models"],
  },
  {
    id: "researcher",
    name: "Researcher",
    tagline: "Evidence-Driven Synthesis & Literature Analyst",
    icon: "🔬",
    description:
      "Rigorous, analytical, comprehensive. Synthesizes multi-source findings, cross-examines evidence, highlights empirical data, and produces structured markdown reports.",
    features: ["Deep Synthesis", "Multi-Source Extraction", "Evidence-Based Analysis", "Structured Reports"],
  },
  {
    id: "coder",
    name: "Coding Assistant",
    tagline: "Elite Systems & Full-Stack Architect",
    icon: "💻",
    description:
      "Terse, code-centric, precise. Zero conversational filler. Emphasizes production patterns, strict type safety, edge cases, security allowlists, and debugging tracebacks.",
    features: ["Production Code Blocks", "Type Safety & Invariants", "Edge Case Diagnostics", "Zero Filler"],
  },
];

export interface PersonasViewProps {
  activePersonaId: string;
  onSelectPersona: (personaId: string) => void;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  activePersonaId,
  onSelectPersona,
}) => {
  const activePersona =
    PERSONA_DEFINITIONS.find((p) => p.id === activePersonaId) || PERSONA_DEFINITIONS[0];

  return (
    <div className="personas-container">
      {/* 1. TOP HEADER (Simple Minimalist Heading - matching Focus & Timers / Apps) */}
      <header className="personas-top-nav-bar">
        <div className="personas-title-cluster">
          <h1 className="personas-main-heading">Personas</h1>
          <span className="personas-count-badge">5 Profiles (1 Adaptive + 4 Manual)</span>
        </div>

        <div className="personas-active-status-pill">
          <span className="personas-status-dot" />
          <span className="personas-status-label">
            Active: <span className="personas-status-name">{activePersona.name}</span>
          </span>
        </div>
      </header>

      {/* 2. FOUR MAJOR PERSONAS GRID */}
      <main className="personas-grid">
        {PERSONA_DEFINITIONS.map((persona) => {
          const isActive = persona.id === activePersonaId;
          return (
            <div
              key={persona.id}
              className={`persona-card ${isActive ? "active" : ""}`}
              onClick={() => onSelectPersona(persona.id)}
            >
              <div className="persona-card-header">
                <div className="persona-icon-box">{persona.icon}</div>
                <div className="persona-header-info">
                  <h3 className="persona-name">{persona.name}</h3>
                  <p className="persona-tagline">{persona.tagline}</p>
                </div>
                {isActive && (
                  <div className="persona-active-badge">
                    <span>ACTIVE</span>
                  </div>
                )}
              </div>

              <div className="persona-card-body">
                <p className="persona-description">{persona.description}</p>
                <div className="persona-features-row">
                  {persona.features.map((feat, idx) => (
                    <span key={idx} className="persona-feature-pill">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="persona-card-footer">
                <button
                  type="button"
                  className="persona-select-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPersona(persona.id);
                  }}
                >
                  {isActive ? "Active Persona" : "Activate Persona"}
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

