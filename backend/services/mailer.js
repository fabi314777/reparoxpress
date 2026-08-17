const nodemailer = require('nodemailer');

/**
 * Servicio de correo para enviar el comprobante de compra al cliente
 * desde el correo de la empresa.
 *
 * Tiene DOS formas de enviar, en este orden de preferencia:
 *
 *   1. Resend (por HTTPS) — RECOMENDADO si tu backend está en Railway,
 *      Render, o cualquier hosting gratuito. Estas plataformas suelen
 *      bloquear las conexiones SMTP salientes (puertos 587/465) por
 *      seguridad, lo que causa errores de "Connection timeout" con
 *      Gmail u otros SMTP. Resend evita ese problema porque manda el
 *      correo por una simple llamada HTTPS, igual que cualquier otra
 *      petición a una API.
 *
 *   2. SMTP tradicional (Gmail, Outlook, etc.) — funciona bien en tu
 *      compu local, pero puede fallar con "Connection timeout" en
 *      hostings que bloquean esos puertos.
 *
 * Mientras no completes NINGUNA de las dos, este módulo no envía nada
 * y no genera errores: la venta se guarda igual, solo no se manda el
 * correo.
 *
 * ---------------------------------------------------------------------
 * CÓMO ACTIVAR RESEND (recomendado):
 *   1. Crea una cuenta gratis en https://resend.com
 *   2. Ve a "API Keys" → "Create API Key" y cópiala.
 *   3. Para poder mandar correos a tus clientes reales (no solo a ti
 *      mismo), ve a "Domains" → "Add Domain", agrega reparoxpress.cl
 *      (o el dominio de tu correo) y sigue las instrucciones para
 *      agregar los registros DNS que te piden (donde compraste el
 *      dominio). Mientras el dominio no esté verificado, Resend solo
 *      te deja enviar correos de prueba a tu propia cuenta.
 *   4. Agrega en las variables de entorno de Railway/Render:
 *        RESEND_API_KEY=la_api_key_que_copiaste
 *        SMTP_FROM=comprobantes@reparoxpress.cl  (debe ser del dominio verificado)
 *        SMTP_FROM_NAME=ReparoXpress
 *
 * CÓMO ACTIVAR SMTP (alternativa, mejor para uso 100% local):
 *   Completa en backend/.env (o en las variables del hosting):
 *     SMTP_HOST=smtp.gmail.com
 *     SMTP_PORT=465
 *     SMTP_USER=tu-correo@reparoxpress.cl
 *     SMTP_PASS=la_contraseña_de_aplicación_de_16_letras
 *     SMTP_FROM=tu-correo@reparoxpress.cl
 *     SMTP_FROM_NAME=ReparoXpress
 * ---------------------------------------------------------------------
 */

function money(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
}

function buildReceiptHtml(sale) {
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

  return `
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
}

async function sendViaResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${process.env.SMTP_FROM_NAME || 'ReparoXpress'} <${process.env.SMTP_FROM || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend respondió ${response.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

let cachedTransporter;
function getSmtpTransporter() {
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

async function sendReceiptEmail({ to, sale }) {
  if (!to) return { sent: false, reason: 'no_client_email' };

  const subject = `ReparoXpress — Comprobante de tu compra N° ${sale.id}`;
  const html = buildReceiptHtml(sale);

  // Prioridad 1: Resend (HTTPS, no lo bloquean los hostings gratuitos)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend({ to, subject, html });
      return { sent: true };
    } catch (err) {
      console.error('❌ Error enviando correo con Resend:', err.message);
      return { sent: false, reason: err.message };
    }
  }

  // Prioridad 2: SMTP tradicional
  const transporter = getSmtpTransporter();
  if (!transporter) return { sent: false, reason: 'not_configured' };

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'ReparoXpress'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('❌ Error enviando correo por SMTP:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendReceiptEmail };
