const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Fotos de evidencia subidas (comprobantes, estado del dispositivo, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/services', require('./routes/services'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/cash-closures', require('./routes/cashClosures'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'reparoxpress-api' }));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ReparoXpress API corriendo en puerto ${PORT}`);
});
