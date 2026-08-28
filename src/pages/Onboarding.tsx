import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { motion } from "framer-motion";
import { Building2, UserCircle2, ArrowRight, Loader2, Bot } from "lucide-react";

export function Onboarding() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState("FINANCE_MANAGER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateSession } = useAuth();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.createWorkspace(workspaceName, role);
      updateSession(data.token, data.user);
      // App.tsx router will automatically redirect to /dashboard 
      // since the AuthContext user now has a tenantId
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "ADMIN", label: "Admin" },
    { value: "FINANCE_MANAGER", label: "Finance Manager" },
    { value: "REVIEWER", label: "Reviewer" },
    { value: "VIEWER", label: "Viewer" }
  ];

  return (
    <div className="min-h-screen bg-charm-surface flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mb-6 shadow-brand">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-charm-heading mb-2 tracking-tight font-display">
            Welcome to LedgerPilotAI
          </h1>
          <p className="text-charm-muted">
            Let's set up your finance workspace.
          </p>
        </div>

        <div className="charm-panel p-8">
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charm-heading mb-2">
                Company / Workspace Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-charm-border rounded-full leading-5 bg-white text-charm-heading placeholder-charm-muted focus:outline-none focus:ring-1 focus:ring-charm-brand focus:border-charm-brand transition-colors sm:text-sm shadow-sm"
                  placeholder="Acme Technologies"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charm-heading mb-2">
                Your Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle2 className="h-5 w-5 text-gray-500" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-charm-border rounded-full leading-5 bg-white text-charm-heading focus:outline-none focus:ring-1 focus:ring-charm-brand focus:border-charm-brand transition-colors sm:text-sm appearance-none shadow-sm"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !workspaceName}
              className="w-full mt-8 charm-btn-primary flex justify-center items-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
