"use client";

import { useState } from "react";
import { Sparkles, ArrowLeft, Plus, Image, Wand2, Download, Info } from "lucide-react";

export default function AdCreativePage() {
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
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ad Creative Director</h1>
                <p className="text-sm text-gray-500">AI-powered ad copy & creative generation</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600"
            >
              <Wand2 className="w-4 h-4" />
              Generate Creative
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Creatives Generated", value: "0", icon: Sparkles, color: "text-amber-600 bg-amber-50" },
            { label: "Ad Copies", value: "0", icon: Wand2, color: "text-purple-600 bg-purple-50" },
            { label: "Downloads", value: "0", icon: Download, color: "text-blue-600 bg-blue-50" },
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Coming fully online soon</h3>
              <p className="text-sm text-amber-700 mt-1">
                The Ad Creative Director uses AI to generate compelling ad copy, headlines, and image suggestions
                tailored to your painting business. Generate Facebook, Google, and Instagram ad creatives in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Creative Types */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Creative Types</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { title: "Facebook/Instagram Ads", desc: "Image + copy combinations optimized for social feeds" },
              { title: "Google Search Ads", desc: "Headlines and descriptions for search campaigns" },
              { title: "Before & After Showcases", desc: "Project transformation ad creatives" },
            ].map((type) => (
              <div key={type.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Image className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{type.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
