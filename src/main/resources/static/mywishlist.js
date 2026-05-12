// ============================================================
// my-wishlist.js — ArtsyVibe My Wishlist Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------
    // 1. Category filter pills
    // ----------------------------------------------------------
    window.filterWishlist = function (category, button) {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.wishlist-item').forEach(row => {
            const show = category === 'all' || row.dataset.category === category;
            row.style.display = show ? '' : 'none';
        });
    };

    // ----------------------------------------------------------
    // 2. Remove from wishlist
    // ----------------------------------------------------------
    window.removeFromWishlist = function (button) {
        const row = button.closest('.wishlist-item');
        if (!row) return;

        row.style.opacity   = '0';
        row.style.transform = 'translateX(-20px)';
        row.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            row.remove();
            updateWishlistCount();
            checkEmptyState();
        }, 300);
    };

    // ----------------------------------------------------------
    // 3. Add to cart from wishlist
    // ----------------------------------------------------------
    window.addToCart = function (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-1"></i>Added!';
        button.classList.remove('bg-[#c17c5f]');
        button.classList.add('bg-green-600');
        button.disabled = true;

        // Update cart badge
        incrementCartCount();

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('bg-green-600');
            button.classList.add('bg-[#c17c5f]');
            button.disabled = false;
        }, 1500);
    };

    // ----------------------------------------------------------
    // 4. "Add All to Cart" button (optional enhancement)
    // ----------------------------------------------------------
    buildAddAllButton();

    // ----------------------------------------------------------
    // 5. Initial count
    // ----------------------------------------------------------
    updateWishlistCount();
});

// ============================================================
// Wishlist count & empty state
// ============================================================

function updateWishlistCount() {
    const visible = document.querySelectorAll('.wishlist-item').length;
    const countEl = document.getElementById('wishlist-count');
    if (countEl) countEl.textContent = visible;
}

function checkEmptyState() {
    const remaining = document.querySelectorAll('.wishlist-item').length;
    const tableWrap = document.querySelector('table')?.closest('div');
    const filterBar = document.querySelector('.filter-pill')?.closest('.bg-white');
    const emptyState = document.getElementById('empty-state');

    if (remaining === 0) {
        tableWrap?.classList.add('hidden');
        filterBar?.classList.add('hidden');
        emptyState?.classList.remove('hidden');
    }
}

// ============================================================
// Cart badge helper
// ============================================================

function incrementCartCount() {
    const badges = document.querySelectorAll('.fa-shopping-cart + span, .fa-shopping-cart ~ span');
    let newCount = parseInt(sessionStorage.getItem('cartCount') ?? '0', 10) + 1;
    sessionStorage.setItem('cartCount', newCount);

    document.querySelectorAll('.fa-shopping-cart').forEach(icon => {
        const badge = icon.parentElement?.querySelector('span');
        if (badge) badge.textContent = newCount;
    });
}

// ============================================================
// "Add All to Cart" button injection
// ============================================================

function buildAddAllButton() {
    const header = document.querySelector('main .mb-8');
    if (!header || document.getElementById('add-all-btn')) return;

    const btn = document.createElement('button');
    btn.id        = 'add-all-btn';
    btn.className = 'mt-4 px-6 py-2.5 bg-[#c17c5f] hover:bg-[#a5664d] text-white rounded-xl font-semibold transition-colors shadow-md text-sm';
    btn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Add All to Cart';
    header.appendChild(btn);

    btn.addEventListener('click', () => {
        const addBtns = document.querySelectorAll('.wishlist-item:not([style*="none"]) .add-to-cart-btn');
        if (addBtns.length === 0) {
            showToast('No items to add.', 'info');
            return;
        }
        addBtns.forEach(b => b.click());
        showToast(`${addBtns.length} item(s) added to cart!`, 'success');
    });
}

// ============================================================
// Toast
// ============================================================

function showToast(message, type = 'info') {
    document.getElementById('av-toast')?.remove();
    const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
    const toast = document.createElement('div');
    toast.id        = 'av-toast';
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colours[type]}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
