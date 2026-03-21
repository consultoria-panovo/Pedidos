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
  }
};

// Endpoint para leer Entregas de Pedidos de Compras (Filtrado)
app.get("/pedidos", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    // Consulta SQL con los filtros solicitados por el usuario
    const result = await pool.request().query(`
      SELECT 
          MATKL, 
          MATNR, 
          TXZ01, 
          EBELN, 
          EBELP, 
          WERKS, 
          EINDT
      FROM EntregasDePedidosDeCompras
      WHERE MATKL IN ('mm06', 'mp10') 
        AND WERKS IN ('PAL3', 'PAL4')
        AND EINDT >= '2026-01-01'  -- Solo pedidos del 2025 en adelante
      ORDER BY EINDT ASC;
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Puedes cambiar el puerto si vas a correr ambas APIs en el mismo servidor local
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`API Pedidos corriendo en puerto ${PORT} con filtros de material y centro`);
});
