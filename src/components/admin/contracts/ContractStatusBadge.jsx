import {
  Edit,
  Send,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getStatusColor } from "@/utils/contractsUtils";

export function ContractStatusBadge({ status }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <Edit size={16} />;
      case "sent":
        return <Send size={16} />;
      case "signed":
        return <FileSignature size={16} />;
      case "completed":
        return <CheckCircle2 size={16} />;
      case "cancelled":
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
