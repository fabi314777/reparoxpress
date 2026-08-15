const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

const FIELDS = [
  'sku', 'name', 'category', 'description', 'cost', 'price',
  'stock', 'min_stock', 'branch_id', 'supplier_id'
];

// LISTAR (búsqueda + filtro de sucursal + solo bajo stock)
router.get('/', requireAuth, async (req, res) => {
  try {
    let sql = 'SELECT * FROM products';
    const params = [];
    const where = [];

    if (req.query.branch_id) {
      where.push('branch_id = ?');
      params.push(req.query.branch_id);
    }
    if (req.query.q) {
      where.push('(name LIKE ? OR sku LIKE ? OR category LIKE ?)');
      const like = `%${req.query.q}%`;
      params.push(like, like, like);
    }
    if (req.query.low_stock === 'true') {
      where.push('stock <= min_stock');
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY name ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

router.get('/low-stock/count', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE stock <= min_stock');
  res.json(rows[0]);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const values = FIELDS.map((f) => (req.body[f] !== undefined ? req.body[f] : null));
    const [result] = await pool.query(
      `INSERT INTO products (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`,
      values
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El SKU ya existe.' });
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const setClause = FIELDS.map((f) => `${f} = ?`).join(', ');
    const values = FIELDS.map((f) => (req.body[f] !== undefined ? req.body[f] : null));
    values.push(req.params.id);
    await pool.query(`UPDATE products SET ${setClause} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// Ajuste rápido de stock (entradas/salidas manuales)
router.patch('/:id/stock', requireAuth, async (req, res) => {
  try {
    const { delta } = req.body; // positivo suma, negativo resta
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta debe ser numérico.' });
    await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [delta, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// IMPORTAR PRODUCTOS DESDE OTRO SISTEMA (CSV ya parseado en el frontend)
// body: { rows: [{ sku, name, category, description, cost, price, stock, min_stock, branch_id, supplier_id }, ...] }
router.post('/import', requireAuth, async (req, res) => {
  const rawRows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (!rawRows.length) return res.status(400).json({ error: 'No se recibieron filas para importar.' });

  let inserted = 0;
  const errors = [];

  for (let i = 0; i < rawRows.length; i++) {
    const r = {};
    Object.keys(rawRows[i] || {}).forEach((k) => { r[k.trim().toLowerCase()] = rawRows[i][k]; });

    const name = (r.name || '').toString().trim();
    if (!name) {
      errors.push({ row: i + 2, reason: 'Falta el nombre (columna "name").' });
      continue;
    }

    const cost = r.cost !== undefined && r.cost !== '' ? Number(r.cost) : 0;
    const price = r.price !== undefined && r.price !== '' ? Number(r.price) : 0;
    const stock = r.stock !== undefined && r.stock !== '' ? Number(r.stock) : 0;
    const minStock = r.min_stock !== undefined && r.min_stock !== '' ? Number(r.min_stock) : 0;

    if ([cost, price, stock, minStock].some((n) => Number.isNaN(n))) {
      errors.push({ row: i + 2, reason: 'Costo, precio, stock o stock mínimo no son números válidos.' });
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO products (sku, name, category, description, cost, price, stock, min_stock, branch_id, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.sku || null,
          name,
          r.category || null,
          r.description || null,
          cost,
          price,
          stock,
          minStock,
          r.branch_id || null,
          r.supplier_id || null
        ]
      );
      inserted++;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        errors.push({ row: i + 2, reason: `El SKU "${r.sku}" ya existe.` });
      } else {
        errors.push({ row: i + 2, reason: friendlyDbError(err) });
      }
    }
  }

  res.json({ inserted, skipped: errors.length, errors });
});

module.exports = router;
