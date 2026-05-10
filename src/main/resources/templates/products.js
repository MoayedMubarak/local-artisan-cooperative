document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Price Range Slider ---
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    if (priceRange && priceValue) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = this.value + ' BD';
        });
    }

    function updateItemCount() {
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        const visibleCount = productCards.filter(card => card.style.display !== 'none').length;
        const countElement = document.getElementById('item-count');
        if (countElement) {
            countElement.textContent = visibleCount.toString();
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
    const categoryRadios = document.querySelectorAll('input[type="radio"][name="category"]');
    const auctionCheckbox = document.querySelector('input[type="checkbox"]');
    const searchInput = document.querySelector('input[placeholder="Search..."]');

    function applyFilters() {
        const searchTerm = searchInput?.value.trim().toLowerCase() || '';
        const selectedCategory = getSelectedCategoryValue();
        const showAuctionsOnly = auctionCheckbox?.checked || false;

        productCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const matchesSearch = !searchTerm || cardText.includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || cardText.includes(selectedCategory);
            const matchesAuction = !showAuctionsOnly || card.dataset.auctionCard === 'true';

            card.style.display = (matchesSearch && matchesCategory && matchesAuction) ? 'block' : 'none';
        });

        updateItemCount();
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
    applyFilters();

    // --- 5. View Details Navigation ---
    document.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button || button.textContent.trim() !== 'View Details') return;

        const card = button.closest('.product-card');
        if (!card) return;

        const target = card.dataset.detailPage || 'Product-Details(Standard).html';
        window.location.href = target;
    });
});
