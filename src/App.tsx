import { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AutoLoginOnLoad() {
  const { login, isAuthenticated, orders, customers, addOrder } = useAppStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      login('admin', 'admin123');
    }
  }, [login, isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated && orders.length === 0) {
      const defaultCompany = customers.find(c => c.id === 'c1') || customers[0] || { id: 'c1', name: '北京主体企业有限公司', unifiedCreditCode: '91110000MA001ABC12', contactPerson: '张三', contactPhone: '13800138001', address: '北京市朝阳区建国路88号', region: '北京', industry: '贸易', createdAt: new Date(), updatedAt: new Date() };
      
      const initialOrders = [
        {
          id: 'order1',
          orderNo: 'ORD2026051476952366',
          mainCompany: defaultCompany,
          upstreams: [],
          downstreams: [],
          receivableAmount: 1000000,
          payableAmount: 1000000,
          currency: 'CNY' as const,
          linkedOrderIds: [],
          status: 'active' as const,
          createdAt: new Date('2026-05-14'),
          updatedAt: new Date('2026-05-14'),
        },
        {
          id: 'order2',
          orderNo: 'ORD2026062347024917',
          mainCompany: defaultCompany,
          upstreams: [],
          downstreams: [],
          receivableAmount: 500000,
          payableAmount: 500000,
          currency: 'CNY' as const,
          linkedOrderIds: [],
          status: 'active' as const,
          createdAt: new Date('2026-06-23'),
          updatedAt: new Date('2026-06-23'),
        },
      ];
      
      initialOrders.forEach(order => {
        addOrder(order);
      });
    }
  }, [isAuthenticated, orders.length, customers, addOrder]);
  
  return null;
}

export default function App() {
  const { isAuthenticated } = useAppStore();

  return (
    <Router>
      <AutoLoginOnLoad />
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
