import React from 'react';
import CrudPage from '../components/CrudPage';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = { pendiente: 'gray', en_progreso: 'yellow', completada: 'green' };
const PRIORITY_LABEL = { baja: 'gray', media: 'yellow', alta: 'red' };

export default function Tasks() {
  const { branches } = useAuth();

  return (
    <CrudPage
      title="Tareas"
      subtitle="Organiza pendientes del equipo y del local"
      endpoint="/tasks"
      searchPlaceholder="Buscar tarea..."
      columns={[
        { key: 'title', label: 'Tarea' },
        { key: 'status', label: 'Estado', render: (r) => (
          <span className={`badge ${STATUS_LABEL[r.status] || 'gray'}`}>{r.status.replace('_', ' ')}</span>
        ) },
        { key: 'priority', label: 'Prioridad', render: (r) => (
          <span className={`badge ${PRIORITY_LABEL[r.priority] || 'gray'}`}>{r.priority}</span>
        ) },
        { key: 'due_date', label: 'Vence' }
      ]}
      fields={[
        { name: 'title', label: 'Título de la tarea', required: true, full: true },
        { name: 'description', label: 'Descripción', type: 'textarea', full: true },
        { name: 'status', label: 'Estado', type: 'select', options: [
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'en_progreso', label: 'En progreso' },
          { value: 'completada', label: 'Completada' }
        ] },
        { name: 'priority', label: 'Prioridad', type: 'select', options: [
          { value: 'baja', label: 'Baja' },
          { value: 'media', label: 'Media' },
          { value: 'alta', label: 'Alta' }
        ] },
        { name: 'due_date', label: 'Fecha límite', type: 'date' },
        { name: 'branch_id', label: 'Sucursal', type: 'select', options: branches.map((b) => ({ value: b.id, label: b.name })) }
      ]}
    />
  );
}
