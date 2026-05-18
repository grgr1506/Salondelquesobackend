const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const auth = require('../middlewares/auth');

router.post('/registrar', usuarioController.registrarUsuario);
router.post('/login', usuarioController.loginUsuario);
router.get('/', auth, usuarioController.obtenerUsuarios);
router.delete('/:id', auth, usuarioController.eliminarUsuario); // NUEVA RUTA PARA ELIMINAR

module.exports = router;
