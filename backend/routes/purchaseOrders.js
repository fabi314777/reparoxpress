const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT po.*, s.name AS supplier_name, b.name AS branch_name
     FROM purchase_orders po
     LEFT JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN branches b ON b.id = po.branch_id
     ORDER BY po.created_at DESC`
  );
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [po] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
  if (!po.length) return res.status(404).json({ error: 'No encontrada' });
  const [items] = await pool.query(
    `SELECT poi.*, p.name AS product_name
     FROM purchase_order_items poi
     LEFT JOIN products p ON p.id = poi.product_id
     WHERE poi.purchase_order_id = ?`,
    [req.params.id]
  );
  res.json({ ...po[0], items });
});

// body: { supplier_id, branch_id, items: [{product_id, quantity, cost}] }
router.post('/', requireAuth, async (req, res) => {
  const { supplier_id, branch_id, items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'La orden debe tener al menos un ítem.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const total = items.reduce((sum, it) => sum + Number(it.cost) * Number(it.quantity), 0);
    const [result] = await conn.query(
      `INSERT INTO purchase_orders (supplier_id, branch_id, status, total)
       VALUES (?, ?, 'pendiente', ?)`,
      [supplier_id || null, branch_id || null, total]
    );
    const poId = result.insertId;
    for (const item of items) {
      await conn.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost)
         VALUES (?, ?, ?, ?)`,
        [poId, item.product_id, item.quantity, item.cost]
      );
    }
    await conn.commit();
    const [po] = await pool.query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
    res.status(201).json(po[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: friendlyDbError(err) });
  } finally {
    conn.release();
  }
});

// RECIBIR ORDEN (marca como recibida y suma el stock de cada producto)
router.post('/:id/receive', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?',
      [req.params.id]
    );
    for (const item of items) {
      await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
        item.quantity,
        item.product_id
      ]);
    }
    await conn.query("UPDATE purchase_orders SET status = 'recibida' WHERE id = ?", [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: friendlyDbError(err) });
  } finally {
    conn.release();
  }
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body; // pendiente | recibida | cancelada
  await pool.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
