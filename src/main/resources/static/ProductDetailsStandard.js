document.addEventListener('DOMContentLoaded', () => {

    // Login state elements
    const loginButtonWrapper = document.getElementById('login-button-wrapper');
    const userSection = document.getElementById('user-section');
    const navUserName = document.getElementById('nav-user-name');
    const navUserEmail = document.getElementById('nav-user-email');
    const notificationBadge = document.getElementById('notification-badge');
    const cartBadge = document.getElementById('cart-badge');

    // Removed redundant updateLoginState - handled globally by authguard.js
    
    // --- 1. Image Gallery Logic ---
    window.changeImage = function(thumbnail) {
        const mainImage = document.getElementById('mainImage');
        // Update source to higher res
        mainImage.src = thumbnail.src.replace('w=150&h=150', 'w=600&h=500');
        
        // Update active state styling
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    // --- 2. Add to Cart ---
    const addToCartBtns = document.querySelectorAll('button:has(.fa-shopping-cart)');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const userEmail = sessionStorage.getItem('userEmail');
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('loggedIn') === 'true';
            
            if (!isLoggedIn) {
                showToast('Please login to add items to your cart', 'error');
                return;
            }

            const productId = document.querySelector('[data-product-id]')?.dataset.productId;
            if (!productId) return;

            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Adding...';
            this.disabled = true;

            try {
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, productId: productId, quantity: 1 })
                });

                const data = await response.json();
                if (data.success) {
                    showToast('Added to Cart!', 'success');
                    this.innerHTML = '<i class="fas fa-check mr-2"></i>Added!';
                    this.classList.remove('bg-[#c17c5f]', 'hover:bg-[#a5664d]');
                    this.classList.add('bg-green-600');
                    
                    // Update global cart count
                    sessionStorage.setItem('cartCount', data.cartCount);
                    if (window.updateCartBadge) window.updateCartBadge();

                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.classList.add('bg-[#c17c5f]', 'hover:bg-[#a5664d]');
                        this.classList.remove('bg-green-600');
                        this.disabled = false;
                    }, 2000);
                } else {
                    showToast(data.message || 'Failed to add to cart', 'error');
                    this.innerHTML = originalText;
                    this.disabled = false;
                }
            } catch (err) {
                console.error("Cart error", err);
                showToast('Error adding to cart', 'error');
                this.innerHTML = originalText;
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
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
            if (!document.querySelector('.toast-container')) {
                document.body.insertAdjacentHTML('afterbegin', '<div class="toast-container"></div>');
            }
        }
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    // Logic handled globally or locally above
});
