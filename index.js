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

// Endpoint para leer Entregas de Pedidos de Compras (Uniendo EKPO para traer cantidad)
app.get("/pedidos", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    // Consulta SQL con INNER JOIN para traer la cantidad (MENGE) y Unidad (MEINS)
    const result = await pool.request().query(`
      SELECT DISTINCT
          E.MATKL, 
          E.MATNR, 
          E.TXZ01, 
          E.EBELN, 
          E.EBELP, 
          E.WERKS, 
          E.EINDT,
          P.MENGE,  -- <--- La cantidad viene de la tabla EKPO
          P.MEINS   -- <--- La unidad de medida (ej. KG, PZA)
      FROM EntregasDePedidosDeCompras E
      INNER JOIN PedidosDeCompra_ekpo P 
          ON E.EBELN = P.EBELN AND E.MATNR = P.MATNR
      WHERE E.MATKL IN ('mm06', 'mp10') 
        AND E.WERKS IN ('PAL3', 'PAL4')
        AND E.EINDT >= '2026-01-01'
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
  console.log(`API Pedidos corriendo en puerto ${PORT} con JOIN de cantidades`);
});
