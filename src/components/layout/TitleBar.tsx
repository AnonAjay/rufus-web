import React, { useState, useRef, useEffect } from "react";
import {
  RufusEyesLogo,
  MicIcon,
  CameraIcon,
  ScreenIcon,
  BellIcon,
  MoreDotsIcon,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  MiniModeIcon,
  MoonIcon,
  SettingsIcon,
} from "./TitleBarIcons";
import { useTauriWindow } from "../../hooks/useTauriWindow";
import "./TitleBar.css";

export interface TitleBarProps {
  isAlwaysOnMic: boolean;
  onToggleAlwaysOnMic: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isScreenActive: boolean;
  onToggleScreen: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  isAlwaysOnMic,
  onToggleAlwaysOnMic,
  isCameraActive,
  onToggleCamera,
  isScreenActive,
  onToggleScreen,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenSettings,
}) => {
  const { isMaximized, isMiniMode, minimize, toggleMaximize, close, toggleMiniMode } =
    useTauriWindow();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuietMode, setIsQuietMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

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

      {/* Right Controls & Action Cluster (Explicitly non-draggable) */}
      <div className="titlebar-right">
        {/* Hardware / Context Toggles */}
        <div className="toggle-group">
          <button
            type="button"
            className={`titlebar-toggle-btn ${isAlwaysOnMic ? "active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAlwaysOnMic();
            }}
            title={isAlwaysOnMic ? "Always-on Mic Active (Listening for wake word)" : "Push-to-Talk Mode (Click to enable always-on mic)"}
          >
            <MicIcon active={isAlwaysOnMic} />
            <span className="toggle-label">Mic</span>
          </button>

          <button
            type="button"
            className={`titlebar-toggle-btn ${isCameraActive ? "active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCamera();
            }}
            title={isCameraActive ? "Webcam Emotion Detection Active" : "Webcam Off (Click to enable emotion detection)"}
          >
            <CameraIcon active={isCameraActive} />
            <span className="toggle-label">Camera</span>
          </button>

          <button
            type="button"
            className={`titlebar-toggle-btn ${isScreenActive ? "active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleScreen();
            }}
            title={isScreenActive ? "Screen Vision Context Active" : "Screen Context Inactive"}
          >
            <ScreenIcon active={isScreenActive} />
            <span className="toggle-label">Screen</span>
          </button>
        </div>

        {/* Separator */}
        <div className="titlebar-divider" />

        {/* Notifications & Menu */}
        <div className="utility-group" ref={menuRef}>
          <button
            type="button"
            className="titlebar-icon-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotifications?.();
            }}
            title="Notification Center"
          >
            <BellIcon unread={unreadNotificationsCount > 0} />
          </button>

          <button
            type="button"
            className={`titlebar-icon-btn ${isMenuOpen ? "open" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="Status & Quick Actions"
          >
            <MoreDotsIcon />
          </button>

          {/* Quick Menu Popover */}
          {isMenuOpen && (
            <div className="titlebar-menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
              <div className="menu-header">
                <div className="menu-header-avatar">
                  <RufusEyesLogo size={14} glow={false} />
                </div>
                <div className="menu-header-text">
                  <div className="menu-header-title">Rufus is ready</div>
                </div>
              </div>

              <div className="menu-divider" />

              <button
                type="button"
                className="menu-item"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMiniMode();
                  setIsMenuOpen(false);
                }}
              >
                <MiniModeIcon />
                <span>{isMiniMode ? "Expand to Workstation" : "Floating Mini Capsule"}</span>
              </button>

              <button
                type="button"
                className={`menu-item ${isQuietMode ? "quiet-active" : ""}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuietMode((prev) => !prev);
                  setIsMenuOpen(false);
                }}
              >
                <MoonIcon />
                <span>{isQuietMode ? "Turn off Quiet Mode" : "Quiet for one hour"}</span>
              </button>

              <button
                type="button"
                className="menu-item"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings?.();
                  setIsMenuOpen(false);
                }}
              >
                <SettingsIcon />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Native Window Controls */}
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
