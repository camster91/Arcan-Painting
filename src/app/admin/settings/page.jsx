"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Save,
  Image as ImageIcon,
  Percent,
  Settings,
  Building2,
  Paintbrush,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { SuccessNotification } from "@/components/admin/estimates/SuccessNotification";

function Section({ title, description, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [notification, setNotification] = useState(null);
  const queryClient = useQueryClient();
  const [upload, { loading: uploading }] = useUpload();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/settings, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      return json.settings || {};
    },
  });

  const settings = data || {};

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to save settings");
      }
      return json.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setNotification("Settings saved successfully");
    },
    onError: (e) => {
      console.error(e);
      alert(e.message);
    },
  });

  const tabs = useMemo(
    () => [
      { key: "company", label: "Company", icon: Building2 },
      { key: "rates", label: "Tax & Rates", icon: Percent },
      { key: "branding", label: "Branding", icon: ImageIcon },
      { key: "templates", label: "Templates", icon: Paintbrush },
    ],
    [],
  );

  const handleLogoUpload = async (file) => {
    try {
      const { url, error: uploadErr } = await upload({ file });
      if (uploadErr) throw new Error(uploadErr);
      await mutation.mutateAsync({ logo_url: url });
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-700 mb-2">
          <Settings size={18} />
          <span className="text-sm">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage company info, rates, branding, and templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 md:px-5 py-2.5 text-sm rounded-md whitespace-nowrap flex items-center gap-2 transition-colors ${
                  isActive
                    ? "bg-amber-500 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {/* Company */}
        {activeTab === "company" && (
          <Section
            title="Company"
            description="Basic information shown on estimates, invoices, and emails."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Company Name
                </label>
                <input
                  defaultValue={settings.company_name || ""}
                  onBlur={(e) =>
                    mutation.mutate({ company_name: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Company Email
                </label>
                <input
                  type="email"
                  defaultValue={settings.company_email || ""}
                  onBlur={(e) =>
                    mutation.mutate({ company_email: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  defaultValue={settings.company_phone || ""}
                  onBlur={(e) =>
                    mutation.mutate({ company_phone: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Address
                </label>
                <textarea
                  rows={3}
                  defaultValue={settings.company_address || ""}
                  onBlur={(e) =>
                    mutation.mutate({ company_address: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </Section>
        )}

        {/* Rates */}
        {activeTab === "rates" && (
          <Section
            title="Tax & Rates"
            description="Defaults used for estimates and invoices."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={settings.tax_rate ?? 13}
                  onBlur={(e) =>
                    mutation.mutate({
                      tax_rate: parseFloat(e.target.value || 0),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Markup (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={settings.markup_pct ?? 0}
                  onBlur={(e) =>
                    mutation.mutate({
                      markup_pct: parseFloat(e.target.value || 0),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <input
                  defaultValue={settings.currency || "USD"}
                  onBlur={(e) => mutation.mutate({ currency: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Hourly Rate (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={settings.hourly_rate ?? ""}
                  onBlur={(e) =>
                    mutation.mutate({
                      hourly_rate: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Default Invoice Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Shown at the bottom of invoices"
                  defaultValue={settings.invoice_notes_template || ""}
                  onBlur={(e) =>
                    mutation.mutate({ invoice_notes_template: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </Section>
        )}

        {/* Branding */}
        {activeTab === "branding" && (
          <Section
            title="Branding"
            description="Upload your logo and set email sender."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo
                </label>
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-[240px] h-[120px] object-contain border border-slate-200 rounded"
                  />
                ) : (
                  <div className="w-[240px] h-[120px] bg-slate-50 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400">
                    No logo
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm cursor-pointer inline-flex items-center gap-2">
                    <Upload size={16} />
                    {uploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </label>
                  {settings.logo_url && (
                    <button
                      onClick={() => mutation.mutate({ logo_url: "" })}
                      className="px-3 py-2 text-sm text-slate-700 hover:text-amber-700 hover:bg-slate-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email From
                </label>
                <input
                  placeholder="e.g. estimates@yourcompany.com"
                  defaultValue={settings.email_from || ""}
                  onBlur={(e) =>
                    mutation.mutate({ email_from: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for outgoing emails (estimates, invoices, contracts).
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Templates */}
        {activeTab === "templates" && (
          <Section
            title="Email Templates"
            description="Default messages for Estimate, Invoice, and Contract emails."
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Estimate Email Template
                </label>
                <textarea
                  rows={4}
                  placeholder="Dear {{lead_name}}, here is your estimate {{estimate_number}}..."
                  defaultValue={settings.estimate_email_template || ""}
                  onBlur={(e) =>
                    mutation.mutate({ estimate_email_template: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Invoice Email Template
                </label>
                <textarea
                  rows={4}
                  placeholder="Invoice {{invoice_number}} for {{project_title}}..."
                  defaultValue={settings.invoice_email_template || ""}
                  onBlur={(e) =>
                    mutation.mutate({ invoice_email_template: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Contract Email Template
                </label>
                <textarea
                  rows={4}
                  placeholder="Contract {{contract_number}}—please review and sign..."
                  defaultValue={settings.contract_email_template || ""}
                  onBlur={(e) =>
                    mutation.mutate({ contract_email_template: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </Section>
        )}

        {/* Save All (optional) */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => mutation.mutate(settings)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {notification && (
        <SuccessNotification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
