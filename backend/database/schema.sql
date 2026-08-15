-- ============================================================
-- ReparoXpress - Esquema de base de datos
-- Ábrelo en MySQL Workbench y ejecútalo completo (rayo amarillo)
-- ============================================================

CREATE DATABASE IF NOT EXISTS reparoxpress
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE reparoxpress;

-- ---------------------------
-- Sucursales (multisucursal)
-- ---------------------------
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- Usuarios / soporte a usuarios
-- ---------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','gerente','vendedor','tecnico') NOT NULL DEFAULT 'vendedor',
  branch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ---------------------------
-- Clientes
-- ---------------------------
CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(150),
  address VARCHAR(255),
  rut VARCHAR(30),
  notes TEXT,
  branch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ---------------------------
-- Proveedores
-- ---------------------------
CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(150),
  phone VARCHAR(50),
  email VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- Productos / Inventario / Stock
-- ---------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(60) UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  cost DECIMAL(12,2) DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  branch_id INT NULL,
  supplier_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ---------------------------
-- Servicios técnicos (reparaciones)
-- ---------------------------
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- Tareas
-- ---------------------------
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('pendiente','en_progreso','completada') NOT NULL DEFAULT 'pendiente',
  priority ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  assigned_to INT NULL,
  due_date DATE NULL,
  branch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ---------------------------
-- Ventas (Documentos de venta / POS)
-- ---------------------------
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NULL,
  branch_id INT NULL,
  user_id INT NULL,
  payment_method ENUM('efectivo','tarjeta','transferencia','otro') NOT NULL DEFAULT 'efectivo',
  document_type ENUM('boleta','factura','nota_venta') NOT NULL DEFAULT 'boleta',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('completada','anulada') NOT NULL DEFAULT 'completada',
  dte_status VARCHAR(20) NULL,
  dte_folio VARCHAR(40) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NULL,
  service_id INT NULL,
  type ENUM('producto','servicio') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE TABLE sale_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- ---------------------------
-- Órdenes de compra a proveedores
-- ---------------------------
CREATE TABLE purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NULL,
  branch_id INT NULL,
  status ENUM('pendiente','recibida','cancelada') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------------------------
-- Gastos (fijos y variables)
-- ---------------------------
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  type ENUM('fijo','variable') NOT NULL DEFAULT 'variable',
  expense_date DATE NOT NULL,
  branch_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ---------------------------
-- Cierre de caja
-- ---------------------------
CREATE TABLE cash_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NULL,
  user_id INT NULL,
  closure_date DATE NOT NULL,
  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  difference DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------
-- Cobranza (cuentas por cobrar)
-- ---------------------------
CREATE TABLE collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  sale_id INT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status ENUM('pendiente','parcial','pagada') NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

-- Índices útiles para reportes y búsquedas frecuentes
CREATE INDEX idx_products_stock ON products (stock, min_stock);
CREATE INDEX idx_sales_created ON sales (created_at);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_collections_status ON collections (status);
