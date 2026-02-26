const express = require('express');
const router = express.Router();
const multer = require('multer');

// AQUÍ ESTÁ EL TRUCO: Debes importar ambas funciones
const { registrarVenta, obtenerVentas } = require('../controllers/ventaController'); 

const upload = multer({ dest: 'uploads/' }); 

router.post('/', upload.single('captura'), registrarVenta);
router.get('/', obtenerVentas); // Ahora sí sabrá qué es esto

module.exports = router;