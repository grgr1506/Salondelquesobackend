const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { registrarVenta, obtenerVentas } = require('../controllers/ventaController'); 

// 1. Configura tus credenciales de Cloudinary
// (Reemplaza estos valores con los de tu cuenta de Cloudinary)
cloudinary.config({
  cloud_name: 'dorypdfsn', 
  api_key: '858336941967329', 
  api_secret: 'Yze-JuLBdYKgfrmn6IAQjCL58k8' 
});

// 2. Configura el almacenamiento para que Multer lo envíe a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'capturas_ventas', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});

const upload = multer({ storage: storage });

// 3. Rutas
router.post('/', upload.single('captura'), registrarVenta);
router.get('/', obtenerVentas);

module.exports = router;