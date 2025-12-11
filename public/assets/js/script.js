window.addEventListener("load", () => {
	const animationContainer = document.querySelector(".animation-container");
	const mainContent = document.getElementById("main-content");

	// Smoother Intro Animation
	setTimeout(() => {
		animationContainer.style.transition =
			"opacity 2s ease-out, filter 2s ease-out";
		animationContainer.style.opacity = "0";
		animationContainer.style.filter = "blur(20px)";
	}, 2500);

	setTimeout(() => {
		animationContainer.style.display = "none";
		mainContent.style.display = "block";
		// Small delay to allow display:block to apply before opacity transition
		requestAnimationFrame(() => {
			mainContent.style.opacity = 1;
		});
	}, 3000); // Increased time to allow fade out to finish
});

document.addEventListener("DOMContentLoaded", function () {
	// ... (Helper functions remain mostly the same, condensed for brevity) ...
	function isMobileDevice() {
		return window.innerWidth < 900;
	}
	function isPcDevice() {
		return window.innerWidth >= 900;
	}

	function loadHeroImages() {
		if (isMobileDevice()) {
			const left = document.querySelector(".hero-image.left");
			const right = document.querySelector(".hero-image.right");
			const center = document.querySelector(".hero-image.center");
			if (left) left.src = "./assets/img/recurses/capturasTEst/mobile_img2.png";
			if (right)
				right.src = "./assets/img/recurses/capturasTEst/TartasOdiTelefono.png";
			if (center) center.src = "./assets/img/logo.svg";
		}
	}

	function loadPcImages() {
		if (isPcDevice()) {
			const left = document.querySelector(".hero-image.left");
			const right = document.querySelector(".hero-image.right");
			const center = document.querySelector(".hero-image.center");
			if (left) left.src = "./assets/img/recurses/capturasTEst/img2.png";
			if (right)
				right.src = "./assets/img/recurses/capturasTEst/WebTartasODI.png";
			if (center) center.src = "./assets/img/logo.svg";
		}
	}

	function applyHeroImageAnimation() {
		const leftImage = document.querySelector(".hero-image.left");
		const rightImage = document.querySelector(".hero-image.right");
		const centerImage = document.querySelector(".hero-image.center");

		if (!leftImage || !rightImage || !centerImage) return;

		if (isMobileDevice()) {
			leftImage.style.transform = "translate(-100%, 20%)";
			rightImage.style.transform = "translate(100%, 20%)";
			loadHeroImages();
		}
		if (isPcDevice()) {
			leftImage.style.transform = "translate(-100%, 0%)";
			rightImage.style.transform = "translate(100%, 0%)";
			loadPcImages();
		}

		leftImage.style.opacity = "1";
		rightImage.style.opacity = "1";
		centerImage.style.transform = "scale(1)";
		centerImage.style.opacity = "1";
	}

	// Hero Images Height Animation
	setTimeout(() => {
		const heroImages = document.querySelector(".hero-images");
		if (heroImages) {
			let height = 0;
			let interval = setInterval(() => {
				if (height >= 30) clearInterval(interval);
				else {
					height += 1;
					heroImages.style.height = height + "vh";
				}
			}, 10);
		}
		applyHeroImageAnimation();
	}, 4800); // Synced with new intro timing

	window.addEventListener("resize", applyHeroImageAnimation);

	// --- Dynamic Data Loading ---
	fetch("/api/data")
		.then((response) => response.json())
		.then((data) => {
			renderProjects(data.projects);
			renderSponsors(data.sponsors);
			renderDesigns(data.designs); // NEW
			initGalleryScroll();
		})
		.catch((error) => console.error("Error loading data:", error));

	function renderProjects(projects) {
		const gallery = document.querySelector(".gallery");
		if (!gallery) return;
		gallery.innerHTML = "";
		projects.forEach((project) => {
			const card = document.createElement("div");
			card.className = "card";
			card.innerHTML = `
                <a href="${project.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
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
		if (!grid) return;
		grid.innerHTML = "";

		if (!designs) return;

		designs.forEach((design) => {
			const item = document.createElement("div");
			item.className = "design-item";
			item.innerHTML = `<img src="${design.image}" alt="${design.title}">`;
			item.onclick = () => openDesignModal(design);
			grid.appendChild(item);
		});
	}

	// Modal Logic
	window.openDesignModal = (design) => {
		const modal = document.getElementById("designDetailModal");
		document.getElementById("modalDesignImage").src = design.image;
		document.getElementById("modalDesignTitle").innerText = design.title;
		document.getElementById("modalDesignDesc").innerText = design.description;
		document.getElementById("modalDesignLink").href = design.link;

		const clientLogo = document.getElementById("modalClientLogo");
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

	function renderSponsors(sponsors) {
		const sponsorTrack = document.querySelector(".sponsor-track");
		if (!sponsorTrack) return;
		sponsorTrack.innerHTML = "";
		for (let i = 0; i < 4; i++) {
			const sponsorLogosDiv = document.createElement("div");
			sponsorLogosDiv.className = "sponsor-logos";
			sponsors.forEach((sponsor) => {
				// Create link if URL exists, else div or just img
				const wrapper = sponsor.url
					? document.createElement("a")
					: document.createElement("div");
				if (sponsor.url) {
					wrapper.href = sponsor.url;
					wrapper.target = "_blank";
					wrapper.style.display = "inline-block"; // Ensure it behaves like block/img
				}

				const img = document.createElement("img");
				img.src = sponsor.image;
				img.alt = sponsor.name;

				wrapper.appendChild(img);
				sponsorLogosDiv.appendChild(wrapper);
			});
			sponsorTrack.appendChild(sponsorLogosDiv);
		}
	}

	// --- Improved Gallery Scroll Logic ---
	function initGalleryScroll() {
		const gallery = document.querySelector(".gallery");
		if (!gallery) return;

		let scrollInterval;
		const autoScrollDelay = 3000;
		let isPaused = false;
		let isDragging = false;
		let startX;
		let scrollLeft;

		// --- Auto Scroll Logic ---
		const startAutoScroll = () => {
			clearInterval(scrollInterval);
			scrollInterval = setInterval(() => {
				if (!isPaused && !isDragging) {
					// Scroll by one card width approx or smooth constant
					// Current logic was focusing items. Let's keep it simple: nice smooth scroll
					// But user wants "carousel".
					// The previous logic used 'focusedIndex'. Let's adapt that to be more fluid.
					// Actually, standard auto-scroll (like sponsors) or item-by-item?
					// Previous code was Item-by-Item (scrollTo). Let's keep that but respectful of Pause.

					// However, for Drag-to-Scroll to work well, we shouldn't force snap back immediately.
					// Let's rely on scroll-snap to handle alignment, and auto-scroll just "nudges" or moves to next.

					const cards = document.querySelectorAll(".card");
					if (cards.length === 0) return;

					const cardWidth = cards[0].offsetWidth + 10; // + gap
					const currentScroll = gallery.scrollLeft;
					const nextScroll = currentScroll + cardWidth;

					// If at end, loop back?
					if (
						gallery.scrollLeft + gallery.clientWidth >=
						gallery.scrollWidth - 10
					) {
						gallery.scrollTo({ left: 0, behavior: "smooth" });
					} else {
						gallery.scrollTo({ left: nextScroll, behavior: "smooth" });
					}
				}
			}, autoScrollDelay);
		};

		startAutoScroll();

		// --- Interaction events to Pause ---
		gallery.addEventListener("mouseenter", () => (isPaused = true));
		gallery.addEventListener("mouseleave", () => {
			isPaused = false;
			isDragging = false;
		});

		gallery.addEventListener("touchstart", () => (isPaused = true));
		gallery.addEventListener("touchend", () => {
			// Resume after a moment
			setTimeout(() => (isPaused = false), 2000);
		});

		// --- Drag-to-Scroll Implementation ---
		gallery.addEventListener("mousedown", (e) => {
			isPaused = true;
			isDragging = true;
			gallery.classList.add("active"); // Optional: for cursor styling
			startX = e.pageX - gallery.offsetLeft;
			scrollLeft = gallery.scrollLeft;
		});

		gallery.addEventListener("mouseleave", () => {
			isDragging = false;
			isPaused = false;
			gallery.classList.remove("active");
		});

		gallery.addEventListener("mouseup", () => {
			isDragging = false;
			isPaused = false;
			gallery.classList.remove("active");
		});

		gallery.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			e.preventDefault(); // Prevent text selection
			const x = e.pageX - gallery.offsetLeft;
			const walk = (x - startX) * 2; // Scroll-fast factor
			gallery.scrollLeft = scrollLeft - walk;
		});
	}
});
