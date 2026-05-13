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

    // ============================================================
    // 0. Hydrate page from URL params (passed from auctions.html)
    //    e.g. /ProductDetailsAuction?id=1&name=...&bid=53.690 BD
    // ============================================================
    const params = new URLSearchParams(window.location.search);

    if (params.has('name')) {
        // --- Page title ---
        document.title = `${params.get('name')} - Auction - Artisan Co-op`;

        // --- Product name ---
        const nameEl = document.querySelector('h1');
        if (nameEl) nameEl.textContent = params.get('name');

        // --- Artist ---
        const artistEl = document.querySelector('h1 + p, h1 ~ .text-earth');
        if (artistEl) artistEl.textContent = params.get('artist') ?? artistEl.textContent;

        // --- Current bid ---
        const bidValue = parseFloat((params.get('bid') ?? '0').replace(/[^0-9.]/g, ''));
        const bidEl = document.querySelector('#current-bid-display');
        if (bidEl) bidEl.textContent = `${bidValue.toFixed(3)} BD`;

        // Set minimum bid input to one step above current
        const bidInput = document.getElementById('bidAmount');
        if (bidInput) {
            bidInput.min         = (bidValue + 0.001).toFixed(3);
            bidInput.placeholder = `Min: ${(bidValue + 0.001).toFixed(3)} BD`;
        }

        // --- Total bids count ---
        const bidsCountEl = document.getElementById('total-bids-count');
        if (bidsCountEl) bidsCountEl.textContent = params.get('bids') ?? bidsCountEl.textContent;

        // --- Main image ---
        const imgSrc = params.get('img');
        if (imgSrc) {
            const mainImg = document.getElementById('mainImage');
            if (mainImg) {
                mainImg.src = imgSrc;
                mainImg.alt = params.get('name');
            }
            // Also update all thumbnails to use the same image as fallback
            document.querySelectorAll('.thumbnail').forEach(t => {
                t.src = imgSrc;
            });
        }

        // --- Countdown: override JS initial values with URL params ---
        window._auctionHours   = parseInt(params.get('hours')   ?? '2',  10);
        window._auctionMinutes = parseInt(params.get('minutes') ?? '45', 10);
        window._auctionSeconds = parseInt(params.get('seconds') ?? '0',  10);
    }

    // ============================================================
    // 1. Image Gallery Logic
    // ============================================================
    window.changeImage = function(thumbnail) {
        const mainImage = document.getElementById('mainImage');

        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            // Use high-res URL if it's an Unsplash image, otherwise use as-is
            const highResUrl = thumbnail.src.includes('unsplash.com')
                ? thumbnail.src.replace(/w=\d+&h=\d+/, 'w=600&h=500')
                : thumbnail.src;
            mainImage.src = highResUrl;
            mainImage.style.opacity = '1';
        }, 150);

        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    // ============================================================
    // 2. Countdown Timer Logic
    //    Uses values from URL params if available, else falls back to HTML defaults
    // ============================================================
    let hours   = window._auctionHours   ?? 2;
    let minutes = window._auctionMinutes ?? 45;
    let seconds = window._auctionSeconds ?? 32;

    const hoursEl   = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // Immediately show correct time (no 1-second delay on first render)
    if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    const countdownInterval = setInterval(() => {
        if (hours === 0 && minutes === 0 && seconds === 0) {
            clearInterval(countdownInterval);
            handleAuctionEnd();
            return;
        }

        if (seconds > 0) {
            seconds--;
        } else {
            seconds = 59;
            if (minutes > 0) {
                minutes--;
            } else {
                minutes = 59;
                if (hours > 0) hours--;
            }
        }

        if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        // Warning: turn countdown red under 5 minutes
        const countdownBox = document.getElementById('countdown')?.parentElement;
        if (countdownBox && hours === 0 && minutes < 5) {
            countdownBox.style.borderColor = '#ef4444';
            countdownBox.style.backgroundColor = '#fff5f5';
        }

        // Anti-sniping notice at exactly 30 seconds left
        if (hours === 0 && minutes === 0 && seconds === 30) {
            showToast('⏰ Anti-snipe: a bid placed in the last 30s extends the auction by 2 minutes!', 'info');
        }
    }, 1000);

    // ============================================================
    // 3. Auction ended state
    // ============================================================
    function handleAuctionEnd() {
        const bidBtn = document.getElementById('bid-submit-btn');
        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Auction Ended';
            bidBtn.className = bidBtn.className.replace('bg-[#c17c5f]', 'bg-gray-400').replace('hover:bg-[#a5664d]', '');
        }
        const countdownBox = document.getElementById('countdown')?.parentElement;
        if (countdownBox) {
            countdownBox.style.borderColor = '#9ca3af';
            countdownBox.style.backgroundColor = '#f3f4f6';
        }
        showToast('This auction has ended.', 'info');
    }

    // ============================================================
    // 4. Bid Form Validation & Submission
    // ============================================================
    const bidForm  = document.querySelector('form');
    const bidInput = document.getElementById('bidAmount');

    // Read current bid value from the displayed element
    function getCurrentBidValue() {
        const bidText = document.querySelector('#current-bid-display')?.textContent ?? '0';
        return parseFloat(bidText.replace(/[^0-9.]/g, '')) || 0;
    }

    // Set the minimum allowed bid = currentBid + 1 BD (whole BDs only, no fils)
    function updateMinBid() {
        const currentBid = getCurrentBidValue();
        const minBid     = Math.floor(currentBid) + 1; // Always next whole BD
        if (bidInput) {
            bidInput.min         = minBid;
            bidInput.step        = 1;                   // Whole BDs only — no fils allowed
            bidInput.placeholder = `Min: ${minBid} BD`;
        }
        return minBid;
    }

    // Validate bidder name: letters and spaces only, no numbers or symbols
    function isValidName(name) {
        return /^[A-Za-z\u0600-\u06FF\s]{2,50}$/.test(name); // Latin + Arabic letters, spaces, 2–50 chars
    }

    // Initialize min bid on page load
    updateMinBid();

    bidForm?.addEventListener('submit', function(e) {
        e.preventDefault();

        const rawBid     = bidInput.value;
        const bidAmount  = parseFloat(rawBid);
        const currentBid = getCurrentBidValue();
        const minBid     = updateMinBid();
        const bidderNameInput = document.getElementById('bidderName');
        const bidderName = bidderNameInput?.value.trim() ?? '';

        // --- Validation 1: bid must be a number ---
        if (!rawBid || isNaN(bidAmount)) {
            showToast('Please enter a valid bid amount.', 'error');
            bidInput.focus();
            return;
        }

        // --- Validation 2: no fils — whole BDs only ---
        if (!Number.isInteger(bidAmount)) {
            showToast('Bids must be in whole BD amounts — fils (e.g. 0.500) are not allowed.', 'error');
            bidInput.focus();
            return;
        }

        // --- Validation 3: bid must be at least currentBid + 1 BD ---
        if (bidAmount < minBid) {
            showToast(`Your bid must be at least ${minBid} BD (current bid + 1 BD minimum).`, 'error');
            bidInput.focus();
            return;
        }

        // --- Validation 4: name is required ---
        if (!bidderName) {
            showToast('Please enter your name before placing a bid.', 'error');
            bidderNameInput?.focus();
            return;
        }

        // --- Validation 5: name must be letters and spaces only (no numbers/symbols) ---
        if (!isValidName(bidderName)) {
            showToast('Name must contain letters only — no numbers or special characters.', 'error');
            bidderNameInput?.focus();
            return;
        }

        // ── Success: update all UI elements ──

        // Update current bid display with flash effect
        const currentBidDisplay = document.querySelector('#current-bid-display');
        if (currentBidDisplay) {
            currentBidDisplay.textContent = `${bidAmount.toFixed(3)} BD`;
            currentBidDisplay.style.color = '#10b981';
            setTimeout(() => currentBidDisplay.style.color = '', 1500);
        }

        // Update highest bidder name — show first name + last initial for privacy
        const highestBidderEl = document.getElementById('highest-bidder-name');
        if (highestBidderEl) {
            const nameParts  = bidderName.trim().split(/\s+/);
            const firstName  = nameParts[0];
            const lastInitial = nameParts.length > 1 ? ` ${nameParts[nameParts.length - 1][0]}.` : '';
            highestBidderEl.textContent = `${firstName}${lastInitial}`;
            highestBidderEl.style.color = '#10b981';
            setTimeout(() => highestBidderEl.style.color = '', 1500);
        }

        // Update bid count
        const bidsCountEl = document.getElementById('total-bids-count');
        if (bidsCountEl) {
            const current = parseInt(bidsCountEl.textContent) || 0;
            bidsCountEl.textContent = `${current + 1} bids`;
        }

        // Raise the minimum bid for the next bidder
        updateMinBid();

        showToast(`🎉 Bid of ${bidAmount} BD placed successfully!`, 'success');
        bidForm.reset();
    });

    // ============================================================
    // 5. "Back to Auctions" button — returns to auction list
    // ============================================================
    const backBtn = document.getElementById('back-to-auctions');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/auctions';
        });
    }

    // ============================================================
    // 6. Toast Notification
    // ============================================================
    function showToast(message, type = 'info') {
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 8px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px; min-width: 250px; }
                .toast.success { background-color: #10b981; border-left: 5px solid #059669; }
                .toast.error   { background-color: #dc2626; border-left: 5px solid #991b1b; }
                .toast.info    { background-color: #c17c5f; border-left: 5px solid #a5664d; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
            if (!document.querySelector('.toast-container')) {
                document.body.insertAdjacentHTML('beforebegin', '<div class="toast-container"></div>');
            }
        }
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
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