import React from "react";

export type EyeState = "idle" | "listening" | "thinking" | "happy" | "sleepy";

export interface RufusFaceProps {
  state: EyeState;
  subtitle?: string;
}

export const RufusFace: React.FC<RufusFaceProps> = ({ state, subtitle }) => {
  return (
    <div className={`rufus-face-container ${state}`}>
      <div className="rufus-oled-screen">
        <div className="rufus-eye left-eye">
          <div className="pupil" />
        </div>
        <div className="rufus-eye right-eye">
          <div className="pupil" />
        </div>
      </div>
      {subtitle && <div className="rufus-face-subtitle">{subtitle}</div>}
    </div>
  );
};
