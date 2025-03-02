window.addEventListener('load', () => {
    const animationContainer = document.querySelector('.animation-container');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => {
        animationContainer.style.animation = 'blurAndFadeOut 2s forwards';
    }, 2500); // Espera 2 segundos (2000ms) y luego aplica el blur y fade out

    setTimeout(() => {
        animationContainer.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.opacity = 1;
    }, 3000); // Espera 1 segundo más para asegurarse de que la animación termine antes de mostrar el contenido principal
});

document.addEventListener("DOMContentLoaded", function () {
    // Función para detectar si es un dispositivo móvil
    function isMobileDevice() {
        return window.matchMedia("(orientation: portrait)").matches || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }

    // Cambiar las imágenes si es un dispositivo móvil
    if (isMobileDevice()) {
        document.querySelector(".hero-image.left").src = "./assets/img/recurses/capturasTEst/mobile_img2.png";
        document.querySelector(".hero-image.right").src = "./assets/img/recurses/capturasTEst/mobile_img3.png";
        document.querySelector(".hero-image.center").src = "./assets/img/logo.svg";
    }

    setTimeout(() => {
        let height = 0;
        let interval = setInterval(() => {
            if (height >= 30) {
                clearInterval(interval);
            } else {
                height += 1;
                document.querySelector(".hero-images").style.height = height + "vh";
            }
        }, 10);

        document.querySelector(".hero-image.left").style.transform = "translate(-100%, 20%)";
        document.querySelector(".hero-image.left").style.opacity = "1";
        
        document.querySelector(".hero-image.right").style.transform = "translate(100%, 20%)";
        document.querySelector(".hero-image.right").style.opacity = "1";
        
        document.querySelector(".hero-image.center").style.transform = "scale(1)";
        document.querySelector(".hero-image.center").style.opacity = "1";
    }, 3500);
});

document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery');
    const cards = document.querySelectorAll('.card');
    const totalCards = cards.length;
    const scrollInterval = 5000; // 10 seconds in milliseconds
    const focusInterval = scrollInterval / totalCards; // Calculate interval per card
    let scrollAmount = 0;
    let focusedIndex = 0;

    const scrollGallery = () => {
        const cardWidth = cards[0].offsetWidth;
        const galleryWidth = gallery.scrollWidth;
        
        // Update scroll amount
        scrollAmount += cardWidth;
        
        // Reset scroll amount if it exceeds the total width minus one card width
        if (scrollAmount >= galleryWidth - cardWidth) {
            scrollAmount = 0;
        }

        // Scroll the gallery
        gallery.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });

        // Update focused card
        cards[focusedIndex].classList.remove('focused');
        focusedIndex = (focusedIndex + 1) % cards.length;
        cards[focusedIndex].classList.add('focused');
    };

    // Initialize first card as focused
    cards[focusedIndex].classList.add('focused');

    setInterval(scrollGallery, focusInterval); // Scroll at calculated intervals
});


