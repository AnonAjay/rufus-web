import React, { useState, useMemo, useEffect, useRef } from "react";
import { SessionItem } from "../../types/agent";
import "./HistoryView.css";

export interface HistoryViewProps {
  sessions: SessionItem[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

function formatCreatedDateTime(isoString?: string): { date: string; time: string } {
  if (!isoString) return { date: "Today", time: "Just now" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "Today", time: "Just now" };
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: "Today", time: "Just now" };
  }
}

/**
 * Generates sliding window pagination items with ellipsis
 */
function getPaginationItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);

  // Close delete modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sessionToDelete) {
        setSessionToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionToDelete]);

  // Filtered sessions based on search
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.last_message && s.last_message.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Dynamic capacity measurement: calculate how many ~72px tiles fit without a scrollbar
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const measureCapacity = () => {
      const availableHeight = el.clientHeight;
      if (availableHeight <= 0) return;
      // Tile height (~66px) + gap (8px) = ~74px
      const calculatedCount = Math.max(4, Math.floor(availableHeight / 74));
      setPageSize(calculatedCount);
    };

    measureCapacity();
    const observer = new ResizeObserver(() => {
      measureCapacity();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset page when search or capacity changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Compute pagination parameters
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + pageSize);

  const paginationItems = useMemo(
    () => getPaginationItems(safePage, totalPages),
    [safePage, totalPages]
  );

  const renderSessionTile = (session: SessionItem) => {
    const isActive = session.id === activeSessionId;
    const { date: dateCreated, time: timeCreated } = formatCreatedDateTime(
      session.created_at || session.updated_at
    );

    return (
      <div
        key={session.id}
        className={`history-linear-tile ${isActive ? "active" : ""}`}
        onClick={() => onSelectSession(session.id)}
      >
        {/* Top Row: Conversation heading on left, Continue & Delete buttons on right */}
        <div className="history-tile-top-row">
          <div className="history-tile-title-group">
            <span className="history-tile-title" title={session.title}>
              {session.title}
            </span>
            {isActive && <span className="history-active-pill">ACTIVE</span>}
          </div>

          {/* Action buttons revealed strictly onHover with expanding labels */}
          <div className="history-tile-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="history-tile-continue-btn"
              onClick={() => onSelectSession(session.id)}
              title="Continue conversation"
            >
              <span className="btn-expand-label">Continue</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              type="button"
              className="history-tile-delete-btn"
              onClick={() => setSessionToDelete(session)}
              title="Delete conversation"
            >
              <span className="btn-expand-label">Delete</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row: Date & Time created metadata */}
        <div className="history-tile-bottom-row">
          <div className="history-tile-created-meta">
            <span className="created-meta-chunk">
              <span className="meta-label">date created:</span>
              <span className="meta-val">{dateCreated}</span>
            </span>
            <span className="created-meta-chunk">
              <span className="meta-label">time created:</span>
              <span className="meta-val">{timeCreated}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="history-view-container">
      {/* Top Header Cluster: Heading + Single-line Controls + Faded Divider */}
      <div className="history-top-header">
        <div className="history-heading-row">
          <h2 className="history-main-heading">Past Conversations</h2>
        </div>

        {/* Single Line: Page Numbers on Left, Search + New Chat on Right */}
        <div className="history-controls-bar">
          {/* Left Edge: Numerical Pagination with hover scale & sliding highlight */}
          <div className="history-controls-left">
            {totalPages > 1 && (
              <div className="history-pagination-cluster">
                <button
                  type="button"
                  className="history-page-nav-arrow"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  ‹
                </button>

                <div className="history-page-numbers-track">
                  {paginationItems.map((item, idx) => {
                    if (item === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="history-page-ellipsis">
                          •••
                        </span>
                      );
                    }
                    const pageNum = Number(item);
                    const isActive = pageNum === safePage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        type="button"
                        className={`history-page-number-btn ${isActive ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                        title={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="history-page-nav-arrow"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Right Edge: Compact Search + New Chat */}
          <div className="history-controls-right">
            <div className="history-search-pill">
              <div className="history-search-circle-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </div>
              <input
                type="text"
                className="history-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="history-clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              className="history-new-chat-btn"
              onClick={onNewSession}
              title="New Conversation"
              disabled={isLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Highly Faded Line Separator */}
        <div className="history-controls-faded-divider" />
      </div>

      {/* Main Sessions Feed Container (Zero Scroll Bar Fit) */}
      <div className="history-feed" ref={feedRef}>
        {filteredSessions.length === 0 ? (
          <div className="history-empty-hero-container">
            {searchQuery ? (
              <div className="history-empty-search-state">
                <div className="empty-search-lens">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                  </svg>
                </div>
                <h4 className="empty-title">No matching conversations found</h4>
                <button
                  type="button"
                  className="empty-clear-query-btn"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                {/* Central Rufus OLED Wake-Up Face */}
                <div className="history-hero-face-frame">
                  <div className="history-hero-glow-ring" />
                  <div className="history-hero-oled-screen">
                    <div className="history-hero-dead-eye">
                      <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
                        <line x1="4" y1="9" x2="24" y2="29" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
                        <line x1="24" y1="9" x2="4" y2="29" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="history-hero-dead-eye">
                      <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
                        <line x1="4" y1="9" x2="24" y2="29" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
                        <line x1="24" y1="9" x2="4" y2="29" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="history-hero-text-wrapper">
                  <h2 className="history-hero-greeting-text">
                    No Past Conversations Recorded
                  </h2>
                </div>

                <button
                  type="button"
                  className="history-play-rufus-btn"
                  onClick={onNewSession}
                  title="Wake up and play with Rufus"
                >
                  <span className="play-glyph-large">🐾</span>
                  <span>Play with Rufus</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="history-tiles-stack">
            {paginatedSessions.map(renderSessionTile)}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {sessionToDelete && (
        <div
          className="history-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSessionToDelete(null);
          }}
        >
          <div className="history-delete-modal-dialog" role="dialog" aria-modal="true">
            <div className="delete-modal-danger-aura">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 className="delete-modal-title">Delete Conversation</h3>
            <p className="delete-modal-question">
              Are you sure you want to delete this conversation?
            </p>
            <div className="delete-modal-session-snippet" title={sessionToDelete.title}>
              "{sessionToDelete.title}"
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-btn cancel"
                onClick={() => setSessionToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-modal-btn confirm"
                onClick={() => {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
