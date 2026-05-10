// ============================================================
// auctions.js — ArtsyVibe Auctions Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------
    // 1. Price/bid range slider
    // ----------------------------------------------------------
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    priceRange?.addEventListener('input', function () {
        priceValue.textContent = this.value + ' BD';
        applyFilters(); // Call applyFilters to combine with other filters
    });

    const requireLoginToAct = (message) => window.requireLoginForAction ? window.requireLoginForAction(message) : true;

    // ----------------------------------------------------------
    // 2. Countdown timers
    // ----------------------------------------------------------
    startCountdowns();
    const countdownInterval = setInterval(tickCountdowns, 1000);

    // ----------------------------------------------------------
    // 3. Tab switching (Live Now / Upcoming / Ended)
    // ----------------------------------------------------------
    window.switchTab = function (button, tabType) {
        document.querySelectorAll('.tab-pill').forEach(t => t.classList.remove('active'));
        button.classList.add('active');
        filterByTab(tabType);
    };

    // ----------------------------------------------------------
    // 4. Category filter pills
    // ----------------------------------------------------------
    window.filterCategory = function (button, category) {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        button.classList.add('active');
        applyFilters();
    };

    // ----------------------------------------------------------
    // 5. Sort dropdown
    // ----------------------------------------------------------
    const sortSelect = document.querySelector('select');
    sortSelect?.addEventListener('change', () => sortAuctions(sortSelect.value));

    // ----------------------------------------------------------
    // 6. Custom checkboxes in sidebar
    // ----------------------------------------------------------
    document.querySelectorAll('.custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const icon   = this.parentElement.querySelector('.checkbox-icon');
            const visual = this.parentElement.querySelector('div');
            if (this.checked) {
                if (icon) icon.style.opacity = '1';
                visual?.classList.add('bg-[#c17c5f]', 'border-[#c17c5f]');
            } else {
                if (icon) icon.style.opacity = '0';
                visual?.classList.remove('bg-[#c17c5f]', 'border-[#c17c5f]');
            }
            applyFilters();
        });
    });

    // ----------------------------------------------------------
    // 7. Sidebar category radios
    // ----------------------------------------------------------
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', () => applyFilters());
    });

    // ----------------------------------------------------------
    // 8. Sidebar search input
    // ----------------------------------------------------------
    const sidebarSearch = document.querySelector('aside input[type="text"]');
    sidebarSearch?.addEventListener('input', () => applyFilters());

    // ----------------------------------------------------------
    // 9. "Place Bid" buttons
    // ----------------------------------------------------------
    document.getElementById('auction-grid')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.textContent.trim() === 'Place Bid') {
            if (!requireLoginToAct('Login/Register first to place a bid.')) return;
            const card = btn.closest('.auction-card');
            openBidModal(card);
        }

        if (btn.textContent.trim() === 'Notify Me') {
            if (!requireLoginToAct('Login/Register first to be notified about this auction.')) return;
            btn.textContent = '✓ Notified';
            btn.classList.add('bg-[#c17c5f]', 'text-white');
            btn.classList.remove('border-[#c17c5f]', 'text-[#c17c5f]');
            showToast('You will be notified when this auction starts!', 'success');
        }
    });

    // ----------------------------------------------------------
    // 10. Load More button
    // ----------------------------------------------------------
    document.querySelector('.mt-8 button')?.addEventListener('click', () => {
        showToast('No more auctions to load right now.', 'info');
    });

    // ----------------------------------------------------------
    // 11. Build and inject bid modal into DOM
    // ----------------------------------------------------------
    buildBidModal();
});

// ============================================================
// Countdown logic
// ============================================================

function startCountdowns() {
    // Already initialised from data attributes in HTML — nothing extra needed.
}

function tickCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        let hours   = parseInt(el.dataset.hours,   10);
        let minutes = parseInt(el.dataset.minutes, 10);
        let seconds = parseInt(el.dataset.seconds, 10);

        if (hours === 0 && minutes === 0 && seconds === 0) {
            markAuctionEnded(el);
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

        el.dataset.hours   = hours;
        el.dataset.minutes = minutes;
        el.dataset.seconds = seconds;
        el.textContent     = `${hours}h ${minutes}m ${seconds}s`;

        // Warning colour when under 5 minutes
        const parent = el.closest('span');
        if (parent && hours === 0 && minutes < 5) {
            parent.classList.add('bg-red-100', 'text-red-600');
            parent.classList.remove('bg-[#f5ebe0]', 'text-[#c17c5f]');
        }

        // Anti-sniping notice
        if (hours === 0 && minutes === 0 && seconds === 30) {
            showToast('⏰ Anti-snipe: bid placed in last 30 s — auction extended 2 min!', 'info');
        }
    });
}

function markAuctionEnded(countdownEl) {
    const card = countdownEl.closest('.auction-card');
    if (!card || card.classList.contains('ended')) return;

    card.classList.add('ended');
    const badge = card.querySelector('.live-badge');
    if (badge) {
        badge.className = 'absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full';
        badge.textContent = 'ENDED';
    }
    const btn = card.querySelector('button');
    if (btn) {
        btn.textContent = 'Auction Ended';
        btn.className   = 'w-full py-2.5 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed';
        btn.disabled    = true;
    }
    const bidLabel = card.querySelector('.text-xs.text-\\[\\#8b7355\\].uppercase');
    if (bidLabel) bidLabel.textContent = 'Final Bid';

    showToast('An auction has just ended!', 'info');
}

// ============================================================
// Filtering & Sorting
// ============================================================

function getActiveTab() {
    const active = document.querySelector('.tab-pill.active');
    return active?.textContent.trim().toLowerCase() ?? 'live now';
}

function getActiveCategory() {
    const active = document.querySelector('.filter-pill.active');
    return active?.textContent.trim().toLowerCase() ?? 'all';
}

function filterByTab(tabType) {
    document.querySelectorAll('.auction-card').forEach(card => {
        const hasLive     = card.querySelector('.live-badge') !== null;
        const hasUpcoming = card.querySelector('.bg-blue-500') !== null;
        const hasEnded    = card.querySelector('.bg-gray-500') !== null || card.classList.contains('ended');

        let show = false;
        if      (tabType === 'all')      show = true;
        else if (tabType === 'upcoming') show = hasUpcoming;
        else if (tabType === 'ended')    show = hasEnded;
        else if (tabType === 'live')     show = hasLive;

        card.style.display = show ? '' : 'none';
    });
}

function filterByBidRange(maxBid) {
    document.querySelectorAll('.auction-card').forEach(card => {
        const bidText = card.querySelector('.text-xl.font-bold')?.textContent ?? '0';
        const bidVal  = parseFloat(bidText.replace(/[^0-9.]/g, ''));
        card.style.display = (isNaN(bidVal) || bidVal <= maxBid) ? '' : 'none';
    });
}

function applyFilters() {
    const category     = getActiveCategory();
    const searchQuery  = document.querySelector('aside input[type="text"]')?.value.trim().toLowerCase() ?? '';
    const checkedBoxes = [...document.querySelectorAll('.custom-checkbox:checked')]
                            .map(cb => cb.parentElement.querySelector('span')?.textContent.trim().toLowerCase());
    const maxPrice     = parseFloat(document.getElementById('priceRange')?.value ?? 1000);

    document.querySelectorAll('.auction-card').forEach(card => {
        const title   = card.querySelector('h3')?.textContent.trim().toLowerCase() ?? '';
        const artisan = card.querySelector('p')?.textContent.trim().toLowerCase() ?? '';
        const bidText = card.querySelector('.text-xl.font-bold')?.textContent ?? '0';
        const bidVal  = parseFloat(bidText.replace(/[^0-9.]/g, ''));

        const matchesSearch = !searchQuery || title.includes(searchQuery) || artisan.includes(searchQuery);
        const cardCategory = (card.dataset.category || '').toLowerCase();
        const matchesCat = category === 'all' || cardCategory === category;
        const matchesPrice  = isNaN(bidVal) || bidVal <= maxPrice;

        let matchesStatus = true;
        if (checkedBoxes.length > 0) {
            const hasLive     = card.querySelector('.live-badge') !== null;
            const hasUpcoming = card.querySelector('.bg-blue-500') !== null;
            const hasEnded    = card.classList.contains('ended') || card.querySelector('.bg-gray-500') !== null;

            matchesStatus = checkedBoxes.some(s =>
                (s === 'live now'  && hasLive) ||
                (s === 'upcoming'  && hasUpcoming) ||
                (s === 'ended'     && hasEnded)
            );
        }

        card.style.display = (matchesSearch && matchesCat && matchesStatus && matchesPrice) ? '' : 'none';
    });
}

function sortAuctions(criteria) {
    const grid  = document.getElementById('auction-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.auction-card')];

    cards.sort((a, b) => {
        if (criteria === 'ending-soonest') {
            const secA = totalSeconds(a);
            const secB = totalSeconds(b);
            return secA - secB;
        }
        if (criteria === 'lowest-bid') {
            return getBidValue(a) - getBidValue(b);
        }
        if (criteria === 'highest-bid') {
            return getBidValue(b) - getBidValue(a);
        }
        return 0; // newest — leave as-is
    });

    cards.forEach(c => grid.appendChild(c));
}

function totalSeconds(card) {
    const el = card.querySelector('.countdown');
    if (!el) return Infinity;
    return parseInt(el.dataset.hours,10)*3600 + parseInt(el.dataset.minutes,10)*60 + parseInt(el.dataset.seconds,10);
}

function getBidValue(card) {
    const text = card.querySelector('.text-xl.font-bold')?.textContent ?? '0';
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
}

// ============================================================
// Bid Modal
// ============================================================

function buildBidModal() {
    if (document.getElementById('bid-modal')) return;

    const modal = document.createElement('div');
    modal.id        = 'bid-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-[#5c4a3d]" style="font-family:'Playfair Display',serif;">Place a Bid</h3>
                <button id="bid-modal-close" class="text-[#8b7355] hover:text-[#c17c5f] transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <p id="bid-product-name" class="text-[#5c4a3d] font-semibold mb-1"></p>
            <p class="text-sm text-[#8b7355] mb-4">Current Bid: <span id="bid-current" class="font-bold text-[#c17c5f]"></span></p>
            <label class="block text-[#5c4a3d] font-semibold mb-2">Your Bid (BD)</label>
            <input id="bid-input" type="number" step="0.001" min="0" placeholder="Enter your bid amount"
                   class="w-full px-4 py-3 rounded-xl border border-[#e5e0d8] text-[#5c4a3d] mb-2
                          focus:border-[#c17c5f] focus:outline-none focus:ring-2 focus:ring-[#c17c5f]/20"/>
            <p id="bid-error" class="text-red-500 text-sm mb-4 hidden"></p>
            <button id="bid-submit" class="w-full bg-[#c17c5f] hover:bg-[#a5664d] text-white py-3 rounded-xl font-bold transition-colors shadow-lg">
                Confirm Bid
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('bid-modal-close')?.addEventListener('click', closeBidModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeBidModal(); });
    document.getElementById('bid-submit')?.addEventListener('click', submitBid);
    document.getElementById('bid-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitBid();
    });
}

let _activeBidCard = null;

function openBidModal(card) {
    _activeBidCard = card;
    const name    = card.querySelector('h3')?.textContent.trim() ?? 'Item';
    const current = card.querySelector('.text-xl.font-bold')?.textContent.trim() ?? '0.000 BD';

    document.getElementById('bid-product-name').textContent = name;
    document.getElementById('bid-current').textContent      = current;
    document.getElementById('bid-input').value              = '';
    document.getElementById('bid-input').min                = (parseFloat(current) + 0.001).toFixed(3);

    const errorEl = document.getElementById('bid-error');
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    const modal = document.getElementById('bid-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('bid-input').focus();
}

function closeBidModal() {
    const modal = document.getElementById('bid-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    _activeBidCard = null;
}

function submitBid() {
    if (!window.requireLoginForAction?.('Login/Register first to place a bid.')) return;
    const input    = document.getElementById('bid-input');
    const errorEl  = document.getElementById('bid-error');
    const bidValue = parseFloat(input.value);
    const minBid   = parseFloat(input.min);

    errorEl.classList.add('hidden');

    if (isNaN(bidValue) || bidValue <= 0) {
        errorEl.textContent = 'Please enter a valid bid amount.';
        errorEl.classList.remove('hidden');
        return;
    }

    if (bidValue <= minBid - 0.001) {
        errorEl.textContent = `Your bid must be higher than the current bid (${(minBid - 0.001).toFixed(3)} BD).`;
        errorEl.classList.remove('hidden');
        return;
    }

    // Update card UI
    if (_activeBidCard) {
        const bidDisplay = _activeBidCard.querySelector('.text-xl.font-bold');
        if (bidDisplay) bidDisplay.textContent = `${bidValue.toFixed(3)} BD`;

        const bidsCount = _activeBidCard.querySelector('.text-xs.text-\\[\\#8b7355\\]');
        if (bidsCount) {
            const current = parseInt(bidsCount.textContent) || 0;
            bidsCount.textContent = `${current + 1} bids`;
        }
    }

    closeBidModal();
    showToast(`Bid of ${bidValue.toFixed(3)} BD placed successfully!`, 'success');
}

// ============================================================
// Toast helper
// ============================================================

function showToast(message, type = 'info') {
    document.getElementById('av-toast')?.remove();
    const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
    const toast = document.createElement('div');
    toast.id        = 'av-toast';
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colours[type]}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}
