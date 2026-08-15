const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  let sql = `SELECT co.*, c.name AS client_name
             FROM collections co
             LEFT JOIN clients c ON c.id = co.client_id`;
  const where = [];
  const params = [];
  if (req.query.status) {
    where.push('co.status = ?');
    params.push(req.query.status);
  }
  if (req.query.client_id) {
    where.push('co.client_id = ?');
    params.push(req.query.client_id);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY co.due_date ASC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// body: { client_id, sale_id, amount_due, due_date, notes }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { client_id, sale_id, amount_due, due_date, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO collections (client_id, sale_id, amount_due, amount_paid, due_date, status, notes)
       VALUES (?, ?, ?, 0, ?, 'pendiente', ?)`,
      [client_id, sale_id || null, amount_due, due_date, notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM collections WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// Registrar un abono/pago
router.post('/:id/pay', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const [rows] = await pool.query('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });

    const record = rows[0];
    const newPaid = Number(record.amount_paid) + Number(amount);
    const status = newPaid >= Number(record.amount_due) ? 'pagada' : 'parcial';

    await pool.query('UPDATE collections SET amount_paid = ?, status = ? WHERE id = ?', [
      newPaid,
      status,
      req.params.id
    ]);
    const [updated] = await pool.query('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

module.exports = router;
