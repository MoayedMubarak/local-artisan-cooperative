document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Price Range Slider ---
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = this.value + ' BD';
        });
    }

    // --- 2. Category Filtering (Radio Buttons) ---
    const radioInputs = document.querySelectorAll('input[type="radio"][name="category"]');
    
    radioInputs.forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedCategory = this.parentElement.querySelector('span').textContent;
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(card => {
                // Since we don't have data-attributes, we perform a text content search
                // This checks if the category name exists inside the card
                if (this.value === 'all' || card.textContent.includes(selectedCategory)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- 3. Show Auctions Only (Checkbox) ---
    const auctionCheckbox = document.querySelector('input[type="checkbox"]');
    
    if (auctionCheckbox) {
        auctionCheckbox.addEventListener('change', function() {
            const showOnlyAuctions = this.checked;
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(card => {
                const hasAuctionBadge = card.querySelector('.auction-badge');
                
                if (showOnlyAuctions) {
                    // If checked, only show cards with the auction badge
                    card.style.display = hasAuctionBadge ? 'block' : 'none';
                } else {
                    // Show all (unless hidden by category filter)
                    card.style.display = 'block';
                }
            });
        });
    }

    // --- 4. Search Input ---
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
