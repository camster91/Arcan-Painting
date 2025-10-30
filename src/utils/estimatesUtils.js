import { Edit, Send, CheckCircle, XCircle, Clock } from "lucide-react";

// Get status color and icon
export const getStatusInfo = (status) => {
  const statusMap = {
    draft: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Edit,
      label: "Draft",
    },
    sent: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Send,
      label: "Sent",
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      label: "Approved",
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      label: "Rejected",
    },
    expired: {
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: Clock,
      label: "Expired",
    },
  };
  return statusMap[status] || statusMap["draft"];
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format date with full details
export const formatDateLong = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Generate estimate number
export const generateEstimateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `EST-${year}${month}${day}-${random}`;
};

// Default valid until date (30 days from now)
export const getDefaultValidUntil = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
};

// Get summary stats
export const getEstimatesStats = (estimates) => {
  return {
    total: estimates.length,
    draft: estimates.filter((e) => e.status === "draft").length,
    sent: estimates.filter((e) => e.status === "sent").length,
    approved: estimates.filter((e) => e.status === "approved").length,
    totalValue: estimates.reduce(
      (sum, e) => sum + (parseFloat(e.total_cost) || 0),
      0,
    ),
    approvedValue: estimates
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + (parseFloat(e.total_cost) || 0), 0),
  };
};

// Filter estimates based on search term
export const filterEstimates = (estimates, searchTerm) => {
  return estimates.filter(
    (estimate) =>
      estimate.project_title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      estimate.estimate_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      estimate.created_by?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
};
