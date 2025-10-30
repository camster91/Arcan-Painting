import { useState, useEffect } from "react";
import {
  Plus,
  X,
  UserPlus,
  CalendarPlus,
  FileText,
  Clock,
  FolderOpen,
} from "lucide-react";

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Context-aware actions based on current page
  const getContextActions = () => {
    const basePath = currentPath.split("/").slice(0, 3).join("/"); // /admin/something -> /admin/something

    switch (basePath) {
      case "/admin":
        return [
          {
            icon: UserPlus,
            label: "Add Lead",
            href: "/admin?action=add-lead",
            color: "bg-blue-500",
          },
          {
            icon: CalendarPlus,
            label: "Schedule",
            href: "/admin/availability",
            color: "bg-green-500",
          },
          {
            icon: FileText,
            label: "New Estimate",
            href: "/admin/estimates?action=new",
            color: "bg-purple-500",
          },
        ];
      case "/admin/projects":
        return [
          {
            icon: FolderOpen,
            label: "New Project",
            href: "/admin/projects?action=new",
            color: "bg-blue-500",
          },
          {
            icon: UserPlus,
            label: "Add Lead",
            href: "/admin?action=add-lead",
            color: "bg-green-500",
          },
          {
            icon: FileText,
            label: "New Estimate",
            href: "/admin/estimates?action=new",
            color: "bg-purple-500",
          },
        ];
      case "/admin/team":
        return [
          {
            icon: UserPlus,
            label: "Add Member",
            href: "/admin/team?action=add",
            color: "bg-blue-500",
          },
          {
            icon: CalendarPlus,
            label: "Schedule",
            href: "/admin/availability",
            color: "bg-green-500",
          },
          {
            icon: Clock,
            label: "Assign Task",
            href: "/admin/tasks?action=new",
            color: "bg-orange-500",
          },
        ];
      case "/admin/estimates":
        return [
          {
            icon: FileText,
            label: "New Estimate",
            href: "/admin/estimates?action=new",
            color: "bg-purple-500",
          },
          {
            icon: UserPlus,
            label: "Add Lead",
            href: "/admin?action=add-lead",
            color: "bg-blue-500",
          },
          {
            icon: CalendarPlus,
            label: "Schedule",
            href: "/admin/availability",
            color: "bg-green-500",
          },
        ];
      default:
        return [
          {
            icon: UserPlus,
            label: "Add Lead",
            href: "/admin?action=add-lead",
            color: "bg-blue-500",
          },
          {
            icon: CalendarPlus,
            label: "Schedule",
            href: "/admin/availability",
            color: "bg-green-500",
          },
          {
            icon: FileText,
            label: "New Estimate",
            href: "/admin/estimates?action=new",
            color: "bg-purple-500",
          },
        ];
    }
  };

  const actions = getContextActions();

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: -1 }}
        />
      )}

      {/* Action buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-end"
                style={{
                  transform: `translateY(${isOpen ? "0" : "20px"})`,
                  opacity: isOpen ? "1" : "0",
                  transition: `all 0.2s ease-out ${index * 0.05}s`,
                }}
              >
                <span className="mr-3 px-3 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
                <a
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className={`w-12 h-12 ${action.color} hover:scale-110 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-200`}
                >
                  <Icon size={20} />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? "rotate-45 scale-110" : "rotate-0 scale-100"
        }`}
        style={{
          boxShadow: "0 8px 25px rgba(245, 158, 11, 0.4)",
        }}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
