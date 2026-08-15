import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import CrudForm from '../components/CrudForm';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
const STATUS_COLOR = { pendiente: 'red', parcial: 'yellow', pagada: 'green' };

export default function Collections() {
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paying, setPaying] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/collections');
    setRows(data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/clients').then(({ data }) => setClients(data)); }, []);

  async function handleCreate(values) {
    await api.post('/collections', values);
    setModalOpen(false);
    load();
  }

  const [payError, setPayError] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  async function handlePay() {
    if (!payAmount) return;
    setPaySaving(true);
    setPayError('');
    try {
      await api.post(`/collections/${paying.id}/pay`, { amount: Number(payAmount) });
      setPaying(null); setPayAmount('');
      load();
    } catch (err) {
      setPayError(err.response?.data?.error || 'No se pudo registrar el abono.');
    } finally {
      setPaySaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cobranza</h1>
          <p>Cuentas por cobrar a tus clientes</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}><Plus size={16} /> Nueva deuda</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Debe</th><th>Pagado</th><th>Saldo</th><th>Vence</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.client_name}</td>
                <td>{money(c.amount_due)}</td>
                <td>{money(c.amount_paid)}</td>
                <td>{money(c.amount_due - c.amount_paid)}</td>
                <td>{c.due_date}</td>
                <td><span className={`badge ${STATUS_COLOR[c.status]}`}>{c.status}</span></td>
                <td>
                  {c.status !== 'pagada' && (
                    <div className="row-actions">
                      <button onClick={() => setPaying(c)}>Abonar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No hay cuentas por cobrar registradas.</div>}
      </div>

      {modalOpen && (
        <Modal title="Nueva cuenta por cobrar" onClose={() => setModalOpen(false)}>
          <CrudForm
            fields={[
              { name: 'client_id', label: 'Cliente', type: 'select', required: true, full: true, options: clients.map((c) => ({ value: c.id, label: c.name })) },
              { name: 'amount_due', label: 'Monto adeudado', type: 'number', required: true },
              { name: 'due_date', label: 'Fecha de vencimiento', type: 'date', required: true },
              { name: 'notes', label: 'Notas', type: 'textarea', full: true }
            ]}
            onSubmit={handleCreate}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {paying && (
        <Modal title={`Abonar — ${paying.client_name}`} onClose={() => setPaying(null)}>
          <p style={{ fontSize: 13.5, color: '#64766f' }}>
            Saldo pendiente: <strong>{money(paying.amount_due - paying.amount_paid)}</strong>
          </p>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Monto a abonar</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </div>
          {payError && <div className="login-error">{payError}</div>}
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setPaying(null)}>Cancelar</button>
            <button className="btn" disabled={paySaving} onClick={handlePay}>{paySaving ? 'Guardando...' : 'Registrar abono'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
