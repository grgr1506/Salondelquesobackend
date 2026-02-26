const express = require('express');
const router = express.Router();
const { obtenerProductos, actualizarStock } = require('../controllers/productoController');

// Ruta para listar el catálogo web: GET /api/productos
router.get('/', obtenerProductos);

// Ruta para que el admin edite el stock: PUT /api/productos/:id/stock
router.put('/:id/stock', actualizarStock);

module.exports = router;