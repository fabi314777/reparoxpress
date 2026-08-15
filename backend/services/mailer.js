const nodemailer = require('nodemailer');

/**
 * Servicio de correo para enviar el comprobante de compra al cliente
 * desde el correo de la empresa.
 *
 * Mientras no completes las variables SMTP_* en tu .env, este módulo
 * no envía nada y no genera errores: la venta se guarda igual, solo
 * no se manda el correo. Apenas configures tus datos, empieza a
 * funcionar sin tocar nada más del código.
 *
 * ---------------------------------------------------------------------
 * CÓMO ACTIVARLO:
 *
 *   Si usas Gmail / Google Workspace para el correo de la empresa:
 *     1. Activa la verificación en 2 pasos en esa cuenta de Gmail.
 *     2. Ve a https://myaccount.google.com/apppasswords y crea una
 *        "contraseña de aplicación" (no uses tu contraseña normal).
 *     3. Completa en backend/.env:
 *          SMTP_HOST=smtp.gmail.com
 *          SMTP_PORT=465
 *          SMTP_USER=tu-correo@reparoxpress.cl
 *          SMTP_PASS=la_contraseña_de_aplicación_de_16_letras
 *          SMTP_FROM=tu-correo@reparoxpress.cl
 *          SMTP_FROM_NAME=ReparoXpress
 *
 *   Si usas otro proveedor (Outlook, un hosting propio, etc.), pide los
 *   datos SMTP (host, puerto, usuario, contraseña) a ese proveedor y
 *   ponlos igual en las mismas variables.
 * ---------------------------------------------------------------------
 */

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return cachedTransporter;
}

function money(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
}

async function sendReceiptEmail({ to, sale }) {
  if (!to) return { sent: false, reason: 'no_client_email' };

  const transporter = getTransporter();
  if (!transporter) return { sent: false, reason: 'not_configured' };

  const itemsHtml = sale.items
    .map(
      (it) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8e6;">
            ${it.name}
            ${it.notes ? `<br><span style="font-size:12px;color:#64766f;">${it.notes}</span>` : ''}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8e6;text-align:center;">${it.quantity}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8e6;text-align:right;">${money(it.price)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8e6;text-align:right;">${money(it.subtotal)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#142421;">
      <h2 style="color:#068562;margin-bottom:0;">ReparoXpress</h2>
      <p style="margin-top:4px;color:#64766f;">Comprobante de compra N° ${sale.id}</p>
      <p>Hola${sale.client_name ? ` ${sale.client_name}` : ''}, gracias por tu compra. Este es el detalle:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f4f7f6;">
            <th style="padding:6px 8px;text-align:left;">Ítem</th>
            <th style="padding:6px 8px;">Cant.</th>
            <th style="padding:6px 8px;text-align:right;">Precio</th>
            <th style="padding:6px 8px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;font-weight:bold;margin-top:10px;">Total: ${money(sale.total)}</p>
      <p style="font-size:12px;color:#64766f;margin-top:24px;">Este correo fue generado automáticamente por ReparoXpress.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'ReparoXpress'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `ReparoXpress — Comprobante de tu compra N° ${sale.id}`,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('❌ Error enviando correo de comprobante:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendReceiptEmail };
