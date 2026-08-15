import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);

export default function CashClosure() {
  const { branchId } = useAuth();
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState(null);
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function loadHistory() {
    api.get('/cash-closures', { params: { branch_id: branchId || undefined } }).then(({ data }) => setHistory(data));
  }

  useEffect(() => { loadHistory(); }, [branchId]);

  useEffect(() => {
    api.get('/cash-closures/summary', { params: { date, branch_id: branchId || undefined } })
      .then(({ data }) => setSummary(data));
  }, [date, branchId]);

  const expected = summary ? Number(opening || 0) + Number(summary.total_sales) - Number(summary.total_expenses) : 0;
  const difference = summary ? Number(closing || 0) - expected : 0;

  async function handleSubmit() {
    setSaving(true);
    setMsg('');
    try {
      await api.post('/cash-closures', {
        branch_id: branchId || null,
        closure_date: date,
        opening_amount: Number(opening || 0),
        closing_amount: Number(closing || 0),
        total_sales: summary.total_sales,
        total_expenses: summary.total_expenses,
        notes
      });
      setMsg('✅ Cierre de caja guardado.');
      setOpening(''); setClosing(''); setNotes('');
      loadHistory();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'No se pudo guardar el cierre.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cierre de Caja</h1>
          <p>Cuadra el efectivo del día contra tus ventas y gastos</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 480 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {summary && (
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat-card">
              <div className="stat-label">Ventas del día ({summary.sales_count})</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{money(summary.total_sales)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gastos del día</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{money(summary.total_expenses)}</div>
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Monto inicial (caja chica)</label>
          <input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Monto contado al cierre</label>
          <input type="number" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>

        <p style={{ fontSize: 13.5 }}>
          Esperado en caja: <strong>{money(expected)}</strong><br />
          Diferencia: <strong style={{ color: difference === 0 ? '#068562' : '#c0392b' }}>{money(difference)}</strong>
        </p>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={saving} onClick={handleSubmit}>
          {saving ? 'Guardando...' : 'Guardar cierre de caja'}
        </button>
      </div>

      <h3 style={{ fontSize: 15, color: '#0b1f2e' }}>Historial de cierres</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Sucursal</th><th>Inicial</th><th>Ventas</th><th>Gastos</th><th>Contado</th><th>Diferencia</th></tr>
          </thead>
          <tbody>
            {history.map((c) => (
              <tr key={c.id}>
                <td>{c.closure_date}</td>
                <td>{c.branch_name || '—'}</td>
                <td>{money(c.opening_amount)}</td>
                <td>{money(c.total_sales)}</td>
                <td>{money(c.total_expenses)}</td>
                <td>{money(c.closing_amount)}</td>
                <td style={{ color: Number(c.difference) === 0 ? '#068562' : '#c0392b' }}>{money(c.difference)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!history.length && <div className="empty-state">Aún no hay cierres registrados.</div>}
      </div>
    </div>
  );
}
