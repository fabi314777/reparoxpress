const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const branchFilter = req.query.branch_id ? 'WHERE branch_id = ?' : '';
    const params = req.query.branch_id ? [req.query.branch_id] : [];

    const [[ventasHoy]] = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
       FROM sales WHERE status = 'completada' AND DATE(created_at) = CURDATE()
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}`,
      params
    );

    const [[ventasMes]] = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS total
       FROM sales WHERE status = 'completada'
       AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}`,
      params
    );

    const [[gastosMes]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total
       FROM expenses WHERE MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}`,
      params
    );

    const [[stockBajo]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products WHERE stock <= min_stock
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}`,
      params
    );

    const [[tareasPendientes]] = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks WHERE status != 'completada'
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}`,
      params
    );

    const [[cobranzaPendiente]] = await pool.query(
      `SELECT COALESCE(SUM(amount_due - amount_paid),0) AS total
       FROM collections WHERE status != 'pagada'`
    );

    const [ventasUltimos7Dias] = await pool.query(
      `SELECT DATE(created_at) AS fecha, COALESCE(SUM(total),0) AS total
       FROM sales
       WHERE status = 'completada' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       ${req.query.branch_id ? 'AND branch_id = ?' : ''}
       GROUP BY DATE(created_at)
       ORDER BY fecha ASC`,
      params
    );

    const [topProductos] = await pool.query(
      `SELECT p.name, SUM(si.quantity) AS cantidad
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completada' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY p.id
       ORDER BY cantidad DESC
       LIMIT 5`
    );

    res.json({
      ventas_hoy: ventasHoy,
      ventas_mes: ventasMes.total,
      gastos_mes: gastosMes.total,
      stock_bajo: stockBajo.total,
      tareas_pendientes: tareasPendientes.total,
      cobranza_pendiente: cobranzaPendiente.total,
      ventas_ultimos_7_dias: ventasUltimos7Dias,
      top_productos: topProductos
    });
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

module.exports = router;
