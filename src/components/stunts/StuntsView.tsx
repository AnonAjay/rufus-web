import React from "react";
import { ViewHeader } from "../layout/ViewHeader";
import "./StuntsView.css";

export const StuntsView: React.FC = () => {
  return (
    <div className="stunts-view-container">
      <ViewHeader activeTab="stunts" isLive={false} />

      <div className="stunts-content">
        <div className="stunts-standby-card">
          <div className="stunts-standby-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="stunts-standby-badge">STANDBY</div>
          <h2 className="stunts-standby-title">Robot Stunt Engine</h2>
          <p className="stunts-standby-desc">
            Physical kinematics and sequence execution pipeline. Awaiting ESP32 WROOM-32 MQTT telemetry handshake on <code>rufus/+/stunts</code>.
          </p>
          <div className="stunts-standby-meta">
            <div className="stunts-meta-item">
              <span className="meta-label">Controller</span>
              <span className="meta-val">ESP32 WROOM-32 (LEDC PWM)</span>
            </div>
            <div className="stunts-meta-item">
              <span className="meta-label">Actuators</span>
              <span className="meta-val">4x SG90 Micro Servos</span>
            </div>
            <div className="stunts-meta-item">
              <span className="meta-label">Protocol</span>
              <span className="meta-val">Mosquitto MQTT (localhost:1883)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
