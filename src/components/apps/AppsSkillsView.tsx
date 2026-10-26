import React, { useState, useMemo, useEffect, useRef } from "react";
import { IntegrationItem, DiscoveredApp } from "../../types/integrations";
import { INITIAL_INTEGRATIONS, DISCOVERABLE_PC_APPS } from "./appPresets";
import { AppIcon } from "./AppIcon";
import "./AppsSkillsView.css";

const STORAGE_KEY = "rufus_apps_skills_integrations_v1";

export const AppsSkillsView: React.FC = () => {
  // Load saved state or default presets
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to read saved integrations from localStorage:", e);
    }
    return INITIAL_INTEGRATIONS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"all" | "apps" | "skills">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredApps, setDiscoveredApps] = useState<DiscoveredApp[]>(DISCOVERABLE_PC_APPS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Custom App Form state
  const [customAppName, setCustomAppName] = useState("");
  const [customAppPath, setCustomAppPath] = useState("");
  const [customAppCategory, setCustomAppCategory] = useState("Productivity");

  // Testing & Toast state
  const [isTestingMcp, setIsTestingMcp] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Search input ref for keyboard shortcut '/'
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage whenever integrations change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
    } catch (e) {
      console.error("Failed to persist integrations:", e);
    }
  }, [integrations]);

  // Global keyboard shortcuts: Escape to close modals/drawers, '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isScanModalOpen) {
          setIsScanModalOpen(false);
        } else if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else if (selectedItemId) {
          setSelectedItemId(null);
        }
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        // Prevent default slash insertion when focusing search
        if (!isScanModalOpen && !isAddModalOpen) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, isScanModalOpen, isAddModalOpen]);

  // Trigger floating toast
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3200);
  };

  // Currently selected item for the Inspector Drawer
  const selectedItem = useMemo(() => {
    return integrations.find((item) => item.id === selectedItemId) || null;
  }, [integrations, selectedItemId]);

  // Filtered list based on Search & Tabs
  const filteredIntegrations = useMemo(() => {
    let list = integrations;

    if (activeTab === "apps") {
      list = list.filter((i) => i.type === "app");
    } else if (activeTab === "skills") {
      list = list.filter((i) => i.type === "skill");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tools.some((t) => t.name.toLowerCase().includes(q) || t.actionKey.toLowerCase().includes(q))
      );
    }

    return list;
  }, [integrations, activeTab, searchQuery]);

  // Active / Disabled counts
  const totalCount = integrations.length;
  const appsCount = integrations.filter((i) => i.type === "app").length;
  const skillsCount = integrations.filter((i) => i.type === "skill").length;
  const activeCount = integrations.filter((i) => i.enabled).length;
  const disabledCount = totalCount - activeCount;

  // Toggle master enabled state for an app/skill
  const handleToggleMaster = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.enabled;
          showToast(
            `${item.name} ${nextState ? "enabled" : "disabled"} (${item.tools.length} tools ${
              nextState ? "activated" : "removed from LLM"
            })`
          );
          return { ...item, enabled: nextState };
        }
        return item;
      })
    );
  };

  // Toggle individual tool permission (Allowlist control)
  const handleToggleTool = (itemId: string, toolId: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedTools = item.tools.map((t) => {
            if (t.id === toolId) {
              const nextState = !t.enabled;
              showToast(
                `Tool '${t.name}' ${nextState ? "allowed" : "blocked (excluded from LLM allowlist)"}`
              );
              return { ...t, enabled: nextState };
            }
            return t;
          });
          return { ...item, tools: updatedTools };
        }
        return item;
      })
    );
  };

  // Test MCP connection simulation
  const handleTestMcp = (item: IntegrationItem) => {
    setIsTestingMcp(true);
    setTestResult(null);

    window.setTimeout(() => {
      setIsTestingMcp(false);
      setTestResult(`✓ Active: Connected to ${item.mcpPackage || item.id} (latency 14ms)`);
      showToast(`Connection verified for ${item.name}`);
    }, 850);
  };

  // Reset tool permissions for an app
  const handleResetPermissions = (item: IntegrationItem) => {
    const original = INITIAL_INTEGRATIONS.find((i) => i.id === item.id);
    if (!original) return;

    setIntegrations((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, tools: [...original.tools] } : i))
    );
    showToast(`Permissions reset to defaults for ${item.name}`);
  };

  // Trigger PC scan modal
  const handleStartScan = () => {
    setIsScanModalOpen(true);
    setIsScanning(true);

    // Simulate scanning Windows Registry & Start Menu
    window.setTimeout(() => {
      setIsScanning(false);
    }, 1100);
  };

  // Toggle selection in the discovery modal
  const handleToggleDiscoveredApp = (appId: string) => {
    setDiscoveredApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, selected: !app.selected } : app))
    );
  };

  // Import selected discovered apps into the grid
  const handleImportSelectedApps = () => {
    const selected = discoveredApps.filter((a) => a.selected);
    if (selected.length === 0) {
      setIsScanModalOpen(false);
      return;
    }

    setIntegrations((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const nextList = [...prev];

      selected.forEach((app) => {
        if (!existingIds.has(app.id)) {
          // Add as new integration
          const seed = INITIAL_INTEGRATIONS.find((i) => i.id === app.id);
          if (seed) {
            nextList.push({ ...seed, enabled: true });
          } else {
            nextList.push({
              id: app.id,
              type: "app",
              name: app.name,
              category: app.category,
              description: `Imported application located at ${app.detectedPath}`,
              iconId: app.iconId,
              installed: true,
              enabled: true,
              path: app.detectedPath,
              version: app.version,
              mcpPackage: `rufus-mcp-${app.id}`,
              mcpStatus: "ready",
              tools: [
                {
                  id: `${app.id}.launch`,
                  name: `Launch ${app.name}`,
                  description: `Open or bring ${app.name} window to focus.`,
                  enabled: true,
                  dangerLevel: "safe",
                  actionKey: app.id,
                },
              ],
            });
          }
        } else {
          // Re-enable existing
          const idx = nextList.findIndex((i) => i.id === app.id);
          if (idx !== -1) {
            nextList[idx] = { ...nextList[idx], enabled: true };
          }
        }
      });

      return nextList;
    });

    setIsScanModalOpen(false);
    showToast(`Successfully connected ${selected.length} applications from your PC.`);
  };

  // Add custom manual app
  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAppName.trim()) return;

    const newId = `custom-${customAppName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
    const newItem: IntegrationItem = {
      id: newId,
      type: "app",
      name: customAppName.trim(),
      category: customAppCategory,
      description: `Custom desktop application (${customAppPath.trim() || "Executable"})`,
      iconId: "app",
      installed: true,
      enabled: true,
      path: customAppPath.trim() || "C:\\Program Files\\" + customAppName.trim(),
      mcpPackage: `rufus-custom-${newId}`,
      mcpStatus: "ready",
      tools: [
        {
          id: `${newId}.launch`,
          name: `Launch ${customAppName.trim()}`,
          description: `Open ${customAppName.trim()} application from verified path.`,
          enabled: true,
          dangerLevel: "safe",
          actionKey: newId,
        },
      ],
    };

    setIntegrations((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setCustomAppName("");
    setCustomAppPath("");
    setSelectedItemId(newId);
    showToast(`Added custom application: ${newItem.name}`);
  };

  return (
    <div className="apps-skills-container">
      {/* =========================================================================
          TOP HEADER CLUSTER (Heading + Controls Bar + Divider)
          ========================================================================= */}
      <div className="apps-top-header">
        {/* Row 1: Heading */}
        <div className="apps-heading-row">
          <h1 className="apps-main-heading">Apps & Skills</h1>
          <span className="apps-status-summary">
            {activeCount} Active • {disabledCount} Disabled
          </span>
        </div>

        {/* Row 2: Controls Bar: Segmented Tabs on Left, Search + Actions on Right */}
        <div className="apps-controls-bar">
          {/* Left: Segmented Tabs */}
          <div className="apps-segmented-tabs">
            <button
              type="button"
              className={`apps-segment-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
              <span className="apps-segment-count">{totalCount}</span>
            </button>
            <button
              type="button"
              className={`apps-segment-btn ${activeTab === "apps" ? "active" : ""}`}
              onClick={() => setActiveTab("apps")}
            >
              Apps
              <span className="apps-segment-count">{appsCount}</span>
            </button>
            <button
              type="button"
              className={`apps-segment-btn ${activeTab === "skills" ? "active" : ""}`}
              onClick={() => setActiveTab("skills")}
            >
              Skills
              <span className="apps-segment-count">{skillsCount}</span>
            </button>
          </div>

          {/* Right: Search Pill + Refresh (Scan) + Add Custom Button */}
          <div className="apps-controls-right">
            {/* Search Pill */}
            <div className="apps-search-pill">
              <div className="apps-search-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="apps-search-input"
                placeholder="Search apps, skills, or tools... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="apps-clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              ) : (
                <span className="apps-shortcut-badge">/</span>
              )}
            </div>

            {/* Refresh / Scan PC Button */}
            <button
              type="button"
              className="apps-action-btn apps-scan-btn"
              onClick={handleStartScan}
              title="Scan Windows for installed apps"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span className="apps-btn-label">Scan PC</span>
            </button>

            {/* Add Custom App Button */}
            <button
              type="button"
              className="apps-action-btn apps-add-btn"
              onClick={() => setIsAddModalOpen(true)}
              title="Add custom app or executable"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="apps-btn-label">Add App</span>
            </button>
          </div>
        </div>

        {/* Faded Divider */}
        <div className="apps-faded-divider" />
      </div>

      {/* =========================================================================
          MAIN WORKSPACE: CARDS GRID + RIGHT SLIDE-OVER INSPECTOR
          ========================================================================= */}
      <div className="apps-workspace">
        {/* Cards Grid */}
        <div className={`apps-grid-scroll-area ${selectedItem ? "has-drawer-open" : ""}`}>
          {filteredIntegrations.length === 0 ? (
            <div className="apps-empty-state">
              <div className="apps-empty-icon">🔍</div>
              <h3 className="apps-empty-title">No matching integrations found</h3>
              <p className="apps-empty-desc">
                Try searching for another term or click <strong>Scan PC</strong> to auto-detect apps installed on Windows.
              </p>
              <button
                type="button"
                className="apps-empty-scan-btn"
                onClick={handleStartScan}
              >
                Scan Installed Windows Apps
              </button>
            </div>
          ) : (
            <div className="apps-cards-grid">
              {filteredIntegrations.map((item) => {
                const isSelected = item.id === selectedItemId;
                const activeTools = item.tools.filter((t) => t.enabled).length;
                const totalTools = item.tools.length;
                const hasDisabledTools = activeTools < totalTools;

                return (
                  <div
                    key={item.id}
                    className={`app-card ${isSelected ? "selected" : ""} ${
                      !item.enabled ? "disabled" : ""
                    }`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    {/* Top Row: App Icon + Status Dot + Quick Master Toggle */}
                    <div className="app-card-header">
                      <div className="app-card-icon-wrap" style={{ borderColor: item.brandColor || "#00f0ff" }}>
                        <AppIcon iconId={item.iconId} size={24} brandColor={item.brandColor} />
                      </div>

                      <div className="app-card-header-right">
                        <span className={`app-status-badge ${item.enabled ? "active" : "inactive"}`}>
                          <span className="app-status-dot" />
                          {item.enabled ? "Active" : "Disabled"}
                        </span>

                        {/* Apple-style Master Switch */}
                        <div
                          className={`apple-toggle ${item.enabled ? "on" : "off"}`}
                          onClick={(e) => handleToggleMaster(item.id, e)}
                          title={`${item.enabled ? "Disable" : "Enable"} ${item.name}`}
                        >
                          <div className="apple-toggle-knob" />
                        </div>
                      </div>
                    </div>

                    {/* Middle: Title & Category Pill */}
                    <div className="app-card-title-group">
                      <h3 className="app-card-title">{item.name}</h3>
                      <span className="app-card-category-pill">{item.category}</span>
                    </div>

                    {/* Description */}
                    <p className="app-card-desc" title={item.description}>
                      {item.description}
                    </p>

                    {/* Footer: Capabilities / Tools Count & Settings Hint */}
                    <div className="app-card-footer">
                      <div className="app-card-tools-count">
                        <span className="tools-count-icon">⚡</span>
                        <span className="tools-count-text">
                          {activeTools}/{totalTools} tools active
                        </span>
                        {hasDisabledTools && item.enabled && (
                          <span className="tools-warning-pill" title="Some tools excluded from LLM">
                            Restricted
                          </span>
                        )}
                      </div>

                      <span className="app-card-click-hint">Inspect ›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT SLIDE-OVER INSPECTOR DRAWER
            ========================================================================= */}
        {selectedItem && (
          <aside className="apps-inspector-drawer">
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-header-left">
                <div
                  className="drawer-icon-wrap"
                  style={{ borderColor: selectedItem.brandColor || "#00f0ff" }}
                >
                  <AppIcon iconId={selectedItem.iconId} size={28} brandColor={selectedItem.brandColor} />
                </div>
                <div className="drawer-title-group">
                  <h2 className="drawer-title">{selectedItem.name}</h2>
                  <div className="drawer-meta-badges">
                    <span className="drawer-type-pill">{selectedItem.type.toUpperCase()}</span>
                    <span className="drawer-category-pill">{selectedItem.category}</span>
                    {selectedItem.version && (
                      <span className="drawer-version-pill">v{selectedItem.version}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedItemId(null)}
                title="Close panel (Esc)"
              >
                ✕
              </button>
            </div>

            <div className="drawer-content-scroll">
              {/* Master App State Banner */}
              <div className={`drawer-master-banner ${selectedItem.enabled ? "active" : "disabled"}`}>
                <div className="master-banner-info">
                  <span className="master-banner-status">
                    {selectedItem.enabled ? "Integration Enabled" : "Integration Disabled"}
                  </span>
                  <span className="master-banner-sub">
                    {selectedItem.enabled
                      ? "Rufus has permission to query and utilize approved tools."
                      : "Completely excluded from the AI agent and tool router."}
                  </span>
                </div>
                <div
                  className={`apple-toggle large ${selectedItem.enabled ? "on" : "off"}`}
                  onClick={() => handleToggleMaster(selectedItem.id)}
                >
                  <div className="apple-toggle-knob" />
                </div>
              </div>

              {/* MCP / System Metadata Card */}
              <div className="drawer-section-card">
                <h4 className="drawer-section-label">Architecture & Endpoint</h4>

                {selectedItem.path && (
                  <div className="drawer-info-row">
                    <span className="info-row-label">Windows Path</span>
                    <span className="info-row-value mono" title={selectedItem.path}>
                      {selectedItem.path}
                    </span>
                  </div>
                )}

                <div className="drawer-info-row">
                  <span className="info-row-label">MCP Server</span>
                  <span className="info-row-value mono">
                    {selectedItem.mcpPackage || `rufus-${selectedItem.id}`}
                  </span>
                </div>

                <div className="drawer-info-row">
                  <span className="info-row-label">Agent Protocol</span>
                  <span className="info-row-badge-ready">
                    <span className="ready-dot" /> Connected & Active
                  </span>
                </div>
              </div>

              {/* Tool Permissions & Allowlist Controls */}
              <div className="drawer-tools-section">
                <div className="tools-section-header">
                  <div>
                    <h4 className="drawer-section-label">Model Tool Permissions (Allowlist)</h4>
                    <p className="tools-section-sub">
                      Control which actions Rufus is permitted to call. Disabled actions are stripped from model prompts.
                    </p>
                  </div>
                </div>

                <div className="tools-permission-list">
                  {selectedItem.tools.map((tool) => {
                    return (
                      <div
                        key={tool.id}
                        className={`tool-permission-card ${tool.enabled ? "allowed" : "denied"} ${
                          !selectedItem.enabled ? "parent-disabled" : ""
                        }`}
                      >
                        <div className="tool-card-main">
                          <div className="tool-card-header">
                            <span className="tool-card-name">{tool.name}</span>
                            <span className={`tool-danger-pill ${tool.dangerLevel}`}>
                              {tool.dangerLevel}
                            </span>
                          </div>

                          <span className="tool-card-action-key mono">
                            action: {tool.actionKey}
                          </span>

                          <p className="tool-card-description">{tool.description}</p>
                        </div>

                        {/* Toggle switch for individual tool */}
                        <div className="tool-card-toggle-wrap">
                          <div
                            className={`apple-toggle ${tool.enabled && selectedItem.enabled ? "on" : "off"}`}
                            onClick={() => handleToggleTool(selectedItem.id, tool.id)}
                            title={
                              tool.enabled
                                ? "Disable this specific action"
                                : "Allow Rufus to invoke this action"
                            }
                          >
                            <div className="apple-toggle-knob" />
                          </div>
                          <span className="tool-toggle-status-label">
                            {tool.enabled && selectedItem.enabled ? "Allowed" : "Blocked"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="drawer-footer">
              <div className="drawer-footer-actions">
                <button
                  type="button"
                  className="drawer-test-btn"
                  onClick={() => handleTestMcp(selectedItem)}
                  disabled={isTestingMcp}
                >
                  {isTestingMcp ? (
                    <>
                      <span className="drawer-spinner" /> Testing MCP...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Test Server Connection
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="drawer-reset-btn"
                  onClick={() => handleResetPermissions(selectedItem)}
                  title="Reset all tools to default states"
                >
                  Reset Defaults
                </button>
              </div>

              {testResult && <div className="drawer-test-result">{testResult}</div>}
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          STEAM-STYLE "SCAN PC" AUTO-DETECTION MODAL
          ========================================================================= */}
      {isScanModalOpen && (
        <div className="apps-modal-overlay" onClick={() => setIsScanModalOpen(false)}>
          <div className="apps-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>

              <div className="modal-title-group">
                <h3 className="modal-title">Detected Windows Applications</h3>
                <p className="modal-subtitle">
                  Steam-style auto-discovery querying Windows Registry & Start Menu shortcuts.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsScanModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {isScanning ? (
                <div className="modal-scanning-view">
                  <div className="scanning-radar-ring" />
                  <p className="scanning-text">Scanning HKLM & HKCU Registry keys for installed software...</p>
                </div>
              ) : (
                <div className="modal-apps-list">
                  <div className="modal-list-header">
                    <span className="modal-list-count">
                      {discoveredApps.length} applications identified on your machine
                    </span>
                    <button
                      type="button"
                      className="modal-select-all-btn"
                      onClick={() =>
                        setDiscoveredApps((prev) =>
                          prev.map((a) => ({ ...a, selected: true }))
                        )
                      }
                    >
                      Select All
                    </button>
                  </div>

                  <div className="modal-items-scroll">
                    {discoveredApps.map((app) => (
                      <div
                        key={app.id}
                        className={`discovered-app-row ${app.selected ? "selected" : ""}`}
                        onClick={() => handleToggleDiscoveredApp(app.id)}
                      >
                        <input
                          type="checkbox"
                          className="discovered-checkbox"
                          checked={app.selected}
                          onChange={() => handleToggleDiscoveredApp(app.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="discovered-icon">
                          <AppIcon iconId={app.iconId} size={22} />
                        </div>

                        <div className="discovered-meta">
                          <div className="discovered-name-row">
                            <span className="discovered-name">{app.name}</span>
                            <span className="discovered-category">{app.category}</span>
                            {app.version && (
                              <span className="discovered-ver">v{app.version}</span>
                            )}
                          </div>
                          <span className="discovered-path mono" title={app.detectedPath}>
                            {app.detectedPath}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="modal-selected-summary">
                {discoveredApps.filter((a) => a.selected).length} apps selected for integration
              </span>

              <div className="modal-actions-right">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsScanModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleImportSelectedApps}
                  disabled={isScanning}
                >
                  Connect Selected Apps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD CUSTOM APP MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="apps-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="apps-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddCustomApp}>
              <div className="modal-header">
                <div className="modal-header-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>

                <div className="modal-title-group">
                  <h3 className="modal-title">Add Custom Application</h3>
                  <p className="modal-subtitle">
                    Register a local executable or URI protocol into Rufus's secure allowlist.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body custom-app-form">
                <div className="form-field">
                  <label className="form-label">Application Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Obsidian, Postman, Blender"
                    value={customAppName}
                    onChange={(e) => setCustomAppName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Executable Path or Protocol</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="C:\Users\...\app.exe or obsidian://"
                    value={customAppPath}
                    onChange={(e) => setCustomAppPath(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={customAppCategory}
                    onChange={(e) => setCustomAppCategory(e.target.value)}
                  >
                    <option value="Productivity">Productivity</option>
                    <option value="Development">Development</option>
                    <option value="Media">Media</option>
                    <option value="Messaging">Messaging</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-actions-right" style={{ marginLeft: "auto" }}>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-primary-btn">
                    Register App
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="apps-floating-toast">
          <span className="toast-dot" />
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
