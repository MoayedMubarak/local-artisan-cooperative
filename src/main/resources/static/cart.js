document.addEventListener('DOMContentLoaded', () => {

    // Constants
    const SHIPPING_COST = 2.00;
    let isShipping = true; // Default state

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

    // --- 1. Delivery Toggle (Ship vs Pickup) ---
    window.selectDelivery = function(mode) {
        isShipping = (mode === 'ship');

        const shipCard = document.getElementById('card-ship');
        const pickupCard = document.getElementById('card-pickup');
        const shippingSection = document.getElementById('shipping-form-section');
        const pickupInfo = document.getElementById('pickup-info');
        const shippingRow = document.getElementById('shipping-cost-row');

        // Visual updates for cards
        if (isShipping) {
            shipCard.classList.add('selected');
            pickupCard.classList.remove('selected');
            // Show shipping form
            shippingSection.style.display = 'block';
            pickupInfo.classList.add('hidden');
            // Update cost row
            if(shippingRow) {
                document.getElementById('shipping-label').textContent = 'Shipping';
                document.getElementById('shipping-cost-display').textContent = SHIPPING_COST.toFixed(2) + ' BD';
            }
        } else {
            pickupCard.classList.add('selected');
            shipCard.classList.remove('selected');
            // Hide shipping form
            shippingSection.style.display = 'none';
            pickupInfo.classList.remove('hidden');
            // Update cost row
            if(shippingRow) {
                document.getElementById('shipping-label').textContent = 'Pickup';
                document.getElementById('shipping-cost-display').textContent = 'Free';
            }
        }

        updateCartTotal();
    };

    // --- 2. Quantity Update ---
    window.updateQuantity = function(button, change) {
        const cartItem = button.closest('.cart-item');
        const quantitySpan = cartItem.querySelector('.quantity-value');
        const priceText = cartItem.querySelector('.text-\\[\\#c17c5f\\]').textContent; // Matches the BD price
        const price = parseFloat(priceText.replace(' BD', ''));
        const subtotalEl = cartItem.querySelector('.item-subtotal');

        let qty = parseInt(quantitySpan.textContent) + change;
        if (qty < 1) qty = 1; // Prevent zero/negative

        // Update UI
        quantitySpan.textContent = qty;
        subtotalEl.textContent = (price * qty).toFixed(2) + ' BD';

        updateCartTotal();
    };

    // --- 3. Remove Item ---
    window.removeItem = function(button) {
        const cartItem = button.closest('.cart-item');

        // Animation
        cartItem.style.opacity = '0';
        cartItem.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            cartItem.remove();
            updateCartTotal();

            // Check if empty
            if (!document.querySelectorAll('.cart-item').length) {
                alert('Your cart is empty!'); // Fallback or could show empty state div
            }
        }, 300);
    };

    // --- 4. Payment Method Selection ---
    window.selectPayment = function(card) {
        document.querySelectorAll('.payment-card').forEach(c => {
            c.classList.remove('selected');
            const radio = c.querySelector('input[type="radio"]');
            const indicator = c.querySelector('.w-6.h-6');
            if (indicator) {
                indicator.className = 'w-6 h-6 border-2 border-[#e5e0d8] rounded-full mr-4';
                indicator.innerHTML = '';
            }
            if (radio) radio.checked = false;
        });

        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        const indicator = card.querySelector('.w-6.h-6');
        if (indicator) {
            indicator.className = 'w-6 h-6 border-2 border-[#c17c5f] bg-[#c17c5f] rounded-full mr-4 flex items-center justify-center';
            indicator.innerHTML = '<i class="fas fa-check text-white text-xs"></i>';
        }
        if (radio) radio.checked = true;
    };

    // --- 5. Total Calculation ---
    function updateCartTotal() {
        let itemsTotal = 0;
        document.querySelectorAll('.item-subtotal').forEach(el => {
            itemsTotal += parseFloat(el.textContent.replace(' BD', ''));
        });

        const shipping = isShipping ? SHIPPING_COST : 0;
        const grandTotal = itemsTotal + shipping;

        // Update DOM elements
        const itemsSubtotalEl = document.getElementById('items-subtotal');
        const cartTotalEl = document.getElementById('cart-total');
        const confirmBtn = document.getElementById('confirm-btn');

        if (itemsSubtotalEl) itemsSubtotalEl.textContent = itemsTotal.toFixed(2) + ' BD';
        if (cartTotalEl) cartTotalEl.textContent = grandTotal.toFixed(2) + ' BD';

        if (confirmBtn) {
            confirmBtn.innerHTML = `<i class="fas fa-check-circle mr-3"></i>Confirm Order (${grandTotal.toFixed(2)} BD)`;
        }
    }

    // --- 6. Confirm Button ---
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            // Basic validation
            const selectedPayment = document.querySelector('.payment-card.selected input[type="radio"]');

            if (!selectedPayment) {
                alert('Please select a payment method.');
                return;
            }

            if (isShipping) {
                const selectedAddress = document.querySelector('input[name="selected_address"]:checked');
                if (!selectedAddress) {
                    alert('Please select a shipping address.');
                    return;
                }
            }

            // Simulate checkout process
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>Processing...';
            confirmBtn.disabled = true;

            setTimeout(() => {
                alert('Order confirmed! Redirecting to confirmation...');
                // window.location.href = '/OrderConformation';
            }, 2000);
        });
    }

    // Initialize Calculation on load
    updateCartTotal();
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