"use client";
import {
  Calendar,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getStatusInfo = (status) => {
  const statusMap = {
    scheduled: {
      color: "border-blue-200 bg-blue-100 text-blue-800",
      icon: Calendar,
      label: "Scheduled",
    },
    in_progress: {
      color: "border-amber-200 bg-amber-100 text-amber-800",
      icon: PlayCircle,
      label: "In Progress",
    },
    paused: {
      color: "border-orange-200 bg-orange-100 text-orange-800",
      icon: PauseCircle,
      label: "Paused",
    },
    completed: {
      color: "border-green-200 bg-green-100 text-green-800",
      icon: CheckCircle,
      label: "Completed",
    },
    cancelled: {
      color: "border-red-200 bg-red-100 text-red-800",
      icon: XCircle,
      label: "Cancelled",
    },
  };
  return statusMap[status] || statusMap.scheduled;
};

export const getProgressColor = (percentage) => {
  if (percentage < 30) return "bg-red-500";
  if (percentage < 70) return "bg-amber-500";
  return "bg-green-500";
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days`;
};
