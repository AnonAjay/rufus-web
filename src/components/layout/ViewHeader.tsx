import React from "react";
import { NavTab } from "./Sidebar";
import "./ViewHeader.css";

export interface ViewHeaderProps {
  activeTab: NavTab;
  isLive?: boolean;
}

const TAB_METADATA: Record<NavTab, { title: string; subtitle: string; category: string }> = {
  assistant: {
    category: "CONVERSATIONS",
    title: "Assistant",
    subtitle: "One conversation. Every capability. Direct local OS tool execution.",
  },
  history: {
    category: "CONVERSATIONS",
    title: "Conversation History",
    subtitle: "Chronological past sessions and persistent multi-turn transcripts.",
  },
  apps: {
    category: "ACTIONS",
    title: "Apps & Skills Registry",
    subtitle: "Registered local tools, system capabilities, and allowlists.",
  },
  missions: {
    category: "ACTIONS",
    title: "Autonomous Missions",
    subtitle: "Multi-step agent workflows and scheduled task loops. (Phase 3 Roadmap)",
  },
  reminders: {
    category: "LIFE APPS",
    title: "Reminders & Focus",
    subtitle: "Contextual desktop reminders, focus intervals, and alert notifications.",
  },
  alarms: {
    category: "LIFE APPS",
    title: "Alarms & Timers",
    subtitle: "Precision system alarms and Pomodoro timer intervals.",
  },
  calendar: {
    category: "LIFE APPS",
    title: "Calendar Schedule",
    subtitle: "Daily schedule, calendar events, and proactive agenda summaries.",
  },
  tasks: {
    category: "LIFE APPS",
    title: "Tasks & To-Do",
    subtitle: "Track action items, engineer checklists, and completed goals.",
  },
  "smart-home": {
    category: "LIFE APPS",
    title: "Smart Home",
    subtitle: "Home Assistant MCP server integration for ambient device control.",
  },
  "robot-telemetry": {
    category: "ROBOT",
    title: "Robot Telemetry",
    subtitle: "ESP32 WROOM-32 hardware link, battery voltage, WiFi RSSI, and MQTT broker.",
  },
  personas: {
    category: "ROBOT",
    title: "Rufus Personas",
    subtitle: "Switchable personality prompts, speech styles, and TTS voice profiles.",
  },
  mood: {
    category: "ROBOT",
    title: "Mood & Vision Context",
    subtitle: "Laptop webcam emotion detection and visual sentiment awareness.",
  },
  "agent-hub": {
    category: "BRAIN",
    title: "Agent Hub",
    subtitle: "Unified cross-agent orchestrator connecting Claude, ChatGPT, and Antigravity.",
  },
  memory: {
    category: "BRAIN",
    title: "Persistent Memory Explorer",
    subtitle: "Supabase long-term vector/chat memory and cross-session knowledge.",
  },
  settings: {
    category: "SYSTEM",
    title: "System Settings",
    subtitle: "Model router configurations, local Ollama endpoints, and audio devices.",
  },
};

export const ViewHeader: React.FC<ViewHeaderProps> = ({ activeTab, isLive = true }) => {
  const metadata = TAB_METADATA[activeTab] || {
    category: "RUFUS",
    title: activeTab,
    subtitle: "Desktop companion module",
  };

  return (
    <div className="view-header">
      <div className="view-header-left">
        <div className="view-breadcrumb">
          <span className="breadcrumb-root">RUFUS</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-root">{metadata.category}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{metadata.title.toUpperCase()}</span>
        </div>
        <h2 className="view-title">{metadata.title}</h2>
        <p className="view-subtitle">{metadata.subtitle}</p>
      </div>

      <div className="view-header-right">
        {isLive && (
          <div className="live-status-pill">
            <span className="live-dot" />
            <span className="live-text">Live</span>
          </div>
        )}
      </div>
    </div>
  );
};
