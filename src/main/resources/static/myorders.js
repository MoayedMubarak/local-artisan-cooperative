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
    loadOrders();
});

async function loadOrders() {
    const email = sessionStorage.getItem('userEmail');
    if (!email) return;

    try {
        const res = await fetch('/api/orders', {
            headers: { 'X-User-Email': email }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders = await res.json();
        renderOrders(orders);
    } catch (err) {
        console.error(err);
    }
}

function renderOrders(orders) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-box-open text-4xl text-[#e5e0d8] mb-4"></i>
                        <p class="text-[#8b7355] font-medium">You haven't placed any orders yet.</p>
                        <a href="/products" class="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#c17c5f] to-[#a5664d] text-white text-sm font-semibold shadow-lg shadow-[#c17c5f]/20 transition-all hover:from-[#b06b4f] hover:to-[#8f5d3f]">
                            Start Shopping
                        </a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'order-row border-b border-[#e5e0d8] order-item';
        row.dataset.status = order.status.toLowerCase();
        row.orderData = order;
        
        const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
        const moreCount = order.items ? order.items.length - 1 : 0;
        
        const statusClass = order.status.toLowerCase() === 'delivered' ? 'status-delivered'
                          : order.status.toLowerCase() === 'shipped'   ? 'status-shipped'
                          :                                              'status-pending';
        
        const statusIcon = order.status.toLowerCase() === 'delivered' ? 'fa-check-circle'
                         : order.status.toLowerCase() === 'shipped'   ? 'fa-truck'
                         :                                              'fa-clock';

        const dateObj = new Date(order.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        row.innerHTML = `
            <td class="py-4 px-6">
                <span class="font-semibold text-[#5c4a3d]">#AC-${order.orderId}</span>
            </td>
            <td class="py-4 px-6 text-[#8b7355]">${dateStr}</td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <img src="${firstItem ? firstItem.imageUrl : '/images/placeholder.png'}" alt="${firstItem ? escapeHtml(firstItem.title) : 'Product'}" class="w-12 h-12 object-cover rounded-lg">
                    <div>
                        <p class="font-medium text-[#5c4a3d]">${firstItem ? escapeHtml(firstItem.title) : 'N/A'}</p>
                        ${moreCount > 0 ? `<p class="text-sm text-[#8b7355]">+ ${moreCount} more item${moreCount > 1 ? 's' : ''}</p>` : ''}
                    </div>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="font-bold text-[#5c4a3d]">${Number(order.totalAmount).toFixed(2)} BD</span>
            </td>
            <td class="py-4 px-6">
                <span class="${statusClass} px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                    <i class="fas ${statusIcon} mr-1"></i>${capitalise(order.status)}
                </span>
            </td>
            <td class="py-4 px-6">
                <button class="text-[#c17c5f] hover:text-[#a5664d] font-medium transition-colors">
                    View Details <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    updateVisibleCount('all');
}

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
    if (!row || !row.orderData) return;
    const order = row.orderData;

    const dateObj = new Date(order.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const statusClass = order.status.toLowerCase() === 'delivered' ? 'text-green-600'
                      : order.status.toLowerCase() === 'shipped'   ? 'text-blue-600'
                      :                                              'text-yellow-600';

    // Build items list HTML
    const itemsHtml = order.items.map(item => `
        <div class="flex items-center justify-between py-3 border-b border-[#e5e0d8] last:border-0">
            <div class="flex items-center gap-3">
                <img src="${item.imageUrl || '/images/placeholder.png'}" class="w-12 h-12 object-cover rounded-lg">
                <div>
                    <p class="font-semibold text-sm text-[#5c4a3d]">${escapeHtml(item.title)}</p>
                    <p class="text-xs text-[#8b7355]">Qty: ${item.quantity} | ${Number(item.price).toFixed(2)} BD</p>
                    ${item.refundRequested ? `
                        <span class="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold ${
                            item.refundStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            item.refundStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                            item.refundStatus === 'ESCALATED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                        }">Refund: ${escapeHtml(item.refundStatus)}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Check if there's any item eligible for refund
    const hasRefundableItem = order.items.some(item => !item.refundRequested);

    document.getElementById('order-modal-body').innerHTML = `
        <div class="space-y-4">
            <div class="pb-2 border-b border-[#e5e0d8]">
                <p class="text-xs text-[#8b7355] uppercase tracking-wide font-bold">Order Items</p>
                <div class="divide-y divide-[#e5e0d8] mt-2">
                    ${itemsHtml}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs text-[#8b7355] uppercase tracking-wide font-bold">Order Date</p>
                    <p class="font-semibold text-[#5c4a3d]">${escapeHtml(dateStr)}</p>
                </div>
                <div>
                    <p class="text-xs text-[#8b7355] uppercase tracking-wide font-bold">Total</p>
                    <p class="font-bold text-[#c17c5f]">${Number(order.totalAmount).toFixed(2)} BD</p>
                </div>
                <div>
                    <p class="text-xs text-[#8b7355] uppercase tracking-wide font-bold">Status</p>
                    <p class="font-semibold ${statusClass}">${escapeHtml(capitalise(order.status))}</p>
                </div>
                <div>
                    <p class="text-xs text-[#8b7355] uppercase tracking-wide font-bold">Payment</p>
                    <p class="font-semibold text-green-600">Completed</p>
                </div>
            </div>
            
            ${order.status.toLowerCase() === 'shipped' ? `
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p class="text-blue-700 font-semibold text-sm"><i class="fas fa-truck mr-2"></i>Your order is on its way!</p>
                <p class="text-blue-600 text-sm mt-1">Estimated delivery: 2–4 business days.</p>
            </div>` : ''}
            
            ${order.status.toLowerCase() === 'pending' ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p class="text-yellow-700 font-semibold text-sm"><i class="fas fa-clock mr-2"></i>Order is being processed.</p>
                <p class="text-yellow-600 text-sm mt-1">The artisan will ship your order soon.</p>
            </div>` : ''}

            ${hasRefundableItem ? `
            <button id="refund-btn-trigger" class="w-full bg-[#c17c5f] hover:bg-[#a5664d] text-white font-semibold py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2">
                <i class="fas fa-undo"></i> Request a Refund
            </button>
            ` : ''}
        </div>
    `;

    // Click handler for refund trigger
    const refundTrigger = document.getElementById('refund-btn-trigger');
    if (refundTrigger) {
        refundTrigger.addEventListener('click', () => {
            openRefundModal(order);
        });
    }

    const modal = document.getElementById('order-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function buildRefundModal() {
    if (document.getElementById('refund-modal')) return;

    const modal = document.createElement('div');
    modal.id        = 'refund-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-[#e5e0d8]">
                <h3 class="text-xl font-bold text-[#5c4a3d]" style="font-family:'Playfair Display',serif;">Request a Refund</h3>
                <button id="refund-modal-close" class="text-[#8b7355] hover:text-[#c17c5f] transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <!-- Body -->
            <form id="refund-form" class="p-6 space-y-4 text-[#5c4a3d]" onsubmit="submitRefund(event)">
                <input type="hidden" id="refund-order-id">
                
                <!-- Choose Item -->
                <div>
                    <label class="block text-sm font-semibold text-[#5c4a3d] mb-1.5">Select Item with Problem</label>
                    <select id="refund-item-select" class="w-full border border-[#e5e0d8] rounded-xl px-4 py-3 text-sm text-[#5c4a3d] bg-white focus:outline-none focus:border-[#c17c5f]" required>
                        <option value="">Choose item...</option>
                    </select>
                </div>

                <!-- Problem Types (Checkboxes) -->
                <div>
                    <label class="block text-sm font-semibold text-[#5c4a3d] mb-2">What is the problem? (Select at least one)</label>
                    <div class="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto border border-[#e5e0d8] rounded-xl p-4 bg-[#faf9f6]">
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Damaged during transit" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Damaged during transit</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Quality does not meet expectations" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Quality does not meet expectations</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Defective or inoperable item" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Defective or inoperable item</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Item looks significantly different from photos" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Item looks significantly different from photos</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Incorrect dimensions or size" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Incorrect dimensions or size</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Received the wrong item entirely" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Received the wrong item entirely</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Item arrived too late" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Item arrived too late</span>
                        </label>
                        <label class="flex items-start gap-3 cursor-pointer text-sm">
                            <input type="checkbox" name="problem-type" value="Accidental purchase / Changed my mind" class="rounded border-[#e5e0d8] text-[#c17c5f] focus:ring-[#c17c5f] mt-0.5">
                            <span class="text-[#8b7355]">Accidental purchase / Changed my mind</span>
                        </label>
                    </div>
                </div>

                <!-- Explanation -->
                <div>
                    <label class="block text-sm font-semibold text-[#5c4a3d] mb-1.5">Explanation Details</label>
                    <textarea id="refund-details" rows="3" placeholder="Provide more details about the issue..." class="w-full border border-[#e5e0d8] rounded-xl px-4 py-3 text-sm text-[#5c4a3d] placeholder-[#b8a99a] resize-none focus:outline-none focus:border-[#c17c5f]" required></textarea>
                </div>

                <!-- Photo Upload -->
                <div>
                    <label class="block text-sm font-semibold text-[#5c4a3d] mb-1.5">Upload Evidence Photo</label>
                    <div class="border-2 border-dashed border-[#e5e0d8] rounded-xl p-4 text-center hover:border-[#c17c5f] transition-colors cursor-pointer bg-[#faf9f6]" id="refund-upload-area">
                        <i class="fas fa-camera text-2xl text-[#b8a99a] mb-2"></i>
                        <p class="text-xs text-[#8b7355] font-medium">Click to select photo</p>
                        <input id="refund-image-file" type="file" class="hidden" accept="image/*" required>
                    </div>
                    <input type="hidden" id="refund-image-data">
                </div>

                <!-- Footer Buttons -->
                <div class="flex justify-end gap-3 pt-4 border-t border-[#e5e0d8]">
                    <button type="button" id="refund-modal-cancel" class="px-5 py-2.5 border border-[#e5e0d8] text-[#8b7355] rounded-xl font-medium transition-colors hover:border-[#c17c5f]">Cancel</button>
                    <button type="submit" class="px-5 py-2.5 bg-[#c17c5f] hover:bg-[#a5664d] text-white rounded-xl font-semibold transition-colors">Submit Request</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('refund-modal-close')?.addEventListener('click', closeRefundModal);
    document.getElementById('refund-modal-cancel')?.addEventListener('click', closeRefundModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeRefundModal(); });

    // File input change handler for compression
    document.getElementById('refund-image-file')?.addEventListener('change', function() {
        if (!this.files.length) return;
        const file = this.files[0];
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.6);
                document.getElementById('refund-image-data').value = compressedUrl;
                
                const textEl = document.querySelector('#refund-upload-area p');
                if (textEl) textEl.textContent = "Photo attached successfully!";
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('refund-upload-area')?.addEventListener('click', function(e) {
        if (!e.target.closest('input')) {
            document.getElementById('refund-image-file').click();
        }
    });
}

function openRefundModal(order) {
    buildRefundModal();
    
    document.getElementById('refund-order-id').value = order.orderId;
    
    // Clear form
    document.getElementById('refund-form').reset();
    document.getElementById('refund-image-data').value = '';
    const textEl = document.querySelector('#refund-upload-area p');
    if (textEl) textEl.textContent = "Click to select photo";
    
    // Populate combo box
    const select = document.getElementById('refund-item-select');
    select.innerHTML = '<option value="">Choose item...</option>';
    
    order.items.forEach(item => {
        if (!item.refundRequested) {
            const opt = document.createElement('option');
            opt.value = item.orderItemId;
            opt.textContent = `${item.title} (Qty: ${item.quantity})`;
            select.appendChild(opt);
        }
    });
    
    // Hide details modal, show refund modal
    closeOrderModal();
    const modal = document.getElementById('refund-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeRefundModal() {
    const modal = document.getElementById('refund-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function submitRefund(event) {
    event.preventDefault();
    
    const orderItemId = document.getElementById('refund-item-select').value;
    const details = document.getElementById('refund-details').value.trim();
    const imageData = document.getElementById('refund-image-data').value;
    
    // Gather checked problem types
    const checkboxes = document.querySelectorAll('input[name="problem-type"]:checked');
    if (checkboxes.length === 0) {
        alert("Please select at least one type of problem.");
        return;
    }
    
    const problemTypes = [...checkboxes].map(cb => cb.value).join(', ');
    const fullReason = `${problemTypes}. Details: ${details}`;
    
    if (!orderItemId) {
        alert("Please select an item.");
        return;
    }
    
    if (!imageData) {
        alert("Please upload a photo evidence.");
        return;
    }

    try {
        const res = await fetch(`/api/orders/items/${orderItemId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: fullReason,
                images: imageData
            })
        });
        
        if (res.ok) {
            alert("Refund request submitted successfully!");
            closeRefundModal();
            loadOrders(); // reload the page data
        } else {
            const err = await res.json();
            alert("Error: " + (err.message || "Failed to submit request"));
        }
    } catch (e) {
        console.error(e);
        alert("Failed to connect to the server.");
    }
}

// ============================================================
// Shared badge helpers
// ============================================================

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '0', 10);
    badge.textContent     = count;
    badge.style.display   = count > 0 ? 'flex' : 'none';
}

function updateCartBadge() {
    document.querySelectorAll('.fa-shopping-cart').forEach(icon => {
        const badge = icon.parentElement?.querySelector('span');
        if (!badge) return;
        const count = parseInt(sessionStorage.getItem('cartCount') ?? '0', 10);
        badge.textContent = count;
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
