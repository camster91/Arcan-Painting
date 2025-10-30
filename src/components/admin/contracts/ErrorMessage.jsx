import { AlertCircle } from "lucide-react";

export function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 text-red-800">
        <AlertCircle size={20} />
        <span>{message}</span>
      </div>
    </div>
  );
}
