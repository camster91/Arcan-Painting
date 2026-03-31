"use client";

import { useState } from "react";
import { Search, ArrowLeft, TrendingUp, Target, FileText, BarChart3, Info } from "lucide-react";

export default function ContentResearchPage() {
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
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Content Research</h1>
                <p className="text-sm text-gray-500">Keyword research & content ideas for your market</p>
              </div>
            </div>
            <a
              href="/admin/marketing/ai-assistant"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              <Search className="w-4 h-4" />
              Ask AI Assistant
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Keywords Tracked", value: "0", icon: Target, color: "text-emerald-600 bg-emerald-50" },
            { label: "Content Ideas", value: "0", icon: FileText, color: "text-blue-600 bg-blue-50" },
            { label: "Competitors Monitored", value: "0", icon: BarChart3, color: "text-purple-600 bg-purple-50" },
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900">Coming fully online soon</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Research local painting keywords, analyze competitor strategies, and discover content ideas
                that drive leads. Use the AI Assistant in the meantime for content brainstorming.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Topics */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Suggested Research Topics</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { title: "Local SEO Keywords", desc: "\"painters near me\", \"house painting [city]\" keyword opportunities" },
              { title: "Seasonal Trends", desc: "Peak painting seasons and when to ramp up marketing spend" },
              { title: "Competitor Analysis", desc: "What other painting companies in your area are advertising" },
              { title: "Content Calendar", desc: "Blog post and social media content ideas by month" },
            ].map((topic) => (
              <div key={topic.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{topic.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{topic.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
