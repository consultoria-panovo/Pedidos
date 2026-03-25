const express = require("express");
const sql = require("mssql");
const app = express();

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

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
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
        AND E.EINDT >= '2026-03-01'
        ORDER BY E.EINDT ASC;
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`API Pedidos corriendo en puerto ${PORT} dividida por centros PAL3 y PAL4`);
});
