const express = require("express");
const sql = require("mssql");
const app = express();
app.disable("x-powered-by");

// --- Seguridad: solo el proxy (edge function sap-proxy) puede llamar esta API ---
// La llave vive en la variable de entorno API_KEY de Render; nunca en el código.
const crypto = require("crypto");
function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) {
    // Falla cerrado: sin llave configurada no se sirve nada.
    console.error("API_KEY no configurada; solicitud rechazada");
    return res.status(503).json({ error: "service_unavailable" });
  }
  const given = req.get("x-api-key") || "";
  // Compara hashes de longitud fija para que el tiempo no revele la llave.
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}
// Ruta pública SOLO para el health check de Render (no devuelve datos).
// Va antes del candado; en Render: Settings -> Health Check Path = /healthz
app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.use(requireApiKey);

// Configuración desde variables de ambiente
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  requestTimeout: 60000 
};

// ---------------------------------------------------
// Endpoint para leer Pedidos PAL3
// ---------------------------------------------------
app.get("/pedidos/pal3", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT DISTINCT
          E.MATKL, 
          E.MATNR, 
          E.TXZ01, 
          E.EBELN, 
          E.EBELP, 
          E.WERKS, 
          E.EINDT,
          P.MENGE,
          P.MEINS
      FROM EntregasDePedidosDeCompras E
      INNER JOIN PedidosDeCompra_ekpo P 
          ON E.EBELN = P.EBELN 
         AND E.EBELP = P.EBELP 
         AND E.MATNR = P.MATNR
      WHERE E.MATKL IN ('mm06', 'mp10') 
        AND E.WERKS = 'PAL3'
        AND E.EINDT >= '2026-01-01'
      ORDER BY E.EINDT ASC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error en " + req.path + ":", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ---------------------------------------------------
// Endpoint para leer Pedidos PAL4
// ---------------------------------------------------
app.get("/pedidos/pal4", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT DISTINCT
          E.MATKL, 
          E.MATNR, 
          E.TXZ01, 
          E.EBELN, 
          E.EBELP, 
          E.WERKS, 
          E.EINDT,
          P.MENGE,
          P.MEINS
      FROM EntregasDePedidosDeCompras E
      INNER JOIN PedidosDeCompra_ekpo P 
          ON E.EBELN = P.EBELN 
         AND E.EBELP = P.EBELP 
         AND E.MATNR = P.MATNR
      WHERE E.MATKL IN ('mm06', 'mp10') 
        AND E.WERKS = 'PAL4'
        AND E.EINDT >= '2026-01-01'
      ORDER BY E.EINDT ASC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error en " + req.path + ":", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`API Pedidos corriendo en puerto ${PORT} dividida por centros PAL3 y PAL4`);
});
