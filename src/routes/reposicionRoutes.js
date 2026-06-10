const express = require('express');
const router = express.Router();
const { obtenerReposiciones } = require('../controllers/productoController');

// Ruta principal para historial: GET /api/reposiciones
router.get('/', obtenerReposiciones);

module.exports = router;
