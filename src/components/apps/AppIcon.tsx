import React from "react";

interface AppIconProps {
  iconId: string;
  size?: number;
  className?: string;
  brandColor?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  iconId,
  size = 28,
  className = "",
  brandColor,
}) => {
  const s = size;

  switch (iconId.toLowerCase()) {
    case "whatsapp":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#25D366"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );

    case "vscode":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#007ACC"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );

    case "spotify":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#1DB954"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 11.5c3-1 6-1 8 .5" />
          <path d="M7 14.5c3.5-1 7.5-.5 9.5 1" />
          <path d="M9 9c2.5-.8 5-.5 7 .5" />
        </svg>
      );

    case "chrome":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#EA4335"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="21.17" y1="8" x2="12" y2="8" />
          <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
          <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
        </svg>
      );

    case "antigravity":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#00F0FF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );

    case "explorer":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#FFB900"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );

    case "notion":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#FFFFFF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 13.56 2H6a2 2 0 0 0-2 2z" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
          <path d="M9 9h1" />
        </svg>
      );

    case "discord":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#5865F2"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M18 6h0a14.5 14.5 0 0 0-4-1.2 9.6 9.6 0 0 0-.4 1 13 13 0 0 0-3.2 0 9.6 9.6 0 0 0-.4-1A14.5 14.5 0 0 0 6 6c-2.4 3.6-3 7-2.6 10.4a14.8 14.8 0 0 0 4.5 2.3 11 11 0 0 0 1-1.6 9.5 9.5 0 0 1-1.5-.7l.4-.3c3 1.4 6.2 1.4 9.2 0l.4.3a9.5 9.5 0 0 1-1.5.7 11 11 0 0 0 1 1.6 14.8 14.8 0 0 0 4.5-2.3c.5-4-.5-7.4-2.4-10.4z" />
          <circle cx="9" cy="12" r="1" fill={brandColor || "#5865F2"} />
          <circle cx="15" cy="12" r="1" fill={brandColor || "#5865F2"} />
        </svg>
      );

    case "steam":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#171A21"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="8.5" cy="14.5" r="2.5" />
          <circle cx="15.5" cy="9.5" r="3.5" />
          <line x1="10.5" y1="13" x2="13" y2="11.5" />
        </svg>
      );

    case "slack":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#E01E5A"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="13" y="2" width="3" height="8" rx="1.5" />
          <path d="M19 8.5a1.5 1.5 0 0 0-1.5-1.5H16v3h1.5A1.5 1.5 0 0 0 19 8.5z" />
          <rect x="8" y="14" width="3" height="8" rx="1.5" />
          <path d="M5 15.5A1.5 1.5 0 0 0 6.5 17H8v-3H6.5A1.5 1.5 0 0 0 5 15.5z" />
          <rect x="2" y="8" width="8" height="3" rx="1.5" />
          <path d="M8.5 5A1.5 1.5 0 0 0 7 6.5V8h3V6.5A1.5 1.5 0 0 0 8.5 5z" />
          <rect x="14" y="13" width="8" height="3" rx="1.5" />
          <path d="M15.5 19a1.5 1.5 0 0 0 1.5-1.5V16h-3v1.5a1.5 1.5 0 0 0 1.5 1.5z" />
        </svg>
      );

    // SKILLS
    case "volume":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#00F0FF"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );

    case "display":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#F59E0B"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );

    case "vision":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#8B5CF6"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "research":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#10B981"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      );

    case "focus":
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#EC4899"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );

    default:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={brandColor || "#94A3B8"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
  }
};
