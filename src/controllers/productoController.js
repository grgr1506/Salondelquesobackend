const pool = require('../config/db');

// Obtener todos los productos activos para el catálogo
const obtenerProductos = async (req, res) => {
    try {
        // Traemos todos los productos que estén activos (estado = 1)
        const [rows] = await pool.query('SELECT * FROM productos WHERE estado = 1');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al cargar el catálogo' });
    }
};

// Actualizar el stock de un producto (Vista Admin)
const actualizarStock = async (req, res) => {
    const { id } = req.params;
    const { nuevoStock } = req.body;

    // Validación básica
    if (nuevoStock === undefined || nuevoStock < 0) {
        return res.status(400).json({ mensaje: 'El nuevo stock no es válido' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE productos SET stock = ? WHERE id = ?',
            [nuevoStock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.status(200).json({ mensaje: 'Stock actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar el stock' });
    }
};

module.exports = {
    obtenerProductos,
    actualizarStock
};