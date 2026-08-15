const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { friendlyDbError } = require('./dbError');

/**
 * Crea un router CRUD genérico para una tabla simple.
 * @param {string} table - nombre de la tabla en MySQL
 * @param {string[]} fields - columnas que se pueden crear/editar (sin id ni timestamps)
 * @param {object} opts - { branchScoped: boolean, searchFields: string[], orderBy: string }
 */
function crudFactory(table, fields, opts = {}) {
  const router = express.Router();
  const { branchScoped = false, searchFields = [], orderBy = 'id DESC' } = opts;

  // LISTAR (con búsqueda simple opcional vía ?q=)
  router.get('/', requireAuth, async (req, res) => {
    try {
      let sql = `SELECT * FROM ${table}`;
      const params = [];
      const where = [];

      if (branchScoped && req.query.branch_id) {
        where.push('branch_id = ?');
        params.push(req.query.branch_id);
      }

      if (req.query.q && searchFields.length) {
        const like = `%${req.query.q}%`;
        where.push('(' + searchFields.map((f) => `${f} LIKE ?`).join(' OR ') + ')');
        searchFields.forEach(() => params.push(like));
      }

      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ` ORDER BY ${orderBy}`;

      const [rows] = await pool.query(sql, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });

  // OBTENER UNO
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });

  // CREAR
  router.post('/', requireAuth, async (req, res) => {
    try {
      const values = fields.map((f) => (req.body[f] !== undefined ? req.body[f] : null));
      const placeholders = fields.map(() => '?').join(', ');
      const [result] = await pool.query(
        `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });

  // ACTUALIZAR
  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => (req.body[f] !== undefined ? req.body[f] : null));
      values.push(req.params.id);
      await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });

  // ELIMINAR
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });

  return router;
}

module.exports = crudFactory;
