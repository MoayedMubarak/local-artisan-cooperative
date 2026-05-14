document.addEventListener('DOMContentLoaded', () => {

    // Login state elements
    const loginButtonWrapper = document.getElementById('login-button-wrapper');
    const userSection = document.getElementById('user-section');
    const navUserName = document.getElementById('nav-user-name');
    const navUserEmail = document.getElementById('nav-user-email');
    const notificationBadge = document.getElementById('notification-badge');
    const cartBadge = document.getElementById('cart-badge');

    function updateLoginState() {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('loggedIn') === 'true';
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
    
    // --- 1. Image Gallery Logic ---
    window.changeImage = function(thumbnail) {
        const mainImage = document.getElementById('mainImage');
        // Update source to higher res
        mainImage.src = thumbnail.src.replace('w=150&h=150', 'w=600&h=500');
        
        // Update active state styling
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    // --- 2. Add to Cart (persisted to database via /api/cart/add) ---
    const addToCartBtns = document.querySelectorAll('button:has(.fa-shopping-cart)');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to add items to your cart.')) {
                return;
            }
            const meta = document.getElementById('product-page-meta');
            const fromUrl = new URLSearchParams(window.location.search).get('id');
            const productId = meta?.dataset?.productId || fromUrl;
            if (!productId) {
                showToast('Product not available.', 'error');
                return;
            }
            if (meta?.dataset?.auction === 'true') {
                showToast('Auction items cannot be added to the cart.', 'info');
                return;
            }
            const originalText = this.innerHTML;
            this.disabled = true;
            try {
                if (!window.addProductToCart) {
                    throw new Error('Cart is unavailable. Refresh the page.');
                }
                await window.addProductToCart(productId, 1);
                this.innerHTML = '<i class="fas fa-check mr-2"></i>Added!';
                this.classList.remove('bg-[#c17c5f]', 'hover:bg-[#a5664d]');
                this.classList.add('bg-green-600');
                showToast('Added to Cart!', 'success');
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.add('bg-[#c17c5f]', 'hover:bg-[#a5664d]');
                    this.classList.remove('bg-green-600');
                    this.disabled = false;
                }, 900);
            } catch (err) {
                showToast(err.message || 'Could not add to cart', 'error');
                this.disabled = false;
            }
        });
    });

    // --- 3. Add to Wishlist ---
    const addToWishlistBtns = document.querySelectorAll('button:has(.fa-heart)');
    addToWishlistBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (icon.classList.contains('far')) { // Currently not saved (regular heart)
                icon.classList.remove('far');
                icon.classList.add('fas', 'text-red-500'); // Solid red heart
                showToast('Added to Wishlist', 'success');
            } else { // Currently saved
                icon.classList.remove('fas', 'text-red-500');
                icon.classList.add('far'); // Back to regular heart
                showToast('Removed from Wishlist', 'info');
            }
        });
    });

    // --- 4. Utility: Toast Notification ---
    function showToast(message, type = 'info') {
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 8px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px; min-width: 250px; }
                .toast.success { background-color: #10b981; border-left: 5px solid #059669; }
                .toast.info { background-color: #2563eb; border-left: 5px solid #1d4ed8; }
                .toast.error { background-color: #dc2626; border-left: 5px solid #b91c1c; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
            if (!document.querySelector('.toast-container')) {
                document.body.insertAdjacentHTML('afterbegin', '<div class="toast-container"></div>');
            }
        }
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    updateLoginState();
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
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '0', 10);
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
            const count = parseInt(sessionStorage.getItem('cartCount') ?? '0', 10);
            badge.textContent = count;
        });
}
