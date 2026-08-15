import React, { useEffect, useState } from 'react';
import { Trash2, Package, Wrench, UserPlus, Camera } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import CrudForm from '../components/CrudForm';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function POS() {
  const { branchId } = useAuth();
  const [tab, setTab] = useState('producto');
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [clientId, setClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [documentType, setDocumentType] = useState('boleta');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);

  useEffect(() => {
    api.get('/products', { params: { branch_id: branchId || undefined } }).then(({ data }) => setProducts(data));
    api.get('/services').then(({ data }) => setServices(data));
    api.get('/clients', { params: { branch_id: branchId || undefined } }).then(({ data }) => setClients(data));
  }, [branchId]);

  const catalog = tab === 'producto' ? products : services;
  const filtered = catalog.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()));

  function addToCart(item) {
    setCart((prev) => {
      const key = `${tab}-${item.id}`;
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key,
          type: tab,
          product_id: tab === 'producto' ? item.id : null,
          service_id: tab === 'servicio' ? item.id : null,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          maxStock: tab === 'producto' ? item.stock : null
        }
      ];
    });
  }

  function changeQty(key, delta) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(key) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function updateNotes(key, notes) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, notes } : l)));
  }

  async function handleCreateClient(values) {
    const { data } = await api.post('/clients', values);
    setClients((prev) => [...prev, data]);
    setClientId(String(data.id));
    setNewClientOpen(false);
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files].slice(0, 6));
    e.target.value = '';
  }

  function removePhoto(idx) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function handleCheckout() {
    if (!cart.length) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const { data } = await api.post('/sales', {
        client_id: clientId || null,
        branch_id: branchId || null,
        payment_method: paymentMethod,
        document_type: documentType,
        items: cart.map((l) => ({
          type: l.type,
          product_id: l.product_id,
          service_id: l.service_id,
          quantity: l.quantity,
          price: l.price,
          notes: l.notes || null
        }))
      });
      setCart([]);

      let photoNote = '';
      if (photoFiles.length) {
        try {
          const form = new FormData();
          photoFiles.forEach((f) => form.append('photos', f));
          await api.post(`/sales/${data.id}/photos`, form);
          photoNote = ` ${photoFiles.length} foto(s) de evidencia adjuntada(s).`;
        } catch (photoErr) {
          photoNote = ' No se pudieron subir las fotos de evidencia, pero la venta sí quedó guardada.';
        }
      }
      setPhotoFiles([]);

      if (data.email?.sent) {
        setSuccessMsg(`✅ Venta registrada y comprobante enviado por correo al cliente.${photoNote}`);
      } else if (data.email?.reason === 'no_client_email') {
        setSuccessMsg(`✅ Venta registrada correctamente.${photoNote}`);
      } else if (data.email?.reason === 'not_configured') {
        setSuccessMsg(`✅ Venta registrada. (El envío de correo aún no está configurado — ver backend/services/mailer.js)${photoNote}`);
      } else {
        setSuccessMsg(`✅ Venta registrada. No se pudo enviar el correo al cliente${data.email?.reason ? ` (${data.email.reason})` : ''}.${photoNote}`);
      }
    } catch (err) {
      setSuccessMsg('❌ ' + (err.response?.data?.error || 'No se pudo registrar la venta.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Punto de Venta</h1>
          <p>Registra ventas de productos y servicios</p>
        </div>
      </div>

      <div className="pos-layout">
        <div className="pos-catalog">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <button className={`btn ${tab === 'producto' ? '' : 'secondary'}`} onClick={() => setTab('producto')}>
              <Package size={15} /> Productos
            </button>
            <button className={`btn ${tab === 'servicio' ? '' : 'secondary'}`} onClick={() => setTab('servicio')}>
              <Wrench size={15} /> Servicios
            </button>
            <input type="text" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="pos-item-grid">
            {filtered.map((item) => (
              <button key={item.id} className="pos-item-card" onClick={() => addToCart(item)}>
                <div className="name">{item.name}</div>
                <div className="price">{money(item.price)}</div>
                {tab === 'producto' && (
                  <div className="stock-tag">Stock: {item.stock}</div>
                )}
              </button>
            ))}
            {!filtered.length && <div className="empty-state">No se encontraron resultados.</div>}
          </div>
        </div>

        <div className="pos-cart card">
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Carrito</h3>

          {!cart.length && <div className="empty-state" style={{ padding: 20 }}>Agrega productos o servicios</div>}

          {cart.map((l) => (
            <div className="cart-line" key={l.key} style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div>{l.name}</div>
                <div style={{ fontSize: 12, color: '#64766f' }}>{money(l.price)} c/u</div>
                {l.type === 'servicio' && (
                  <input
                    type="text"
                    placeholder="Detalle del dispositivo (opcional)"
                    value={l.notes || ''}
                    onChange={(e) => updateNotes(l.key, e.target.value)}
                    style={{ marginTop: 6, fontSize: 12.5, width: '100%' }}
                  />
                )}
              </div>
              <div className="qty-controls">
                <button onClick={() => changeQty(l.key, -1)}>-</button>
                <span>{l.quantity}</span>
                <button onClick={() => changeQty(l.key, 1)}>+</button>
                <button onClick={() => removeLine(l.key)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}

          <div className="cart-total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label>Cliente (opcional)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Cliente ocasional</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                type="button"
                className="btn secondary"
                title="Crear cliente nuevo"
                style={{ padding: '0 10px' }}
                onClick={() => setNewClientOpen(true)}
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label>Método de pago</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Fotos de evidencia (opcional)</label>
            <label className="btn secondary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={16} /> Agregar fotos
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
            {photoFiles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {photoFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      title="Quitar"
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
            )}
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Documento</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="nota_venta">Nota de venta</option>
            </select>
          </div>

          {successMsg && <p style={{ fontSize: 13 }}>{successMsg}</p>}

          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={!cart.length || saving} onClick={handleCheckout}>
            {saving ? 'Procesando...' : `Cobrar ${money(total)}`}
          </button>
        </div>
      </div>

      {newClientOpen && (
        <Modal title="Nuevo cliente" onClose={() => setNewClientOpen(false)}>
          <CrudForm
            fields={[
              { name: 'name', label: 'Nombre completo', required: true, full: true },
              { name: 'phone', label: 'Teléfono' },
              { name: 'email', label: 'Email', type: 'email' }
            ]}
            onSubmit={handleCreateClient}
            onCancel={() => setNewClientOpen(false)}
            submitLabel="Crear cliente"
          />
        </Modal>
      )}
    </div>
  );
}
