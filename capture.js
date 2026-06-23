import { MongoClient } from 'mongodb';

// ===== CONFIGURACIÓN DE MONGODB =====
const MONGODB_URI = "mongodb+srv://brandongarcia20052312_db_user:5IBioCdw2RUWkEg3@cluster0.xauxee.w.mongodb.net/?appName=Cluster0";
const DB_NAME = "capturas";
const COLLECTION_NAME = "datos";

// ===== CONFIGURACIÓN DE OPENWA (RENDER) =====
const OPENWA_URL = "https://openwa-yosd.onrender.com/api";
const OPENWA_API_KEY = "owa_k1_6a7d1c5c078a27fcdc15b75f0cbd0ce8d74cd0dcfdea101f7e0ea4a0cb13237c";
const SESSION_ID = "mi-session"; // Cámbialo si usaste otro nombre
const DESTINO = "50672587762@c.us";

// ===== FUNCIÓN PARA GUARDAR EN MONGODB =====
async function guardarEnMongoDB(data) {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const documento = { ...data, capturadoEn: new Date().toISOString() };
        const result = await collection.insertOne(documento);
        console.log('✅ Datos guardados en MongoDB ID:', result.insertedId);
        await client.close();
        return result;
    } catch (error) {
        console.error('❌ Error guardando en MongoDB:', error.message);
        return null;
    }
}

// ===== FUNCIÓN PARA ENVIAR CON OPENWA =====
async function sendWhatsApp(mensaje) {
    const url = `${OPENWA_URL}/sessions/${SESSION_ID}/messages/send-text`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': OPENWA_API_KEY
            },
            body: JSON.stringify({ chatId: DESTINO, text: mensaje })
        });
        const result = await response.json();
        console.log('📩 Respuesta OpenWA:', result);
        return response.ok;
    } catch (error) {
        console.error('❌ Error enviando:', error.message);
        return false;
    }
}

// ===== CAPTURA DE DATOS (SIN PUPPETEER) =====
async function captureData() {
    console.log('🌐 Capturando datos...');
    try {
        const response = await fetch('https://mundial-simulator.vercel.app/');
        const html = await response.text();
        const cookies = response.headers.get('set-cookie') || '';
        
        // Extraer datos básicos del HTML
        const tokenMatch = html.match(/token[:\s]+["']([^"']+)["']/i);
        const userMatch = html.match(/user[:\s]+["']([^"']+)["']/i);
        const emailMatch = html.match(/email[:\s]+["']([^"']+)["']/i);
        
        return {
            url: 'https://mundial-simulator.vercel.app/',
            timestamp: new Date().toISOString(),
            cookies: cookies || 'No cookies',
            htmlSize: html.length,
            token: tokenMatch ? tokenMatch[1] : 'No token',
            user: userMatch ? userMatch[1] : 'No user',
            email: emailMatch ? emailMatch[1] : 'No email',
            title: 'Mundial Simulator'
        };
    } catch (error) {
        console.error('❌ Error capturando:', error.message);
        return null;
    }
}

// ===== FORMATEAR MENSAJE =====
function formatMessage(data) {
    return '🔴 CAPTURA COMPLETA 🔴\n' +
           '📅 ' + new Date(data.timestamp).toLocaleString() + '\n' +
           '🌐 ' + data.url + '\n\n' +
           '🍪 COOKIES:\n' + data.cookies + '\n\n' +
           '📄 TAMAÑO HTML: ' + data.htmlSize + ' bytes\n\n' +
           '🔑 TOKEN:\n' + data.token + '\n\n' +
           '👤 USUARIO:\n' + data.user + '\n\n' +
           '📧 EMAIL:\n' + data.email;
}

// ===== FUNCIÓN PRINCIPAL =====
async function main() {
    console.log('📅', new Date().toLocaleString());
    try {
        const data = await captureData();
        if (!data) {
            console.log('❌ No se pudieron capturar datos');
            return;
        }
        await guardarEnMongoDB(data);
        console.log('✅ Datos guardados en MongoDB');
        const mensaje = formatMessage(data);
        await sendWhatsApp(mensaje);
        console.log('✅ Proceso completado');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);
