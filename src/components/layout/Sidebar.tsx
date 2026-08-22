import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileSpreadsheet, Activity, DollarSign, BrainCircuit } from "lucide-react";
import { cn } from "../../lib/utils";

export function Sidebar() {
  const location = useLocation();

  const links = [
    { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { name: "Import", href: "/app/import", icon: FileSpreadsheet },
    { name: "Runs", href: "/app/runs", icon: Activity },
    { name: "Cash Position", href: "/app/cash", icon: DollarSign },
    { name: "Ask AI", href: "/app/ask", icon: BrainCircuit },
  ];

  return (
    <div className="w-64 border-r border-gray-800 bg-[#0f101f] h-screen p-4">
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          LedgerPilot
        </span>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.href);
          
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
