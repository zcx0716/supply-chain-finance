import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store";
import { Layout } from "./components/Layout";
import { ToastContainer } from "./components/Toast";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import Orders from "./pages/Orders";
import PaymentManagement from "./pages/PaymentManagement";
import Payments from "./pages/Payments";
import { Contracts } from "./pages/Contracts";
import { System } from "./pages/System";

const basename = "/supply-chain-finance";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAppStore();

  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-slate-50">
        <ToastContainer />
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
          />
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id/payments" element={<PaymentManagement />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/system" element={<System />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
