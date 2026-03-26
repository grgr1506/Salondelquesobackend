// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const { crearUsuario, login, obtenerUsuarios, actualizarRol } = require('../controllers/usuarioController');
const { verificarToken, esSuperAdmin } = require('../middlewares/auth');

// Ruta pública para iniciar sesión
router.post('/login', login);

// OJO AQUÍ: Por ahora dejaremos esta ruta abierta para que puedas crear tu PRIMER usuario superadmin.
// Una vez que lo crees, cambiaremos esta línea para protegerla.
router.post('/crear', verificarToken, esSuperAdmin, crearUsuario);
router.get('/', verificarToken, esSuperAdmin, obtenerUsuarios);
router.put('/:id/rol', verificarToken, esSuperAdmin, actualizarRol);

module.exports = router;