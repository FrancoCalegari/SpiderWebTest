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
			initCarouselScroll(".gallery", ".gallery .card");
			initCarouselScroll(".designs-grid", ".designs-grid .design-item");
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
				<a href="${project.url}" target="_blank" rel="noopener noreferrer" draggable="false">
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
			item.innerHTML = `<img src="${design.image}" alt="${design.title}" draggable="false">`;
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

	// --- Gallery / Carousel scroll ──────────────────────────────────────────────
	function initCarouselScroll(selector, cardSelector) {
		const gallery = document.querySelector(selector);
		if (!gallery) return;

		let isPaused = false;
		let isDragging = false;
		let startX, scrollLeft;
		let dragged = false;

		const scrollInterval = setInterval(() => {
			if (isPaused || isDragging) return;
			const cards = document.querySelectorAll(cardSelector);
			if (!cards.length) return;
			const cardWidth = cards[0].offsetWidth + 20;
			if (gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 10) {
				gallery.scrollTo({ left: 0, behavior: "smooth" });
			} else {
				gallery.scrollTo({ left: gallery.scrollLeft + cardWidth, behavior: "smooth" });
			}
		}, 3000);

		gallery.addEventListener("mouseenter", () => isPaused = true);
		gallery.addEventListener("mouseleave", () => { 
			isPaused = false; 
			isDragging = false; 
			gallery.classList.remove("active"); 
		});
		gallery.addEventListener("touchstart", () => isPaused = true);
		gallery.addEventListener("touchend", () => setTimeout(() => isPaused = false, 2000));

		gallery.addEventListener("mousedown", (e) => {
			isPaused = isDragging = true;
			dragged = false;
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
			const x = e.pageX - gallery.offsetLeft;
			const walk = (x - startX) * 2;
			if (Math.abs(walk) > 5) dragged = true;
			gallery.scrollLeft = scrollLeft - walk;
		});

		gallery.addEventListener("click", (e) => {
			if (dragged) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true);
	}

	// --- Scroll Reveal ───────────────────────────────────────────────
	function initScrollReveal() {
		const reveals = document.querySelectorAll(".reveal");
		const observerOptions = {
			threshold: 0.15,
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("visible");
				}
			});
		}, observerOptions);

		reveals.forEach((el) => observer.observe(el));
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

	// --- Contact Form ────────────────────────────────────────────────
	function initContactForm() {
		const form = document.getElementById("contactForm");
		const messageDiv = document.getElementById("formMessage");
		const submitBtn = document.getElementById("contactSubmit");

		if (!form) return;

		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			
			// Disable button and show loading state
			const originalBtnText = submitBtn.innerHTML;
			submitBtn.disabled = true;
			submitBtn.innerHTML = `<span>Enviando...</span><i class="fa-solid fa-spinner fa-spin"></i>`;
			messageDiv.className = "form-message";
			messageDiv.innerText = "";

			const formData = {
				name: form.name.value,
				email: form.email.value,
				subject: form.subject.value,
				message: form.message.value
			};

			try {
				const response = await fetch("/api/contact", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(formData)
				});

				const result = await response.json();

				if (response.ok) {
					messageDiv.classList.add("success");
					messageDiv.innerText = result.message || "¡Mensaje enviado con éxito!";
					form.reset();
				} else {
					messageDiv.classList.add("error");
					messageDiv.innerText = result.error || "Ocurrió un error al enviar el mensaje.";
				}
			} catch (err) {
				console.error("Error submitting contact form:", err);
				messageDiv.classList.add("error");
				messageDiv.innerText = "Error de red. Por favor, intenta de nuevo.";
			} finally {
				// Restore button
				submitBtn.disabled = false;
				submitBtn.innerHTML = originalBtnText;

				// Clear message after 5 seconds
				setTimeout(() => {
					messageDiv.innerText = "";
					messageDiv.className = "form-message";
				}, 5000);
			}
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
	initContactForm();
	initFAQ();
	initScrollReveal();
});

// ── Hamburger Menu ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
	const btn  = document.getElementById("hamburger-btn");
	const nav  = document.getElementById("main-nav");
	if (!btn || !nav) return;

	const openIcon  = "fa-bars";
	const closeIcon = "fa-xmark";

	function openMenu() {
		nav.classList.add("open");
		btn.setAttribute("aria-expanded", "true");
		btn.querySelector("i").classList.replace(openIcon, closeIcon);
	}

	function closeMenu() {
		nav.classList.remove("open");
		btn.setAttribute("aria-expanded", "false");
		btn.querySelector("i").classList.replace(closeIcon, openIcon);
	}

	btn.addEventListener("click", (e) => {
		e.stopPropagation();
		nav.classList.contains("open") ? closeMenu() : openMenu();
	});

	// Cerrar al hacer clic en un enlace
	nav.querySelectorAll(".nav-link").forEach((link) => {
		link.addEventListener("click", closeMenu);
	});

	// Cerrar al hacer clic fuera del header
	document.addEventListener("click", (e) => {
		if (!e.target.closest(".site-header")) closeMenu();
	});

	// Cerrar al hacer resize a escritorio
	window.addEventListener("resize", () => {
		if (window.innerWidth > 900) closeMenu();
	});
});