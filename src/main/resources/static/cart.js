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
        if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to change delivery options.')) return;
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
        if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to update item quantities.')) return;
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
        if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to remove items from your cart.')) return;
        const cartItem = button.closest('.cart-item');

        // Animation
        cartItem.style.opacity = '0';
        cartItem.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            cartItem.remove();
            updateCartTotal();

            checkCartEmpty();
        }, 300);
    };

    function checkCartEmpty() {
        const container = document.getElementById('cart-items-container');
        const emptyMsg = document.getElementById('empty-cart-msg');
        const summary = document.querySelector('.mt-4.pt-4.border-t-2'); // Order summary div
        const confirmBtn = document.getElementById('confirm-btn');

        if (container && !container.querySelectorAll('.cart-item').length) {
            emptyMsg?.classList.remove('hidden');
            if (summary) summary.style.display = 'none';
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            emptyMsg?.classList.add('hidden');
            if (summary) summary.style.display = 'block';
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    // --- 4. Payment Method Selection ---
    window.selectPayment = function(card) {
        if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to change payment method.')) return;
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

    // Load addresses from DB
    loadCartAddresses();

    // Check if empty on load
    checkCartEmpty();

    // Initialize Calculation on load
    updateCartTotal();
    updateLoginState();
});

function loadCartAddresses() {
    const email = sessionStorage.getItem('userEmail') || '';
    const grid = document.getElementById('cart-addresses-grid');
    const noAddresses = document.getElementById('cart-no-addresses');
    if (!grid) return;

    if (!email) {
        if (noAddresses) noAddresses.classList.remove('hidden');
        return;
    }

    fetch(`/api/addresses?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(addresses => {
            // Remove old address labels (keep the no-address message)
            grid.querySelectorAll('label.cart-address-item').forEach(el => el.remove());

            if (!addresses.length) {
                if (noAddresses) noAddresses.classList.remove('hidden');
                return;
            }
            if (noAddresses) noAddresses.classList.add('hidden');

            let firstChecked = false;
            addresses.forEach(addr => {
                const isFirst = !firstChecked && (addr.default || true);
                if (!firstChecked) firstChecked = true;
                const checked = addr.default ? 'checked' : '';
                const defBadge = addr.default
                    ? '<span class="ml-2 px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full uppercase font-bold">Default</span>'
                    : '';
                const html = `
                    <label class="relative cursor-pointer group cart-address-item">
                        <input type="radio" name="selected_address" value="${addr.id}" class="peer sr-only" ${checked}>
                        <div class="h-full p-4 rounded-xl border-2 border-[#f8f5f0] bg-[#fcfaf7] transition-all
                                    peer-checked:border-[#c17c5f] peer-checked:bg-white hover:border-[#e5e0d8]">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-map-marker-alt text-[#c17c5f] mr-2"></i>
                                <span class="font-bold text-[#5c4a3d]">${escapeHtml(addr.label)}</span>${defBadge}
                            </div>
                            <div class="text-sm text-[#8a7a6d] leading-relaxed">
                                ${escapeHtml(addr.street)}<br>
                                ${escapeHtml(addr.city)}<br>
                                ${escapeHtml(addr.country)}
                            </div>
                        </div>
                    </label>`;
                noAddresses.insertAdjacentHTML('beforebegin', html);
            });
        })
        .catch(err => console.error('Failed to load addresses for cart', err));
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

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
