const crudFactory = require('../utils/crudFactory');

module.exports = crudFactory(
  'services',
  ['name', 'description', 'category', 'price'],
  { searchFields: ['name', 'category'], orderBy: 'name ASC' }
);
