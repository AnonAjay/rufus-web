import React, { useState, useEffect } from "react";
import "./HeroWakeup.css";

export interface HeroWakeupProps {
  onPromptClick?: (prompt: string) => void;
  isFadingOut?: boolean;
}

export const HeroWakeup: React.FC<HeroWakeupProps> = ({ isFadingOut }) => {
  const fullText = "Hi, I am Rufus. How can I help you?";
  const [displayedText, setDisplayedText] = useState("");
  const [wakeState, setWakeState] = useState<"sleeping" | "waking" | "awake">("sleeping");

  useEffect(() => {
    // Wake-up sequence:
    // 0ms - 500ms: Eyes closed / dormant
    // 500ms - 1200ms: Waking / opening with double blink
    // 1200ms+: Awake alert state & start typewriter
    const wakeTimer = setTimeout(() => {
      setWakeState("waking");
    }, 450);

    const awakeTimer = setTimeout(() => {
      setWakeState("awake");
    }, 1200);

    return () => {
      clearTimeout(wakeTimer);
      clearTimeout(awakeTimer);
    };
  }, []);

  useEffect(() => {
    if (wakeState !== "awake") return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 38);

    return () => clearInterval(typingInterval);
  }, [wakeState, fullText]);

  return (
    <div className={`hero-wakeup-container ${isFadingOut ? "fading-out" : ""}`}>
      {/* Central Rufus OLED Wake-Up Face */}
      <div className={`hero-face-frame ${wakeState}`}>
        <div className="hero-face-glow-ring" />
        <div className="hero-oled-screen">
          <div className="hero-eye left-eye" />
          <div className="hero-eye right-eye" />
        </div>
      </div>

      {/* Typewriter Greeting Text */}
      <div className="hero-text-wrapper">
        <h2 className="hero-greeting-text">
          {displayedText}
          {displayedText.length < fullText.length && (
            <span className="hero-cursor">|</span>
          )}
        </h2>
      </div>
    </div>
  );
};
