const express = require('express');
const router = express.Router();

// Importamos los archivos completos para evitar errores de desincronización
const usuarioController = require('../controllers/usuarioController');
const auth = require('../middlewares/auth');

// 1. Iniciar sesión (Pública)
router.post('/login', usuarioController.login);

// 2. Crear usuario (Protegida)
router.post('/crear', auth.verificarToken, auth.esSuperAdmin, usuarioController.crearUsuario);

// 3. Obtener usuarios (Sin 'esSuperAdmin' para que la cuenta 'publico' pueda leerlos)
router.get('/', auth.verificarToken, usuarioController.obtenerUsuarios);

// 4. Actualizar rol (Protegida)
router.put('/:id/rol', auth.verificarToken, auth.esSuperAdmin, usuarioController.actualizarRol);

// 5. Eliminar usuario (Protegida)
router.delete('/:id', auth.verificarToken, auth.esSuperAdmin, usuarioController.eliminarUsuario);

module.exports = router;
