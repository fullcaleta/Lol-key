const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 9000;

let clientMap = {}; // Mapa para almacenar IPs y sus nombres
let clientCounter = 0; // Contador para asignar nombres

// Configurar Express para confiar en los proxies
app.set('trust proxy', true);

// Middleware para registrar solicitudes y asignar nombres a las IPs
app.use(async (req, res, next) => {
    const userIp = req.ip; // IP del cliente

    // Verificar si la IP ya tiene un nombre asignado
    if (!clientMap[userIp]) {
        clientCounter++; // Incrementar el contador
        clientMap[userIp] = `Cliente ${clientCounter}`; // Asignar un nombre único
    }

    const clientId = clientMap[userIp]; // Obtener el nombre del cliente

    try {
        // Obtener la IP pública del cliente desde un servicio externo
        const response = await axios.get('https://api.ipify.org?format=json');
        const publicIp = response.data.ip;

        console.log(`Método: ${req.method}, URL: ${req.url} ////  IP pública: ${publicIp} //// -> ${clientId}`);
    } catch (error) {
        console.error('Error al obtener la IP pública:', error.message);
    }

    next();
});

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
