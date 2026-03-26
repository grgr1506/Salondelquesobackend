const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const crearUsuario = async (req, res) => {
    const { username, password, rol } = req.body;
    
    try {
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
        
        const passValido = await bcrypt.compare(password, usuario.password);
        if (!passValido) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

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

// --- NUEVAS FUNCIONES AGREGADAS ---

const obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT id, username, rol, activo FROM usuarios');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

const actualizarRol = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    try {
        await pool.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id]);
        res.status(200).json({ mensaje: 'Rol actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar rol' });
    }
};

// Exportamos TODAS las funciones juntas al final
module.exports = { crearUsuario, login, obtenerUsuarios, actualizarRol };