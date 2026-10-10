import { useState, useCallback } from "react";
import { ChatMessage, AgentChatResponse, AgentVoiceResponse } from "../types/agent";

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

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (!audioBlob || audioBlob.size === 0) return;
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("audio_file", audioBlob, "voice.webm");

        const response = await fetch(`${API_BASE_URL}/agent/voice`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server error: ${response.status}`);
        }

        const data: AgentVoiceResponse = await response.json();
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: "user",
          text: data.transcript || "[Unintelligible audio]",
          timestamp: timeStr,
        };

        const rufusMsg: ChatMessage = {
          id: `rufus-${Date.now()}`,
          sender: "rufus",
          text: data.reply_text,
          timestamp: timeStr,
          actions: data.actions,
          modelUsed: data.model_used,
        };

        setMessages((prev) => [...prev, userMsg, rufusMsg]);

        // In-memory playback of Piper TTS speech
        if (data.audio_base64 && data.audio_mime_type) {
          try {
            const audio = new Audio(`data:${data.audio_mime_type};base64,${data.audio_base64}`);
            audio.play().catch((playErr) => console.warn("Audio autoplay blocked:", playErr));
          } catch (err) {
            console.warn("Audio element playback error:", err);
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || "Failed to process voice request.";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "rufus",
            text: `[Voice Error: ${errMsg}]`,
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
    sendVoiceMessage,
    sessionId,
  };
};
