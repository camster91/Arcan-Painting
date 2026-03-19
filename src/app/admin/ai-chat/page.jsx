"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Send, Trash2, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAdminChat } from "@/hooks/useAdminChat";

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy response"
      className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-600 transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const isError = msg.isError;

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 mb-4">
        <div className="max-w-[75%]">
          <div className="bg-amber-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {msg.content}
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant / system message
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 mt-1">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${
            isError ? "bg-red-900" : "bg-slate-700"
          }`}
        >
          {isError ? (
            <AlertCircle size={14} className="text-red-400" />
          ) : (
            <Bot size={14} className="text-amber-400" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed ${
            isError
              ? "bg-red-950 border border-red-800 text-red-300"
              : "bg-slate-700 text-slate-100"
          }`}
        >
          {isError ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-code:text-amber-300 prose-a:text-amber-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
          {!isError && !msg.isSystem && (
            <CopyButton text={msg.content} />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
          <Bot size={14} className="text-amber-400" />
        </div>
      </div>
      <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
        <Loader2 size={14} className="text-amber-400 animate-spin" />
        <span className="text-sm text-slate-400">Thinking…</span>
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "How many open leads do I have?",
  "What projects are in progress?",
  "Show me overdue invoices",
  "How do I create an estimate?",
];

export default function AIChatPage() {
  const { chatHistory, loading, sendMessage, clearChat } = useAdminChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    await sendMessage(msg);
    inputRef.current?.focus();
  }, [input, loading, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestion = useCallback(
    (prompt) => {
      if (loading) return;
      sendMessage(prompt);
    },
    [loading, sendMessage]
  );

  const handleClear = useCallback(() => {
    if (showClearConfirm) {
      clearChat();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  }, [clearChat, showClearConfirm]);

  const isOnlyWelcome = chatHistory.length === 1 && chatHistory[0].id === "welcome";

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-9rem)] bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center shadow">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-slate-400">Powered by OpenClaw</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          title={showClearConfirm ? "Click again to confirm" : "Clear chat"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showClearConfirm
              ? "bg-red-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <Trash2 size={13} />
          {showClearConfirm ? "Confirm clear" : "Clear"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {chatHistory.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts — show only when chat is fresh */}
      {isOnlyWelcome && !loading && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestion(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Arcan Painting…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 transition-all"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
