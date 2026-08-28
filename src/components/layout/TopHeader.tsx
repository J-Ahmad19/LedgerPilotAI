import { useAuth } from "../../contexts/AuthContext";
import { Bell, User } from "lucide-react";

export function TopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-charm-border bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Breadcrumbs or current section title could go here */}
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-charm-muted hover:text-charm-heading transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 border-l border-charm-border pl-4">
          <div className="w-8 h-8 bg-charm-band rounded-full flex items-center justify-center text-charm-brand">
            <User className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{user?.name || 'User'}</span>
          <button 
            onClick={() => logout()}
            className="text-xs text-charm-muted hover:text-charm-brand transition-colors ml-2"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
