const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { registrarVenta, obtenerVentas, eliminarVenta } = require('../controllers/ventaController'); 

cloudinary.config({
  cloud_name: 'dorypdfsn', 
  api_key: '858336941967329', 
  api_secret: 'Yze-JuLBdYKgfrmn6IAQjCL58k8' 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'capturas_ventas',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.array('capturas', 2), registrarVenta);
router.get('/', obtenerVentas);
router.delete('/:id', eliminarVenta); 

module.exports = router;
