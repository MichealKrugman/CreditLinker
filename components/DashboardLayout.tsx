"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Upload, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Building2
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <Home size={20} /> },
    { label: "Upload Data", href: "/dashboard/upload", icon: <Upload size={20} /> },
    { label: "Transactions", href: "/dashboard/transactions", icon: <FileText size={20} /> },
    { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 size={20} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Building2 className="text-blue-600" size={24} />
          <span className="font-bold text-lg">CreditLinker</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200">
          <Building2 className="text-blue-600" size={28} />
          <span className="font-bold text-xl">CreditLinker</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
            <p className="text-sm font-medium text-gray-900">Greene Pharmacy</p>
            <p className="text-xs text-gray-500">Business Account</p>
          </div>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {/* Handle logout */}}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
