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


window.addEventListener('load', () => {
    const animationContainer = document.querySelector('.animation-container');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => {
        animationContainer.style.animation = 'blurAndFadeOut 1s forwards';
    }, 3000); // Espera 2 segundos (2000ms) y luego aplica el blur y fade out

    setTimeout(() => {
        animationContainer.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.opacity = 1;
    }, 4000); // Espera 1 segundo más para asegurarse de que la animación termine antes de mostrar el contenido principal
});