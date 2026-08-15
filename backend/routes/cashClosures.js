const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  let sql = `SELECT cc.*, b.name AS branch_name, u.name AS user_name
             FROM cash_closures cc
             LEFT JOIN branches b ON b.id = cc.branch_id
             LEFT JOIN users u ON u.id = cc.user_id`;
  const params = [];
  if (req.query.branch_id) {
    sql += ' WHERE cc.branch_id = ?';
    params.push(req.query.branch_id);
  }
  sql += ' ORDER BY cc.closure_date DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// Calcula un resumen de caja del día (ventas y gastos) para prellenar el cierre
router.get('/summary', requireAuth, async (req, res) => {
  const { branch_id, date } = req.query;
  const day = date || new Date().toISOString().slice(0, 10);

  const [[salesRow]] = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total_sales, COUNT(*) AS sales_count
     FROM sales
     WHERE status = 'completada' AND DATE(created_at) = ? ${branch_id ? 'AND branch_id = ?' : ''}`,
    branch_id ? [day, branch_id] : [day]
  );

  const [[expensesRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_expenses
     FROM expenses
     WHERE expense_date = ? ${branch_id ? 'AND branch_id = ?' : ''}`,
    branch_id ? [day, branch_id] : [day]
  );

  res.json({
    date: day,
    total_sales: salesRow.total_sales,
    sales_count: salesRow.sales_count,
    total_expenses: expensesRow.total_expenses
  });
});

// body: { branch_id, closure_date, opening_amount, closing_amount, total_sales, total_expenses, notes }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { branch_id, closure_date, opening_amount, closing_amount, total_sales, total_expenses, notes } = req.body;
    const expected = Number(opening_amount) + Number(total_sales) - Number(total_expenses);
    const difference = Number(closing_amount) - expected;

    const [result] = await pool.query(
      `INSERT INTO cash_closures
       (branch_id, user_id, closure_date, opening_amount, closing_amount, total_sales, total_expenses, expected_amount, difference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id || null, req.user.id, closure_date, opening_amount, closing_amount,
        total_sales, total_expenses, expected, difference, notes || null
      ]
    );
    const [rows] = await pool.query('SELECT * FROM cash_closures WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

module.exports = router;
