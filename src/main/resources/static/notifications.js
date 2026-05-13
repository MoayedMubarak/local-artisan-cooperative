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
    
    // --- 1. Filter Logic ---
    window.filterNotifications = function(button, type) {
        // UI Update: Set active pill
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        button.classList.add('active');

        // Filter Logic
        const cards = document.querySelectorAll('.notification-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardType = card.getAttribute('data-type');
            
            if (type === 'all' || cardType === type) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle Empty State
        const emptyState = document.getElementById('empty-state');
        if (visibleCount === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    };

    // --- 2. Toggle Read/Unread Status ---
    window.toggleRead = function(card) {
        const isRead = card.getAttribute('data-read') === 'true';
        
        if (isRead) {
            // Mark as Unread
            card.setAttribute('data-read', 'false');
            card.classList.remove('read');
            card.classList.add('unread');
            
            // Add the blue dot back
            const dotContainer = card.querySelector('.flex.items-start.gap-4');
            const existingDot = dotContainer.querySelector('.unread-dot');
            if (!existingDot) {
                const unreadDot = document.createElement('div');
                unreadDot.className = 'unread-dot mt-1.5';
                dotContainer.insertBefore(unreadDot, dotContainer.firstChild);
            }
        } else {
            // Mark as Read
            card.setAttribute('data-read', 'true');
            card.classList.remove('unread');
            card.classList.add('read');
            
            // Remove blue dot
            const unreadDot = card.querySelector('.unread-dot');
            if (unreadDot) {
                unreadDot.remove();
            }
            
            // Replace with empty spacer to keep layout
            const dotContainer = card.querySelector('.flex.items-start.gap-4');
            const existingSpacer = dotContainer.querySelector('.w-2.mt-1\\.5');
            if (!existingSpacer) {
                const spacer = document.createElement('div');
                spacer.className = 'w-2 mt-1.5';
                dotContainer.insertBefore(spacer, dotContainer.firstChild);
            }
        }
        
        updateBadgeCount();
    };

    // --- 3. Mark All as Read ---
    window.markAllAsRead = function() {
        const unreadCards = document.querySelectorAll('.notification-card[data-read="false"]');
        
        unreadCards.forEach(card => {
            // Set Attribute
            card.setAttribute('data-read', 'true');
            card.classList.remove('unread');
            card.classList.add('read');
            
            // Remove blue dot
            const unreadDot = card.querySelector('.unread-dot');
            if (unreadDot) {
                unreadDot.remove();
            }

            // Add spacer
            const dotContainer = card.querySelector('.flex.items-start.gap-4');
            const existingSpacer = dotContainer.querySelector('.w-2.mt-1\\.5');
            if (!existingSpacer) {
                const spacer = document.createElement('div');
                spacer.className = 'w-2 mt-1.5';
                dotContainer.insertBefore(spacer, dotContainer.firstChild);
            }
        });

        updateBadgeCount();
        showToast('All notifications marked as read', 'success');
    };

    // --- 4. Update Navbar Badge ---
    function updateBadgeCount() {
        const unreadCount = document.querySelectorAll('.notification-card[data-read="false"]').length;
        const badge = document.getElementById('notification-badge');
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // --- 5. Utility: Simple Toast Notification ---
    function showToast(message, type = 'info') {
        // Check if styles already exist
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 8px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px; min-width: 250px; }
                .toast.success { background-color: #10b981; border-left: 5px solid #059669; }
                .toast.error { background-color: #dc2626; border-left: 5px solid #991b1b; }
                .toast.info { background-color: #2563eb; border-left: 5px solid #1d4ed8; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
            document.body.insertAdjacentHTML('afterbegin', '<div class="toast-container"></div>');
        }

        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
        if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
        if (type === 'info') icon = '<i class="fas fa-info-circle"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
