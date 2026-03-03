require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { spiderQuery, spiderUpload, spiderDeleteFile, initDB } = require("./lib/spider");

const app = express();

// ─── Multer: solo memoria (no escribe al disco) ───────────────────────────────
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: MAX_SIZE },
	fileFilter: (req, file, cb) => {
		if (ALLOWED_MIME.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Tipo de archivo no permitido. Solo imágenes (jpg, png, webp, gif)."));
		}
	},
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set("trust proxy", 1);
const allowedOrigins = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"https://spider-web-test.vercel.app"
];
app.use(cors({
	origin: function (origin, callback) {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("No permitido por CORS"));
		}
	},
	credentials: true
}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ─── Auth Middleware ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret";

function isAuthenticated(req, res, next) {
	const token = req.cookies.jwt;
	if (token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			req.user = decoded;
			return next();
		} catch (err) {
			console.error("JWT verify error:", err.message);
		}
	}
	if (req.method !== "GET") return res.status(401).json({ error: "No autorizado" });
	if (req.originalUrl.startsWith("/admin")) return res.redirect("/login");
	next();
}

// Admin Protection (antes de static)
app.use("/admin", isAuthenticated);

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

// ─── GET /api/images/:id (Image Proxy) ─────────────────────────────────────────
// This must be BEFORE the generic /api auth middleware so it is always public
app.get("/api/images/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const fetch = require("node-fetch");
		const API_URL = process.env.SPIDER_API_URL || "http://190.220.229.45:7256/api/v1";

		const response = await fetch(`${API_URL}/storage/files/${id}`, {
			headers: { "X-API-KEY": process.env.SPIDER_API_KEY }
		});

		if (!response.ok) {
			const text = await response.text();
			console.error(`Error fetching image ${id} from Spider Storage: Status ${response.status}`, text);
			return res.status(response.status).send("Error fetching image");
		}

		// Pipe the image stream directly to the client
		res.set("Content-Type", response.headers.get("content-type"));
		res.set("Cache-Control", "public, max-age=31536000"); // Cache nicely

		response.body.pipe(res);
	} catch (err) {
		console.error("Image proxy error:", err);
		res.status(500).send("Internal Server Error");
	}
});

// API general auth (solo para escritura)
app.use("/api", (req, res, next) => {
	if (req.method !== "GET") return isAuthenticated(req, res, next);
	next();
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.get("/login", (req, res) =>
	res.sendFile(path.join(__dirname, "admin", "login.html"))
);

app.post("/login", (req, res) => {
	const { username, password } = req.body;
	if (
		username === process.env.ADMIN_USER &&
		password === process.env.ADMIN_PASSWORD
	) {
		const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 24 * 60 * 60 * 1000, // 24h
			sameSite: "lax"
		});
		return res.status(200).json({ success: true });
	}
	res.status(401).json({ error: "Credenciales inválidas" });
});

app.get("/logout", (req, res) => {
	res.clearCookie("jwt");
	res.redirect("/login");
});

app.get("/admin", (req, res) =>
	res.sendFile(path.join(__dirname, "admin", "index.html"))
);

app.get("/", (req, res) =>
	res.sendFile(path.join(__dirname, "index.html"))
);

// ─── Helper: mapear fila de BD al formato que espera el frontend ──────────────
function mapProject(row) {
	return {
		id: String(row.id),
		title: row.title,
		description: row.description,
		// If there's an image_file_id, use our internal proxy. Otherwise fallback to old URL if any.
		image: row.image_file_id ? `/api/images/${row.image_file_id}` : (row.image_url || ""),
		imageFileId: row.image_file_id,
		url: row.url || "",
	};
}
function mapSponsor(row) {
	return {
		id: String(row.id),
		name: row.name,
		url: row.url || "",
		image: row.image_file_id ? `/api/images/${row.image_file_id}` : (row.image_url || ""),
		imageFileId: row.image_file_id,
	};
}
function mapDesign(row) {
	return {
		id: String(row.id),
		title: row.title,
		description: row.description,
		image: row.image_file_id ? `/api/images/${row.image_file_id}` : (row.image_url || ""),
		imageFileId: row.image_file_id,
		clientName: row.client_name,
		clientLogo: row.client_logo_file_id ? `/api/images/${row.client_logo_file_id}` : (row.client_logo_url || ""),
		clientLogoFileId: row.client_logo_file_id,
		link: row.link || "",
	};
}

// ─── GET /api/data ────────────────────────────────────────────────────────────
app.get("/api/data", async (req, res) => {
	try {
		const [projectRows, sponsorRows, designRows] = await Promise.all([
			spiderQuery("SELECT * FROM projects ORDER BY created_at DESC"),
			spiderQuery("SELECT * FROM sponsors ORDER BY created_at DESC"),
			spiderQuery("SELECT * FROM designs ORDER BY created_at DESC"),
		]);
		res.json({
			projects: (projectRows || []).map(mapProject),
			sponsors: (sponsorRows || []).map(mapSponsor),
			designs: (designRows || []).map(mapDesign),
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error al obtener datos" });
	}
});

// ─── PROJECTS CRUD ────────────────────────────────────────────────────────────
app.post("/api/projects", upload.single("image"), async (req, res) => {
	try {
		const { title, description, url } = req.body;
		if (!title) return res.status(400).json({ error: "El título es requerido" });

		let imageUrl = null, imageFileId = null;
		if (req.file) {
			const uploaded = await spiderUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
			imageUrl = uploaded.fileUrl;
			imageFileId = uploaded.fileId;
		}

		const insertResult = await spiderQuery(
			"INSERT INTO projects (title, description, image_url, image_file_id, url) VALUES (?, ?, ?, ?, ?)",
			[title, description || null, imageUrl, imageFileId, url || null]
		);

		const newRow = await spiderQuery("SELECT * FROM projects WHERE id = ?", [insertResult.insertId]);
		res.status(201).json(mapProject(newRow[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.put("/api/projects/:id", upload.single("image"), async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, url } = req.body;

		// Obtener registro actual para imagen vieja
		const existing = await spiderQuery("SELECT * FROM projects WHERE id = ?", [id]);
		if (!existing || existing.length === 0) return res.status(404).json({ error: "Proyecto no encontrado" });
		const current = existing[0];

		let imageUrl = current.image_url;
		let imageFileId = current.image_file_id;

		if (req.file) {
			// Eliminar imagen vieja
			if (current.image_file_id) await spiderDeleteFile(current.image_file_id);
			const uploaded = await spiderUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
			imageUrl = uploaded.fileUrl;
			imageFileId = uploaded.fileId;
		}

		await spiderQuery(
			"UPDATE projects SET title=?, description=?, image_url=?, image_file_id=?, url=? WHERE id=?",
			[title || current.title, description ?? current.description, imageUrl, imageFileId, url ?? current.url, id]
		);

		const updated = await spiderQuery("SELECT * FROM projects WHERE id = ?", [id]);
		res.json(mapProject(updated[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.delete("/api/projects/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const rows = await spiderQuery("SELECT image_file_id FROM projects WHERE id = ?", [id]);
		if (rows && rows[0]?.image_file_id) await spiderDeleteFile(rows[0].image_file_id);
		await spiderQuery("DELETE FROM projects WHERE id = ?", [id]);
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// ─── SPONSORS CRUD ────────────────────────────────────────────────────────────
app.post("/api/sponsors", upload.single("image"), async (req, res) => {
	try {
		const { name, url } = req.body;
		if (!name) return res.status(400).json({ error: "El nombre es requerido" });

		let imageUrl = null, imageFileId = null;
		if (req.file) {
			const uploaded = await spiderUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
			imageUrl = uploaded.fileUrl;
			imageFileId = uploaded.fileId;
		}

		const insertResult = await spiderQuery(
			"INSERT INTO sponsors (name, url, image_url, image_file_id) VALUES (?, ?, ?, ?)",
			[name, url || null, imageUrl, imageFileId]
		);

		const newRow = await spiderQuery("SELECT * FROM sponsors WHERE id = ?", [insertResult.insertId]);
		res.status(201).json(mapSponsor(newRow[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.put("/api/sponsors/:id", upload.single("image"), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, url } = req.body;

		const existing = await spiderQuery("SELECT * FROM sponsors WHERE id = ?", [id]);
		if (!existing || existing.length === 0) return res.status(404).json({ error: "Sponsor no encontrado" });
		const current = existing[0];

		let imageUrl = current.image_url;
		let imageFileId = current.image_file_id;

		if (req.file) {
			if (current.image_file_id) await spiderDeleteFile(current.image_file_id);
			const uploaded = await spiderUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
			imageUrl = uploaded.fileUrl;
			imageFileId = uploaded.fileId;
		}

		await spiderQuery(
			"UPDATE sponsors SET name=?, url=?, image_url=?, image_file_id=? WHERE id=?",
			[name || current.name, url ?? current.url, imageUrl, imageFileId, id]
		);

		const updated = await spiderQuery("SELECT * FROM sponsors WHERE id = ?", [id]);
		res.json(mapSponsor(updated[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.delete("/api/sponsors/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const rows = await spiderQuery("SELECT image_file_id FROM sponsors WHERE id = ?", [id]);
		if (rows && rows[0]?.image_file_id) await spiderDeleteFile(rows[0].image_file_id);
		await spiderQuery("DELETE FROM sponsors WHERE id = ?", [id]);
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// ─── DESIGNS CRUD ─────────────────────────────────────────────────────────────
const designUpload = upload.fields([
	{ name: "image", maxCount: 1 },
	{ name: "clientLogo", maxCount: 1 },
]);

app.post("/api/designs", designUpload, async (req, res) => {
	try {
		const { title, description, clientName, link } = req.body;
		if (!title) return res.status(400).json({ error: "El título es requerido" });

		let imageUrl = null, imageFileId = null;
		let clientLogoUrl = null, clientLogoFileId = null;

		if (req.files?.["image"]?.[0]) {
			const f = req.files["image"][0];
			const up = await spiderUpload(f.buffer, f.originalname, f.mimetype);
			imageUrl = up.fileUrl;
			imageFileId = up.fileId;
		}
		if (req.files?.["clientLogo"]?.[0]) {
			const f = req.files["clientLogo"][0];
			const up = await spiderUpload(f.buffer, f.originalname, f.mimetype);
			clientLogoUrl = up.fileUrl;
			clientLogoFileId = up.fileId;
		}

		const insertResult = await spiderQuery(
			"INSERT INTO designs (title, description, image_url, image_file_id, client_name, client_logo_url, client_logo_file_id, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			[title, description || null, imageUrl, imageFileId, clientName || null, clientLogoUrl, clientLogoFileId, link || null]
		);

		const newRow = await spiderQuery("SELECT * FROM designs WHERE id = ?", [insertResult.insertId]);
		res.status(201).json(mapDesign(newRow[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.put("/api/designs/:id", designUpload, async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, clientName, link } = req.body;

		const existing = await spiderQuery("SELECT * FROM designs WHERE id = ?", [id]);
		if (!existing || existing.length === 0) return res.status(404).json({ error: "Diseño no encontrado" });
		const cur = existing[0];

		let imageUrl = cur.image_url, imageFileId = cur.image_file_id;
		let clientLogoUrl = cur.client_logo_url, clientLogoFileId = cur.client_logo_file_id;

		if (req.files?.["image"]?.[0]) {
			if (cur.image_file_id) await spiderDeleteFile(cur.image_file_id);
			const f = req.files["image"][0];
			const up = await spiderUpload(f.buffer, f.originalname, f.mimetype);
			imageUrl = up.fileUrl;
			imageFileId = up.fileId;
		}
		if (req.files?.["clientLogo"]?.[0]) {
			if (cur.client_logo_file_id) await spiderDeleteFile(cur.client_logo_file_id);
			const f = req.files["clientLogo"][0];
			const up = await spiderUpload(f.buffer, f.originalname, f.mimetype);
			clientLogoUrl = up.fileUrl;
			clientLogoFileId = up.fileId;
		}

		await spiderQuery(
			"UPDATE designs SET title=?, description=?, image_url=?, image_file_id=?, client_name=?, client_logo_url=?, client_logo_file_id=?, link=? WHERE id=?",
			[title || cur.title, description ?? cur.description, imageUrl, imageFileId, clientName ?? cur.client_name, clientLogoUrl, clientLogoFileId, link ?? cur.link, id]
		);

		const updated = await spiderQuery("SELECT * FROM designs WHERE id = ?", [id]);
		res.json(mapDesign(updated[0]));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.delete("/api/designs/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const rows = await spiderQuery("SELECT image_file_id, client_logo_file_id FROM designs WHERE id = ?", [id]);
		if (rows?.[0]) {
			if (rows[0].image_file_id) await spiderDeleteFile(rows[0].image_file_id);
			if (rows[0].client_logo_file_id) await spiderDeleteFile(rows[0].client_logo_file_id);
		}
		await spiderQuery("DELETE FROM designs WHERE id = ?", [id]);
		res.json({ success: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

// ─── Error handler para Multer ────────────────────────────────────────────────
app.use((err, req, res, next) => {
	if (err.code === "LIMIT_FILE_SIZE") {
		return res.status(400).json({ error: "El archivo supera el límite de 5MB." });
	}
	if (err.message && err.message.includes("Tipo de archivo")) {
		return res.status(400).json({ error: err.message });
	}
	console.error(err);
	res.status(500).json({ error: "Error interno del servidor" });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDB()
	.then(() => {
		app.listen(PORT, () =>
			console.log(`Servidor corriendo en http://localhost:${PORT}`)
		);
	})
	.catch((err) => {
		console.error("Error al inicializar la base de datos (Verificar conexión a IP remota):", err.message);
		// No hacemos process.exit(1) para permitir que el servidor local encienda (Proxy a Vercel/Remoto)
		app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT} (Sin DB confirmada)`));
	});

module.exports = app;
