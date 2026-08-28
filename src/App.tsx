import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Runs } from "./pages/RunList";
import { Exceptions } from "./pages/Exceptions";
import { CashPosition } from "./pages/CashPosition";
import { AskAI } from "./pages/AskAI";
import { Onboarding } from "./pages/Onboarding";
import { RequireRole } from "./components/layout/RequireRole";
import { Import } from "./pages/Import";
import { RunProgress } from "./pages/RunProgress";
import { Transactions } from "./pages/Transactions";
import { Toaster } from "react-hot-toast";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-charm-surface flex items-center justify-center text-charm-heading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function RequireWorkspace({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user?.tenantId) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function RequireData({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.tenantId && user?.hasData === false) {
    return <Navigate to="/import" replace />;
  }
  
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.tenantId) {
    if (user.hasData === false) {
      return <Navigate to="/import" replace />;
    }
    
    if (user.role === "REVIEWER") {
      return <Navigate to="/exceptions" replace />;
    }
    
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            </ProtectedRoute>
          } />
          <Route element={
            <ProtectedRoute>
              <RequireWorkspace>
                <AppLayout />
              </RequireWorkspace>
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={
              <RequireData>
                <Dashboard />
              </RequireData>
            } />
            <Route path="/import" element={<Import />} />
            <Route path="/runs" element={<Runs />} />
            <Route path="/runs/:runId" element={<RunProgress />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/exceptions/:exceptionId" element={<div className="p-8 text-xl text-charm-muted">Exception Details Placeholder</div>} />
            <Route path="/cash-position" element={<CashPosition />} />
            <Route path="/ask-ai" element={<AskAI />} />
            <Route path="/audit-log" element={<div className="p-8 text-xl text-charm-muted">Audit Log Placeholder</div>} />
            <Route path="/settings" element={
              <RequireRole allowedRoles={["ADMIN"]}>
                <div className="p-8 text-xl text-charm-muted">Settings Placeholder</div>
              </RequireRole>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
