import React, { useState, useEffect, useMemo, useRef } from "react";
import { UserMemory, MemoryCategory } from "../../types/memory";
import "./MemoryView.css";

const API_BASE = "http://127.0.0.1:8000";

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Just now";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | MemoryCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null);
  const [formCategory, setFormCategory] = useState<MemoryCategory>("project");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/agent/memories`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.error("Failed to load user memories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // Filtered list
  const filteredMemories = useMemo(() => {
    let list = memories;
    if (activeTab !== "all") {
      list = list.filter((m) => m.category === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memories, activeTab, searchQuery]);

  // Counts
  const totalCount = memories.length;
  const projectCount = memories.filter((m) => m.category === "project").length;
  const prefCount = memories.filter((m) => m.category === "preference").length;
  const relationCount = memories.filter((m) => m.category === "relationship").length;
  const generalCount = memories.filter((m) => m.category === "general").length;

  const handleOpenAddModal = (mem?: UserMemory) => {
    if (mem) {
      setEditingMemory(mem);
      setFormCategory(mem.category);
      setFormTitle(mem.title);
      setFormContent(mem.content);
    } else {
      setEditingMemory(null);
      setFormCategory("project");
      setFormTitle("");
      setFormContent("");
    }
    setIsModalOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        memory_id: editingMemory ? editingMemory.id : undefined,
      };

      const res = await fetch(`${API_BASE}/agent/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchMemories();
        showToast(editingMemory ? "Memory updated successfully" : "New memory stored in brain");
      }
    } catch (err) {
      console.error("Failed to save memory:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/agent/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        showToast("Memory deleted from persistent storage");
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  return (
    <div className="memory-view-container">
      {/* Toast */}
      {toastMsg && <div className="memory-toast-pill">{toastMsg}</div>}

      {/* Top Header Cluster */}
      <div className="memory-top-header">
        <div className="memory-heading-row">
          <h1 className="memory-main-heading">Persistent Memories</h1>
        </div>

        {/* Controls Bar */}
        <div className="memory-controls-bar">
          {/* Segmented Category Filter Tabs */}
          <div className="memory-segmented-tabs">
            <button
              type="button"
              className={`memory-segment-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
              <span className="memory-segment-count">{totalCount}</span>
            </button>
            <button
              type="button"
              className={`memory-segment-btn ${activeTab === "project" ? "active" : ""}`}
              onClick={() => setActiveTab("project")}
            >
              Projects
              <span className="memory-segment-count">{projectCount}</span>
            </button>
            <button
              type="button"
              className={`memory-segment-btn ${activeTab === "preference" ? "active" : ""}`}
              onClick={() => setActiveTab("preference")}
            >
              Preferences
              <span className="memory-segment-count">{prefCount}</span>
            </button>
            <button
              type="button"
              className={`memory-segment-btn ${activeTab === "relationship" ? "active" : ""}`}
              onClick={() => setActiveTab("relationship")}
            >
              People
              <span className="memory-segment-count">{relationCount}</span>
            </button>
            {generalCount > 0 && (
              <button
                type="button"
                className={`memory-segment-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                General
                <span className="memory-segment-count">{generalCount}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Search Pill + Add Button */}
          <div className="memory-controls-right">
            <div className="memory-search-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="memory-search-input"
              />
            </div>

            <button
              type="button"
              className="memory-add-btn"
              onClick={() => handleOpenAddModal()}
              title="Add a persistent memory fact"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Flush Divider */}
        <div className="memory-faded-divider" />
      </div>

      {/* Main Workspace: Memories Grid */}
      <div className="memory-workspace">
        {isLoading ? (
          <div className="memory-loading-state">
            <div className="memory-spinner" />
            <p>Accessing Rufus neural memory database...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="memory-empty-state">
            <div className="memory-empty-icon">🧠</div>
            <h3 className="memory-empty-title">
              {searchQuery ? "No matching memories found" : "No memories saved yet"}
            </h3>
            <p className="memory-empty-desc">
              {searchQuery
                ? "Try searching for another keyword or clear the search filter."
                : "Rufus automatically extracts project updates and preferences as you chat, or you can add one manually."}
            </p>
            <button
              type="button"
              className="memory-empty-add-btn"
              onClick={() => handleOpenAddModal()}
            >
              Add First Memory
            </button>
          </div>
        ) : (
          <div className="memory-cards-grid">
            {filteredMemories.map((mem) => {
              return (
                <div
                  key={mem.id}
                  className={`memory-card category-${mem.category}`}
                  onClick={() => handleOpenAddModal(mem)}
                  title="Click to edit memory"
                >
                  <div className="memory-card-header">
                    <span className={`memory-category-badge ${mem.category}`}>
                      {mem.category.toUpperCase()}
                    </span>

                    <button
                      type="button"
                      className="memory-delete-btn"
                      onClick={(e) => handleDeleteMemory(mem.id, e)}
                      title="Delete memory"
                    >
                      ✕
                    </button>
                  </div>

                  <h3 className="memory-card-title">{mem.title}</h3>
                  <p className="memory-card-content">{mem.content}</p>

                  <div className="memory-card-footer">
                    <span className="memory-updated-time">
                      Updated {formatRelativeTime(mem.updated_at)}
                    </span>
                    <span className="memory-edit-hint">Click to edit</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="memory-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="memory-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMemory ? "Edit Memory" : "Add Persistent Memory"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="modal-form">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                  className="form-select"
                >
                  <option value="project">Project (Active tasks & milestones)</option>
                  <option value="preference">Preference (Tone, coding, tools)</option>
                  <option value="relationship">Relationship (People, contacts, dates)</option>
                  <option value="general">General (Identity, location, facts)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Title / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. Rufus Companion Robot or Preferred Tone"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Details / Content</label>
                <textarea
                  placeholder="Enter the dense status, spec, or fact to remember..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingMemory ? "Update Memory" : "Save Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
