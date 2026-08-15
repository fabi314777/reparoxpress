import React, { useState } from 'react';

// fields: [{ name, label, type: 'text'|'number'|'select'|'date'|'textarea', options, required, full, step }]
export default function CrudForm({ fields, initialValues = {}, onSubmit, onCancel, submitLabel = 'Guardar' }) {
  const [values, setValues] = useState(() => {
    const base = {};
    fields.forEach((f) => {
      base[f.name] = initialValues[f.name] ?? (f.type === 'number' ? '' : '');
    });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="login-error">{error}</div>}
      <div className="form-grid">
        {fields.map((f) => (
          <div className={'field' + (f.full ? ' full' : '')} key={f.name}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'select' ? (
              <select
                value={values[f.name] ?? ''}
                required={f.required}
                onChange={(e) => update(f.name, e.target.value)}
              >
                <option value="">Selecciona...</option>
                {(f.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                value={values[f.name] ?? ''}
                onChange={(e) => update(f.name, e.target.value)}
              />
            ) : (
              <input
                type={f.type || 'text'}
                step={f.step}
                required={f.required}
                value={values[f.name] ?? ''}
                onChange={(e) => update(f.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
