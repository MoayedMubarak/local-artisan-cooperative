document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Price Range Slider ---
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    // Login state elements
    const loginButtonWrapper = document.getElementById('login-button-wrapper');
    const userSection = document.getElementById('user-section');
    const navUserName = document.getElementById('nav-user-name');
    const navUserEmail = document.getElementById('nav-user-email');
    const notificationBadge = document.getElementById('notification-badge');
    const cartBadge = document.getElementById('cart-badge');

    function updateLoginState() {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        if (loggedIn) {
            loginButtonWrapper?.classList.add('hidden');
            userSection?.classList.remove('hidden');

            const userName = sessionStorage.getItem('userName') || 'John Doe';
            const userEmail = sessionStorage.getItem('userEmail') || 'john@example.com';
            if (navUserName) navUserName.textContent = userName;
            if (navUserEmail) navUserEmail.textContent = userEmail;

            updateNotificationBadge();
        } else {
            loginButtonWrapper?.classList.remove('hidden');
            userSection?.classList.add('hidden');
        }

        updateCartBadge();
    }

    function updatePriceDisplay() {
        if (priceRange && priceValue) {
            priceValue.textContent = priceRange.value + ' BD';
        }
    }

    if (priceRange) {
        priceRange.addEventListener('input', function() {
            updatePriceDisplay();
            applyFilters();
        });
    }

    function updateItemCount() {
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        const visibleCount = productCards.filter(card => card.style.display !== 'none').length;
        const countElement = document.getElementById('item-count');
        if (countElement) {
            countElement.textContent = visibleCount.toString();
        }

        // Show/hide no-results message
        let noResults = document.getElementById('no-results-msg');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'no-results-msg';
                noResults.className = 'col-span-3 text-center py-16 text-[#8b7355]';
                noResults.innerHTML = '<i class="fas fa-search text-4xl mb-4 block text-[#d4c5b5]"></i><p class="text-lg font-medium">No products match your filters.</p><p class="text-sm mt-1">Try adjusting your search or category.</p>';
                const grid = document.querySelector('.grid.grid-cols-1');
                if (grid) grid.appendChild(noResults);
            }
            noResults.style.display = 'block';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }

    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            search: params.get('search')?.trim() || '',
            category: params.get('category')?.trim().toLowerCase() || '',
            auctionOnly: params.get('auction') === 'true',
        };
    }

    function getSelectedCategoryValue() {
        return document.querySelector('input[type="radio"][name="category"]:checked')?.value || 'all';
    }

    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2') || document.querySelector('#product-grid') || productCards[0]?.parentElement;
    const categoryRadios = document.querySelectorAll('input[type="radio"][name="category"]');
    const auctionCheckbox = document.querySelector('input[type="checkbox"]');
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    const sortSelect = document.querySelector('select');

    function applyFilters() {
        const searchTerm = searchInput?.value.trim().toLowerCase() || '';
        const selectedCategory = getSelectedCategoryValue();
        const showAuctionsOnly = auctionCheckbox?.checked || false;
        const maxPrice = priceRange ? parseFloat(priceRange.value) : Infinity;

        productCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const cardCategory = card.dataset.category?.trim().toLowerCase() || '';
            const cardPrice = card.dataset.price ? parseFloat(card.dataset.price) : 0;

            const matchesSearch = !searchTerm || cardText.includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || cardCategory === selectedCategory || cardText.includes(selectedCategory);
            const matchesAuction = !showAuctionsOnly || card.dataset.auctionCard === 'true';
            const matchesPrice = cardPrice <= maxPrice;

            card.style.display = (matchesSearch && matchesCategory && matchesAuction && matchesPrice) ? 'block' : 'none';
        });

        updateItemCount();

        // Re-sort after filtering so the visible order stays correct
        if (sortSelect) sortProducts(sortSelect.value);
    }

    // --- 2. Sort Products ---
    function sortProducts(criteria) {
        const parent = productCards[0]?.parentElement;
        if (!parent) return;

        const visible = productCards.filter(c => c.style.display !== 'none');
        const hidden  = productCards.filter(c => c.style.display === 'none');

        visible.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price) || 0;
            const priceB = parseFloat(b.dataset.price) || 0;
            const nameA  = a.querySelector('h3')?.textContent.trim().toLowerCase() || '';
            const nameB  = b.querySelector('h3')?.textContent.trim().toLowerCase() || '';

            if (criteria === 'price-low')  return priceA - priceB;
            if (criteria === 'price-high') return priceB - priceA;
            if (criteria === 'name')       return nameA.localeCompare(nameB);
            return 0; // 'featured' / 'newest' — keep original order
        });

        // Re-append in sorted order; hidden cards go to the end
        [...visible, ...hidden].forEach(c => parent.appendChild(c));
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortProducts(sortSelect.value);
        });
    }

    categoryRadios.forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });

    if (auctionCheckbox) {
        auctionCheckbox.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }

    function syncFiltersFromUrl() {
        const params = getUrlParams();

        if (searchInput && params.search) {
            searchInput.value = params.search;
        }

        if (params.category) {
            const categoryInput = document.querySelector(`input[type="radio"][name="category"][value="${params.category}"]`);
            if (categoryInput) {
                categoryInput.checked = true;
            }
        }

        if (auctionCheckbox) {
            auctionCheckbox.checked = params.auctionOnly;
        }
    }

    syncFiltersFromUrl();
    updatePriceDisplay();
    applyFilters();
    updateLoginState();

    // --- 3. View Details Navigation ---
    document.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button || button.textContent.trim() !== 'View Details') return;

        const card = button.closest('.product-card');
        if (!card) return;

        const target = card.dataset.detailPage || '/ProductDetailsStandard';
        window.location.href = target;
    });
});

// ============================================================
// Utility helpers (shared across pages via global scope)
// ============================================================

/**
 * Read the notification count from sessionStorage and update any badge on the page.
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '4', 10);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

/**
 * Read cart item count from sessionStorage and update any cart badge on the page.
 */
function updateCartBadge() {
    document.querySelectorAll('.fa-shopping-cart')
        .forEach(icon => {
            const badge = icon.parentElement?.querySelector('span');
            if (!badge) return;
            const count = parseInt(sessionStorage.getItem('cartCount') ?? '3', 10);
            badge.textContent = count;
        });
}
