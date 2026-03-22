"use client";

import { useState } from "react";
import { BarChart2, ArrowLeft, Plus, Search, DollarSign, Eye, MousePointerClick, Info } from "lucide-react";

export default function GoogleAdsPage() {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin/marketing" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Google Ads</h1>
                <p className="text-sm text-gray-500">Search & display campaign management</p>
              </div>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Campaigns", value: "0", icon: BarChart2, color: "text-blue-600 bg-blue-50" },
            { label: "Monthly Budget", value: "$0", icon: DollarSign, color: "text-green-600 bg-green-50" },
            { label: "Impressions", value: "0", icon: Eye, color: "text-purple-600 bg-purple-50" },
            { label: "Clicks", value: "0", icon: MousePointerClick, color: "text-orange-600 bg-orange-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Coming fully online soon</h3>
              <p className="text-sm text-blue-700 mt-1">
                Google Ads integration will allow you to create search and display campaigns targeting homeowners
                searching for painting services in your area. Connect your Google Ads account to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Campaigns</h2>
          </div>
          <div className="py-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No Google Ads campaigns yet</p>
            <p className="text-gray-400 text-xs mt-1">Connect your Google Ads account to manage campaigns</p>
          </div>
        </div>
      </div>
    </div>
  );
}
