const express = require('express');
const router = express.Router();
const { obtenerProductos, actualizarStock, crearProducto, ajustarStock } = require('../controllers/productoController');

// Ruta para listar el catálogo web: GET /api/productos
router.get('/', obtenerProductos);

// NUEVO: Ruta para crear un producto: POST /api/productos
router.post('/', crearProducto);

// NUEVO: Ruta para ajustar stock con nota: POST /api/productos/ajustar-stock
router.post('/ajustar-stock', ajustarStock);

// Ruta para que el admin edite el stock directamente: PUT /api/productos/:id/stock
router.put('/:id/stock', actualizarStock);

module.exports = router;
