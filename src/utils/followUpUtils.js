import { Phone, Mail, Users, FileText, CheckCircle } from "lucide-react";

export const getTypeInfo = (type) => {
  const typeMap = {
    phone_call: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Phone,
      label: "Phone Call",
    },
    email: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: Mail,
      label: "Email",
    },
    site_visit: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Users,
      label: "Site Visit",
    },
    estimate_follow_up: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: FileText,
      label: "Estimate Follow-up",
    },
    project_check_in: {
      color: "bg-slate-100 text-slate-800 border-slate-200",
      icon: CheckCircle,
      label: "Project Check-in",
    },
  };
  return typeMap[type] || typeMap["phone_call"];
};

export const getStatusColor = (status) => {
  const statusMap = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };
  return statusMap[status] || statusMap["pending"];
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateLong = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const isOverdue = (followUpDate, status) => {
  if (status !== "pending") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(followUpDate) < today;
};

export const isToday = (followUpDate) => {
  const today = new Date();
  return new Date(followUpDate).toDateString() === today.toDateString();
};

export const calculateStats = (
  followUps,
  overdueFollowUps,
  todayFollowUps,
  upcomingFollowUps,
) => {
  return {
    total: followUps.length,
    pending: followUps.filter((f) => f.status === "pending").length,
    completed: followUps.filter((f) => f.status === "completed").length,
    overdue: overdueFollowUps.length,
    today: todayFollowUps.length,
    upcoming: upcomingFollowUps.length,
  };
};
