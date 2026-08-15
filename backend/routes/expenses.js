const crudFactory = require('../utils/crudFactory');

// type: fijo | variable
module.exports = crudFactory(
  'expenses',
  ['category', 'description', 'amount', 'type', 'expense_date', 'branch_id'],
  { branchScoped: true, searchFields: ['category', 'description'], orderBy: 'expense_date DESC' }
);
