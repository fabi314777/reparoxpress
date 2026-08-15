import React from 'react';
import CrudPage from '../components/CrudPage';

export default function Branches() {
  return (
    <CrudPage
      title="Sucursales"
      subtitle="Administra tus locales (multisucursal)"
      endpoint="/branches"
      searchPlaceholder="Buscar sucursal..."
      columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'address', label: 'Dirección' },
        { key: 'phone', label: 'Teléfono' }
      ]}
      fields={[
        { name: 'name', label: 'Nombre de la sucursal', required: true, full: true },
        { name: 'address', label: 'Dirección', full: true },
        { name: 'phone', label: 'Teléfono' }
      ]}
    />
  );
}
