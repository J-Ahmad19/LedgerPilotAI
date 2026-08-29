import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Activity, List, AlertTriangle, DollarSign, BrainCircuit, History, Settings, BarChart2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Sidebar() {
  const location = useLocation();

  const groups = [
    {
      label: "OVERVIEW",
      links: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      label: "RECONCILIATION",
      links: [
        { name: "Import Data", href: "/import", icon: Upload },
        { name: "Reconciliation Runs", href: "/runs", icon: Activity },
        { name: "Transactions", href: "/transactions", icon: List },
        { name: "Exceptions", href: "/exceptions", icon: AlertTriangle },
      ]
    },
    {
      label: "FINANCIAL INSIGHTS",
      links: [
        { name: "Cash Position", href: "/cash-position", icon: DollarSign },
        { name: "Reports", href: "/reports", icon: BarChart2 },
        { name: "Ask LedgerPilot", href: "/ask-ai", icon: BrainCircuit },
      ]
    },
    {
      label: "CONTROL",
      links: [
        { name: "Audit Log", href: "/audit-log", icon: History },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-64 border-r border-charm-border bg-charm-band h-screen p-4">
      <div className="flex items-center space-x-2 mb-8">
        <img src="/logo.jpg" alt="LedgerPilot Logo" className="w-8 h-8 rounded-lg shadow-sm" />
        <span className="text-xl font-bold text-charm-heading font-display">
          LedgerPilot
        </span>
      </div>

      <nav className="flex-1 space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-charm-muted uppercase tracking-wider font-mono">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.href) && (link.href !== '/' || location.pathname === '/');
                
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors border",
                      isActive 
                        ? "bg-white text-charm-brand border-charm-border shadow-sm" 
                        : "text-charm-muted border-transparent hover:bg-charm-surface hover:text-charm-heading"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
