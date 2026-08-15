import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Services from './pages/Services';
import Tasks from './pages/Tasks';
import Branches from './pages/Branches';
import Expenses from './pages/Expenses';
import POS from './pages/POS';
import Sales from './pages/Sales';
import PurchaseOrders from './pages/PurchaseOrders';
import CashClosure from './pages/CashClosure';
import Collections from './pages/Collections';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="proveedores" element={<Suppliers />} />
        <Route path="inventario" element={<Products />} />
        <Route path="servicios" element={<Services />} />
        <Route path="tareas" element={<Tasks />} />
        <Route path="sucursales" element={<Branches />} />
        <Route path="gastos" element={<Expenses />} />
        <Route path="pos" element={<POS />} />
        <Route path="ventas" element={<Sales />} />
        <Route path="compras" element={<PurchaseOrders />} />
        <Route path="cierre-caja" element={<CashClosure />} />
        <Route path="cobranza" element={<Collections />} />
        <Route path="reportes" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
