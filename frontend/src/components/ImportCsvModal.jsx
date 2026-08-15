import React, { useState } from 'react';
import Modal from './Modal';
import api from '../api';

// Parser CSV simple (sin dependencias externas): soporta comillas, comas
// dentro de campos entre comillas, y saltos de línea \n o \r\n.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
}

export default function ImportCsvModal({ title, endpoint, expectedColumns, onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result || ''));
        if (!parsed.length) setError('El archivo no tiene filas de datos, o el formato no se pudo leer.');
        setRows(parsed);
      } catch {
        setError('No se pudo leer el archivo. Asegúrate de que sea un CSV válido.');
      }
    };
    reader.onerror = () => setError('No se pudo leer el archivo.');
    reader.readAsText(file, 'UTF-8');
  }

  async function handleImport() {
    if (!rows.length) return;
    setImporting(true);
    setError('');
    try {
      const { data } = await api.post(endpoint, { rows });
      setResult(data);
      onImported();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo importar el archivo.');
    } finally {
      setImporting(false);
    }
  }

  const previewCols = rows.length ? Object.keys(rows[0]) : [];

  return (
    <Modal title={title} onClose={onClose}>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 0 }}>
        Sube un archivo <strong>.csv</strong> con la primera fila como encabezado.
        Columnas esperadas: <strong>{expectedColumns.join(', ')}</strong>.
        Solo <strong>{expectedColumns[0]}</strong> es obligatoria; el resto puede ir vacío.
      </p>

      <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      {fileName && !error && (
        <p style={{ fontSize: 13, marginTop: 8 }}>
          {rows.length} fila{rows.length === 1 ? '' : 's'} leída{rows.length === 1 ? '' : 's'} de "{fileName}".
        </p>
      )}

      {rows.length > 0 && !result && (
        <div className="table-wrap" style={{ maxHeight: 220, overflow: 'auto', marginTop: 10 }}>
          <table>
            <thead><tr>{previewCols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i}>{previewCols.map((h) => <td key={h}>{r[h]}</td>)}</tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 && (
            <p style={{ fontSize: 12, padding: '6px 10px', color: 'var(--text-muted)' }}>
              ... y {rows.length - 8} fila(s) más.
            </p>
          )}
        </div>
      )}

      {error && <div className="login-error" style={{ marginTop: 10 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 12, fontSize: 13.5 }}>
          <p><strong>{result.inserted}</strong> registro(s) importado(s) correctamente.</p>
          {result.errors?.length > 0 && (
            <>
              <p style={{ color: 'var(--danger)', marginBottom: 4 }}>
                {result.errors.length} fila(s) con problemas (no se importaron):
              </p>
              <ul style={{ maxHeight: 140, overflow: 'auto', fontSize: 12.5, paddingLeft: 18 }}>
                {result.errors.map((e, i) => <li key={i}>Fila {e.row}: {e.reason}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="modal-actions">
        <button className="btn secondary" onClick={onClose}>{result ? 'Cerrar' : 'Cancelar'}</button>
        {!result && (
          <button className="btn" disabled={!rows.length || importing} onClick={handleImport}>
            {importing ? 'Importando...' : `Importar ${rows.length || ''} registro(s)`}
          </button>
        )}
      </div>
    </Modal>
  );
}
