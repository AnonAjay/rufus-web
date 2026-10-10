export interface ChatMessage {
  id: string;
  sender: 'user' | 'rufus';
  text: string;
  timestamp: string;
  actions?: string[];
  modelUsed?: string;
}

export interface AgentChatResponse {
  reply: string;
  model_used: string;
  actions: string[];
}

export interface SystemStatus {
  backendOnline: boolean;
  ollamaOnline: boolean;
  lastChecked: string;
}
