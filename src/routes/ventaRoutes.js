const pool = require('../config/db');

const registrarVenta = async (req, res) => {
    const { nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, total, carrito } = req.body;
    const archivosCaptura = req.files; // Ahora recibimos un arreglo de archivos

    if (!carrito) {
        return res.status(400).json({ mensaje: 'Faltan los datos del carrito' });
    }

    if (metodo_pago === 'Yape/Plin' && (!archivosCaptura || archivosCaptura.length === 0)) {
        return res.status(400).json({ mensaje: 'Falta la captura de pantalla' });
    }

    // Unimos los links de las 2 imágenes separadas por una coma
    const urlCaptura = archivosCaptura && archivosCaptura.length > 0 
        ? archivosCaptura.map(file => file.path).join(',') 
        : '';

    const productosCarrito = JSON.parse(carrito);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); 

        const [resultVenta] = await connection.query(
            'INSERT INTO ventas (nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, url_captura, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, urlCaptura, total]
        );
        const ventaId = resultVenta.insertId; 

        for (const item of productosCarrito) {
            const [rows] = await connection.query('SELECT stock FROM productos WHERE id = ? FOR UPDATE', [item.id]);
            const stockActual = rows[0].stock;

            if (stockActual < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${item.nombre}.`);
            }

            await connection.query(
                'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [ventaId, item.id, item.cantidad, item.precio, item.cantidad * item.precio]
            );

            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.id]
            );
        }

        await connection.commit();
        res.status(201).json({ mensaje: 'Venta registrada', ventaId });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ mensaje: error.message || 'Error al procesar la venta' });
    } finally {
        connection.release();
    }
};

const obtenerVentas = async (req, res) => {
    try {
        const [ventas] = await pool.query('SELECT * FROM ventas ORDER BY fecha_hora DESC');
        for (let i = 0; i < ventas.length; i++) {
            const [detalles] = await pool.query(`
                SELECT d.cantidad, p.nombre, d.precio_unitario 
                FROM detalle_ventas d
                JOIN productos p ON d.producto_id = p.id
                WHERE d.venta_id = ?
            `, [ventas[i].id]);
            ventas[i].productos_vendidos = detalles; 
        }
        res.status(200).json(ventas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar las ventas' });
    }
};

// NUEVA FUNCIÓN: Eliminar y devolver stock
const eliminarVenta = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        // 1. Buscamos qué productos llevó esta venta
        const [detalles] = await connection.query('SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?', [id]);

        // 2. Devolvemos el stock sumando las cantidades
        for (const item of detalles) {
            await connection.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id]);
        }

        // 3. Borramos los registros
        await connection.query('DELETE FROM detalle_ventas WHERE venta_id = ?', [id]);
        await connection.query('DELETE FROM ventas WHERE id = ?', [id]);

        await connection.commit();
        res.status(200).json({ mensaje: 'Venta eliminada y stock restaurado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ mensaje: 'Error al eliminar la venta' });
    } finally {
        connection.release();
    }
};

module.exports = { registrarVenta, obtenerVentas, eliminarVenta };
