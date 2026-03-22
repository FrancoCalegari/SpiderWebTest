const API_URL = "/api";

async function loadData() {
	try {
		const res = await fetch(`${API_URL}/data`);
		const data = await res.json();
		renderProjects(data.projects || []);
		renderDesigns(data.designs || []);
		renderSponsors(data.sponsors || []);
	} catch (err) {
		console.error("Error cargando datos:", err);
		showToast("Error al cargar datos", "error");
	}
}

function resolveImagePath(path) {
	return path || "";
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderProjects(projects) {
	const tbody = document.querySelector("#projectsTable tbody");
	if (!tbody) return;

	if (!projects.length) {
		tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay proyectos aún</td></tr>`;
		return;
	}

	tbody.innerHTML = "";
	projects.forEach((p) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${p.image ? `<img src="${resolveImagePath(p.image)}" alt="${p.title}">` : "—"}</td>
			<td>${escHtml(p.title)}</td>
			<td>${escHtml(p.description || "")}</td>
			<td>
				<div class="actions">
					<button class="btn btn-edit" onclick='editProject(${JSON.stringify(p)})'>Editar</button>
					<button class="btn btn-delete" onclick="deleteProject('${p.id}')">Borrar</button>
				</div>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

function renderDesigns(designs) {
	const tbody = document.querySelector("#designsTable tbody");
	if (!tbody) return;

	if (!designs.length) {
		tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay diseños aún</td></tr>`;
		return;
	}

	tbody.innerHTML = "";
	designs.forEach((d) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${d.image ? `<img src="${resolveImagePath(d.image)}" alt="${d.title}">` : "—"}</td>
			<td>${escHtml(d.title)}</td>
			<td>
				${d.clientName ? escHtml(d.clientName) : "—"}
				${d.clientLogo ? `<img src="${resolveImagePath(d.clientLogo)}" style="width:24px;height:24px;border-radius:4px;vertical-align:middle;margin-left:6px;">` : ""}
			</td>
			<td>
				<div class="actions">
					<button class="btn btn-edit" onclick='editDesign(${JSON.stringify(d)})'>Editar</button>
					<button class="btn btn-delete" onclick="deleteDesign('${d.id}')">Borrar</button>
				</div>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

function renderSponsors(sponsors) {
	const tbody = document.querySelector("#sponsorsTable tbody");
	if (!tbody) return;

	if (!sponsors.length) {
		tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay clientes aún</td></tr>`;
		return;
	}

	tbody.innerHTML = "";
	sponsors.forEach((s) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${s.image ? `<img src="${resolveImagePath(s.image)}" alt="${s.name}">` : "—"}</td>
			<td>${escHtml(s.name)}</td>
			<td>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:#e63946;text-decoration:none;">Ver sitio</a>` : "—"}</td>
			<td>
				<div class="actions">
					<button class="btn btn-delete" onclick="deleteSponsor('${s.id}')">Borrar</button>
				</div>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteProject(id) {
	if (!confirm("¿Borrar este proyecto?")) return;
	try {
		await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
		showToast("Proyecto eliminado");
		loadData();
	} catch { showToast("Error al eliminar", "error"); }
}

async function deleteDesign(id) {
	if (!confirm("¿Borrar este diseño?")) return;
	try {
		await fetch(`${API_URL}/designs/${id}`, { method: "DELETE" });
		showToast("Diseño eliminado");
		loadData();
	} catch { showToast("Error al eliminar", "error"); }
}

async function deleteSponsor(id) {
	if (!confirm("¿Borrar este cliente?")) return;
	try {
		await fetch(`${API_URL}/sponsors/${id}`, { method: "DELETE" });
		showToast("Cliente eliminado");
		loadData();
	} catch { showToast("Error al eliminar", "error"); }
}

// ── Forms ─────────────────────────────────────────────────────────────────────

document.getElementById("projectForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const id = document.getElementById("projectId").value;
	const btn = e.submitter;
	btn.disabled = true;
	btn.textContent = "Guardando...";

	const fd = new FormData();
	fd.append("title", document.getElementById("projectTitle").value);
	fd.append("description", document.getElementById("projectDesc").value);
	fd.append("url", document.getElementById("projectUrl").value);

	const img = document.getElementById("projectImage");
	if (img.files.length) fd.append("image", img.files[0]);

	try {
		const res = await fetch(
			id ? `${API_URL}/projects/${id}` : `${API_URL}/projects`,
			{ method: id ? "PUT" : "POST", body: fd }
		);
		if (!res.ok) throw new Error();
		closeModal("projectModal");
		showToast(id ? "Proyecto actualizado" : "Proyecto creado");
		loadData();
	} catch {
		showToast("Error al guardar", "error");
	} finally {
		btn.disabled = false;
		btn.textContent = "Guardar";
	}
});

document.getElementById("designForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const id = document.getElementById("designId").value;
	const btn = e.submitter;
	btn.disabled = true;
	btn.textContent = "Guardando...";

	const fd = new FormData();
	fd.append("title", document.getElementById("designTitle").value);
	fd.append("description", document.getElementById("designDesc").value);
	fd.append("clientName", document.getElementById("designClientName").value);
	fd.append("link", document.getElementById("designLink").value);

	const img = document.getElementById("designImage");
	const logo = document.getElementById("designClientLogo");
	if (img.files.length) fd.append("image", img.files[0]);
	if (logo.files.length) fd.append("clientLogo", logo.files[0]);

	try {
		const res = await fetch(
			id ? `${API_URL}/designs/${id}` : `${API_URL}/designs`,
			{ method: id ? "PUT" : "POST", body: fd }
		);
		if (!res.ok) throw new Error();
		closeModal("designModal");
		showToast(id ? "Diseño actualizado" : "Diseño creado");
		loadData();
	} catch {
		showToast("Error al guardar", "error");
	} finally {
		btn.disabled = false;
		btn.textContent = "Guardar";
	}
});

document.getElementById("sponsorForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const btn = e.submitter;
	btn.disabled = true;
	btn.textContent = "Guardando...";

	const fd = new FormData();
	fd.append("name", document.getElementById("sponsorName").value);
	fd.append("url", document.getElementById("sponsorUrl").value);

	const img = document.getElementById("sponsorImage");
	if (img.files.length) fd.append("image", img.files[0]);

	try {
		const res = await fetch(`${API_URL}/sponsors`, { method: "POST", body: fd });
		if (!res.ok) throw new Error();
		closeModal("sponsorModal");
		showToast("Cliente agregado");
		loadData();
	} catch {
		showToast("Error al guardar", "error");
	} finally {
		btn.disabled = false;
		btn.textContent = "Guardar";
	}
});

// ── Edit helpers ──────────────────────────────────────────────────────────────

window.editProject = (p) => {
	document.getElementById("projectId").value = p.id;
	document.getElementById("projectTitle").value = p.title;
	document.getElementById("projectDesc").value = p.description || "";
	document.getElementById("projectUrl").value = p.url || "";
	document.getElementById("projectModalTitle").innerText = "Editar Proyecto";
	document.getElementById("projectModal").classList.add("open");
};

window.editDesign = (d) => {
	document.getElementById("designId").value = d.id;
	document.getElementById("designTitle").value = d.title;
	document.getElementById("designDesc").value = d.description || "";
	document.getElementById("designClientName").value = d.clientName || "";
	document.getElementById("designLink").value = d.link || "";
	document.getElementById("designModalTitle").innerText = "Editar Diseño";
	document.getElementById("designModal").classList.add("open");
};

// ── Utility ───────────────────────────────────────────────────────────────────

function escHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadData();