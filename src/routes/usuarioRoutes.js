// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const { crearUsuario, login, obtenerUsuarios, actualizarRol, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken, esSuperAdmin } = require('../middlewares/auth');

// Ruta pública para iniciar sesión
router.post('/login', login);

// Rutas protegidas
router.post('/crear', verificarToken, esSuperAdmin, crearUsuario);

// OJO: Le quitamos el "esSuperAdmin" a esta ruta para que la cuenta "publico" 
// pueda leer la lista de vendedores y mostrarla en el menú desplegable.
router.get('/', verificarToken, obtenerUsuarios);

router.put('/:id/rol', verificarToken, esSuperAdmin, actualizarRol);

// NUEVA RUTA: Solo los SuperAdmins pueden eliminar personal
router.delete('/:id', verificarToken, esSuperAdmin, eliminarUsuario);

module.exports = router;
