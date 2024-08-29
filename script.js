let currentIndex = 0;
let data = [];

let lastScrollTime = 0;
const scrollCooldown = 500; // milliseconds

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('disclaimerAccepted') === 'true') {
        loadJsonData();
    } else {
        showDisclaimerModal();
    }

    // Add these lines to handle the checkbox and button
    const checkbox = document.getElementById('disclaimer-checkbox');
    const acceptButton = document.getElementById('disclaimer-accept');

    checkbox.addEventListener('change', function() {
        acceptButton.disabled = !this.checked;
    });

    acceptButton.addEventListener('click', function() {
        if (checkbox.checked) {
            localStorage.setItem('disclaimerAccepted', 'true');
            hideDisclaimerModal();
            loadJsonData();
        }
    });
});

function showDisclaimerModal() {
    document.getElementById('disclaimer-modal').style.display = 'flex';
}

function hideDisclaimerModal() {
    document.getElementById('disclaimer-modal').style.display = 'none';
}

async function loadJsonData() {
    try {
        const response = await fetch('./gutenberg_images.json');
        data = await response.json();
        if (data && data.length > 0) {
            console.log(`Loaded ${data.length} items`);
            createVolumeNavigation();
            createVolumeDropdown(); // Add this line
            initializeCarousel();
            setupNavigationEventListeners();
        } else {
            console.error('No data loaded from JSON file');
        }
    } catch (error) {
        console.error('Error loading JSON data:', error);
    }
}

function initializeCarousel() {
    updateCard();
    setupEventListeners();
    updateCarouselIndicator();
}

function updateCard() {
    const item = data[currentIndex];
    document.getElementById('main-image').src = item.local_path;
    document.getElementById('main-image').alt = item.description;
    
    const titleElement = document.getElementById('title');
    const bookSourceElement = document.getElementById('book-source');
    const moreTextElement = document.getElementById('more-text');
    const readMoreElement = document.getElementById('read-more');

    if (item.description.length > 100) {
        titleElement.textContent = item.description.substring(0, 100) + '...';
        moreTextElement.textContent = item.description.substring(100);
        readMoreElement.style.display = 'inline';
    } else {
        titleElement.textContent = item.description;
        moreTextElement.style.display = 'none';
        readMoreElement.style.display = 'none';
    }

    // Find the simplified name for the current book
    const simplifiedName = Array.from(document.querySelectorAll('#volume-dropdown a'))
        .find(link => link.dataset.fullName === item.book_name).textContent;
    bookSourceElement.textContent = simplifiedName;

    updateCarouselIndicator();
}

function createVolumeNavigation() {
    const nav = document.getElementById('volume-nav');
    if (!nav) {
        console.error('Element with ID "volume-nav" not found');
        return;
    }
    nav.innerHTML = '<button id="close-nav-btn" class="close-btn">&times;</button>';
    const volumes = new Set(data.map(item => item.book_name));
    
    volumes.forEach(volume => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = volume;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            jumpToVolume(volume);
            closeNav();
        });
        nav.appendChild(link);
    });
}

function jumpToVolume(volume) {
    const index = data.findIndex(item => item.book_name === volume);
    if (index !== -1) {
        currentIndex = index;
        updateCard();
        const simplifiedName = Array.from(document.querySelectorAll('#volume-dropdown a'))
            .find(link => link.dataset.fullName === volume).textContent;
        document.getElementById('selected-volume').textContent = simplifiedName + ' ▼';
    }
}

function openNav() {
    const nav = document.getElementById('volume-nav');
    const overlay = document.querySelector('.overlay');
    if (nav) {
        nav.style.width = '250px'; // Adjust as needed
    }
    if (overlay) {
        overlay.style.display = 'block';
    }
}

function closeNav() {
    const nav = document.getElementById('volume-nav');
    const overlay = document.querySelector('.overlay');
    if (nav) {
        nav.style.width = '0';
    }
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function goToSlide(index) {
    currentIndex = index;
    updateCard();
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % data.length;
    updateCard();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + data.length) % data.length;
    updateCard();
}

function setupEventListeners() {
    document.getElementById('prev-btn').addEventListener('click', prevSlide);
    document.getElementById('next-btn').addEventListener('click', nextSlide);
    document.getElementById('main-image').addEventListener('click', openModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('image-modal').addEventListener('click', closeModalOnClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('read-more').addEventListener('click', function (e) {
        e.preventDefault();
        const titleElement = document.getElementById('title');
        const moreTextElement = document.getElementById('more-text');
        titleElement.textContent += moreTextElement.textContent;
        this.style.display = 'none';
        moreTextElement.style.display = 'none';
    });

    // Update the horizontal scroll event listener
    document.getElementById('carousel-container').addEventListener('wheel', handleHorizontalScroll, { passive: false });
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.getElementById('carousel-container').addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.getElementById('carousel-container').addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function openModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const mainImg = document.getElementById('main-image');
    modal.style.display = "flex"; // Make sure this is "flex"
    modalImg.src = mainImg.src;
    modalImg.alt = mainImg.alt;
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = "none";
}

function closeModalOnClickOutside(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    }
}

function handleHorizontalScroll(event) {
    const now = new Date().getTime();
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        if (now - lastScrollTime > scrollCooldown) {
            if (event.deltaX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            lastScrollTime = now;
        }
    }
}

function handleSwipe() {
    const now = new Date().getTime();
    if (now - lastScrollTime > scrollCooldown) {
        if (touchEndX < touchStartX) nextSlide();
        if (touchEndX > touchStartX) prevSlide();
        lastScrollTime = now;
    }
}

function updateCarouselIndicator() {
    const indicator = document.getElementById('carousel-indicator');
    indicator.textContent = `${currentIndex + 1} / ${data.length}`;
}

// Initialize
if (localStorage.getItem('disclaimerAccepted') === 'true') {
    loadJsonData();
} else {
    showDisclaimerModal();
}

function jumpToBook(bookName) {
    const index = data.findIndex(item => item.book_name === bookName);
    if (index !== -1) {
        currentIndex = index;
        updateCard();
    } else {
        console.error(`No items found for book name ${bookName}`);
    }
}

function setupNavigationEventListeners() {
    const openNavBtn = document.getElementById('open-nav-btn');
    const closeNavBtn = document.getElementById('close-nav-btn');
    const overlay = document.querySelector('.overlay');

    if (openNavBtn) {
        openNavBtn.addEventListener('click', openNav);
    } else {
        console.error('Element with ID "open-nav-btn" not found');
    }

    if (closeNavBtn) {
        closeNavBtn.addEventListener('click', closeNav);
    } else {
        console.error('Element with ID "close-nav-btn" not found');
    }

    if (overlay) {
        overlay.addEventListener('click', closeNav);
    } else {
        console.error('Element with class "overlay" not found');
    }

    // Close the nav when pressing the Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNav();
        }
    });
}

// Call the setup function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupNavigationEventListeners);

function createVolumeDropdown() {
    const dropdown = document.getElementById('volume-dropdown');
    const selectedVolumeBtn = document.getElementById('selected-volume');
    dropdown.innerHTML = ''; // Clear existing content
    
    const volumes = new Set(data.map(item => item.book_name));
    let volumeNumber = 1;
    
    volumes.forEach(volume => {
        const simplifiedName = `Volume ${volumeNumber}`;
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = simplifiedName;
        link.dataset.fullName = volume; // Store the full name as a data attribute
        link.addEventListener('click', (e) => {
            e.preventDefault();
            jumpToVolume(volume);
            selectedVolumeBtn.textContent = simplifiedName + ' ▼';
            closeDropdown(); // Add this line to close the dropdown
        });
        dropdown.appendChild(link);
        volumeNumber++;
    });
}

// Add this new function to close the dropdown
function closeDropdown() {
    const dropdown = document.getElementById('volume-dropdown');
    dropdown.style.display = 'none';
}

// Modify the existing event listener for the dropdown button
document.addEventListener('DOMContentLoaded', () => {
    const dropdownBtn = document.getElementById('selected-volume');
    const dropdown = document.getElementById('volume-dropdown');

    dropdownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});