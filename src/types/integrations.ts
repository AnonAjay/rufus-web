export type IntegrationType = "app" | "skill";

export type DangerLevel = "safe" | "moderate" | "critical";

export type McpStatus = "ready" | "needs-auth" | "connecting" | "offline";

export interface ToolPermission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  dangerLevel: DangerLevel;
  actionKey: string;
}

export interface IntegrationItem {
  id: string;
  type: IntegrationType;
  name: string;
  category: string;
  description: string;
  iconId: string;
  brandColor?: string;
  installed: boolean;
  enabled: boolean;
  version?: string;
  path?: string;
  mcpPackage?: string;
  mcpStatus?: McpStatus;
  tools: ToolPermission[];
}

export interface DiscoveredApp {
  id: string;
  name: string;
  category: string;
  detectedPath: string;
  publisher?: string;
  version?: string;
  iconId: string;
  selected: boolean;
}
