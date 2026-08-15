const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(
  'branches',
  ['name', 'address', 'phone'],
  { searchFields: ['name', 'address'], orderBy: 'name ASC' }
);
