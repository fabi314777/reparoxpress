/**
 * Traduce errores comunes de MySQL a mensajes entendibles para el usuario.
 * Si no reconoce el error, devuelve el mensaje original (fallback seguro).
 */
function friendlyDbError(err) {
  switch (err.code) {
    case 'ER_ROW_IS_REFERENCED_2':
    case 'ER_ROW_IS_REFERENCED':
      return 'No se puede eliminar: este registro está siendo usado por otros datos del sistema (ventas, órdenes, etc.).';
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_NO_REFERENCED_ROW':
      return 'Uno de los datos seleccionados (sucursal, cliente, producto, proveedor) no existe o fue eliminado.';
    case 'ER_DUP_ENTRY':
      return 'Ya existe un registro con ese mismo valor único (por ejemplo, email o SKU repetido).';
    case 'ER_BAD_NULL_ERROR':
      return 'Falta un dato obligatorio. Revisa que todos los campos requeridos estén completos.';
    case 'ER_DATA_TOO_LONG':
      return 'Uno de los valores ingresados es demasiado largo para ese campo.';
    case 'ECONNREFUSED':
    case 'PROTOCOL_CONNECTION_LOST':
      return 'No se pudo conectar con la base de datos. Verifica que MySQL esté encendido.';
    default:
      return err.message;
  }
}

module.exports = { friendlyDbError };
