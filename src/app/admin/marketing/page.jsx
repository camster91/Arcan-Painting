"use client";

import { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Link2,
  Bot,
  Send,
  Plus,
  Unplug,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Mail,
  Users,
  ExternalLink,
  RefreshCw,
  MapPin,
} from "lucide-react";

const PLATFORMS = [
  {
    id: "google",
    name: "Google",
    description: "Google Ads, Business Profile, Gmail",
    color: "bg-blue-500",
    connectUrl: "/api/marketing/google/connect",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Facebook & Instagram Ads",
    color: "bg-indigo-500",
    connectUrl: "/api/marketing/facebook/connect",
  },
  {
    id: "gemini_api",
    name: "Gemini AI",
    description: "Connect your Gemini API Key",
    color: "bg-blue-600",
    isApiKey: true,
  },
  {
    id: "openai_api",
    name: "ChatGPT (OpenAI)",
    description: "Connect your OpenAI API Key",
    color: "bg-green-600",
    isApiKey: true,
  },
  {
    id: "ollama_cloud",
    name: "Ollama Cloud",
    description: "Connect your Ollama endpoint",
    color: "bg-teal-600",
    isApiKey: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "LinkedIn outreach & ads",
    color: "bg-sky-700",
    connectUrl: null,
  },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // API Key modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiEmailInput, setApiEmailInput] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // URL params for connection feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      const platform = params.get("connected");
      showToast(`Successfully connected ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, "success");
      fetchConnections();
    }
    if (params.get("error")) {
      const errorCode = params.get("error");
      const messages = {
        google_auth_failed: "Google authentication was cancelled or failed.",
        google_token_failed: "Failed to complete Google connection. Please try again.",
      };
      showToast(messages[errorCode] || `Connection error: ${errorCode}`, "error");
    }
    // Clean URL params
    if (params.toString()) {
      window.history.replaceState({}, "", "/admin/marketing");
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await fetch("/api/marketing/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (e) {
      console.error("Error fetching connections:", e);
    } finally {
      setLoadingConnections(false);
    }
  };

  const disconnectPlatform = async (platform) => {
    try {
      await fetch("/api/marketing/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      fetchConnections();
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
  };

  const saveApiKey = async () => {
    if (!apiKeyInput.trim() || savingApiKey) return;
    try {
      setSavingApiKey(true);
      const res = await fetch("/api/marketing/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          apiKey: apiKeyInput.trim(),
          accountEmail: apiEmailInput.trim(),
        }),
      });
      if (res.ok) {
        showToast(`${selectedPlatform.name} key saved successfully!`);
        setShowApiKeyModal(false);
        setApiKeyInput("");
        setApiEmailInput("");
        fetchConnections();
      }
    } catch (e) {
      showToast("Failed to save API key", "error");
    } finally {
      setSavingApiKey(false);
    }
  };

  const getConnectionStatus = (platformId) => {
    const conn = connections.find(
      (c) => c.platform === platformId && c.is_active
    );
    return conn || null;
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/marketing/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          conversationHistory: chatMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        const err = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${err.error || "Something went wrong. Please try again."}`,
          },
        ]);
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "connections", label: "Connections", icon: Link2 },
    { id: "ai", label: "AI Assistant", icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Marketing</h1>
              <p className="text-sm text-gray-500">
                Manage campaigns, connections & AI assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/marketing/ai-assistant"
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Bot className="w-4 h-4" />
              Full AI Assistant
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={fetchConnections}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`bg-white rounded-xl p-5 ${
                connections.filter((c) => c.is_active).length === 0
                  ? "border border-dashed border-blue-300"
                  : "border border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Connected Platforms
                  </span>
                </div>
                {connections.filter((c) => c.is_active).length > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {connections.filter((c) => c.is_active).length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      of {PLATFORMS.length} available
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Get started
                    </p>
                    <button
                      onClick={() => setActiveTab("connections")}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Connect Google to unlock ads, posts & AI &rarr;
                    </button>
                  </>
                )}
              </div>

              <div className="bg-white rounded-xl border border-dashed border-green-300 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Email Sequences
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Automated follow-ups
                </p>
                <p className="text-xs text-gray-400">
                  Send drip emails to property managers and realtors automatically. Coming soon!
                </p>
              </div>

              <div className="bg-white rounded-xl border border-dashed border-purple-300 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Outreach Contacts
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Find new clients nearby
                </p>
                <p className="text-xs text-gray-400">
                  Discover property managers and realtors in the GTA to grow your network. Coming soon!
                </p>
              </div>
            </div>

            {/* Marketing Dashboards */}
            {(getConnectionStatus("google") || getConnectionStatus("facebook")) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Active Dashboards
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getConnectionStatus("google") && (
                    <>
                      <a
                        href="/admin/marketing/google-ads"
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                            <BarChart3 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Google Ads</p>
                            <p className="text-xs text-gray-500">Manage search & display campaigns</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </a>
                      <a
                        href="/admin/marketing/google-business"
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Google Business</p>
                            <p className="text-xs text-gray-500">Manage reviews, posts & Map SEO</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </a>
                    </>
                  )}
                  {getConnectionStatus("facebook") && (
                    <a
                      href="/admin/marketing/facebook"
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                          <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Facebook Ads</p>
                          <p className="text-xs text-gray-500">Manage FB & IG ad campaigns</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab("connections")}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <Link2 className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Connect a Platform
                    </p>
                    <p className="text-xs text-gray-500">
                      Google, Facebook, LinkedIn
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("ai");
                    setChatInput(
                      "Help me write a Google Business post about our spring painting specials"
                    );
                  }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <Bot className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      AI Marketing Assistant
                    </p>
                    <p className="text-xs text-gray-500">
                      Write posts, ads, emails
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("ai");
                    setChatInput(
                      "Draft an email outreach sequence for real estate agents in the GTA"
                    );
                  }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <Mail className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Outreach
                    </p>
                    <p className="text-xs text-gray-500">
                      Target real estate agents
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === "connections" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Platform Connections
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Connect your marketing platforms to manage campaigns and track
                performance.
              </p>

              <div className="space-y-3">
                {PLATFORMS.map((platform) => {
                  const conn = getConnectionStatus(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}
                        >
                          {platform.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {platform.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conn
                              ? `Connected as ${conn.account_email || conn.account_name || "Unknown"}`
                              : platform.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {conn ? (
                          <>
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Connected
                            </span>
                            <button
                              onClick={() =>
                                disconnectPlatform(platform.id)
                              }
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
                            >
                              <Unplug className="w-3 h-3" />
                              Disconnect
                            </button>
                          </>
                        ) : platform.isApiKey ? (
                          <button
                            onClick={() => {
                              setSelectedPlatform(platform);
                              setShowApiKeyModal(true);
                            }}
                            className="flex items-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Connect API
                          </button>
                        ) : platform.connectUrl ? (
                          <a
                            href={platform.connectUrl}
                            className="flex items-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Connect
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                            Coming soon — we'll let you know!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === "ai" && (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Marketing AI Assistant
                  </h2>
                  <p className="text-xs text-gray-500">
                    Get help with posts, ads, emails, and marketing strategy
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-6">
                    Ask me anything about marketing your painting business
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Write a Google Business post",
                      "Draft a Facebook ad",
                      "Email template for property managers",
                      "SEO blog post ideas",
                      "How to set up Google Ads",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setChatInput(suggestion);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Ask about marketing, ads, social posts, emails..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Connect {selectedPlatform?.name}
              </h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  API Key or Endpoint
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Paste your ${selectedPlatform?.name} key here`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account Email (Optional)
                </label>
                <input
                  type="email"
                  value={apiEmailInput}
                  onChange={(e) => setApiEmailInput(e.target.value)}
                  placeholder="e.g. gerardo@arcanpainting.ca"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 p-3 rounded-lg">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                Your keys are stored securely in your private database and used only for marketing tasks.
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim() || savingApiKey}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {savingApiKey && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
