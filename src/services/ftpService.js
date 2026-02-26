const ftp = require('basic-ftp');
const fs = require('fs');
require('dotenv').config();

const subirPorFTP = async (rutaLocal, nombreOriginal) => {
    const client = new ftp.Client();
    // client.ftp.verbose = true; // Descomenta esta línea si quieres ver los logs del FTP en la terminal

    // Limpiamos el nombre del archivo y le agregamos la fecha para evitar que se sobreescriban
    const nombreUnico = `${Date.now()}_${nombreOriginal.replace(/\s+/g, '_')}`;
    
    // Esta es la ruta exacta dentro de tu cPanel
    const rutaRemota = `/public_html/evento/capturas/${nombreUnico}`;

    try {
        // Conectamos a Webempresa usando las credenciales de tu .env
        await client.access({
            host: process.env.FTP_HOST, // suele ser tu dominio o la IP de Webempresa
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false // Si te da error de conexión, cámbialo a true (Webempresa a veces exige FTPS)
        });

        console.log("Conectado al servidor FTP. Subiendo imagen...");

        // Subimos el archivo de la carpeta temporal a Webempresa
        await client.uploadFrom(rutaLocal, rutaRemota);

        // Una vez subido con éxito, borramos el archivo temporal de nuestro servidor Node
        fs.unlinkSync(rutaLocal);

        // Retornamos la URL pública final para guardarla en la base de datos MySQL
        // IMPORTANTE: Cambia 'tudominio.com' por tu dominio real
        const urlPublica = `https://tudominio.com/evento/capturas/${nombreUnico}`;
        return urlPublica;

    } catch (error) {
        console.error("Error al subir archivo por FTP:", error);
        // Si falla, intentamos borrar el archivo temporal de todas formas
        if (fs.existsSync(rutaLocal)) fs.unlinkSync(rutaLocal);
        throw new Error("No se pudo subir la captura de pantalla a Webempresa");
    } finally {
        // Siempre cerramos la conexión FTP al terminar
        client.close();
    }
};

module.exports = { subirPorFTP };