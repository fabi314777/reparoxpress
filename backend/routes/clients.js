const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');
const crudFactory = require('../utils/crudFactory');

const router = crudFactory(
  'clients',
  ['name', 'phone', 'email', 'address', 'rut', 'notes', 'branch_id'],
  { branchScoped: true, searchFields: ['name', 'phone', 'email', 'rut'], orderBy: 'name ASC' }
);

// IMPORTAR CLIENTES DESDE OTRO SISTEMA (CSV ya parseado en el frontend)
// body: { rows: [{ name, phone, email, address, rut, notes, branch_id }, ...] }
router.post('/import', requireAuth, async (req, res) => {
  const rawRows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (!rawRows.length) return res.status(400).json({ error: 'No se recibieron filas para importar.' });

  let inserted = 0;
  const errors = [];

  for (let i = 0; i < rawRows.length; i++) {
    // Normaliza encabezados a minúscula (por si el CSV viene de Excel con mayúsculas)
    const r = {};
    Object.keys(rawRows[i] || {}).forEach((k) => { r[k.trim().toLowerCase()] = rawRows[i][k]; });

    const name = (r.name || '').toString().trim();
    if (!name) {
      errors.push({ row: i + 2, reason: 'Falta el nombre (columna "name").' });
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO clients (name, phone, email, address, rut, notes, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          r.phone || null,
          r.email || null,
          r.address || null,
          r.rut || null,
          r.notes || null,
          r.branch_id || null
        ]
      );
      inserted++;
    } catch (err) {
      errors.push({ row: i + 2, reason: friendlyDbError(err) });
    }
  }

  res.json({ inserted, skipped: errors.length, errors });
});

module.exports = router;
