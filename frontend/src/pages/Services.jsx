import React from 'react';
import CrudPage from '../components/CrudPage';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function Services() {
  return (
    <CrudPage
      title="Servicios"
      subtitle="Reparaciones y servicios técnicos que ofreces"
      endpoint="/services"
      searchPlaceholder="Buscar servicio..."
      columns={[
        { key: 'name', label: 'Servicio' },
        { key: 'category', label: 'Categoría' },
        { key: 'price', label: 'Precio', render: (r) => money(r.price) }
      ]}
      fields={[
        { name: 'name', label: 'Nombre del servicio', required: true, full: true },
        { name: 'category', label: 'Categoría' },
        { name: 'price', label: 'Precio', type: 'number', step: '1', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea', full: true }
      ]}
    />
  );
}
