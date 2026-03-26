const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const usuarioRoutes = require('./routes/usuarioRoutes');

// Middlewares
app.use(cors()); // Permite peticiones de otros dominios
app.use(express.json()); // Permite leer JSON en el body
app.use(express.urlencoded({ extended: true }));
app.use('/capturas', express.static('uploads'));
app.use('/api/usuarios', usuarioRoutes);

// Endpoint de salud para UptimeRobot (Truco 24/7)
app.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor despierto' });
});

app.get('/ping', (req, res) => {
    res.status(200).send('OK');
});

// Aquí irán las rutas (las conectaremos en el siguiente paso)
 app.use('/api/productos', require('./routes/productoRoutes'));
app.use('/api/ventas', require('./routes/ventaRoutes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});