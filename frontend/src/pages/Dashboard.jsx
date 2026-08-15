import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function money(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);
}

export default function Dashboard() {
  const { user, branchId } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary', { params: branchId ? { branch_id: branchId } : {} })
      .then(({ data }) => setData(data));
  }, [branchId]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Resumen general del negocio</p>
        </div>
      </div>

      {!data ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Ventas de hoy</div>
              <div className="stat-value">{money(data.ventas_hoy.total)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ventas del mes</div>
              <div className="stat-value">{money(data.ventas_mes)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gastos del mes</div>
              <div className="stat-value">{money(data.gastos_mes)}</div>
            </div>
            <div className="stat-card alert">
              <div className="stat-label">Productos con stock bajo</div>
              <div className="stat-value">{data.stock_bajo}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tareas pendientes</div>
              <div className="stat-value">{data.tareas_pendientes}</div>
            </div>
            <div className="stat-card alert">
              <div className="stat-label">Cobranza pendiente</div>
              <div className="stat-value">{money(data.cobranza_pendiente)}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, color: '#0b1f2e' }}>Ventas de los últimos 7 días</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.ventas_ultimos_7_dias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e6" />
                <XAxis dataKey="fecha" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="total" stroke="#068562" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: 15, color: '#0b1f2e' }}>Productos más vendidos (30 días)</h3>
            {data.top_productos.length ? (
              <table>
                <thead><tr><th>Producto</th><th>Cantidad vendida</th></tr></thead>
                <tbody>
                  {data.top_productos.map((p) => (
                    <tr key={p.name}><td>{p.name}</td><td>{p.cantidad}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">Aún no hay ventas registradas en este período.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
