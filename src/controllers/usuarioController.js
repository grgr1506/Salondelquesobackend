const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registrarUsuario = async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ mensaje: 'Usuario y contraseña obligatorios' });
    }
    try {
        const [existe] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya existe' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (username, password, role) VALUES (?, ?, ?)', [username, passwordHash, role || 'vendedor']);
        res.status(201).json({ mensaje: 'Usuario creado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
};

const loginUsuario = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }
        const usuario = rows[0];
        const coinciden = await bcrypt.compare(password, usuario.password);
        if (!coinciden) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, role: usuario.role },
            process.env.JWT_SECRET || 'secreto_seguro_feria',
            { expiresIn: '24h' }
        );
        res.status(200).json({
            token,
            id: usuario.id,
            username: usuario.username,
            role: usuario.role
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    }
};

const obtenerUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role FROM usuarios');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

// NUEVA FUNCIÓN: Eliminar colaborador de forma definitiva
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Regla de seguridad: Impedir auto-eliminación
        if (req.usuario && req.usuario.id == id) {
            return res.status(400).json({ mensaje: 'Operación no permitida: No puedes eliminar la cuenta con la que tienes la sesión abierta.' });
        }

        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.status(200).json({ mensaje: 'Usuario eliminado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno al intentar eliminar el usuario' });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerUsuarios,
    eliminarUsuario
};
