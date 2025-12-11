const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const multer = require("multer");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "assets", "data", "data.json");

// --- Multer Configuration ---
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "assets/img/uploads/");
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});
const upload = multer({ storage: storage });

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Handle URL encoded data too
app.use(
	session({
		secret: "spiderweb-secret-key-123",
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

// --- Auth Middleware ---
// Define it BEFORE static files to ensure it intercepts requests
function isAuthenticated(req, res, next) {
	if (req.session.user) {
		return next();
	}
	// Block API Write Methods
	if (req.method !== "GET") {
		return res.status(401).json({ error: "Unauthorized" });
	}
	// Block Admin Page Access
	if (req.originalUrl.startsWith("/admin")) {
		return res.redirect("/login");
	}
	next();
}

// Admin Protection (Must be before static to protect admin/index.html)
app.use("/admin", isAuthenticated);

// Static files
app.use(express.static(__dirname));

// --- Helpers ---
function readData() {
	try {
		const data = fs.readFileSync(DATA_FILE, "utf8");
		return JSON.parse(data);
	} catch (err) {
		return { projects: [], sponsors: [] };
	}
}

function writeData(data) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Routes ---

// Auth
app.get("/login", (req, res) => {
	res.sendFile(path.join(__dirname, "admin", "login.html"));
});

app.post("/login", (req, res) => {
	const { username, password } = req.body;
	if (username === "admin" && password === "admin") {
		req.session.user = { username };
		res.status(200).json({ success: true });
	} else {
		res.status(401).json({ error: "Invalid credentials" });
	}
});

app.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/login");
});

// Admin Page Route (Backup for explicit /admin request, though static might catch it now if auth passes)
app.get("/admin", (req, res) => {
	res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// Explicit Root Route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "index.html"));
});

// API Middleware for Auth on /api
app.use("/api", (req, res, next) => {
	if (req.method !== "GET") {
		return isAuthenticated(req, res, next);
	}
	next();
});

// GET Data
app.get("/api/data", (req, res) => {
	res.json(readData());
});

// Projects
app.post("/api/projects", upload.single("image"), (req, res) => {
	const data = readData();
	// Safety check for req.body
	const newProject = req.body || {};
	newProject.id = Date.now().toString();

	if (req.file) {
		newProject.image = "./assets/img/uploads/" + req.file.filename;
	}

	// Ensure array exists
	if (!data.projects) data.projects = [];
	data.projects.push(newProject);
	writeData(data);
	res.json(newProject);
});

app.put("/api/projects/:id", upload.single("image"), (req, res) => {
	const data = readData();
	const { id } = req.params;
	if (!data.projects) data.projects = [];

	const projectIndex = data.projects.findIndex((p) => p.id === id);

	if (projectIndex !== -1) {
		const updatedProject = {
			...data.projects[projectIndex],
			...(req.body || {}),
		};

		if (req.file) {
			updatedProject.image = "./assets/img/uploads/" + req.file.filename;
		}

		data.projects[projectIndex] = updatedProject;
		writeData(data);
		res.json(data.projects[projectIndex]);
	} else {
		res.status(404).json({ error: "Project not found" });
	}
});

app.delete("/api/projects/:id", (req, res) => {
	const data = readData();
	const { id } = req.params;
	if (data.projects) {
		data.projects = data.projects.filter((p) => p.id !== id);
		writeData(data);
	}
	res.json({ success: true });
});

// Sponsors
app.post("/api/sponsors", upload.single("image"), (req, res) => {
	const data = readData();
	const newSponsor = req.body || {};
	newSponsor.id = Date.now().toString();

	if (req.file) {
		newSponsor.image = "./assets/img/uploads/" + req.file.filename;
	}

	if (!data.sponsors) data.sponsors = [];
	data.sponsors.push(newSponsor);
	writeData(data);
	res.json(newSponsor);
});

app.delete("/api/sponsors/:id", (req, res) => {
	const data = readData();
	const { id } = req.params;
	if (data.sponsors) {
		data.sponsors = data.sponsors.filter((s) => s.id !== id);
		writeData(data);
	}
	res.json({ success: true });
});

// Designs CRUD
const designUpload = upload.fields([
	{ name: "image", maxCount: 1 },
	{ name: "clientLogo", maxCount: 1 },
]);

app.post("/api/designs", designUpload, (req, res) => {
	const data = readData();
	const newDesign = req.body || {};
	newDesign.id = Date.now().toString();

	if (req.files) {
		if (req.files["image"])
			newDesign.image =
				"./assets/img/uploads/" + req.files["image"][0].filename;
		if (req.files["clientLogo"])
			newDesign.clientLogo =
				"./assets/img/uploads/" + req.files["clientLogo"][0].filename;
	}

	if (!data.designs) data.designs = [];
	data.designs.push(newDesign);
	writeData(data);
	res.json(newDesign);
});

app.put("/api/designs/:id", designUpload, (req, res) => {
	const data = readData();
	const { id } = req.params;
	if (!data.designs) data.designs = [];

	const index = data.designs.findIndex((d) => d.id === id);
	if (index !== -1) {
		const updatedDesign = { ...data.designs[index], ...(req.body || {}) };

		if (req.files) {
			if (req.files["image"])
				updatedDesign.image =
					"./assets/img/uploads/" + req.files["image"][0].filename;
			if (req.files["clientLogo"])
				updatedDesign.clientLogo =
					"./assets/img/uploads/" + req.files["clientLogo"][0].filename;
		}

		data.designs[index] = updatedDesign;
		writeData(data);
		res.json(data.designs[index]);
	} else {
		res.status(404).json({ error: "Design not found" });
	}
});

app.delete("/api/designs/:id", (req, res) => {
	const data = readData();
	const { id } = req.params;
	if (data.designs) {
		data.designs = data.designs.filter((d) => d.id !== id);
		writeData(data);
	}
	res.json({ success: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
