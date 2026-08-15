import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function Reports() {
  const { branchId } = useAuth();
  const [periodo, setPeriodo] = useState('diario');
  const [salesReport, setSalesReport] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [topClients, setTopClients] = useState([]);

  useEffect(() => {
    api.get('/reports/sales', { params: { periodo, branch_id: branchId || undefined } })
      .then(({ data }) => setSalesReport([...data].reverse()));
  }, [periodo, branchId]);

  useEffect(() => {
    api.get('/reports/inventory-value').then(({ data }) => setInventoryValue(data));
    api.get('/reports/top-clients').then(({ data }) => setTopClients(data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
          <p>Ventas, inventario y clientes</p>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div className="toolbar" style={{ marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#0b1f2e' }}>Ventas por período</h3>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #e2e8e6' }}>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={salesReport}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e6" />
            <XAxis dataKey="periodo" fontSize={11} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => money(v)} />
            <Bar dataKey="total" fill="#068562" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {inventoryValue && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Productos en inventario</div>
            <div className="stat-value">{inventoryValue.total_productos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Valor inventario (costo)</div>
            <div className="stat-value" style={{ fontSize: 19 }}>{money(inventoryValue.valor_costo)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Valor inventario (venta)</div>
            <div className="stat-value" style={{ fontSize: 19 }}>{money(inventoryValue.valor_venta)}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0, fontSize: 15, color: '#0b1f2e' }}>Mejores clientes</h3>
        {topClients.length ? (
          <table>
            <thead><tr><th>Cliente</th><th>Compras</th><th>Total gastado</th></tr></thead>
            <tbody>
              {topClients.map((c) => (
                <tr key={c.name}><td>{c.name}</td><td>{c.compras}</td><td>{money(c.total_gastado)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">Aún no hay suficientes ventas para este reporte.</div>
        )}
      </div>
    </div>
  );
}
