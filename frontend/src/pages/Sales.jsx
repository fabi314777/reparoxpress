import React, { useEffect, useState, useCallback } from 'react';
import { Camera } from 'lucide-react';
import api, { FILE_BASE_URL } from '../api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
const DOC_LABELS = { boleta: 'Boleta', factura: 'Factura', nota_venta: 'Nota de Venta' };

export default function Sales() {
  const { branchId } = useAuth();
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [printType, setPrintType] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (!printType) return;
    const id = setTimeout(() => window.print(), 50);
    return () => clearTimeout(id);
  }, [printType]);

  useEffect(() => {
    const afterPrint = () => setPrintType(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const load = useCallback(async () => {
    const { data } = await api.get('/sales', { params: { branch_id: branchId || undefined } });
    setRows(data);
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(row) {
    const { data } = await api.get(`/sales/${row.id}`);
    setDetail(data);
  }

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !detail) return;
    setPhotoUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      await api.post(`/sales/${detail.id}/photos`, form);
      const { data } = await api.get(`/sales/${detail.id}`);
      setDetail(data);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudieron subir las fotos.');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await api.delete(`/sales/${detail.id}/photos/${photoId}`);
      setDetail((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== photoId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar la foto.');
    }
  }

  async function handleCancel(row) {
    if (!confirm('¿Anular esta venta? Se repondrá el stock de los productos.')) return;
    try {
      await api.post(`/sales/${row.id}/cancel`);
      setDetail(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo anular la venta.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documentos de Venta</h1>
          <p>Historial de boletas, facturas y notas de venta</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Documento</th><th>Pago</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{new Date(s.created_at).toLocaleString('es-CL')}</td>
                <td>{s.client_name || 'Cliente ocasional'}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.document_type.replace('_', ' ')}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.payment_method}</td>
                <td>{money(s.total)}</td>
                <td>
                  <span className={`badge ${s.status === 'completada' ? 'green' : 'red'}`}>{s.status}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => openDetail(s)}>Ver</button>
                    {s.status === 'completada' && (
                      <button className="danger-link" onClick={() => handleCancel(s)}>Anular</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">Aún no hay ventas registradas.</div>}
      </div>

      {detail && (
        <Modal title={`Venta #${detail.id}`} onClose={() => setDetail(null)}>
          <table>
            <thead><tr><th>Ítem</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>
              {detail.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.product_name || it.service_name}
                    {it.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{it.notes}</div>}
                  </td>
                  <td>{it.quantity}</td>
                  <td>{money(it.price)}</td>
                  <td>{money(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-total"><span>Total</span><span>{money(detail.total)}</span></div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Fotos de evidencia
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {(detail.photos || []).map((p) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <a href={`${FILE_BASE_URL}${p.file_path}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${FILE_BASE_URL}${p.file_path}`}
                      alt="Evidencia"
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p.id)}
                    title="Eliminar"
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 11, lineHeight: '18px', cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <label className="btn secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <Camera size={15} /> {photoUploading ? 'Subiendo...' : 'Agregar fotos'}
              <input type="file" accept="image/*" multiple onChange={handleAddPhotos} disabled={photoUploading} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setDetail(null)}>Cerrar</button>
            <button className="btn secondary" onClick={() => setPrintType('boleta')}>Emitir boleta</button>
            <button className="btn" onClick={() => setPrintType('factura')}>Emitir factura</button>
          </div>
        </Modal>
      )}

      {printType && detail && (
        <div id="print-receipt">
          <div className="print-header">
            <div>
              <h2>REPAROXPRESS</h2>
              {detail.branch_name && <div>{detail.branch_name}</div>}
              {detail.branch_address && <div>{detail.branch_address}</div>}
              {detail.branch_phone && <div>Tel: {detail.branch_phone}</div>}
            </div>
            <div className="print-doc-box">
              <div>{DOC_LABELS[printType]}</div>
              <div>N° {detail.id}</div>
            </div>
          </div>

          <div className="print-parties">
            <div>
              <strong>Cliente:</strong> {detail.client_name || 'Cliente ocasional'}<br />
              {detail.client_rut && <>RUT: {detail.client_rut}<br /></>}
              {detail.client_address && <>{detail.client_address}<br /></>}
            </div>
            <div>
              <strong>Fecha:</strong> {new Date(detail.created_at).toLocaleString('es-CL')}<br />
              <strong>Pago:</strong> {detail.payment_method}
            </div>
          </div>

          <table>
            <thead><tr><th>Ítem</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>
              {detail.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.product_name || it.service_name}
                    {it.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{it.notes}</div>}
                  </td>
                  <td>{it.quantity}</td>
                  <td>{money(it.price)}</td>
                  <td>{money(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-total">Total: {money(detail.total)}</div>
          <p className="print-footnote">Documento generado por ReparoXpress — no válido como documento tributario electrónico ante el SII.</p>
        </div>
      )}
    </div>
  );
}
