import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import ImportCsvModal from '../components/ImportCsvModal';

export default function Clients() {
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <CrudPage
        title="Clientes"
        subtitle="Administra la información de tus clientes"
        endpoint="/clients"
        searchPlaceholder="Buscar por nombre, teléfono o email..."
        refreshKey={refreshKey}
        extraActions={
          <button className="btn secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Importar CSV
          </button>
        }
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'email', label: 'Email' },
          { key: 'rut', label: 'RUT' }
        ]}
        fields={[
          { name: 'name', label: 'Nombre completo', required: true, full: true },
          { name: 'phone', label: 'Teléfono' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'rut', label: 'RUT' },
          { name: 'address', label: 'Dirección', full: true },
          { name: 'notes', label: 'Notas', type: 'textarea', full: true }
        ]}
      />

      {importOpen && (
        <ImportCsvModal
          title="Importar clientes desde CSV"
          endpoint="/clients/import"
          expectedColumns={['name', 'phone', 'email', 'rut', 'address', 'notes']}
          onClose={() => setImportOpen(false)}
          onImported={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}
