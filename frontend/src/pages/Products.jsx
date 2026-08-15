import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, AlertTriangle, Upload } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import CrudForm from '../components/CrudForm';
import ImportCsvModal from '../components/ImportCsvModal';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function Products() {
  const { branches, branchId } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { q, low_stock: onlyLow || undefined, branch_id: branchId || undefined }
      });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [q, onlyLow, branchId]);

  useEffect(() => { load(); }, [load]);

  const fields = [
    { name: 'sku', label: 'SKU / Código' },
    { name: 'name', label: 'Nombre del producto', required: true, full: true },
    { name: 'category', label: 'Categoría' },
    { name: 'cost', label: 'Costo', type: 'number', step: '1' },
    { name: 'price', label: 'Precio de venta', type: 'number', step: '1', required: true },
    { name: 'stock', label: 'Stock actual', type: 'number', required: true },
    { name: 'min_stock', label: 'Stock mínimo (alerta)', type: 'number', required: true },
    { name: 'branch_id', label: 'Sucursal', type: 'select', options: branches.map((b) => ({ value: b.id, label: b.name })) },
    { name: 'description', label: 'Descripción', type: 'textarea', full: true }
  ];

  async function handleSubmit(values) {
    if (editing) await api.put(`/products/${editing.id}`, values);
    else await api.post('/products', values);
    setModalOpen(false); setEditing(null); load();
  }

  async function handleDelete(row) {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    try {
      await api.delete(`/products/${row.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el producto.');
    }
  }

  async function handleAdjust(delta) {
    try {
      await api.patch(`/products/${adjusting.id}/stock`, { delta });
      setAdjusting(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo ajustar el stock.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventario / Stock</h1>
          <p>Controla tus productos y recibe alertas de stock bajo</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Importar CSV
          </button>
          <button className="btn" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="toolbar">
        <Search size={16} color="#64766f" />
        <input type="text" placeholder="Buscar por nombre, SKU o categoría..." value={q} onChange={(e) => setQ(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Solo stock bajo
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th><th>Producto</th><th>Categoría</th><th>Costo</th><th>Precio</th><th>Stock</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{money(p.cost)}</td>
                <td>{money(p.price)}</td>
                <td>
                  {p.stock}
                  {Number(p.stock) <= Number(p.min_stock) && (
                    <span className="badge red" style={{ marginLeft: 6 }}>
                      <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                      bajo
                    </span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => setAdjusting(p)}>Ajustar</button>
                    <button onClick={() => { setEditing(p); setModalOpen(true); }}>Editar</button>
                    <button className="danger-link" onClick={() => handleDelete(p)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !rows.length && (
          <div className="empty-state">No hay productos que coincidan con tu búsqueda.</div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={() => { setModalOpen(false); setEditing(null); }}>
          <CrudForm fields={fields} initialValues={editing || {}} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
        </Modal>
      )}

      {adjusting && (
        <Modal title={`Ajustar stock — ${adjusting.name}`} onClose={() => setAdjusting(null)}>
          <p style={{ color: '#64766f', fontSize: 13.5 }}>Stock actual: <strong>{adjusting.stock}</strong></p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn secondary" style={{ flex: 1 }} onClick={() => handleAdjust(-1)}>-1</button>
            <button className="btn secondary" style={{ flex: 1 }} onClick={() => handleAdjust(1)}>+1</button>
            <button className="btn secondary" style={{ flex: 1 }} onClick={() => handleAdjust(-5)}>-5</button>
            <button className="btn secondary" style={{ flex: 1 }} onClick={() => handleAdjust(5)}>+5</button>
          </div>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setAdjusting(null)}>Cerrar</button>
          </div>
        </Modal>
      )}

      {importOpen && (
        <ImportCsvModal
          title="Importar productos desde CSV"
          endpoint="/products/import"
          expectedColumns={['name', 'sku', 'category', 'cost', 'price', 'stock', 'min_stock', 'description']}
          onClose={() => setImportOpen(false)}
          onImported={load}
        />
      )}
    </div>
  );
}
