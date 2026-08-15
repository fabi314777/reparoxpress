/**
 * Punto único de integración con un proveedor de Documentos Tributarios
 * Electrónicos (DTE) autorizado — boleta y factura electrónica válidas
 * ante el SII (Servicio de Impuestos Internos de Chile).
 *
 * Por defecto (DTE_PROVIDER=none o vacío) este módulo NO hace ninguna
 * llamada externa: solo responde que la emisión electrónica todavía no
 * está configurada. El resto del sistema (ventas, POS, comprobante
 * imprimible) sigue funcionando exactamente igual mientras tanto.
 *
 * ---------------------------------------------------------------------
 * CÓMO ACTIVAR LA EMISIÓN REAL (cuando lo decidas):
 *
 *   1. Elige un proveedor. El sistema propio y gratuito del SII
 *      (sii.cl → "Emisión de documentos tributarios electrónicos") es
 *      una opción, aunque requiere certificado digital y no tiene API
 *      pública sencilla. Para integrarte con este sistema por API sin
 *      manejar el protocolo del SII directamente, se suele usar un
 *      proveedor certificado, por ejemplo Haulmer/OpenFactura,
 *      SimpleFactura o Bsale — todos tienen planes gratuitos o de bajo
 *      costo para volúmenes chicos y una API REST documentada.
 *
 *   2. Crea una cuenta con ese proveedor y obtén tus credenciales
 *      (API key / token).
 *
 *   3. Completa estas variables en tu archivo backend/.env:
 *        DTE_PROVIDER=nombre_del_proveedor
 *        DTE_API_URL=https://api.delproveedor.com
 *        DTE_API_KEY=tu_api_key
 *
 *   4. Reemplaza el bloque marcado "TODO" más abajo por la llamada real
 *      a la API de ese proveedor, siguiendo su documentación. El resto
 *      del sistema (ruta /sales/:id/emit-dte y el botón en el frontend)
 *      ya está listo y no necesita cambios.
 * ---------------------------------------------------------------------
 */

async function emitDocument({ type, sale }) {
  const provider = (process.env.DTE_PROVIDER || 'none').trim().toLowerCase();

  if (!provider || provider === 'none') {
    return {
      ok: false,
      configured: false,
      message:
        'La emisión electrónica ante el SII todavía no está configurada. ' +
        'Revisa DTE_PROVIDER en tu archivo .env y las instrucciones en ' +
        'backend/services/dteProvider.js para conectar un proveedor autorizado.'
    };
  }

  // --- TODO: integración real con el proveedor elegido ---
  //
  // Ejemplo orientativo (ajusta nombres de campos según la documentación
  // real del proveedor que elijas — cada uno tiene su propio formato):
  //
  // const axios = require('axios');
  // const response = await axios.post(
  //   `${process.env.DTE_API_URL}/documentos`,
  //   {
  //     tipo_documento: type, // 'boleta' | 'factura'
  //     receptor: {
  //       rut: sale.client_rut || '66666666-6', // RUT genérico si es venta a cliente ocasional
  //       razon_social: sale.client_name || 'Cliente ocasional',
  //       direccion: sale.client_address || ''
  //     },
  //     items: sale.items.map((it) => ({
  //       nombre: it.product_name || it.service_name,
  //       cantidad: Number(it.quantity),
  //       precio_unitario: Number(it.price)
  //     })),
  //     total: Number(sale.total)
  //   },
  //   { headers: { Authorization: `Bearer ${process.env.DTE_API_KEY}` } }
  // );
  //
  // return {
  //   ok: true,
  //   configured: true,
  //   folio: response.data.folio,
  //   pdfUrl: response.data.pdf_url || null
  // };

  return {
    ok: false,
    configured: true,
    message: `El proveedor '${provider}' está configurado en .env, pero la llamada real a su API todavía no está implementada en backend/services/dteProvider.js (ver el bloque TODO en ese archivo).`
  };
}

module.exports = { emitDocument };
