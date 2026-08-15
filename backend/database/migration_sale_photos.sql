-- ---------------------------------------------------------------
-- Migración opcional: agrega la tabla de fotos de evidencia por venta
-- a una base de datos que ya existe.
--
-- Solo necesitas correr este script si tu base de datos fue creada
-- ANTES de esta actualización. Si vas a crear la base desde cero,
-- no lo necesitas: schema.sql ya incluye esta tabla.
--
-- Cómo usarlo en MySQL Workbench:
--   1. Abre este archivo.
--   2. Selecciona tu base de datos reparoxpress en el árbol izquierdo.
--   3. Ejecútalo (rayo ⚡).
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sale_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);
