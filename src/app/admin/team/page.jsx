"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Users, Plus, Home, ChevronRight } from "lucide-react";
import TeamMemberCard from "@/components/admin/team/TeamMemberCard";

export default function TeamManagementPage() {
  // Current user via local-auth API
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState(null);

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "painter",
    hire_date: "",
    hourly_rate: "",
    specialties: "",
    notes: "",
  });

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("painter");
  const [inviteMsg, setInviteMsg] = useState(null);
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      setInviteMsg(null);
      const res = await fetch("/api/team-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }
      return data;
    },
    onSuccess: () => {
      setInviteMsg({ type: "success", text: "Invite sent successfully" });
      setInviteEmail("");
      setInviteRole("painter");
    },
    onError: (e) =>
      setInviteMsg({
        type: "error",
        text: e.message || "Failed to send invite",
      }),
  });

  // Fetch current user (cookie-based local-auth)
  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        setMeLoading(true);
        const res = await fetch("/api/local-auth/me");
        if (!res.ok) {
          setMe(null);
          if (mounted) setMeError("Unauthorized");
          return;
        }
        const data = await res.json();
        if (mounted) setMe(data.user || null);
      } catch (e) {
        console.error("Failed to load current user", e);
        if (mounted) setMeError("Failed to load current user");
      } finally {
        if (mounted) setMeLoading(false);
      }
    };
    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members");
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error("Error fetching team members:", error);
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!meLoading && me) {
      fetchTeamMembers();
    }
  }, [meLoading, me]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const method = editingMember ? "PUT" : "POST";
      const body = editingMember
        ? { ...formData, id: editingMember.id }
        : formData;

      const response = await fetch("/api/team-members", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save team member");
      }

      await fetchTeamMembers();
      setShowForm(false);
      setEditingMember(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "painter",
        hire_date: "",
        hourly_rate: "",
        specialties: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving team member:", error);
      setError(error.message);
    }
  };

  // Handle edit
  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "painter",
      hire_date: member.hire_date || "",
      hourly_rate: member.hourly_rate || "",
      specialties: member.specialties || "",
      notes: member.notes || "",
    });
    setShowForm(true);
  };

  // Handle deactivate
  const handleDeactivate = async (memberId) => {
    if (!confirm("Are you sure you want to deactivate this team member?")) {
      return;
    }

    try {
      const response = await fetch("/api/team-members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, status: "inactive" }),
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate team member");
      }

      await fetchTeamMembers();
    } catch (error) {
      console.error("Error deactivating team member:", error);
      setError("Failed to deactivate team member");
    }
  };

  if (meLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (!me || me.role !== "owner") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600">Only owners can manage team members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Header with Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-slate-600 mb-4">
            <a
              href="/admin"
              className="flex items-center gap-1 hover:text-slate-900"
            >
              <Home size={16} />
              <span>Dashboard</span>
            </a>
            <ChevronRight size={16} className="mx-2 text-slate-400" />
            <span className="text-slate-900 font-medium">Team</span>
          </div>

          {/* Page Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={24} />
                Team Management
              </h1>
              <p className="text-slate-600">
                Manage your painting crew and staff
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Team Member Button */}
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingMember(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    role: "painter",
                    hire_date: "",
                    hourly_rate: "",
                    specialties: "",
                    notes: "",
                  });
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Team Member</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Invite team member */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
          {inviteMsg && (
            <div
              className={`${inviteMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} border text-sm rounded-lg p-3 mb-4`}
            >
              {inviteMsg.text}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="teammate@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="painter">Painter</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={inviteMutation.isLoading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors"
              >
                {inviteMutation.isLoading ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            They'll get an email with a link to create their account.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">
              {editingMember ? "Edit Team Member" : "Add New Team Member"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="painter">Painter</option>
                  <option value="lead_painter">Lead Painter</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) =>
                    setFormData({ ...formData, hire_date: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specialties
                </label>
                <input
                  type="text"
                  placeholder="e.g., Interior, Exterior, Commercial"
                  value={formData.specialties}
                  onChange={(e) =>
                    setFormData({ ...formData, specialties: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {editingMember ? "Update" : "Add"} Team Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Members Cards */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Team Members
            </h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No team members found. Add your first team member to get started.
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onViewDetails={(member) => {
                      // Could implement a detailed view modal in the future
                      console.log("View details for:", member.name);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
