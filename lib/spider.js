/**
 * lib/spider.js
 * Helper para interactuar con la Spider API (SQL + Storage)
 */

require("dotenv").config();
const fetch = require("node-fetch");
const FormData = require("form-data");

const API_URL = process.env.SPIDER_API_URL;
const API_KEY = process.env.SPIDER_API_KEY;
const DB_NAME = process.env.SPIDER_DB_NAME;
const STORAGE_PROJECT_ID = process.env.SPIDER_STORAGE_PROJECT_ID;

const HEADERS = {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json",
};

/**
 * Ejecuta una query SQL en la Spider DB
 * @param {string} query - Query SQL (soporta placeholders ? con params)
 * @param {Array} [params=[]] - Parámetros para la query
 */
async function spiderQuery(query, params = []) {
    // Reemplazar ? por los valores escapados
    let finalQuery = query;
    if (params.length > 0) {
        let i = 0;
        finalQuery = query.replace(/\?/g, () => {
            const val = params[i++];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val;
            return `'${String(val).replace(/'/g, "''")}'`;
        });
    }

    const res = await fetch(`${API_URL}/query`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ database: DB_NAME, query: finalQuery }),
    });

    const json = await res.json();
    if (!json.success) {
        throw new Error(`Spider SQL error: ${json.error || JSON.stringify(json)}`);
    }
    return json.result;
}

/**
 * Sube un archivo al Spider Storage y devuelve { fileId, fileUrl }
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} originalname - Nombre original del archivo
 * @param {string} mimetype - MIME type del archivo
 */
async function spiderUpload(buffer, originalname, mimetype) {
    const form = new FormData();
    form.append("files", buffer, { filename: originalname, contentType: mimetype });

    const res = await fetch(
        `${API_URL}/storage/projects/${STORAGE_PROJECT_ID}/files`,
        {
            method: "POST",
            headers: { "X-API-KEY": API_KEY, ...form.getHeaders() },
            body: form,
        }
    );

    const json = await res.json();
    if (!json.success) {
        throw new Error(`Spider upload error: ${json.error || JSON.stringify(json)}`);
    }

    const file = json.files[0];
    return {
        fileId: String(file.id),
        fileUrl: `${API_URL}/storage/files/${file.id}`,
    };
}

/**
 * Elimina un archivo del Spider Storage
 * @param {string|number} fileId - ID del archivo a eliminar
 */
async function spiderDeleteFile(fileId) {
    if (!fileId) return;
    const res = await fetch(`${API_URL}/storage/files/${fileId}`, {
        method: "DELETE",
        headers: HEADERS,
    });
    const json = await res.json();
    return json;
}

/**
 * Crea las tablas necesarias si no existen
 */
async function initDB() {
    await spiderQuery(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT,
      image_file_id VARCHAR(100),
      url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    await spiderQuery(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(500),
      image_url TEXT,
      image_file_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    await spiderQuery(`
    CREATE TABLE IF NOT EXISTS designs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT,
      image_file_id VARCHAR(100),
      client_name VARCHAR(255),
      client_logo_url TEXT,
      client_logo_file_id VARCHAR(100),
      link VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log("[Spider DB] Tablas verificadas/creadas correctamente.");
}

module.exports = { spiderQuery, spiderUpload, spiderDeleteFile, initDB };
