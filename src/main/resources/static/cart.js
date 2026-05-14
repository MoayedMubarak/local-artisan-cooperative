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

    // Removed redundant updateLoginState - handled globally by authguard.js

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

    // --- 2. Load Cart Items ---
    async function loadCartItems() {
        const email = sessionStorage.getItem('userEmail');
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (!email) {
            container.innerHTML = '<div class="py-12 text-center text-[#8b7355]"><i class="fas fa-shopping-cart text-4xl mb-4 block opacity-20"></i><p class="text-lg font-medium">Please login to view your cart</p></div>';
            updateCartTotal();
            return;
        }

        try {
            const response = await fetch(`/api/cart?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (data.success && data.items.length > 0) {
                container.innerHTML = '';
                data.items.forEach(item => {
                    const itemHtml = `
                        <div class="cart-item flex items-center gap-4" data-product-id="${item.product.id}">
                            <img src="${item.product.imageUrl}" alt="${item.product.title}" class="cart-item-img">
                            <div class="flex-1 min-w-0">
                                <h3 class="font-semibold text-[#5c4a3d] truncate">${item.product.title}</h3>
                                <p class="text-sm text-[#8b7355]">by ${item.product.artisanName}</p>
                                <p class="text-[#c17c5f] font-bold mt-1">${item.product.price.toFixed(2)} BD</p>
                            </div>
                            <div class="flex flex-col items-end gap-2 flex-shrink-0">
                                <div class="flex items-center border border-[#e5e0d8] rounded-lg">
                                    <button class="quantity-btn px-3 py-1 text-[#8b7355]" onclick="updateQuantity(this, -1)">
                                        <i class="fas fa-minus text-xs"></i>
                                    </button>
                                    <span class="px-3 py-1 text-[#5c4a3d] font-medium quantity-value">${item.quantity}</span>
                                    <button class="quantity-btn px-3 py-1 text-[#8b7355]" onclick="updateQuantity(this, 1)">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-3">
                                    <p class="font-bold text-[#5c4a3d] item-subtotal">${(item.product.price * item.quantity).toFixed(2)} BD</p>
                                    <button class="text-[#8b7355] hover:text-red-500 transition-colors" onclick="removeItem(this)">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', itemHtml);
                });
                
                // Update global count
                sessionStorage.setItem('cartCount', data.items.length);
                if (window.updateCartBadge) window.updateCartBadge();
            } else {
                container.innerHTML = '<div class="py-12 text-center text-[#8b7355]"><i class="fas fa-shopping-cart text-4xl mb-4 block opacity-20"></i><p class="text-lg font-medium">Your cart is empty</p><a href="/products" class="text-[#c17c5f] underline mt-2 inline-block">Start Shopping</a></div>';
                sessionStorage.setItem('cartCount', 0);
                if (window.updateCartBadge) window.updateCartBadge();
            }
        } catch (err) {
            console.error("Failed to load cart", err);
            container.innerHTML = '<div class="py-12 text-center text-red-500"><p>Error loading cart. Please try again.</p></div>';
        }

        updateCartTotal();
    }

    // --- 3. Quantity Update ---
    window.updateQuantity = async function(button, change) {
        const cartItem = button.closest('.cart-item');
        const productId = cartItem.dataset.productId;
        const userEmail = sessionStorage.getItem('userEmail');
        
        const quantitySpan = cartItem.querySelector('.quantity-value');
        let currentQty = parseInt(quantitySpan.textContent);
        let newQty = currentQty + change;
        
        if (newQty < 1) return;

        // Visual update first (optimistic)
        quantitySpan.textContent = newQty;
        const priceText = cartItem.querySelector('.text-\\[\\#c17c5f\\]').textContent;
        const price = parseFloat(priceText.replace(' BD', ''));
        cartItem.querySelector('.item-subtotal').textContent = (price * newQty).toFixed(2) + ' BD';
        updateCartTotal();

        try {
            // We use the /add endpoint with change as quantity (it adds to existing)
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, productId: productId, quantity: change })
            });
            const data = await response.json();
            if (!data.success) {
                // Revert on failure
                quantitySpan.textContent = currentQty;
                cartItem.querySelector('.item-subtotal').textContent = (price * currentQty).toFixed(2) + ' BD';
                updateCartTotal();
                alert(data.message || "Failed to update quantity");
            }
        } catch (err) {
            console.error("Quantity update failed", err);
            quantitySpan.textContent = currentQty;
            updateCartTotal();
        }
    };

    // --- 4. Remove Item ---
    window.removeItem = async function(button) {
        const cartItem = button.closest('.cart-item');
        const productId = cartItem.dataset.productId;
        const userEmail = sessionStorage.getItem('userEmail');

        try {
            const response = await fetch(`/api/cart/remove/${productId}?email=${encodeURIComponent(userEmail)}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                // Animation
                cartItem.style.opacity = '0';
                cartItem.style.transform = 'translateX(-20px)';

                setTimeout(() => {
                    cartItem.remove();
                    updateCartTotal();

                    // Update global count
                    const currentCount = parseInt(sessionStorage.getItem('cartCount') || '0');
                    sessionStorage.setItem('cartCount', Math.max(0, currentCount - 1));
                    if (window.updateCartBadge) window.updateCartBadge();

                    // Check if empty
                    if (!document.querySelectorAll('.cart-item').length) {
                        document.getElementById('cart-items-container').innerHTML = '<div class="py-12 text-center text-[#8b7355]"><i class="fas fa-shopping-cart text-4xl mb-4 block opacity-20"></i><p class="text-lg font-medium">Your cart is empty</p></div>';
                    }
                }, 300);
            } else {
                alert(data.message || "Failed to remove item");
            }
        } catch (err) {
            console.error("Removal failed", err);
        }
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

    // Load items from DB
    loadCartItems();
    
    // Load addresses from DB
    loadCartAddresses();
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

    // Handled globally
});