import React from 'react';
import CrudPage from '../components/CrudPage';
import { useAuth } from '../context/AuthContext';

const money = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function Expenses() {
  const { branches } = useAuth();

  return (
    <CrudPage
      title="Gastos"
      subtitle="Control de gastos fijos y variables del negocio"
      endpoint="/expenses"
      searchPlaceholder="Buscar por categoría o descripción..."
      columns={[
        { key: 'category', label: 'Categoría' },
        { key: 'description', label: 'Descripción' },
        { key: 'type', label: 'Tipo', render: (r) => (
          <span className={`badge ${r.type === 'fijo' ? 'gray' : 'yellow'}`}>{r.type}</span>
        ) },
        { key: 'amount', label: 'Monto', render: (r) => money(r.amount) },
        { key: 'expense_date', label: 'Fecha' }
      ]}
      fields={[
        { name: 'category', label: 'Categoría', required: true },
        { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
          { value: 'fijo', label: 'Fijo' },
          { value: 'variable', label: 'Variable' }
        ] },
        { name: 'amount', label: 'Monto', type: 'number', step: '1', required: true },
        { name: 'expense_date', label: 'Fecha', type: 'date', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea', full: true },
        { name: 'branch_id', label: 'Sucursal', type: 'select', options: branches.map((b) => ({ value: b.id, label: b.name })) }
      ]}
    />
  );
}
