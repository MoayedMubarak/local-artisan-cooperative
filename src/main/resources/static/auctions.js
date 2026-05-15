// ============================================================
// auctions.js — ArtsyVibe Auctions Page
// ============================================================

let _activeTab = 'all';
let _activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {

    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    priceRange?.addEventListener('input', function () {
        priceValue.textContent = this.value + ' BD';
        applyFilters();
    });

    const requireLoginToAct = (message) =>
        window.requireLoginForAction ? window.requireLoginForAction(message) : true;

    startCountdowns();
    setInterval(tickCountdowns, 1000);

    window.switchTab = function (button, tabType) {
        _activeTab = tabType;
        updateTabButtons(_activeTab, button);
        updateAuctionHeader(_activeTab);
        applyFilters();
    };

    function updateTabButtons(tabType, clickedButton) {
        document.querySelectorAll('.tab-pill').forEach(t => t.classList.remove('active'));
        if (tabType === 'all') {
            document.querySelector('.tab-pill[data-tab="all"]')?.classList.add('active');
            return;
        }
        if (clickedButton) {
            clickedButton.classList.add('active');
            return;
        }
        document.querySelector(`.tab-pill[data-tab="${tabType}"]`)?.classList.add('active');
    }

    function updateAuctionHeader(tabType) {
        const header = document.getElementById('auction-page-header');
        const subtext = document.getElementById('auction-page-subtext');
        if (!header || !subtext) return;

        if (tabType === 'live') {
            header.textContent = 'Live Auctions';
            subtext.textContent = 'Bid on items currently available in live bidding.';
        } else if (tabType === 'upcoming') {
            header.textContent = 'Upcoming Auctions';
            subtext.textContent = 'See the next unique handcrafted items arriving soon.';
        } else if (tabType === 'ended') {
            header.textContent = 'Ended Auctions';
            subtext.textContent = 'Review completed auctions and sold treasures.';
        } else {
            header.textContent = 'All Auctions';
            subtext.textContent = 'Browse live, upcoming, and ended handcrafted auctions.';
        }
    }

    window.filterCategory = function (button, category) {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        button.classList.add('active');
        _activeCategory = category;
        applyFilters();
    };

    const sortSelect = document.querySelector('select');
    sortSelect?.addEventListener('change', () => sortAuctions(sortSelect.value));

    document.querySelectorAll('.custom-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => applyFilters());
    });

    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', () => applyFilters());
    });

    const sidebarSearch = document.querySelector('aside input[type="text"]');
    sidebarSearch?.addEventListener('input', () => applyFilters());

    const grid = document.getElementById('auction-grid');
    grid?.addEventListener('click', (e) => {
        const viewLink = e.target.closest('a.auction-view-details');
        if (viewLink) return;

        const placeBidBtn = e.target.closest('.auction-place-bid');
        if (placeBidBtn) {
            e.preventDefault();
            if (!requireLoginToAct('Login/Register first to place a bid.')) return;
            navigateToAuctionDetail(placeBidBtn);
            return;
        }

        const btn = e.target.closest('button');
        if (!btn) {
            const card = e.target.closest('.auction-card');
            if (!card) return;
            const isImage = e.target.tagName === 'IMG';
            const isTitle = e.target.closest('h3');
            if (isImage || isTitle) {
                window.location.href = getAuctionDetailUrl(card);
            }
            return;
        }

        const btnText = btn.textContent.trim();

        if (btnText === 'Notify Me') {
            if (!requireLoginToAct('Login/Register first to be notified about this auction.')) return;
            btn.dataset.notifyState = 'notified';
            btn.dataset.originalHtml = btn.innerHTML;
            btn.dataset.originalClass = btn.className;
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Notified';
            btn.classList.add('bg-[#c17c5f]', 'text-white', 'notified');
            btn.classList.remove('border-[#c17c5f]', 'text-[#c17c5f]');
            showToast('You will be notified when this auction starts!', 'success');
            return;
        }

        if (btn.dataset.notifyState === 'notified') {
            btn.dataset.notifyState = 'canceled';
            btn.innerHTML = 'Notify Me';
            btn.className = btn.dataset.originalClass || btn.className;
            showToast('Notification canceled.', 'info');
        }
    });

    document.querySelector('.mt-8 button')?.addEventListener('click', () => {
        showToast('No more auctions to load right now.', 'info');
    });

    updateTabButtons('all', document.querySelector('.tab-pill[data-tab="all"]'));
    updateAuctionHeader('all');
    applyFilters();
});

function getAuctionDetailUrl(card) {
    const auctionId = card.getAttribute('data-auction-id');
    if (auctionId) {
        return `/ProductDetailsAuction?id=${encodeURIComponent(auctionId)}`;
    }
    const link = card.querySelector('a.auction-view-details');
    return link ? link.getAttribute('href') : '/auctions';
}

function navigateToAuctionDetail(triggerEl) {
    const card = triggerEl?.closest('.auction-card');
    if (!card) return;
    window.location.href = getAuctionDetailUrl(card);
}

function cardStatus(card) {
    return (card.getAttribute('data-status') || '').toLowerCase();
}

function isLiveCard(card) {
    return cardStatus(card) === 'live' && !card.classList.contains('ended');
}

function isUpcomingCard(card) {
    return cardStatus(card) === 'upcoming';
}

function isEndedCard(card) {
    return cardStatus(card) === 'ended' || card.classList.contains('ended');
}

function applyFilters() {
    const grid = document.getElementById('auction-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.auction-card');
    const priceMax = parseFloat(document.getElementById('priceRange')?.value ?? 1000);
    const searchTerm = (document.querySelector('aside input[type="text"]')?.value ?? '').toLowerCase().trim();

    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() ?? '';
        const artist = card.querySelector('p.text-sm')?.textContent.toLowerCase() ?? '';
        const matchesSearch = !searchTerm || title.includes(searchTerm) || artist.includes(searchTerm);

        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
        const matchesCat = _activeCategory === 'all' || cardCat === _activeCategory;

        const bidText = card.querySelector('.text-xl.font-bold')?.textContent ?? '0';
        const bidValue = parseFloat(bidText.replace(/[^0-9.]/g, '')) || 0;
        const matchesPrice = bidValue <= priceMax;

        let matchesTab = true;
        if (_activeTab === 'live') matchesTab = isLiveCard(card);
        else if (_activeTab === 'upcoming') matchesTab = isUpcomingCard(card);
        else if (_activeTab === 'ended') matchesTab = isEndedCard(card);

        const show = matchesSearch && matchesCat && matchesPrice && matchesTab;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    let noResults = document.getElementById('no-auction-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'no-auction-results';
            noResults.className = 'col-span-3 text-center py-16 text-[#8b7355]';
            noResults.innerHTML = '<i class="fas fa-gavel text-4xl mb-4 block text-[#d4c5b5]"></i><p class="text-lg font-medium">No auctions match your filters.</p><p class="text-sm mt-1">Try a different tab, category, or price range.</p>';
            grid.appendChild(noResults);
        }
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
}

function tickCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        let hours = parseInt(el.dataset.hours, 10) || 0;
        let minutes = parseInt(el.dataset.minutes, 10) || 0;
        let seconds = parseInt(el.dataset.seconds, 10) || 0;

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

        el.dataset.hours = hours;
        el.dataset.minutes = minutes;
        el.dataset.seconds = seconds;
        el.textContent = `${hours}h ${minutes}m ${seconds}s`;

        const parent = el.closest('span');
        if (parent && hours === 0 && minutes < 5) {
            parent.classList.add('bg-red-100', 'text-red-600');
            parent.classList.remove('bg-[#f5ebe0]', 'text-[#c17c5f]');
        }
    });
}

function markAuctionEnded(countdownEl) {
    const card = countdownEl.closest('.auction-card');
    if (!card || card.classList.contains('ended')) return;

    card.classList.add('ended');
    card.setAttribute('data-status', 'ENDED');

    const badge = card.querySelector('.live-badge');
    if (badge) {
        badge.className = 'ended-badge absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full';
        badge.textContent = 'ENDED';
    }

    card.querySelector('.auction-place-bid')?.remove();
}

function startCountdowns() {}

function sortAuctions(criteria) {
    const grid = document.getElementById('auction-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.auction-card')];

    const order = { live: 0, upcoming: 1, ended: 2 };

    cards.sort((a, b) => {
        if (criteria === 'status-order' || criteria === 'ending-soonest') {
            const statusDiff = (order[cardStatus(a)] ?? 3) - (order[cardStatus(b)] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return totalSeconds(a) - totalSeconds(b);
        }
        if (criteria === 'lowest-bid') return getBidValue(a) - getBidValue(b);
        if (criteria === 'highest-bid') return getBidValue(b) - getBidValue(a);
        return 0;
    });

    cards.forEach(c => grid.appendChild(c));
}

function totalSeconds(card) {
    const el = card.querySelector('.countdown');
    if (!el) return Number.MAX_SAFE_INTEGER;
    return (parseInt(el.dataset.hours, 10) || 0) * 3600
        + (parseInt(el.dataset.minutes, 10) || 0) * 60
        + (parseInt(el.dataset.seconds, 10) || 0);
}

function getBidValue(card) {
    const text = card.querySelector('.text-xl.font-bold')?.textContent ?? '0';
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
}

function showToast(message, type = 'info') {
    document.getElementById('av-toast')?.remove();
    const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
    const toast = document.createElement('div');
    toast.id = 'av-toast';
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colours[type] || colours.info}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}
