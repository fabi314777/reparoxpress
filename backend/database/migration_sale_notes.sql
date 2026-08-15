-- ---------------------------------------------------------------
-- Migración opcional: agrega la columna de notas (detalle del
-- dispositivo/servicio) a sale_items en una base de datos que ya existe.
--
-- Solo necesitas correr este script si tu base de datos fue creada
-- ANTES de esta actualización. Si vas a crear la base desde cero,
-- no lo necesitas: schema.sql ya incluye esta columna.
--
-- Cómo usarlo en MySQL Workbench:
--   1. Abre este archivo.
--   2. Selecciona tu base de datos reparoxpress en el árbol izquierdo.
--   3. Ejecútalo (rayo ⚡).
-- ---------------------------------------------------------------

ALTER TABLE sale_items
  ADD COLUMN notes TEXT NULL;
