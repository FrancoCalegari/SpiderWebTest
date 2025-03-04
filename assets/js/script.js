window.addEventListener('load', () => {
    const animationContainer = document.querySelector('.animation-container');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => {
        animationContainer.style.animation = 'blurAndFadeOut 2s forwards';
    }, 2500);

    setTimeout(() => {
        animationContainer.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.opacity = 1;
    }, 3000);
});

document.addEventListener("DOMContentLoaded", function () {

    function logWindowSize() {
        console.log(`Tamaño de la ventana: ${window.innerWidth}px x ${window.innerHeight}px`);
    }

    // Mostrar el tamaño de la ventana al cargar
    logWindowSize();

    // Detectar cambios en el tamaño de la ventana
    window.addEventListener('resize', logWindowSize);

    function isMobileDevice() {
        return window.innerWidth < 900; // Detecta si es un dispositivo móvil
    }

    function isPcDevice() {
        return window.innerWidth >= 900; // Detecta si es una PC o escritorio
    }

    function loadHeroImages() {
        if (isMobileDevice()) {
            console.log("Cargando imágenes para móvil...");
            document.querySelector(".hero-image.left").src = "./assets/img/recurses/capturasTEst/mobile_img2.png";
            document.querySelector(".hero-image.right").src = "./assets/img/recurses/capturasTEst/mobile_img3.png";
            document.querySelector(".hero-image.center").src = "./assets/img/logo.svg";
        }
    }

    function loadPcImages() {
        if (isPcDevice()) {
            console.log("Cargando imágenes para PC...");
            document.querySelector(".hero-image.left").src = "./assets/img/recurses/capturasTEst/img2.png";
            document.querySelector(".hero-image.right").src = "./assets/img/recurses/capturasTEst/img3.png";
            document.querySelector(".hero-image.center").src = "./assets/img/logo.svg";
        }
    }

    function applyHeroImageAnimation() {
        const leftImage = document.querySelector(".hero-image.left");
        const rightImage = document.querySelector(".hero-image.right");
        const centerImage = document.querySelector(".hero-image.center");

        

        if (!leftImage || !rightImage || !centerImage) return;

        if (isMobileDevice()) {
            console.log("Modo móvil activado");
            leftImage.style.transform = "translate(-100%, 20%)";
            rightImage.style.transform = "translate(100%, 20%)";
            loadHeroImages(); // Ejecutar la carga de imágenes para móviles
        } if (isPcDevice()) {
            console.log("Modo escritorio activado");
            leftImage.style.transform = "translate(-100%, 0%)";
            rightImage.style.transform = "translate(100%, 0%)";
            loadPcImages(); // Ejecutar la carga de imágenes para escritorio
        }

        leftImage.style.opacity = "1";
        rightImage.style.opacity = "1";
        centerImage.style.transform = "scale(1)";
        centerImage.style.opacity = "1";
    }

    // Inicia la animación después de 3.3 segundos
    setTimeout(() => {
        let height = 0;
        const heroImages = document.querySelector(".hero-images");

        if (!heroImages) {
            console.error("Error: No se encontró el elemento .hero-images");
            return;
        }

        let interval = setInterval(() => {
            if (height >= 30) {
                clearInterval(interval);
            } else {
                height += 1;
                heroImages.style.height = height + "vh";
            }
        }, 10);

        applyHeroImageAnimation();
    }, 3300);

    // Ejecutar animación en cambios de tamaño de la ventana
    window.addEventListener('resize', applyHeroImageAnimation);
});




document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery');
    const cards = document.querySelectorAll('.card');

    if (!gallery || cards.length === 0) {
        console.error("Error: No se encontraron elementos '.gallery' o '.card'.");
        return;
    }

    const totalCards = cards.length;
    const scrollInterval = 3000;
    let focusedIndex = 0;

    const scrollGallery = () => {
        if (cards.length === 0) {
            console.error("Error: No hay tarjetas disponibles para el scroll.");
            return;
        }

        const card = cards[focusedIndex];
        const cardWidth = card.offsetWidth;
        const galleryWidth = gallery.clientWidth;

        // Centrar la tarjeta en la galería
        const scrollAmount = card.offsetLeft - (galleryWidth / 2) + (cardWidth / 2);

        gallery.scrollTo({ left: scrollAmount, behavior: 'smooth' });

        // Actualizar clases
        cards.forEach(card => card.classList.remove('focused'));
        card.classList.add('focused');

        // Avanzar al siguiente índice
        focusedIndex = (focusedIndex + 1) % totalCards;
    };

    // Inicializar el primer elemento como enfocado
    if (cards[focusedIndex]) {
        cards[focusedIndex].classList.add('focused');
    }

    let scrollTimer = setInterval(scrollGallery, scrollInterval);

    window.addEventListener('resize', () => {
        if (cards.length === 0) return;

        const card = cards[focusedIndex];
        const cardWidth = card.offsetWidth;
        const galleryWidth = gallery.clientWidth;
        const scrollAmount = card.offsetLeft - (galleryWidth / 2) + (cardWidth / 2);

        gallery.scrollTo({ left: scrollAmount, behavior: 'auto' });

        clearInterval(scrollTimer);
        scrollTimer = setInterval(scrollGallery, scrollInterval);
    });

    gallery.addEventListener('mouseenter', () => clearInterval(scrollTimer));
    gallery.addEventListener('mouseleave', () => scrollTimer = setInterval(scrollGallery, scrollInterval));
});
