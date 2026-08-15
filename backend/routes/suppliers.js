const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(
  'suppliers',
  ['name', 'contact_name', 'phone', 'email', 'notes'],
  { searchFields: ['name', 'contact_name', 'phone'], orderBy: 'name ASC' }
);
