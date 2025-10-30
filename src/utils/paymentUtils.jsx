import {
  Check,
  Clock,
  X,
  RotateCcw,
  CreditCard,
  Banknote,
  Receipt,
  Building2,
  DollarSign,
} from "lucide-react";

export const getStatusIcon = (status) => {
  switch (status) {
    case "cleared":
      return <Check className="w-4 h-4 text-green-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "failed":
      return <X className="w-4 h-4 text-red-500" />;
    case "refunded":
      return <RotateCcw className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

export const getMethodIcon = (method) => {
  switch (method) {
    case "card":
      return <CreditCard className="w-4 h-4 text-blue-500" />;
    case "cash":
      return <Banknote className="w-4 h-4 text-green-500" />;
    case "check":
      return <Receipt className="w-4 h-4 text-orange-500" />;
    case "bank_transfer":
      return <Building2 className="w-4 h-4 text-purple-500" />;
    default:
      return <DollarSign className="w-4 h-4 text-gray-500" />;
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateLong = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
