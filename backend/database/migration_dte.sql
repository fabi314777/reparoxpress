-- ---------------------------------------------------------------
-- Migración opcional: agrega columnas de seguimiento de emisión
-- electrónica (DTE) a una base de datos que ya existe.
--
-- Solo necesitas correr este script si tu base de datos fue creada
-- ANTES de esta actualización. Si vas a crear la base de datos desde
-- cero, no lo necesitas: schema.sql ya incluye estas columnas.
--
-- Cómo usarlo en MySQL Workbench:
--   1. Abre este archivo.
--   2. Selecciona tu base de datos reparoxpress en el árbol izquierdo.
--   3. Ejecútalo (rayo ⚡).
-- ---------------------------------------------------------------

ALTER TABLE sales
  ADD COLUMN dte_status VARCHAR(20) NULL,
  ADD COLUMN dte_folio VARCHAR(40) NULL;
