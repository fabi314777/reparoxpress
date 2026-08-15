import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../api';
import Modal from './Modal';
import CrudForm from './CrudForm';

/**
 * columns: [{ key, label, render?: (row) => node }]
 * fields: campos para el formulario (ver CrudForm)
 */
export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = 'Buscar...',
  extraParams = {},
  extraActions = null,
  refreshKey = 0
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoint, { params: { q, ...extraParams } });
      setRows(data);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, q, JSON.stringify(extraParams), refreshKey]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(values) {
    if (editing) {
      await api.put(`${endpoint}/${editing.id}`, values);
    } else {
      await api.post(endpoint, values);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(row) {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return;
    try {
      await api.delete(`${endpoint}/${row.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el registro.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {extraActions}
          <button className="btn" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="toolbar">
        <Search size={16} color="#64766f" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
                <td>
                  <div className="row-actions">
                    <button onClick={() => { setEditing(row); setModalOpen(true); }}>Editar</button>
                    <button className="danger-link" onClick={() => handleDelete(row)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !rows.length && (
          <div className="empty-state">No hay registros todavía. Crea el primero con "Nuevo".</div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Editar' : 'Nuevo registro'} onClose={() => { setModalOpen(false); setEditing(null); }}>
          <CrudForm
            fields={fields}
            initialValues={editing || {}}
            onSubmit={handleSubmit}
            onCancel={() => { setModalOpen(false); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
