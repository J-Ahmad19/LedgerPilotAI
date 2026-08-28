import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Bot } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charm-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-charm-body relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-charm-brand/5 rounded-full blur-[128px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-charm-heading tracking-tight font-display">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-charm-muted">
          Sign in to access your finance controller workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="charm-panel py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charm-heading">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-charm-border rounded-full shadow-sm bg-white text-charm-heading placeholder-charm-muted focus:outline-none focus:ring-1 focus:ring-charm-brand focus:border-charm-brand sm:text-sm transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charm-heading">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-charm-border rounded-full shadow-sm bg-white text-charm-heading placeholder-charm-muted focus:outline-none focus:ring-1 focus:ring-charm-brand focus:border-charm-brand sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full charm-btn-primary"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
             <span className="text-charm-muted">Don't have an account?</span>{" "}
             <Link to="/signup" className="font-medium text-charm-brand hover:opacity-80 transition-opacity">
               Sign up
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
