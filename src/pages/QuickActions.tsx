import { useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Calendar,
  FileText,
  Settings,
  MessageSquare,
  Repeat,
  Truck,
  BarChart3,
  ShoppingBag,
} from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  adminOnly?: boolean;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { isAdmin } = useSimpleAuth();

  const actions: QuickAction[] = [
    {
      label: "New Request",
      description: "Submit a new goods request",
      icon: <ShoppingBag size={24} />,
      path: "/request-form",
      color: "bg-blue-500",
    },
    {
      label: "Schedule Delivery",
      description: "Set up a weekly delivery",
      icon: <Calendar size={24} />,
      path: "/schedule-delivery",
      color: "bg-purple-500",
    },
    {
      label: "My Deliveries",
      description: "View upcoming deliveries",
      icon: <Truck size={24} />,
      path: "/partner/deliveries",
      color: "bg-indigo-500",
    },
    {
      label: "Recurring Wish Lists",
      description: "Manage recurring requests",
      icon: <Repeat size={24} />,
      path: "/recurring-wishlists",
      color: "bg-teal-500",
    },
    {
      label: "Support Request",
      description: "Get help from our team",
      icon: <MessageSquare size={24} />,
      path: "/support/new",
      color: "bg-orange-500",
    },
    {
      label: "Manage Partners",
      description: "View & manage partner accounts",
      icon: <Users size={24} />,
      path: "/staff/partners",
      color: "bg-pink-500",
      adminOnly: true,
    },
    {
      label: "Inventory",
      description: "Track available goods",
      icon: <Package size={24} />,
      path: "/staff/inventory",
      color: "bg-red-500",
      adminOnly: true,
    },
    {
      label: "Manage Requests",
      description: "Review partner requests",
      icon: <FileText size={24} />,
      path: "/staff/manage-requests",
      color: "bg-yellow-500",
      adminOnly: true,
    },
    {
      label: "Reports",
      description: "Analytics and reporting",
      icon: <BarChart3 size={24} />,
      path: "/sheets",
      color: "bg-cyan-500",
      adminOnly: true,
    },
    {
      label: "Settings",
      description: "Account and preferences",
      icon: <Settings size={24} />,
      path: "/my-profile",
      color: "bg-gray-500",
    },
  ];

  const visible = actions.filter((a) => !a.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quick Actions</h1>
          <p className="text-gray-600">Jump straight to what you need</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visible.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div
                className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
              >
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
