const crudFactory = require('../utils/crudFactory');

// status: pendiente | en_progreso | completada
// priority: baja | media | alta
module.exports = crudFactory(
  'tasks',
  ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date', 'branch_id'],
  { branchScoped: true, searchFields: ['title', 'description'], orderBy: 'due_date ASC, id DESC' }
);
