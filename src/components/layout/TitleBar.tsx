import React, { useState } from "react";
import {
  RufusEyesLogo,
  BellIcon,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  MiniModeIcon,
  MoonIcon,
} from "./TitleBarIcons";
import { useTauriWindow } from "../../hooks/useTauriWindow";
import "./TitleBar.css";

export interface TitleBarProps {
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const { isMaximized, minimize, toggleMaximize, close, toggleMiniMode } =
    useTauriWindow();

  const [isQuietMode, setIsQuietMode] = useState<boolean>(false);

  return (
    <header className="custom-titlebar">
      {/* Brand / Logo Section (Draggable region) */}
      <div className="titlebar-left" data-tauri-drag-region>
        <div className="titlebar-brand" data-tauri-drag-region>
          <div className="brand-logo-container" data-tauri-drag-region>
            <RufusEyesLogo size={18} glow={true} />
          </div>
          <span className="brand-title" data-tauri-drag-region>Rufus</span>
          <span className="brand-version" data-tauri-drag-region>1.0</span>
        </div>
      </div>

      {/* Center Draggable Spacer */}
      <div className="titlebar-spacer" data-tauri-drag-region />

      {/* Right Controls & Minimalist Utility Cluster (Explicitly non-draggable) */}
      <div className="titlebar-right">
        {/* Minimalist Action Cluster: Notifications, Mini Mode, DND */}
        <div className="titlebar-utility-cluster">
          {/* 1. Notifications */}
          <button
            type="button"
            className="titlebar-pill-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotifications?.();
            }}
            title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread notifications` : "Notifications"}
          >
            <BellIcon unread={unreadNotificationsCount > 0} />
          </button>

          {/* 2. Mini Mode Floater */}
          <button
            type="button"
            className="titlebar-pill-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleMiniMode();
            }}
            title="Switch to Floating Island Capsule"
          >
            <MiniModeIcon />
          </button>

          {/* 3. Do Not Disturb (DND / Quiet Mode) */}
          <button
            type="button"
            className={`titlebar-pill-btn ${isQuietMode ? "quiet-active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsQuietMode((prev) => !prev);
            }}
            title={isQuietMode ? "Quiet Mode Active (Muted alerts)" : "Do Not Disturb / Quiet Mode"}
          >
            <MoonIcon />
          </button>
        </div>

        {/* Separator Divider */}
        <div className="titlebar-divider" />

        {/* Window Controls */}
        <div className="window-controls">
          <button
            type="button"
            className="win-btn win-minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              minimize();
            }}
            title="Minimize"
          >
            <MinimizeIcon />
          </button>

          <button
            type="button"
            className="win-btn win-maximize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <MaximizeIcon isMaximized={isMaximized} />
          </button>

          <button
            type="button"
            className="win-btn win-close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
