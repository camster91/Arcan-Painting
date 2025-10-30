"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Mail, Send, RefreshCw } from "lucide-react";

export default function EmailHealthPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState(
    "Test Email from Painting CRM",
  );
  const [testMessage, setTestMessage] = useState(
    "This is a test email to verify your email system is working correctly.",
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/email/health");
      const data = await response.json();
      setHealthStatus(data);
      setLastChecked(new Date());
    } catch (error) {
      setHealthStatus({
        ok: false,
        configured: false,
        message: "Failed to check email health: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestResult({
        success: false,
        message: "Please enter an email address",
      });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Test email sent successfully!",
          id: data.id,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to send test email",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error: " + error.message,
      });
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Email System Health
        </h1>
        <p className="text-gray-600">
          Monitor and test your email delivery system
        </p>
      </div>

      {/* Health Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            System Status
          </h2>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && !healthStatus ? (
          <div className="flex items-center gap-3 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Checking email system health...
          </div>
        ) : healthStatus ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {healthStatus.ok ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div
                  className={`font-medium ${healthStatus.ok ? "text-green-700" : "text-red-700"}`}
                >
                  {healthStatus.ok
                    ? "Email System Active"
                    : "Email System Issue"}
                </div>
                <div className="text-sm text-gray-600">
                  {healthStatus.message}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthStatus.configured ? "Yes" : "No"}
                </div>
                <div className="text-sm text-gray-600">API Key Configured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthStatus.domainsCount || "N/A"}
                </div>
                <div className="text-sm text-gray-600">Verified Domains</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {lastChecked ? lastChecked.toLocaleTimeString() : "N/A"}
                </div>
                <div className="text-sm text-gray-600">Last Checked</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Unable to check system status
          </div>
        )}
      </div>

      {/* Test Email Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Test Email
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send to Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={sendTestEmail}
            disabled={sendingTest || !healthStatus?.ok}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendingTest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test Email
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-md ${testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <div
                className={`flex items-center gap-2 ${testResult.success ? "text-green-700" : "text-red-700"}`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
              {testResult.id && (
                <div className="text-sm text-green-600 mt-1">
                  Email ID: {testResult.id}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert Section */}
      {healthStatus && !healthStatus.ok && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">
                Email System Alert
              </h3>
              <p className="text-red-700 text-sm mb-3">
                Your email system is not working properly. This may affect:
              </p>
              <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                <li>Customer notifications and receipts</li>
                <li>Estimate and contract delivery</li>
                <li>Password reset emails</li>
                <li>Team member invitations</li>
              </ul>
              <div className="mt-3">
                <a
                  href="/admin/settings"
                  className="text-red-800 underline text-sm font-medium hover:text-red-900"
                >
                  Check Settings → Secrets to configure RESEND API key
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
