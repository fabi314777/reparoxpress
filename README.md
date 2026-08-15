# ReparoXpress — Sistema de Administración

Sistema web completo para administrar ReparoXpress: tareas, clientes, inventario,
servicios, proveedores, ventas (POS), documentos de venta, cierre de caja,
cobranza, órdenes de compra, gastos, reportes y multisucursal. Responsive:
funciona igual de bien en computador, tablet y celular (desde el navegador).

## Estructura del proyecto

```
reparoxpress/
├── backend/          → API en Node.js + Express + MySQL
│   ├── database/
│   │   ├── schema.sql   → crea la base de datos y todas las tablas
│   │   └── seed.sql     → datos iniciales (usuario admin de prueba)
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   └── .env.example
└── frontend/          → Panel web en React + Vite
    └── src/
```

## 1. Crear la base de datos (MySQL Workbench)

1. Abre **MySQL Workbench** y conéctate a tu servidor MySQL local.
2. Abre el archivo `backend/database/schema.sql` (File → Open SQL Script).
3. Ejecútalo completo (ícono del rayo ⚡ o Ctrl+Shift+Enter). Esto crea la
   base de datos `reparoxpress` con las 14 tablas.
4. Abre `backend/database/seed.sql` y ejecútalo también. Esto crea:
   - Una sucursal ("Sucursal Principal")
   - Un usuario administrador para poder entrar al sistema:
     - **Email:** `admin@reparoxpress.cl`
     - **Contraseña:** `admin123`
   - Algunos productos y servicios de ejemplo (puedes borrarlos después)

## 2. Configurar y correr el backend (VS Code)

1. Abre la carpeta `reparoxpress` completa en VS Code.
2. Abre una terminal en VS Code (`Ctrl+ñ` o Terminal → New Terminal) y entra al backend:
   ```bash
   cd backend
   npm install
   ```
3. Copia el archivo de variables de entorno y edítalo con tus datos reales de MySQL:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y coloca tu usuario y contraseña de MySQL (los mismos que usas
   en MySQL Workbench):
   ```
   DB_USER=root
   DB_PASSWORD=tu_password_real
   ```
4. Levanta el servidor:
   ```bash
   npm run dev
   ```
   Deberías ver: `✅ ReparoXpress API corriendo en http://localhost:4000`

   Si no tienes `nodemon` y `npm run dev` falla, usa `npm start` en su lugar.

## 3. Configurar y correr el frontend (VS Code)

En **otra terminal** de VS Code (deja el backend corriendo en la primera):

```bash
cd frontend
npm install
npm run dev
```

Abre el navegador en **http://localhost:5173**. Inicia sesión con:
- Email: `admin@reparoxpress.cl`
- Contraseña: `admin123`

### Usar el sistema desde tu celular/tablet en la misma red

Vite ya está configurado con `host: true`. Con el backend y frontend corriendo,
busca la IP local de tu computador (`ipconfig` en Windows, `ifconfig` en
Mac/Linux) y entra desde el navegador del celular a `http://TU_IP:5173`.
Si el celular no logra conectarse a la API, edita `frontend/.env` (créalo si
no existe) con:
```
VITE_API_URL=http://TU_IP:4000/api
```

## 4. Primeros pasos recomendados

1. Entra y cambia la contraseña del usuario admin (crea un usuario nuevo desde
   la API `/api/auth/register` o pídeme que agregue una pantalla de "Mi perfil").
2. Ve a **Sucursales** y agrega tus locales si tienes más de uno.
3. Ve a **Inventario** y carga tus productos reales (o edita los de ejemplo).
4. Ve a **Servicios** y carga tus reparaciones con sus precios.
5. Empieza a vender desde **Punto de Venta**.

## Módulos incluidos

| Módulo | Qué hace |
|---|---|
| Dashboard | Ventas del día/mes, gastos, alertas de stock bajo, tareas pendientes, cobranza pendiente, gráfico de ventas y top productos |
| Tareas | Administración de pendientes con estado, prioridad y fecha |
| Clientes | Ficha de cada cliente (contacto, RUT, notas) |
| Proveedores | Ficha de cada proveedor |
| Inventario / Stock | Productos con SKU, costo, precio, stock, stock mínimo y alerta visual de stock bajo, ajuste rápido de stock |
| Servicios | Catálogo de reparaciones y sus precios |
| Punto de Venta (POS) | Carrito de productos/servicios, descuenta stock automáticamente, genera boleta/factura/nota de venta |
| Documentos de Venta | Historial de ventas, ver detalle, anular (repone stock) |
| Órdenes de Compra | Pedidos a proveedores, al "recibir" suma el stock automáticamente |
| Gastos | Registro de gastos fijos y variables por categoría |
| Cierre de Caja | Cuadre diario: monto inicial + ventas − gastos vs. lo contado, calcula diferencia |
| Cobranza | Cuentas por cobrar a clientes, registro de abonos parciales |
| Reportes | Ventas diarias/semanales/mensuales, valor de inventario, mejores clientes |
| Multisucursal | Todo lo anterior se puede filtrar por sucursal desde el menú lateral |

## Lo que este entregable NO incluye todavía

Para que sepas exactamente qué falta si lo necesitas:

- **App móvil nativa** (iOS/Android): lo que tienes es una web responsive que
  funciona perfecto desde el navegador del celular, pero no es una app
  instalable de las tiendas de apps. Si la necesitas, es un proyecto aparte
  (React Native / Flutter) que puede reusar esta misma API.
- **Tienda online pública** (catálogo + checkout para tus clientes finales):
  este sistema es el panel de **administración interna**. Una tienda online
  de cara al público es otro front-end aparte, también puede reusar esta API.
- **Multiempresa / facturación electrónica ante el SII**: el sistema guarda
  documentos de venta (boleta/factura/nota) internamente, pero no timbra
  electrónicamente ante el SII. Eso requiere integrarse con un proveedor de
  facturación electrónica.

Dile a Claude cuando quieras seguir con cualquiera de estos tres puntos.

## Notas técnicas

- Backend: Node.js + Express + MySQL (mysql2) + JWT para autenticación.
- Frontend: React 18 + Vite + React Router + Recharts (gráficos) + Axios.
- Todo el diseño usa la paleta de marca de ReparoXpress (verde `#068562`,
  navy/teal oscuro `#013F4A`) y es responsive (sidebar en computador, menú
  inferior + drawer en celular/tablet).
