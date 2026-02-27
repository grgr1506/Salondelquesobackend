const pool = require('../config/db');
// const { subirPorFTP } = require('../services/ftpService'); // Comentado temporalmente para la prueba local

const registrarVenta = async (req, res) => {
    // 1. Recibimos los datos del frontend (incluyendo los nuevos campos solicitados)
    const { nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, total, carrito } = req.body;
    const archivoCaptura = req.file; 

    if (!archivoCaptura || !carrito) {
        return res.status(400).json({ mensaje: 'Faltan datos o la captura de pantalla' });
    }

    // Convertimos el carrito que viene como texto (JSON) a un objeto de JavaScript
    const productosCarrito = JSON.parse(carrito);

    // SOLICITAMOS UNA CONEXIÓN EXCLUSIVA PARA LA TRANSACCIÓN
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // Empezamos la transacción ACID

        // PASO A: Capturar la URL que nos devuelve Cloudinary
        const urlCaptura = archivoCaptura.path;

        // PASO B: Registrar la Venta Principal en la tabla 'ventas'
        const [resultVenta] = await connection.query(
            'INSERT INTO ventas (nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, url_captura, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_vendedor, detalle_compra, metodo_pago, tipo_documento, celular, urlCaptura, total]
        );
        const ventaId = resultVenta.insertId; // Capturamos el ID de la venta recién creada

        // PASO C: Registrar el Detalle y Descontar Stock
        for (const item of productosCarrito) {
            // 1. Verificamos si hay stock suficiente bloqueando la fila momentáneamente
            const [rows] = await connection.query('SELECT stock FROM productos WHERE id = ? FOR UPDATE', [item.id]);
            const stockActual = rows[0].stock;

            if (stockActual < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${item.nombre}. Stock actual: ${stockActual}`);
            }

            // 2. Insertamos en el detalle de la venta
            await connection.query(
                'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [ventaId, item.id, item.cantidad, item.precio, item.cantidad * item.precio]
            );

            // 3. Descontamos el stock de la tabla productos
            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.id]
            );
        }

        // SI TODO SALIÓ BIEN, CONFIRMAMOS LOS CAMBIOS EN LA BASE DE DATOS
        await connection.commit();
        res.status(201).json({ mensaje: 'Venta registrada con éxito', ventaId });

    } catch (error) {
        // SI ALGO FALLÓ (ej. no había stock de un queso), REVERTIMOS TODO
        await connection.rollback();
        console.error('Error en la transacción de venta:', error);
        res.status(500).json({ mensaje: error.message || 'Error al procesar la venta' });
    } finally {
        // Siempre liberamos la conexión para que no se sature el servidor
        connection.release();
    }
};

// Función para listar el historial de ventas CON SUS PRODUCTOS INCLUIDOS
const obtenerVentas = async (req, res) => {
    try {
        // 1. Obtenemos todas las ventas principales ordenadas de la más reciente a la más antigua
        const [ventas] = await pool.query('SELECT * FROM ventas ORDER BY fecha_hora DESC');
        
        // 2. Buscamos el detalle (los productos) de cada venta
        for (let i = 0; i < ventas.length; i++) {
            const [detalles] = await pool.query(`
                SELECT d.cantidad, p.nombre, d.precio_unitario 
                FROM detalle_ventas d
                JOIN productos p ON d.producto_id = p.id
                WHERE d.venta_id = ?
            `, [ventas[i].id]);
            
            // Le inyectamos el arreglo de productos a la venta para que el frontend lo pueda iterar
            ventas[i].productos_vendidos = detalles; 
        }

        res.status(200).json(ventas);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al cargar las ventas' });
    }
};

module.exports = { 
    registrarVenta, 
    obtenerVentas 
};