import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, LayoutDashboard, ShoppingCart, Boxes, ClipboardList } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Sidebar />
      </aside>

      <div className="main-content">
        <div className="topbar">
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', color: '#fff' }}
          >
            <Menu size={22} />
          </button>
          <div className="brand-text" style={{ fontWeight: 700 }}>
            REPARO<span style={{ color: '#0aa87d' }}>XPRESS</span>
          </div>
          <div style={{ width: 22 }} />
        </div>

        <div className="page">
          <Outlet />
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <LayoutDashboard size={18} />
          Inicio
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => (isActive ? 'active' : '')}>
          <ShoppingCart size={18} />
          Venta
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Boxes size={18} />
          Stock
        </NavLink>
        <NavLink to="/tareas" className={({ isActive }) => (isActive ? 'active' : '')}>
          <ClipboardList size={18} />
          Tareas
        </NavLink>
      </nav>
    </div>
  );
}
