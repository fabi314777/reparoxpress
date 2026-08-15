const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
require('dotenv').config();
const { friendlyDbError } = require('../utils/dbError');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// CREAR USUARIO (solo admin)
router.post('/register', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, branch_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, branch_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, role, branch_id || null]
    );
    res.status(201).json({ id: result.insertId, name, email, role, branch_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese email ya está registrado.' });
    }
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// USUARIO ACTUAL
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, branch_id FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json(rows[0]);
});

// LISTAR USUARIOS (solo admin) - útil para asignar tareas
router.get('/users', requireAuth, requireRole('admin', 'gerente'), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, branch_id FROM users ORDER BY name ASC'
  );
  res.json(rows);
});

module.exports = router;
