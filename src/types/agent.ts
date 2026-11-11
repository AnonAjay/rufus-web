export interface ChatMessage {
  id: string;
  sender: 'user' | 'rufus';
  text: string;
  timestamp: string;
  actions?: string[];
  actionType?: 'speech' | 'action';
  confidence?: number;
  modelUsed?: string;
  accuracy?: string;
  authorization?: {
    id: string;
    task: string;
    risk: string;
    status: 'pending' | 'approved' | 'denied';
    initialExpiresInSeconds?: number;
  };
}

export interface AgentChatResponse {
  reply: string;
  model_used: string;
  action_type?: string;
  confidence?: number;
  actions: string[];
}

export interface AgentVoiceResponse {
  transcript: string;
  reply_text: string;
  model_used: string;
  action_type?: string;
  confidence?: number;
  audio_base64: string;
  audio_mime_type: string;
  actions: string[];
}

export interface SystemStatus {
  backendOnline: boolean;
  ollamaOnline: boolean;
  lastChecked: string;
}

export interface SessionItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  synced: number;
  message_count?: number;
  last_message?: string;
  last_model?: string;
}
