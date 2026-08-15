import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Boxes, Wrench, ClipboardList, Truck,
  ShoppingCart, FileText, Wallet, Landmark, BarChart3, Building2, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/tareas', label: 'Tareas', icon: ClipboardList }
    ]
  },
  {
    label: 'Ventas',
    items: [
      { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
      { to: '/ventas', label: 'Documentos de Venta', icon: FileText },
      { to: '/cierre-caja', label: 'Cierre de Caja', icon: Wallet },
      { to: '/cobranza', label: 'Cobranza', icon: Landmark }
    ]
  },
  {
    label: 'Operación',
    items: [
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/inventario', label: 'Inventario / Stock', icon: Boxes },
      { to: '/servicios', label: 'Servicios', icon: Wrench },
      { to: '/proveedores', label: 'Proveedores', icon: Truck },
      { to: '/compras', label: 'Órdenes de Compra', icon: ClipboardList }
    ]
  },
  {
    label: 'Gestión',
    items: [
      { to: '/gastos', label: 'Gastos', icon: Wallet },
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      { to: '/sucursales', label: 'Sucursales', icon: Building2 }
    ]
  }
];

export default function Sidebar({ onNavigate }) {
  const { user, logout, branchId, setBranchId, branches = [] } = useAuth();

  return (
    <>
      <div className="sidebar-brand">
        <div className="logo-mark">R</div>
        <div className="brand-text">REPARO<span>XPRESS</span></div>
      </div>

      {branches.length > 1 && (
        <div className="sidebar-branch">
          Sucursal activa
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map((group) => (
          <div key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <Icon size={16} className="nav-icon" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-name">{user?.name}</div>
        <div className="user-role">{user?.role}</div>
        <button onClick={logout}>
          <LogOut size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
