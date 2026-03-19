import { useState, useCallback } from "react";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the Arcan Painting AI assistant. Ask me anything about leads, projects, estimates, invoices, clients, or how to use the admin dashboard.",
  timestamp: new Date().toISOString(),
  isSystem: true,
};

export function useAdminChat() {
  const [chatHistory, setChatHistory] = useState([WELCOME_MESSAGE]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (message) => {
      if (!message || !message.trim() || loading) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            ...(conversationId ? { conversationId } : {}),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get a response.");
        }

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMsg = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        setChatHistory((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: err.message || "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setChatHistory((prev) => [...prev, errMsg]);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [loading, conversationId]
  );

  const clearChat = useCallback(() => {
    setChatHistory([WELCOME_MESSAGE]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    chatHistory,
    loading,
    error,
    sendMessage,
    clearChat,
  };
}
