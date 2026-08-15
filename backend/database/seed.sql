-- ============================================================
-- Datos iniciales - ejecuta esto DESPUÉS de schema.sql
-- Crea una sucursal y un usuario administrador para poder entrar.
--
-- Usuario:    admin@reparoxpress.cl
-- Contraseña: admin123   (cámbiala apenas entres)
-- ============================================================

USE reparoxpress;

INSERT INTO branches (name, address, phone)
VALUES ('Sucursal Principal', 'Dirección de tu local', '+56 9 5905 1999');

INSERT INTO users (name, email, password_hash, role, branch_id)
VALUES (
  'Administrador',
  'admin@reparoxpress.cl',
  '$2a$10$HYBdMC8eXLiHHz/bL4kO6.NNV8hTqKM92wXS69rHu8gxEvRqhAurS',
  'admin',
  1
);

-- Algunos productos de ejemplo (puedes borrarlos luego)
INSERT INTO products (sku, name, category, cost, price, stock, min_stock, branch_id) VALUES
('PROD-001', 'Vidrio templado iPhone 13', 'Accesorios', 1500, 3990, 25, 5, 1),
('PROD-002', 'Batería genérica Samsung A32', 'Repuestos', 8000, 15990, 8, 3, 1),
('PROD-003', 'Cable USB-C 1m', 'Accesorios', 1200, 3490, 40, 10, 1);

INSERT INTO services (name, description, category, price) VALUES
('Cambio de pantalla iPhone', 'Reemplazo de pantalla original o genérica', 'Reparación', 45000),
('Cambio de batería', 'Reemplazo de batería con garantía de 3 meses', 'Reparación', 18000),
('Diagnóstico general', 'Revisión técnica completa del equipo', 'Diagnóstico', 0);
