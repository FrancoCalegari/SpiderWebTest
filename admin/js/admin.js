const API_URL = "/api";

// Fetch and Render Data
async function loadData() {
	const res = await fetch(`${API_URL}/data`);
	const data = await res.json();
	renderProjects(data.projects);
	renderDesigns(data.designs); // NEW
	renderSponsors(data.sponsors);
}

function resolveImagePath(path) {
	if (path && path.startsWith("./")) {
		return path.substring(1); // Remove '.' to make it '/assets/...'
	}
	return path || "";
}

function renderProjects(projects) {
	const tbody = document.querySelector("#projectsTable tbody");
	tbody.innerHTML = "";
	projects.forEach((p) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
            <td><img src="${resolveImagePath(p.image)}" height="50"></td>
            <td>${p.title}</td>
            <td>${p.description}</td>
            <td>
                <button class="btn btn-warning" onclick='editProject(${JSON.stringify(
									p
								)})'>Editar</button>
                <button class="btn btn-danger" onclick="deleteProject('${
									p.id
								}')">Borrar</button>
            </td>
        `;
		tbody.appendChild(tr);
	});
}

// NEW: Render Designs
function renderDesigns(designs) {
	const tbody = document.querySelector("#designsTable tbody");
	if (!tbody) return;
	tbody.innerHTML = "";
	if (!designs) return;

	designs.forEach((d) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
            <td><img src="${resolveImagePath(d.image)}" height="50"></td>
            <td>${d.title}</td>
            <td>
                ${d.clientName}
                ${
									d.clientLogo
										? `<img src="${resolveImagePath(
												d.clientLogo
										  )}" height="20" style="vertical-align: middle; margin-left: 5px;">`
										: ""
								}
            </td>
            <td>
                <button class="btn btn-warning" onclick='editDesign(${JSON.stringify(
									d
								)})'>Editar</button>
                <button class="btn btn-danger" onclick="deleteDesign('${
									d.id
								}')">Borrar</button>
            </td>
        `;
		tbody.appendChild(tr);
	});
}

function renderSponsors(sponsors) {
	const tbody = document.querySelector("#sponsorsTable tbody");
	tbody.innerHTML = "";
	sponsors.forEach((s) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
            <td><img src="${resolveImagePath(s.image)}" height="50"></td>
            <td>${s.name}</td>
            <td>${
							s.url ? `<a href="${s.url}" target="_blank">Link</a>` : "-"
						}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteSponsor('${
									s.id
								}')">Borrar</button>
            </td>
        `;
		tbody.appendChild(tr);
	});
}

// Actions
async function deleteProject(id) {
	if (!confirm("¿Seguro de borrar este proyecto?")) return;
	await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
	loadData();
}

async function deleteDesign(id) {
	if (!confirm("¿Seguro de borrar este diseño?")) return;
	await fetch(`${API_URL}/designs/${id}`, { method: "DELETE" });
	loadData();
}

async function deleteSponsor(id) {
	if (!confirm("¿Seguro de borrar este sponsor?")) return;
	await fetch(`${API_URL}/sponsors/${id}`, { method: "DELETE" });
	loadData();
}

// Forms
document.getElementById("projectForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const id = document.getElementById("projectId").value;
	const formData = new FormData();
	formData.append("title", document.getElementById("projectTitle").value);
	formData.append("description", document.getElementById("projectDesc").value);
	formData.append("url", document.getElementById("projectUrl").value);

	const fileInput = document.getElementById("projectImage");
	if (fileInput.files.length > 0) {
		formData.append("image", fileInput.files[0]);
	}

	if (id) {
		await fetch(`${API_URL}/projects/${id}`, { method: "PUT", body: formData });
	} else {
		await fetch(`${API_URL}/projects`, { method: "POST", body: formData });
	}
	closeModal("projectModal");
	loadData();
});

// NEW: Design Form
document.getElementById("designForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const id = document.getElementById("designId").value;
	const formData = new FormData();

	formData.append("title", document.getElementById("designTitle").value);
	formData.append("description", document.getElementById("designDesc").value);
	formData.append(
		"clientName",
		document.getElementById("designClientName").value
	);
	formData.append("link", document.getElementById("designLink").value);

	const imageInput = document.getElementById("designImage");
	if (imageInput.files.length > 0) {
		formData.append("image", imageInput.files[0]);
	}

	const logoInput = document.getElementById("designClientLogo");
	if (logoInput.files.length > 0) {
		formData.append("clientLogo", logoInput.files[0]);
	}

	if (id) {
		await fetch(`${API_URL}/designs/${id}`, { method: "PUT", body: formData });
	} else {
		await fetch(`${API_URL}/designs`, { method: "POST", body: formData });
	}
	closeModal("designModal");
	loadData();
});

document.getElementById("sponsorForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	const formData = new FormData();
	formData.append("name", document.getElementById("sponsorName").value);
	formData.append("url", document.getElementById("sponsorUrl").value); // New field

	const fileInput = document.getElementById("sponsorImage");
	if (fileInput.files.length > 0) {
		formData.append("image", fileInput.files[0]);
	}

	await fetch(`${API_URL}/sponsors`, { method: "POST", body: formData });
	closeModal("sponsorModal");
	loadData();
});

// Modals
window.openModal = (id) => {
	document.getElementById(id).style.display = "block";
	if (id === "projectModal") {
		document.getElementById("projectForm").reset();
		document.getElementById("projectId").value = "";
		document.getElementById("projectModalTitle").innerText = "Agregar Proyecto";
		document.getElementById("projectImage").value = "";
	}
	if (id === "designModal") {
		document.getElementById("designForm").reset();
		document.getElementById("designId").value = "";
		document.getElementById("designModalTitle").innerText = "Agregar Diseño";
		document.getElementById("designImage").value = "";
		document.getElementById("designClientLogo").value = "";
	}
	if (id === "sponsorModal") {
		document.getElementById("sponsorForm").reset();
		document.getElementById("sponsorModalTitle").innerText = "Agregar Sponsor";
		document.getElementById("sponsorImage").value = "";
	}
};

window.closeModal = (id) =>
	(document.getElementById(id).style.display = "none");

window.editProject = (project) => {
	document.getElementById("projectId").value = project.id;
	document.getElementById("projectTitle").value = project.title;
	document.getElementById("projectDesc").value = project.description;
	document.getElementById("projectUrl").value = project.url;
	document.getElementById("projectModalTitle").innerText = "Editar Proyecto";
	document.getElementById("projectModal").style.display = "block";
};

window.editDesign = (design) => {
	document.getElementById("designId").value = design.id;
	document.getElementById("designTitle").value = design.title;
	document.getElementById("designDesc").value = design.description;
	document.getElementById("designClientName").value = design.clientName;
	document.getElementById("designLink").value = design.link;

	document.getElementById("designModalTitle").innerText = "Editar Diseño";
	document.getElementById("designModal").style.display = "block";
};

// Init
loadData();
