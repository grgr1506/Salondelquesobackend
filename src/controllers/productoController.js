const pool = require('../config/db');

// Obtener todos los productos activos para el catálogo
const obtenerProductos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE estado = 1');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al cargar el catálogo' });
    }
};

// Actualizar el stock de un producto de forma básica (antiguo)
const actualizarStock = async (req, res) => {
    const { id } = req.params;
    const { nuevoStock } = req.body;

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

// NUEVO: Crear un producto y registrar stock inicial en el Kardex
const crearProducto = async (req, res) => {
    const { id, nombre, detalle, stock, precio, moneda } = req.body;
    try {
        await pool.query(
            'INSERT INTO productos (id, nombre, detalle, stock, precio) VALUES (?, ?, ?, ?, ?)',
            [id, nombre, `${detalle} (${moneda})`, stock, precio]
        );
        
        if (stock > 0) {
            await pool.query(
                'INSERT INTO historial_reposiciones (producto_id, nombre_producto, tipo, cantidad, nota, moneda, precio) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, nombre, 'INGRESO', stock, 'Stock inicial de registro de producto.', moneda, precio]
            );
        }
        res.status(201).json({ mensaje: 'Producto creado exitosamente' });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ mensaje: 'Error al registrar el producto en la base de datos' });
    }
};

// NUEVO: Ajustar Stock (Sumar o Quitar con Motivo)
const ajustarStock = async (req, res) => {
    const { producto_id, nombre_producto, tipo, cantidad, nota, moneda, precio } = req.body;
    const cambioStock = tipo === 'INGRESO' ? parseInt(cantidad) : -parseInt(cantidad);
    
    try {
        await pool.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cambioStock, producto_id]);
        
        await pool.query(
            'INSERT INTO historial_reposiciones (producto_id, nombre_producto, tipo, cantidad, nota, moneda, precio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [producto_id, nombre_producto, tipo, cantidad, nota, moneda, precio]
        );
        
        res.status(200).json({ mensaje: 'Stock ajustado correctamente e historial registrado.' });
    } catch (error) {
        console.error('Error al ajustar stock:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar el movimiento de almacén' });
    }
};

// NUEVO: Obtener el historial completo
const obtenerReposiciones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM historial_reposiciones ORDER BY fecha_hora DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al cargar el historial de reposiciones' });
    }
};

module.exports = {
    obtenerProductos,
    actualizarStock,
    crearProducto,
    ajustarStock,
    obtenerReposiciones
};
