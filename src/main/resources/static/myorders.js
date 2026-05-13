// ============================================================
// my-orders.js — ArtsyVibe My Orders Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

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

    // ----------------------------------------------------------
    // 1. Filter pills
    // ----------------------------------------------------------
    window.filterOrders = function (status, button) {
        // Update active pill
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        button.classList.add('active');

        // Filter rows
        document.querySelectorAll('.order-item').forEach(row => {
            const show = status === 'all' || row.dataset.status === status;
            row.style.display = show ? '' : 'none';
        });

        updateVisibleCount(status);
    };

    // ----------------------------------------------------------
    // 2. "View Details" buttons — open order detail modal
    // ----------------------------------------------------------
    document.querySelector('tbody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.textContent.includes('View Details')) return;
        const row = btn.closest('.order-item');
        openOrderModal(row);
    });

    // ----------------------------------------------------------
    // 3. Build the order detail modal
    // ----------------------------------------------------------
    buildOrderModal();

    // ----------------------------------------------------------
    // 4. Notification / cart badge sync
    // ----------------------------------------------------------
    updateNotificationBadge();
    updateCartBadge();
    updateLoginState();
});

// ============================================================
// Order count helper
// ============================================================

function updateVisibleCount(status) {
    const total   = document.querySelectorAll('.order-item').length;
    const visible = [...document.querySelectorAll('.order-item')]
                        .filter(r => r.style.display !== 'none').length;

    const heading = document.querySelector('main h1');
    if (heading) {
        heading.nextElementSibling.textContent =
            status === 'all'
                ? `Track and manage your purchases.`
                : `Showing ${visible} of ${total} orders — filtered by "${capitalise(status)}".`;
    }
}

function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// Order Detail Modal
// ============================================================

function buildOrderModal() {
    if (document.getElementById('order-modal')) return;

    const modal = document.createElement('div');
    modal.id        = 'order-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-[#e5e0d8]">
                <h3 class="text-xl font-bold text-[#5c4a3d]" style="font-family:'Playfair Display',serif;">Order Details</h3>
                <button id="order-modal-close" class="text-[#8b7355] hover:text-[#c17c5f] transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <!-- Body -->
            <div id="order-modal-body" class="p-6 space-y-4 text-[#5c4a3d]">
                <!-- Filled dynamically -->
            </div>
            <!-- Footer -->
            <div class="flex justify-end gap-3 p-6 border-t border-[#e5e0d8]">
                <button id="order-modal-close-btn"
                    class="px-6 py-2.5 border-2 border-[#e5e0d8] text-[#8b7355] hover:border-[#c17c5f] hover:text-[#5c4a3d] rounded-xl font-medium transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('order-modal-close')?.addEventListener('click', closeOrderModal);
    document.getElementById('order-modal-close-btn')?.addEventListener('click', closeOrderModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeOrderModal(); });
}

function openOrderModal(row) {
    if (!row) return;

    const orderId   = row.querySelector('td:nth-child(1) span')?.textContent.trim() ?? 'N/A';
    const date      = row.querySelector('td:nth-child(2)')?.textContent.trim() ?? 'N/A';
    const product   = row.querySelector('p.font-medium')?.textContent.trim() ?? 'N/A';
    const total     = row.querySelector('td:nth-child(4) span')?.textContent.trim() ?? 'N/A';
    const statusEl  = row.querySelector('td:nth-child(5) span');
    const status    = statusEl?.textContent.trim() ?? 'N/A';
    const imgSrc    = row.querySelector('img')?.src ?? '';

    const statusClass = row.dataset.status === 'delivered' ? 'text-green-600'
                      : row.dataset.status === 'shipped'   ? 'text-blue-600'
                      :                                      'text-yellow-600';

    document.getElementById('order-modal-body').innerHTML = `
        <div class="flex items-center gap-4 pb-4 border-b border-[#e5e0d8]">
            ${imgSrc ? `<img src="${imgSrc}" alt="Product" class="w-20 h-20 object-cover rounded-xl">` : ''}
            <div>
                <p class="font-semibold text-lg">${escapeHtml(product)}</p>
                <p class="text-[#8b7355] text-sm">${escapeHtml(orderId)}</p>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <p class="text-xs text-[#8b7355] uppercase tracking-wide">Order Date</p>
                <p class="font-semibold">${escapeHtml(date)}</p>
            </div>
            <div>
                <p class="text-xs text-[#8b7355] uppercase tracking-wide">Total</p>
                <p class="font-bold text-[#c17c5f]">${escapeHtml(total)}</p>
            </div>
            <div>
                <p class="text-xs text-[#8b7355] uppercase tracking-wide">Status</p>
                <p class="font-semibold ${statusClass}">${escapeHtml(status)}</p>
            </div>
            <div>
                <p class="text-xs text-[#8b7355] uppercase tracking-wide">Payment</p>
                <p class="font-semibold">Completed</p>
            </div>
        </div>
        ${row.dataset.status === 'shipped' ? `
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p class="text-blue-700 font-semibold text-sm"><i class="fas fa-truck mr-2"></i>Your order is on its way!</p>
            <p class="text-blue-600 text-sm mt-1">Estimated delivery: 2–4 business days.</p>
        </div>` : ''}
        ${row.dataset.status === 'pending' ? `
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p class="text-yellow-700 font-semibold text-sm"><i class="fas fa-clock mr-2"></i>Order is being processed.</p>
            <p class="text-yellow-600 text-sm mt-1">The artisan will ship your order soon.</p>
        </div>` : ''}
    `;

    const modal = document.getElementById('order-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ============================================================
// Shared badge helpers
// ============================================================

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '4', 10);
    badge.textContent     = count;
    badge.style.display   = count > 0 ? 'flex' : 'none';
}

function updateCartBadge() {
    document.querySelectorAll('.fa-shopping-cart').forEach(icon => {
        const badge = icon.parentElement?.querySelector('span');
        if (!badge) return;
        const count = parseInt(sessionStorage.getItem('cartCount') ?? '3', 10);
        badge.textContent = count;
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
