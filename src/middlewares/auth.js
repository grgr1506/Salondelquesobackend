// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ mensaje: 'No hay token provisto. Inicia sesión.' });

    try {
        // Quitamos la palabra "Bearer " que suele enviar el frontend
        const tokenLimpio = token.split(" ")[1] || token;
        const decodificado = jwt.verify(tokenLimpio, 'CLAVE_SECRETA_SISTEMA'); // En producción, esto debe ser una variable de entorno
        req.usuario = decodificado; // Guardamos los datos del usuario para la siguiente función
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o sesión expirada' });
    }
};

const esSuperAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'superadmin') {
        return res.status(403).json({ mensaje: 'Acceso denegado. Acción exclusiva para Super Administradores.' });
    }
    next();
};

module.exports = { verificarToken, esSuperAdmin };