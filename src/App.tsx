import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Runs } from "./pages/RunDetails";
import { Exceptions } from "./pages/Exceptions";
import { CashPosition } from "./pages/CashPosition";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="runs" element={<Runs />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="cash" element={<CashPosition />} />
          {/* Missing import page, but we can add later if needed. Default to Dashboard */}
          <Route path="import" element={<div className="p-8 text-xl text-gray-400">Import Page Placeholder</div>} />
          <Route path="ask" element={<div className="p-8 text-xl text-gray-400">Ask AI Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
