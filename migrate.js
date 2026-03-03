const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const API_URL = process.env.SPIDER_API_URL || 'http://192.168.100.164:3006/api/v1';
const API_KEY = process.env.SPIDER_API_KEY || '20ed16fd2f5001ebd7f5fa01f73e82f90abd9d99db4e2e24afa0954342008e8b';
const DB_NAME = process.env.SPIDER_DB_NAME || 'sw_Franco Calegari_spiderweb';
const STORAGE_PROJECT_ID = process.env.SPIDER_STORAGE_PROJECT_ID || '5';

const HEADERS = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json',
};

async function spiderQuery(query, params = []) {
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

// Function to determine MIME type based on file extension
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream'; // Default if unknown
    }
}

async function spiderUpload(filePath) {
    if (!filePath) return { fileUrl: null, fileId: null };

    // Resolve the path relative to the public directory
    const resolvedPath = path.join(__dirname, 'public', filePath.replace(/^\.\//, ''));

    if (!fs.existsSync(resolvedPath)) {
        console.warn(`[WARN] File not found: ${resolvedPath}. Skipping upload.`);
        return { fileUrl: null, fileId: null };
    }

    const buffer = fs.readFileSync(resolvedPath);
    const originalname = path.basename(resolvedPath);
    const mimetype = getMimeType(resolvedPath);

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

async function migrateData() {
    const dataFilePath = path.join(__dirname, 'public', 'assets', 'data', 'data.json');
    if (!fs.existsSync(dataFilePath)) {
        console.error(`Data file not found at ${dataFilePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    console.log(`Starting migration...`);

    // Migrate Projects
    if (data.projects && data.projects.length > 0) {
        console.log(`Migrating ${data.projects.length} projects...`);
        for (const project of data.projects) {
            console.log(`  - Processing project: ${project.title}`);
            const uploaded = await spiderUpload(project.image);
            await spiderQuery(
                "INSERT INTO projects (title, description, image_url, image_file_id, url) VALUES (?, ?, ?, ?, ?)",
                [project.title, project.description || null, uploaded.fileUrl, uploaded.fileId, project.url || null]
            );
        }
    }

    // Migrate Sponsors
    if (data.sponsors && data.sponsors.length > 0) {
        console.log(`Migrating ${data.sponsors.length} sponsors...`);
        for (const sponsor of data.sponsors) {
            console.log(`  - Processing sponsor: ${sponsor.name}`);
            const uploaded = await spiderUpload(sponsor.image);
            await spiderQuery(
                "INSERT INTO sponsors (name, url, image_url, image_file_id) VALUES (?, ?, ?, ?)",
                [sponsor.name, sponsor.url || null, uploaded.fileUrl, uploaded.fileId]
            );
        }
    }

    // Migrate Designs
    if (data.designs && data.designs.length > 0) {
        console.log(`Migrating ${data.designs.length} designs...`);
        for (const design of data.designs) {
            console.log(`  - Processing design: ${design.title}`);
            const imageUploaded = await spiderUpload(design.image);
            const logoUploaded = await spiderUpload(design.clientLogo);

            await spiderQuery(
                "INSERT INTO designs (title, description, image_url, image_file_id, client_name, client_logo_url, client_logo_file_id, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    design.title,
                    design.description || null,
                    imageUploaded.fileUrl,
                    imageUploaded.fileId,
                    design.clientName || null,
                    logoUploaded.fileUrl,
                    logoUploaded.fileId,
                    design.link || null
                ]
            );
        }
    }

    console.log('Migration completed successfully!');
}

migrateData().catch(console.error);
