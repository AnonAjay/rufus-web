import React from "react";
import { ChatMessage } from "../../types/agent";
import { ActionBadge } from "../common/ActionBadge";

export interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <div className={`chat-bubble-row ${isUser ? "user" : "rufus"}`}>
      <div className={`chat-bubble ${isUser ? "user" : "rufus"}`}>
        <div className="chat-bubble-header">
          <span className="chat-sender-name">{isUser ? "You" : "Rufus"}</span>
          <span className="chat-timestamp">{message.timestamp}</span>
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="chat-actions-container">
            {message.actions.map((act, index) => (
              <ActionBadge key={index} action={act} />
            ))}
          </div>
        )}

        <div className="chat-text">{message.text}</div>

        {!isUser && message.modelUsed && (
          <div className="chat-model-tag">{message.modelUsed}</div>
        )}
      </div>
    </div>
  );
};
