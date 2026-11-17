import React from "react";
import "./LockedRoadmapView.css";

export interface LockedViewConfig {
  phase: string;
  title: string;
  description: string;
  roadmapRef?: string;
}

export const LOCKED_ROADMAP_CONFIG: Record<string, LockedViewConfig> = {
  missions: {
    phase: "Phase 3 • Autonomous Workflows",
    title: "Autonomous Missions",
    description: "Multi-step scheduled agent tasks executing system actions without manual supervision.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
  calendar: {
    phase: "Phase 4 • Productivity Engine",
    title: "Calendar & Schedule Engine",
    description: "Deep synchronization with system calendar and Google Calendar for proactive daily briefings.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
  "smart-home": {
    phase: "Phase 6 • Home Assistant",
    title: "Smart Home Control",
    description: "Connects Rufus to your local Home Assistant server to control appliances, lights, and sensors via MCP.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
  "robot-telemetry": {
    phase: "Phase 2 • Hardware Telemetry",
    title: "Robot Hardware Telemetry",
    description: "Live ESP32 WROOM-32 hardware link, battery voltage, WiFi RSSI, and MQTT broker telemetry.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
  mood: {
    phase: "Phase 2 • Hackathon Track",
    title: "Mood & Emotion Awareness",
    description: "Off-device browser webcam feed analyzes user sentiment and adjusts Rufus's OLED eyes.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
  "agent-hub": {
    phase: "Phase 3 • Cross-Agent Memory",
    title: "Agent Hub Orchestrator",
    description: "Cross-agent unified memory linking Claude, ChatGPT, and Antigravity under one companion umbrella.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  },
};

export interface LockedRoadmapViewProps {
  tabKey: string;
}

export const LockedRoadmapView: React.FC<LockedRoadmapViewProps> = ({ tabKey }) => {
  const config = LOCKED_ROADMAP_CONFIG[tabKey] || {
    phase: "Roadmap Capability",
    title: "Under Development",
    description: "This capability is currently queued in the engineering roadmap.",
    roadmapRef: "PENDING_ARCHITECTURE.md",
  };

  return (
    <div className="locked-view-container">
      <div className="locked-view-card">
        <div className="locked-icon-halo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="locked-phase-badge">{config.phase}</span>
        <h3 className="locked-title">{config.title}</h3>
        <p className="locked-desc">{config.description}</p>
        <div className="locked-roadmap-pill">
          Architectural design tracked in <code>{config.roadmapRef || "PENDING_ARCHITECTURE.md"}</code>
        </div>
      </div>
    </div>
  );
};
