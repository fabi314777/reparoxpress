import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function PurchaseOrders() {
  const { branches, branchId } = useAuth();
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/purchase-orders');
    setRows(data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/suppliers').then(({ data }) => setSuppliers(data));
    api.get('/products').then(({ data }) => setProducts(data));
  }, []);

  function addItem() {
    if (!productId || !qty || !cost) return;
    const product = products.find((p) => String(p.id) === String(productId));
    setItems((prev) => [...prev, { product_id: productId, name: product?.name, quantity: Number(qty), cost: Number(cost) }]);
    setProductId(''); setQty(1); setCost('');
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCreate() {
    if (!items.length) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await api.post('/purchase-orders', {
        supplier_id: supplierId || null,
        branch_id: branchId || null,
        items: items.map(({ product_id, quantity, cost }) => ({ product_id, quantity, cost }))
      });
      setModalOpen(false); setItems([]); setSupplierId('');
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'No se pudo crear la orden. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive(row) {
    if (!confirm('¿Marcar como recibida? Esto sumará el stock de cada producto.')) return;
    try {
      await api.post(`/purchase-orders/${row.id}/receive`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo marcar la orden como recibida.');
    }
  }

  const total = items.reduce((s, it) => s + it.cost * it.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Órdenes de Compra</h1>
          <p>Pide reposición a tus proveedores y recibe mercadería</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}><Plus size={16} /> Nueva orden</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Proveedor</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((po) => (
              <tr key={po.id}>
                <td>{po.id}</td>
                <td>{po.supplier_name || '—'}</td>
                <td>{money(po.total)}</td>
                <td><span className={`badge ${po.status === 'recibida' ? 'green' : po.status === 'cancelada' ? 'red' : 'yellow'}`}>{po.status}</span></td>
                <td>{new Date(po.created_at).toLocaleDateString('es-CL')}</td>
                <td>
                  {po.status === 'pendiente' && (
                    <div className="row-actions">
                      <button onClick={() => handleReceive(po)}>Recibir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No hay órdenes de compra todavía.</div>}
      </div>

      {modalOpen && (
        <Modal title="Nueva orden de compra" onClose={() => setModalOpen(false)}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Proveedor</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Selecciona un proveedor</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-grid" style={{ marginBottom: 10 }}>
            <div className="field">
              <label>Producto</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Selecciona...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Cantidad</label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="field full">
              <label>Costo unitario</label>
              <input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
          </div>
          <button type="button" className="btn secondary" onClick={addItem}>Agregar ítem</button>

          {!!items.length && (
            <table style={{ marginTop: 14 }}>
              <thead><tr><th>Producto</th><th>Cant.</th><th>Costo</th><th></th></tr></thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.name}</td><td>{it.quantity}</td><td>{money(it.cost)}</td>
                    <td><button onClick={() => removeItem(idx)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="cart-total"><span>Total</span><span>{money(total)}</span></div>

          {errorMsg && <div style={{ color: 'var(--danger)', marginTop: 10, fontSize: 14 }}>{errorMsg}</div>}

          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn" disabled={!items.length || saving} onClick={handleCreate}>{saving ? 'Creando...' : 'Crear orden'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
