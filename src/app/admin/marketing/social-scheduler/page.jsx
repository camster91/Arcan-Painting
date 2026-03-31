"use client";

import { useState } from "react";
import { Calendar, ArrowLeft, Plus, Clock, Image, CheckCircle, Info } from "lucide-react";

export default function SocialSchedulerPage() {
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
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Social Scheduler</h1>
                <p className="text-sm text-gray-500">Plan & schedule social media posts</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Schedule Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Scheduled", value: "0", icon: Clock, color: "text-violet-600 bg-violet-50" },
            { label: "Published", value: "0", icon: CheckCircle, color: "text-green-600 bg-green-50" },
            { label: "Drafts", value: "0", icon: Image, color: "text-gray-600 bg-gray-50" },
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
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-violet-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-violet-900">Coming fully online soon</h3>
              <p className="text-sm text-violet-700 mt-1">
                Schedule posts across Facebook, Instagram, and Google Business Profile.
                AI-generated content suggestions will help you maintain a consistent posting schedule
                showcasing your painting projects.
              </p>
            </div>
          </div>
        </div>

        {/* Empty Calendar */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Posts</h2>
          </div>
          <div className="py-16 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No posts scheduled</p>
            <p className="text-gray-400 text-xs mt-1">Create your first scheduled post to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
