import React from 'react';
import CrudPage from '../components/CrudPage';

export default function Suppliers() {
  return (
    <CrudPage
      title="Proveedores"
      subtitle="Administra tus proveedores de repuestos y accesorios"
      endpoint="/suppliers"
      searchPlaceholder="Buscar proveedor..."
      columns={[
        { key: 'name', label: 'Empresa' },
        { key: 'contact_name', label: 'Contacto' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Email' }
      ]}
      fields={[
        { name: 'name', label: 'Nombre de la empresa', required: true, full: true },
        { name: 'contact_name', label: 'Persona de contacto' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'notes', label: 'Notas', type: 'textarea', full: true }
      ]}
    />
  );
}
