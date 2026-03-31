"use client";

import { useState } from "react";
import { Linkedin, ArrowLeft, Plus, Users, Building2, Send, Info } from "lucide-react";

export default function LinkedInPage() {
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
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LinkedIn Marketing</h1>
                <p className="text-sm text-gray-500">B2B outreach & professional networking</p>
              </div>
            </div>
            <a
              href="/admin/marketing/cold-email"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              <Send className="w-4 h-4" />
              Cold Email Templates
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Connections", value: "—", icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "B2B Prospects", value: "—", icon: Building2, color: "text-indigo-600 bg-indigo-50" },
            { label: "Messages Sent", value: "0", icon: Send, color: "text-green-600 bg-green-50" },
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

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Coming fully online soon</h3>
              <p className="text-sm text-blue-700 mt-1">
                LinkedIn integration will help you reach property managers, HOA boards, and facility managers
                for recurring commercial painting contracts. Use Cold Email templates in the meantime.
              </p>
            </div>
          </div>
        </div>

        {/* B2B Targets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">B2B Target Segments</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { title: "Property Managers", desc: "Multi-unit residential complexes needing regular touch-ups" },
              { title: "HOA Boards", desc: "Homeowner associations with scheduled exterior maintenance" },
              { title: "Facilities Managers", desc: "Commercial buildings requiring painting services" },
            ].map((segment) => (
              <div key={segment.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{segment.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{segment.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
