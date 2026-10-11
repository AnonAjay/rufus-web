import React from "react";
import "./AudioWaveform.css";

export interface AudioWaveformProps {
  bars?: number[];
  isActive?: boolean;
  color?: string;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  bars = [0.15, 0.15, 0.15, 0.15, 0.15],
  isActive = false,
  color = "#00E5FF",
  height = 20,
}) => {
  return (
    <div
      className={`audio-waveform-container ${isActive ? "active" : "idle"}`}
      style={{ height: `${height}px` }}
    >
      {bars.map((barValue, idx) => {
        const barHeight = isActive
          ? Math.max(3, Math.round(barValue * height))
          : 3;

        return (
          <span
            key={idx}
            className="waveform-bar"
            style={{
              height: `${barHeight}px`,
              backgroundColor: color,
              boxShadow: isActive ? `0 0 6px ${color}` : "none",
            }}
          />
        );
      })}
    </div>
  );
};
