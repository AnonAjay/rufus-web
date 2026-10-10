import { useState, useCallback } from "react";
import { ChatMessage, AgentChatResponse } from "../types/agent";

const API_BASE_URL = "http://127.0.0.1:8000";

export const useAgentChat = (initialSessionId: string = "rufus-desktop-session") => {
  const [sessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "rufus",
      text: "Woof! I'm Rufus, your desktop companion. Ask me to open apps, search terms, or control Spotify.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/agent/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: text.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Server responded with status ${response.status}`
          );
        }

        const data: AgentChatResponse = await response.json();

        const rufusMsg: ChatMessage = {
          id: `rufus-${Date.now()}`,
          sender: "rufus",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: data.actions,
          modelUsed: data.model_used,
        };

        setMessages((prev) => [...prev, rufusMsg]);
      } catch (err: any) {
        const errMsg = err?.message || "Failed to connect to Rufus backend.";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "rufus",
            text: `[Error: ${errMsg}] Make sure the backend is running at ${API_BASE_URL}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sessionId,
  };
};
