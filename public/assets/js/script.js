// ── Intro: usar DOMContentLoaded en lugar de load ──────────────────
// window load espera a TODAS las imágenes/recursos — puede tardar 5-10s.
// DOMContentLoaded se dispara apenas el HTML está parseado (~100-300ms).
document.addEventListener("DOMContentLoaded", () => {
	const animationContainer = document.querySelector(".animation-container");
	const mainContent = document.getElementById("main-content");

	// La animación CSS dura ~0.9s (logo 0.5s + texto empieza en 0.4s + dura 0.5s).
	// Mostramos el contenido a los 1.2s — suficiente para ver la animación completa.
	const SPLASH_DURATION = 1200;
	const FADE_DURATION = 400;

	setTimeout(() => {
		// Fade out con CSS class en vez de inline style con blur pesado
		animationContainer.classList.add("hide");

		// Mostrar contenido durante el fade-out del splash
		mainContent.style.display = "block";
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				mainContent.style.opacity = "1";
			});
		});

		// Remover del DOM una vez terminado el fade
		setTimeout(() => animationContainer.remove(), FADE_DURATION);
	}, SPLASH_DURATION);
});

document.addEventListener("DOMContentLoaded", function () {

	function isMobileDevice() { return window.innerWidth < 900; }
	function isPcDevice() { return window.innerWidth >= 900; }

	function loadHeroImages() {
		const left = document.querySelector(".hero-image.left");
		const right = document.querySelector(".hero-image.right");
		const center = document.querySelector(".hero-image.center");

		if (isMobileDevice()) {
			if (left) left.src = "./assets/img/recurses/capturasTEst/mobile_img2.png";
			if (right) right.src = "./assets/img/recurses/capturasTEst/TartasOdiTelefono.png";
		} else {
			if (left) left.src = "./assets/img/recurses/capturasTEst/img2.png";
			if (right) right.src = "./assets/img/recurses/capturasTEst/WebTartasODI.png";
		}
		if (center) center.src = "./assets/img/logo.svg";
	}

	function applyHeroImageAnimation() {
		const leftImage = document.querySelector(".hero-image.left");
		const rightImage = document.querySelector(".hero-image.right");
		const centerImage = document.querySelector(".hero-image.center");

		if (!leftImage || !rightImage || !centerImage) return;

		loadHeroImages();

		if (isMobileDevice()) {
			leftImage.style.transform = "translate(-100%, 20%)";
			rightImage.style.transform = "translate(100%, 20%)";
		} else {
			leftImage.style.transform = "translate(-100%, 0%)";
			rightImage.style.transform = "translate(100%, 0%)";
		}

		leftImage.style.opacity = "1";
		rightImage.style.opacity = "1";
		centerImage.style.transform = "scale(1)";
		centerImage.style.opacity = "1";
	}

	// Hero images se animan apenas termina el splash (~1.2s) + pequeño buffer
	setTimeout(() => {
		const heroImages = document.querySelector(".hero-images");
		if (heroImages) {
			let height = 0;
			const interval = setInterval(() => {
				if (height >= 30) {
					clearInterval(interval);
				} else {
					height += 1;
					heroImages.style.height = height + "vh";
				}
			}, 10);
		}
		applyHeroImageAnimation();
	}, 1500); // antes: 3800ms

	window.addEventListener("resize", applyHeroImageAnimation);

	// --- Data: fetch no bloquea el splash, carga en paralelo --------
	fetch("/api/data")
		.then((res) => res.json())
		.then((data) => {
			renderProjects(data.projects);
			renderSponsors(data.sponsors);
			renderDesigns(data.designs);
			initGalleryScroll();
			initFAQ();
		})
		.catch((err) => {
			console.error("Error loading data:", err);
			// Inicializar FAQ aunque falle el fetch
			initFAQ();
		});

	function renderProjects(projects) {
		const gallery = document.querySelector(".gallery");
		if (!gallery || !projects) return;
		gallery.innerHTML = "";
		projects.forEach((project) => {
			const card = document.createElement("div");
			card.className = "card";
			card.innerHTML = `
				<a href="${project.url}" target="_blank" rel="noopener noreferrer">
					<img src="${project.image}" alt="${project.title}" draggable="false">
					<h3>${project.title}</h3>
					<p>${project.description}</p>
				</a>
			`;
			gallery.appendChild(card);
		});
	}

	function renderDesigns(designs) {
		const grid = document.querySelector(".designs-grid");
		if (!grid || !designs) return;
		grid.innerHTML = "";
		designs.forEach((design) => {
			const item = document.createElement("div");
			item.className = "design-item";
			item.innerHTML = `<img src="${design.image}" alt="${design.title}">`;
			item.onclick = () => openDesignModal(design);
			grid.appendChild(item);
		});
	}

	function renderSponsors(sponsors) {
		const sponsorTrack = document.querySelector(".sponsor-track");
		if (!sponsorTrack || !sponsors) return;
		sponsorTrack.innerHTML = "";
		// 4 copias para loop continuo — translateX(-25%) en CSS
		for (let i = 0; i < 4; i++) {
			const group = document.createElement("div");
			group.className = "sponsor-logos";
			sponsors.forEach((sponsor) => {
				const wrapper = document.createElement(sponsor.url ? "a" : "div");
				if (sponsor.url) {
					wrapper.href = sponsor.url;
					wrapper.target = "_blank";
					wrapper.rel = "noopener noreferrer";
				}
				const img = document.createElement("img");
				img.src = sponsor.image;
				img.alt = sponsor.name;
				wrapper.appendChild(img);
				group.appendChild(wrapper);
			});
			sponsorTrack.appendChild(group);
		}
	}

	// Modal
	window.openDesignModal = (design) => {
		const modal = document.getElementById("designDetailModal");
		const clientLogo = document.getElementById("modalClientLogo");

		document.getElementById("modalDesignImage").src = design.image;
		document.getElementById("modalDesignTitle").innerText = design.title;
		document.getElementById("modalDesignDesc").innerText = design.description;
		document.getElementById("modalDesignLink").href = design.link;

		if (design.clientLogo) {
			clientLogo.src = design.clientLogo;
			clientLogo.style.display = "block";
		} else {
			clientLogo.style.display = "none";
		}
		modal.style.display = "block";
	};

	window.closeDesignModal = () => {
		document.getElementById("designDetailModal").style.display = "none";
	};

	// --- Gallery scroll ──────────────────────────────────────────────
	function initGalleryScroll() {
		const gallery = document.querySelector(".gallery");
		if (!gallery) return;

		let isPaused = false;
		let isDragging = false;
		let startX, scrollLeft;

		const scrollInterval = setInterval(() => {
			if (isPaused || isDragging) return;
			const cards = document.querySelectorAll(".card");
			if (!cards.length) return;
			const cardWidth = cards[0].offsetWidth + 20;
			if (gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 10) {
				gallery.scrollTo({ left: 0, behavior: "smooth" });
			} else {
				gallery.scrollTo({ left: gallery.scrollLeft + cardWidth, behavior: "smooth" });
			}
		}, 3000);

		gallery.addEventListener("mouseenter", () => isPaused = true);
		gallery.addEventListener("mouseleave", () => { isPaused = false; isDragging = false; gallery.classList.remove("active"); });
		gallery.addEventListener("touchstart", () => isPaused = true);
		gallery.addEventListener("touchend", () => setTimeout(() => isPaused = false, 2000));

		gallery.addEventListener("mousedown", (e) => {
			isPaused = isDragging = true;
			gallery.classList.add("active");
			startX = e.pageX - gallery.offsetLeft;
			scrollLeft = gallery.scrollLeft;
		});

		gallery.addEventListener("mouseup", () => {
			isDragging = false;
			isPaused = false;
			gallery.classList.remove("active");
		});

		gallery.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			e.preventDefault();
			gallery.scrollLeft = scrollLeft - (e.pageX - gallery.offsetLeft - startX) * 2;
		});
	}

	// --- FAQ ─────────────────────────────────────────────────────────
	function initFAQ() {
		document.querySelectorAll(".faq-question").forEach((question) => {
			question.addEventListener("click", () => {
				const isActive = question.classList.contains("active");
				// Cerrar todos
				document.querySelectorAll(".faq-question").forEach((q) => {
					q.classList.remove("active");
					q.nextElementSibling.style.maxHeight = null;
				});
				// Abrir el clickeado si estaba cerrado
				if (!isActive) {
					question.classList.add("active");
					question.nextElementSibling.style.maxHeight =
						question.nextElementSibling.scrollHeight + "px";
				}
			});
		});
	}

	// --- Settings ────────────────────────────────────────────────────
	function initSettings() {
		const settingsBtn = document.getElementById("settingsBtn");
		const settingsPopup = document.getElementById("settingsPopup");
		const hueSlider = document.getElementById("accentHue");
		const randomBtn = document.getElementById("randomColorBtn");

		if (!settingsPopup || !hueSlider || !randomBtn) return;

		window.toggleSettings = () => {
			settingsPopup.style.display =
				settingsPopup.style.display === "block" ? "none" : "block";
		};

		if (settingsBtn) {
			settingsBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				toggleSettings();
			});
		}

		document.addEventListener("click", (e) => {
			if (settingsBtn && !settingsPopup.contains(e.target) && !settingsBtn.contains(e.target)) {
				settingsPopup.style.display = "none";
			}
		});

		const updateAccentColor = (hue) => {
			const color = `hsl(${hue}, 73%, 37%)`;
			const lightColor = `hsl(${hue}, 100%, 95%)`;
			document.documentElement.style.setProperty("--accent", color);
			document.documentElement.style.setProperty("--accent-soft", lightColor);
			document.documentElement.style.setProperty("--accent-glow", `hsla(${hue}, 73%, 57%, 0.35)`);
			document.documentElement.style.setProperty("--gradient-accent",
				`linear-gradient(135deg, hsl(${hue}, 73%, 47%), hsl(${hue}, 90%, 65%))`);
		};

		hueSlider.addEventListener("input", (e) => updateAccentColor(e.target.value));
		randomBtn.addEventListener("click", () => {
			const hue = Math.floor(Math.random() * 360);
			hueSlider.value = hue;
			updateAccentColor(hue);
		});
	}

	initSettings();
});