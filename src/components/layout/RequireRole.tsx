import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ErrorState } from "../ui/states/ErrorState";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-charm-surface flex items-center justify-center">Loading...</div>;
  }

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    // If not authorized, could either redirect to home or show an error state
    // Redirecting to home prevents them from being stuck if they manipulate URLs
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <ErrorState 
          title="Access Denied" 
          message="You do not have the required permissions to view this page." 
        />
      </div>
    );
  }

  return <>{children}</>;
}
