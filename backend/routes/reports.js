const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// periodo: diario | semanal | mensual
router.get('/sales', requireAuth, async (req, res) => {
  const { periodo = 'diario', branch_id } = req.query;

  let groupExpr = 'DATE(created_at)';
  if (periodo === 'semanal') groupExpr = 'YEARWEEK(created_at, 1)';
  if (periodo === 'mensual') groupExpr = "DATE_FORMAT(created_at, '%Y-%m')";

  let sql = `
    SELECT ${groupExpr} AS periodo, COUNT(*) AS cantidad_ventas, COALESCE(SUM(total),0) AS total
    FROM sales
    WHERE status = 'completada'
  `;
  const params = [];
  if (branch_id) {
    sql += ' AND branch_id = ?';
    params.push(branch_id);
  }
  sql += ` GROUP BY ${groupExpr} ORDER BY ${groupExpr} DESC LIMIT 60`;

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.get('/expenses', requireAuth, async (req, res) => {
  const { periodo = 'diario', branch_id } = req.query;

  let groupExpr = 'expense_date';
  if (periodo === 'semanal') groupExpr = 'YEARWEEK(expense_date, 1)';
  if (periodo === 'mensual') groupExpr = "DATE_FORMAT(expense_date, '%Y-%m')";

  let sql = `SELECT ${groupExpr} AS periodo, type, COALESCE(SUM(amount),0) AS total
             FROM expenses`;
  const params = [];
  if (branch_id) {
    sql += ' WHERE branch_id = ?';
    params.push(branch_id);
  }
  sql += ` GROUP BY ${groupExpr}, type ORDER BY ${groupExpr} DESC LIMIT 120`;

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.get('/inventory-value', requireAuth, async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(stock * cost),0) AS valor_costo,
            COALESCE(SUM(stock * price),0) AS valor_venta,
            COUNT(*) AS total_productos
     FROM products`
  );
  res.json(row);
});

router.get('/top-clients', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.name, COUNT(s.id) AS compras, COALESCE(SUM(s.total),0) AS total_gastado
     FROM sales s
     JOIN clients c ON c.id = s.client_id
     WHERE s.status = 'completada'
     GROUP BY c.id
     ORDER BY total_gastado DESC
     LIMIT 10`
  );
  res.json(rows);
});

module.exports = router;
