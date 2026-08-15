const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');
const { friendlyDbError } = require('../utils/dbError');
const { emitDocument } = require('../services/dteProvider');
const { sendReceiptEmail } = require('../services/mailer');

const router = express.Router();

// LISTAR VENTAS (documentos de venta)
router.get('/', requireAuth, async (req, res) => {
  try {
    let sql = `
      SELECT s.*, c.name AS client_name, b.name AS branch_name, u.name AS user_name
      FROM sales s
      LEFT JOIN clients c ON c.id = s.client_id
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN users u ON u.id = s.user_id
    `;
    const where = [];
    const params = [];
    if (req.query.branch_id) {
      where.push('s.branch_id = ?');
      params.push(req.query.branch_id);
    }
    if (req.query.from) {
      where.push('s.created_at >= ?');
      params.push(req.query.from);
    }
    if (req.query.to) {
      where.push('s.created_at <= ?');
      params.push(req.query.to);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY s.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// DETALLE DE UNA VENTA (con sus items)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [sales] = await pool.query(
      `SELECT s.*, c.name AS client_name, c.rut AS client_rut, c.address AS client_address, c.phone AS client_phone,
              b.name AS branch_name, b.address AS branch_address, b.phone AS branch_phone
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       LEFT JOIN branches b ON b.id = s.branch_id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!sales.length) return res.status(404).json({ error: 'No encontrada' });
    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name, sv.name AS service_name
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN services sv ON sv.id = si.service_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );
    const [photos] = await pool.query(
      'SELECT id, file_path, created_at FROM sale_photos WHERE sale_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ ...sales[0], items, photos });
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// CREAR VENTA (Punto de Venta) - documento tipo boleta/factura
// body: { client_id, branch_id, payment_method, document_type, items: [{product_id|service_id, type, quantity, price}] }
router.post('/', requireAuth, async (req, res) => {
  const { client_id, branch_id, payment_method, document_type, items } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'La venta debe tener al menos un ítem.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);

    const [saleResult] = await conn.query(
      `INSERT INTO sales (client_id, branch_id, user_id, payment_method, document_type, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'completada')`,
      [client_id || null, branch_id || null, req.user.id, payment_method || 'efectivo', document_type || 'boleta', total]
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      const subtotal = Number(item.price) * Number(item.quantity);
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, service_id, type, quantity, price, subtotal, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.type === 'producto' ? item.product_id : null,
          item.type === 'servicio' ? item.service_id : null,
          item.type,
          item.quantity,
          item.price,
          subtotal,
          item.notes || null
        ]
      );

      // Descuenta stock solo si es producto
      if (item.type === 'producto' && item.product_id) {
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
          item.quantity,
          item.product_id
        ]);
      }
    }

    await conn.commit();

    const [sale] = await pool.query(
      `SELECT s.*, c.name AS client_name, c.email AS client_email
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       WHERE s.id = ?`,
      [saleId]
    );

    // Envío del comprobante por correo: si falla o no está configurado,
    // la venta ya quedó guardada de todas formas — nunca se revierte por esto.
    let email = { sent: false, reason: 'no_client_email' };
    try {
      if (sale[0].client_email) {
        const [savedItems] = await pool.query(
          `SELECT si.*, p.name AS product_name, sv.name AS service_name
           FROM sale_items si
           LEFT JOIN products p ON p.id = si.product_id
           LEFT JOIN services sv ON sv.id = si.service_id
           WHERE si.sale_id = ?`,
          [saleId]
        );
        email = await sendReceiptEmail({
          to: sale[0].client_email,
          sale: {
            id: sale[0].id,
            total: sale[0].total,
            client_name: sale[0].client_name,
            items: savedItems.map((it) => ({
              name: it.product_name || it.service_name,
              notes: it.notes,
              quantity: it.quantity,
              price: it.price,
              subtotal: it.subtotal
            }))
          }
        });
      }
    } catch (err) {
      email = { sent: false, reason: err.message };
    }

    res.status(201).json({ ...sale[0], email });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: friendlyDbError(err) });
  } finally {
    conn.release();
  }
});

// ANULAR VENTA (repone stock)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    for (const item of items) {
      if (item.type === 'producto' && item.product_id) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
          item.quantity,
          item.product_id
        ]);
      }
    }
    await conn.query("UPDATE sales SET status = 'anulada' WHERE id = ?", [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: friendlyDbError(err) });
  } finally {
    conn.release();
  }
});

// EMITIR DOCUMENTO TRIBUTARIO ELECTRÓNICO (boleta/factura real ante el SII)
// Mientras no haya un proveedor DTE configurado en .env, responde con un
// mensaje claro y no afecta el resto del flujo de la venta.
router.post('/:id/emit-dte', requireAuth, async (req, res) => {
  try {
    const { type } = req.body; // 'boleta' | 'factura'
    const [sales] = await pool.query(
      `SELECT s.*, c.name AS client_name, c.rut AS client_rut, c.address AS client_address
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!sales.length) return res.status(404).json({ error: 'Venta no encontrada' });

    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name, sv.name AS service_name
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN services sv ON sv.id = si.service_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    const sale = { ...sales[0], items };
    const result = await emitDocument({ type: type || sale.document_type, sale });

    if (result.ok) {
      await pool.query(`UPDATE sales SET dte_status = 'emitido', dte_folio = ? WHERE id = ?`, [
        result.folio || null,
        req.params.id
      ]);
    }

    res.status(result.ok ? 200 : 501).json(result);
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

// SUBIR FOTOS DE EVIDENCIA (hasta 6 por vez, 5MB c/u)
router.post('/:id/photos', requireAuth, (req, res) => {
  uploadPhotos.array('photos', 6)(req, res, async (uploadErr) => {
    if (uploadErr) {
      const msg =
        uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'Cada foto debe pesar menos de 5MB.'
          : uploadErr.code === 'LIMIT_FILE_COUNT'
          ? 'Puedes subir hasta 6 fotos por vez.'
          : uploadErr.message || 'No se pudieron subir las fotos.';
      return res.status(400).json({ error: msg });
    }

    try {
      const [sales] = await pool.query('SELECT id FROM sales WHERE id = ?', [req.params.id]);
      if (!sales.length) return res.status(404).json({ error: 'Venta no encontrada' });

      const files = req.files || [];
      const inserted = [];
      for (const file of files) {
        const filePath = `/uploads/sales/${file.filename}`;
        const [result] = await pool.query(
          'INSERT INTO sale_photos (sale_id, file_path) VALUES (?, ?)',
          [req.params.id, filePath]
        );
        inserted.push({ id: result.insertId, file_path: filePath });
      }
      res.status(201).json({ photos: inserted });
    } catch (err) {
      res.status(500).json({ error: friendlyDbError(err) });
    }
  });
});

// ELIMINAR UNA FOTO DE EVIDENCIA
router.delete('/:id/photos/:photoId', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sale_photos WHERE id = ? AND sale_id = ?',
      [req.params.photoId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Foto no encontrada' });

    await pool.query('DELETE FROM sale_photos WHERE id = ?', [req.params.photoId]);

    const absolutePath = path.join(__dirname, '..', rows[0].file_path.replace('/uploads/', 'uploads/'));
    fs.unlink(absolutePath, () => {}); // si el archivo ya no está en disco, no es un error fatal

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: friendlyDbError(err) });
  }
});

module.exports = router;
