"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Mail, RefreshCw } from "lucide-react";

export default function EmailHealthWidget() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    try {
      const response = await fetch("/api/email/health");
      const data = await response.json();
      setHealthStatus(data);
      setError(null);
    } catch (err) {
      setError("Failed to check email health");
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check health every 10 minutes
    const interval = setInterval(checkHealth, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
          <div>
            <div className="font-medium text-slate-900">Email System</div>
            <div className="text-sm text-slate-600">Checking status...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !healthStatus) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <div className="font-medium text-red-900">Email System</div>
            <div className="text-sm text-red-600">
              {error || "Status unknown"}
            </div>
          </div>
          <a
            href="/admin/email"
            className="ml-auto text-sm text-red-700 underline hover:text-red-800"
          >
            Check
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border p-4 ${
        healthStatus.ok ? "border-green-200" : "border-red-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {healthStatus.ok ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        <div className="flex-1">
          <div
            className={`font-medium ${
              healthStatus.ok ? "text-green-900" : "text-red-900"
            }`}
          >
            Email System
          </div>
          <div
            className={`text-sm ${
              healthStatus.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {healthStatus.ok ? "Active" : "Issue detected"}
          </div>
        </div>
        <a
          href="/admin/email"
          className={`text-sm underline ${
            healthStatus.ok
              ? "text-green-700 hover:text-green-800"
              : "text-red-700 hover:text-red-800"
          }`}
        >
          {healthStatus.ok ? "Test" : "Fix"}
        </a>
      </div>
    </div>
  );
}
