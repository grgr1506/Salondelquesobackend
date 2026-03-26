// src/controllers/usuarioController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const crearUsuario = async (req, res) => {
    const { username, password, rol } = req.body;
    
    try {
        // Encriptar la contraseña (nadie podrá ver la clave real en la BD)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)',
            [username, passwordHash, rol]
        );
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear usuario. Es posible que el username ya exista.' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username]);
        
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado o inactivo' });
        }

        const usuario = rows[0];
        
        // Comparar la contraseña tipeada con la encriptada en la BD
        const passValido = await bcrypt.compare(password, usuario.password);
        if (!passValido) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Si es válido, creamos el Token que durará 8 horas
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, rol: usuario.rol },
            'CLAVE_SECRETA_SISTEMA',
            { expiresIn: '8h' } 
        );

        res.status(200).json({ 
            mensaje: 'Login exitoso', 
            token, 
            usuario: { username: usuario.username, rol: usuario.rol } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión' });
    }
};

module.exports = { crearUsuario, login, obtenerUsuarios, actualizarRol };