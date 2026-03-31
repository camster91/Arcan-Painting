"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Plus,
  ArrowLeft,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  MessageSquare,
  Star,
  Send,
  Calendar,
  Layout,
  ExternalLink,
} from "lucide-react";

export default function GoogleBusinessPage() {
  const [connected, setConnected] = useState(null); // null = loading, false, true, 'setup_required'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [insights, setInsights] = useState([]);
  const [toast, setToast] = useState(null);

  // Setup state
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({
    text: "",
    callToAction: "LEARN_MORE",
  });
  const [posting, setPosting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/google-business");
      const data = await res.json();

      if (res.ok) {
        if (data.code === "NO_LOCATION") {
          setConnected("setup_required");
          loadAccounts();
        } else {
          setConnected(true);
          setLocation(data.locationName);
          setReviews(data.reviews || []);
          setInsights(data.insights || []);
        }
      } else {
        setConnected(false);
      }
    } catch (err) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      setSetupLoading(true);
      const res = await fetch("/api/marketing/google-business?action=listAccounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      showToast("Failed to load Google accounts", "error");
    } finally {
      setSetupLoading(false);
    }
  };

  const loadLocations = async (accountName) => {
    try {
      setSetupLoading(true);
      setSelectedAccount(accountName);
      const res = await fetch(`/api/marketing/google-business?action=listLocations&accountName=${accountName}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      showToast("Failed to load locations", "error");
    } finally {
      setSetupLoading(false);
    }
  };

  const connectLocation = async (loc) => {
    try {
      setSetupLoading(true);
      const res = await fetch("/api/marketing/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connectLocation",
          locationName: loc.name,
          metadata: { title: loc.title }
        })
      });
      if (res.ok) {
        showToast(`Connected to ${loc.title}`);
        loadStatus();
      }
    } catch (err) {
      showToast("Failed to connect location", "error");
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postForm.text) return;
    setPosting(true);
    try {
      const res = await fetch("/api/marketing/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPost",
          locationName: location,
          text: postForm.text,
          callToAction: { type: postForm.callToAction, url: "https://arcanpainting.ca" }
        })
      });
      if (res.ok) {
        showToast("Post created successfully!");
        setShowPostForm(false);
        setPostForm({ text: "", callToAction: "LEARN_MORE" });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create post", "error");
      }
    } catch (err) {
      showToast("Failed to create post", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (reviewName) => {
    if (!replyText) return;
    setReplyingTo(reviewName);
    try {
      const res = await fetch("/api/marketing/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "replyReview",
          reviewName,
          replyText
        })
      });
      if (res.ok) {
        showToast("Reply posted!");
        setReplyingTo(null);
        setReplyText("");
        loadStatus(); // refresh reviews
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to post reply", "error");
      }
    } catch (err) {
      showToast("Failed to post reply", "error");
    } finally {
      setReplyingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (connected === "setup_required") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connect Google Business</h1>
                <p className="text-gray-500">Select your business location to continue</p>
              </div>
            </div>

            {setupLoading && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}

            {!setupLoading && accounts.length > 0 && !selectedAccount && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Select Google Account:</h3>
                {accounts.map(acc => (
                  <button
                    key={acc.name}
                    onClick={() => loadLocations(acc.name)}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{acc.accountName}</p>
                      <p className="text-sm text-gray-500">{acc.type}</p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-500 rotate-180" />
                  </button>
                ))}
              </div>
            )}

            {!setupLoading && locations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Select Business Location:</h3>
                  <button onClick={() => setSelectedAccount("")} className="text-xs text-blue-500">Change Account</button>
                </div>
                {locations.map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => connectLocation(loc)}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{loc.title}</p>
                      <p className="text-sm text-gray-500">{loc.name}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            )}

            {!setupLoading && accounts.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-600">No Google Business accounts found. Make sure you have access to a GBP listing.</p>
                <a href="/api/marketing/google/connect" className="mt-4 inline-block text-blue-500 hover:underline">Reconnect Google Account</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate some quick stats from insights
  const getMetricValue = (metricType) => {
    const series = insights.find(s => s.dailyMetric === metricType);
    if (!series) return 0;
    return series.dailyMetricTimeSeries.reduce((sum, p) => sum + (parseInt(p.value) || 0), 0);
  };

  const searchImpressions = getMetricValue("BUSINESS_IMPRESSIONS_MOBILE_SEARCH") + getMetricValue("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
  const websiteClicks = getMetricValue("BUSINESS_CONVERSIONS_WEBSITE");
  const calls = getMetricValue("BUSINESS_CONVERSIONS_CALLS");

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Google Business</h1>
                <p className="text-sm text-gray-500">Reviews, insights, and local posts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadStatus()}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </button>
              <button
                onClick={() => setShowPostForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <Eye className="w-4 h-4" /> SEARCH IMPRESSIONS (30D)
            </div>
            <div className="text-2xl font-bold text-gray-900">{searchImpressions.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <ExternalLink className="w-4 h-4" /> WEBSITE CLICKS
            </div>
            <div className="text-2xl font-bold text-gray-900">{websiteClicks.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <MessageSquare className="w-4 h-4" /> CALLS FROM MAPS
            </div>
            <div className="text-2xl font-bold text-gray-900">{calls.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <Star className="w-4 h-4" /> AVG. RATING
            </div>
            <div className="text-2xl font-bold text-gray-900">4.9</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Recent Reviews
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
                No reviews found yet.
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                        {review.reviewer.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{review.reviewer.displayName}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < (review.starRating === 'FIVE' ? 5 : 4) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                          ))}
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(review.createTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    {review.comment || <span className="italic text-gray-400">No comment provided.</span>}
                  </p>

                  {review.reviewReply ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                      <p className="text-xs font-bold text-blue-800 mb-1">Your Reply:</p>
                      <p className="text-sm text-blue-900">{review.reviewReply.comment}</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      {replyingTo === review.name ? (
                        <div className="space-y-3">
                          <textarea
                            autoFocus
                            placeholder="Write your reply..."
                            className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
                            <button
                              onClick={() => handleReply(review.name)}
                              className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg font-bold"
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.name)}
                          className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-700"
                        >
                          <Send className="w-3 h-3" />
                          Reply to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right Column: Actions & Quick Info */}
          <div className="space-y-6">
            {/* Create Post Form */}
            {showPostForm && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-500" />
                    New Local Post
                  </h3>
                  <button onClick={() => setShowPostForm(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handlePost} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Update Text</label>
                    <textarea
                      placeholder="What's new with Arcan Painting? Share a recent project or a tip..."
                      className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={5}
                      required
                      value={postForm.text}
                      onChange={(e) => setPostForm({ ...postForm, text: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button (CTA)</label>
                    <select
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                      value={postForm.callToAction}
                      onChange={(e) => setPostForm({ ...postForm, callToAction: e.target.value })}
                    >
                      <option value="LEARN_MORE">Learn More</option>
                      <option value="BOOK">Book Now</option>
                      <option value="CALL">Call Now</option>
                      <option value="SIGN_UP">Sign Up</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={posting}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {posting ? "Posting..." : "Publish to Google"}
                  </button>
                </form>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" />
                Review Tip
              </h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Responding to reviews within 24 hours improves your local SEO ranking and shows customers you care about their experience.
              </p>
              <div className="text-xs bg-white/20 rounded-lg p-3">
                <span className="font-bold">Fact:</span> Businesses that respond to reviews get 1.5x more views on Maps.
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Connection Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Platform</span>
                  <span className="font-medium text-gray-900">Google Business</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="flex items-center gap-1 text-green-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (confirm("Disconnect Google Business?")) {
                        setConnected("setup_required");
                        loadAccounts();
                      }
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Disconnect or Change Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
