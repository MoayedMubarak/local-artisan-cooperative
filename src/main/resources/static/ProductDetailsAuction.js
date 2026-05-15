document.addEventListener('DOMContentLoaded', () => {

    const bidForm = document.querySelector('form');
    const bidInput = document.getElementById('bidAmount');
    const bidBtn = document.getElementById('bid-submit-btn');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    let auctionId = document.getElementById('auction-id')?.value || null;
    let auctionStatus = 'LIVE';
    let totalSeconds = 0;

    const requireLogin = (msg) =>
        window.requireLoginForAction ? window.requireLoginForAction(msg) : true;

    function hydrateFromServer() {
        const data = window.__AUCTION_DATA__;
        if (!data) return false;

        auctionId = String(data.id);
        auctionStatus = data.status || 'LIVE';

        document.title = `${data.name} - Auction - Artisan Co-op`;

        const nameEl = document.querySelector('h1');
        if (nameEl) nameEl.textContent = data.name;

        const artistEl = document.querySelector('h1 + p');
        if (artistEl) artistEl.textContent = data.artist;

        const bidEl = document.getElementById('current-bid-display');
        if (bidEl) bidEl.textContent = `${Math.round(data.bid)} BD`;

        const highestBidderEl = document.getElementById('highest-bidder-name');
        if (highestBidderEl) highestBidderEl.textContent = data.highestBidder || 'No bids yet';

        const mainImg = document.getElementById('mainImage');
        if (mainImg && data.img) {
            mainImg.src = data.img;
            mainImg.alt = data.name;
        }

        if (bidInput) {
            bidInput.min = data.minBid;
            bidInput.step = 1;
            bidInput.placeholder = `Min: ${data.minBid} BD`;
        }

        totalSeconds = Math.max(0, parseInt(data.secondsRemaining, 10) || 0);
        renderCountdown();

        if (auctionStatus === 'ENDED') handleAuctionEnd();
        if (auctionStatus === 'UPCOMING') handleUpcoming();
        return true;
    }

    function hydrateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('id') && !params.has('name')) return false;

        if (params.get('id')) auctionId = params.get('id');

        if (params.has('name')) {
            document.title = `${params.get('name')} - Auction - Artisan Co-op`;
            const nameEl = document.querySelector('h1');
            if (nameEl) nameEl.textContent = params.get('name');
        }

        const bidValue = parseFloat((params.get('bid') ?? '0').replace(/[^0-9.]/g, ''));
        const bidEl = document.getElementById('current-bid-display');
        if (bidEl) bidEl.textContent = `${Math.round(bidValue)} BD`;

        const minBid = Math.floor(bidValue) + 1;
        if (bidInput) {
            bidInput.min = minBid;
            bidInput.step = 1;
            bidInput.placeholder = `Min: ${minBid} BD`;
        }

        const imgSrc = params.get('img');
        if (imgSrc) {
            const mainImg = document.getElementById('mainImage');
            if (mainImg) {
                mainImg.src = imgSrc;
                mainImg.alt = params.get('name') || 'Auction item';
            }
        }

        const h = parseInt(params.get('hours') ?? '0', 10);
        const m = parseInt(params.get('minutes') ?? '0', 10);
        const s = parseInt(params.get('seconds') ?? '0', 10);
        totalSeconds = h * 3600 + m * 60 + s;
        renderCountdown();
        return true;
    }

    function renderCountdown() {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
    }

    function setCountdown(seconds) {
        totalSeconds = Math.max(0, parseInt(seconds, 10) || 0);
        renderCountdown();
    }

    function handleAuctionEnd() {
        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Auction Ended';
        }
        if (bidInput) bidInput.disabled = true;
    }

    function handleUpcoming() {
        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Not Started Yet';
        }
        if (bidInput) bidInput.disabled = true;
    }

    function getCurrentBid() {
        const text = document.getElementById('current-bid-display')?.textContent ?? '0';
        return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    }

    function updateMinBid() {
        const minBid = Math.floor(getCurrentBid()) + 1;
        if (bidInput) {
            bidInput.min = minBid;
            bidInput.placeholder = `Min: ${minBid} BD`;
        }
        return minBid;
    }

    function isValidName(name) {
        return /^[A-Za-z\u0600-\u06FF\s]{2,50}$/.test(name);
    }

    if (!hydrateFromServer()) hydrateFromUrl();
    updateMinBid();

    setInterval(() => {
        if (totalSeconds <= 0) {
            handleAuctionEnd();
            return;
        }
        totalSeconds--;
        renderCountdown();
    }, 1000);

    bidForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!requireLogin('Login/Register first to place a bid.')) return;

        if (!auctionId) {
            showToast('Open this auction from the auctions page.', 'error');
            return;
        }
        if (auctionStatus === 'ENDED') {
            showToast('This auction has ended.', 'error');
            return;
        }
        if (auctionStatus === 'UPCOMING') {
            showToast('This auction has not started yet.', 'error');
            return;
        }

        const bidAmount = parseFloat(bidInput?.value);
        const minBid = updateMinBid();
        const bidderName = document.getElementById('bidderName')?.value.trim() ?? '';

        if (!bidInput?.value || isNaN(bidAmount)) {
            showToast('Please enter a valid bid amount.', 'error');
            return;
        }
        if (!Number.isInteger(bidAmount)) {
            showToast('Bids must be in whole BD amounts.', 'error');
            return;
        }
        if (bidAmount < minBid) {
            showToast(`Your bid must be at least ${minBid} BD.`, 'error');
            return;
        }
        if (!bidderName) {
            showToast('Please enter your name.', 'error');
            return;
        }
        if (!isValidName(bidderName)) {
            showToast('Name must contain letters only.', 'error');
            return;
        }

        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Placing bid...';
        }

        try {
            const res = await fetch(`/api/auctions/${auctionId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: bidAmount, bidderName }),
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                showToast(result.message || 'Could not place bid.', 'error');
                return;
            }

            document.getElementById('current-bid-display').textContent =
                `${Math.round(result.currentHighestBid)} BD`;
            if (result.highestBidderName) {
                document.getElementById('highest-bidder-name').textContent = result.highestBidderName;
            }
            if (result.secondsRemaining != null) {
                setCountdown(result.secondsRemaining);
            }
            updateMinBid();
            bidForm.reset();
            showToast(result.message, 'success');
        } catch {
            showToast('Network error — please try again.', 'error');
        } finally {
            if (bidBtn && auctionStatus === 'LIVE') {
                bidBtn.disabled = false;
                bidBtn.innerHTML = '<i class="fas fa-gavel mr-2"></i>Place Bid';
            }
        }
    });

    document.getElementById('back-to-auctions')?.addEventListener('click', () => {
        window.location.href = '/auctions';
    });

    window.changeImage = function (thumbnail) {
        const mainImage = document.getElementById('mainImage');
        if (!mainImage) return;
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            mainImage.src = thumbnail.src.includes('unsplash.com')
                ? thumbnail.src.replace(/w=\d+&h=\d+/, 'w=600&h=500')
                : thumbnail.src;
            mainImage.style.opacity = '1';
        }, 150);
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    function showToast(message, type) {
        document.getElementById('av-toast')?.remove();
        const colors = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
        const toast = document.createElement('div');
        toast.id = 'av-toast';
        toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colors[type] || colors.info}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }
});
