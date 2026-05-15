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

    const requireLoginToAct = (message) =>
        window.requireLoginForAction ? window.requireLoginForAction(message) : true;

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

        const endLabel = document.querySelector('#countdown + p, #countdown ~ p');
        if (endLabel && data.endTimeLabel) {
            endLabel.textContent = `Ends: ${data.endTimeLabel}`;
        }

        if (auctionStatus === 'ENDED') {
            handleAuctionEnd();
        }

        return true;
    }

    function hydrateFromUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('name') && !params.has('id')) return false;

        if (params.get('id')) auctionId = params.get('id');

        document.title = `${params.get('name')} - Auction - Artisan Co-op`;

        const nameEl = document.querySelector('h1');
        if (nameEl && params.has('name')) nameEl.textContent = params.get('name');

        const artistEl = document.querySelector('h1 + p');
        if (artistEl && params.has('artist')) artistEl.textContent = params.get('artist');

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

        const hours = parseInt(params.get('hours') ?? '0', 10);
        const minutes = parseInt(params.get('minutes') ?? '0', 10);
        const seconds = parseInt(params.get('seconds') ?? '0', 10);
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
        renderCountdown();

        return true;
    }

    function renderCountdown() {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        const countdownBox = document.getElementById('countdown')?.parentElement;
        if (countdownBox && hours === 0 && minutes < 5 && totalSeconds > 0) {
            countdownBox.style.borderColor = '#ef4444';
            countdownBox.style.backgroundColor = '#fff5f5';
        }
    }

    function setCountdownFromSeconds(seconds) {
        totalSeconds = Math.max(0, parseInt(seconds, 10) || 0);
        renderCountdown();
    }

    function handleAuctionEnd() {
        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Auction Ended';
            bidBtn.className = bidBtn.className
                .replace('bg-[#c17c5f]', 'bg-gray-400')
                .replace('hover:bg-[#a5664d]', '');
        }
        if (bidInput) bidInput.disabled = true;
    }

    function getCurrentBidValue() {
        const bidText = document.getElementById('current-bid-display')?.textContent ?? '0';
        return parseFloat(bidText.replace(/[^0-9.]/g, '')) || 0;
    }

    function updateMinBid() {
        const currentBid = getCurrentBidValue();
        const minBid = Math.floor(currentBid) + 1;
        if (bidInput) {
            bidInput.min = minBid;
            bidInput.step = 1;
            bidInput.placeholder = `Min: ${minBid} BD`;
        }
        return minBid;
    }

    function isValidName(name) {
        return /^[A-Za-z\u0600-\u06FF\s]{2,50}$/.test(name);
    }

    function formatBidderDisplay(name) {
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0];
        const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : '';
        return `${firstName}${lastInitial}`;
    }

    if (!hydrateFromServer()) {
        hydrateFromUrlParams();
    }
    updateMinBid();

    const countdownInterval = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            handleAuctionEnd();
            showToast('This auction has ended.', 'info');
            return;
        }
        totalSeconds--;
        renderCountdown();
    }, 1000);

    bidForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!requireLoginToAct('Login/Register first to place a bid.')) return;

        if (!auctionId) {
            showToast('Auction not found. Please open this page from the auctions list.', 'error');
            return;
        }

        if (auctionStatus === 'ENDED') {
            showToast('This auction has ended.', 'error');
            return;
        }

        const rawBid = bidInput.value;
        const bidAmount = parseFloat(rawBid);
        const minBid = updateMinBid();
        const bidderNameInput = document.getElementById('bidderName');
        const bidderName = bidderNameInput?.value.trim() ?? '';

        if (!rawBid || isNaN(bidAmount)) {
            showToast('Please enter a valid bid amount.', 'error');
            bidInput.focus();
            return;
        }

        if (!Number.isInteger(bidAmount)) {
            showToast('Bids must be in whole BD amounts — fils are not allowed.', 'error');
            bidInput.focus();
            return;
        }

        if (bidAmount < minBid) {
            showToast(`Your bid must be at least ${minBid} BD (current bid + 1 BD minimum).`, 'error');
            bidInput.focus();
            return;
        }

        if (!bidderName) {
            showToast('Please enter your name before placing a bid.', 'error');
            bidderNameInput?.focus();
            return;
        }

        if (!isValidName(bidderName)) {
            showToast('Name must contain letters only — no numbers or special characters.', 'error');
            bidderNameInput?.focus();
            return;
        }

        if (bidBtn) {
            bidBtn.disabled = true;
            bidBtn.textContent = 'Placing bid...';
        }

        try {
            const response = await fetch(`/api/auctions/${auctionId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: bidAmount, bidderName }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                showToast(result.message || 'Could not place bid.', 'error');
                return;
            }

            const currentBidDisplay = document.getElementById('current-bid-display');
            if (currentBidDisplay) {
                currentBidDisplay.textContent = `${Math.round(result.currentHighestBid)} BD`;
                currentBidDisplay.style.color = '#10b981';
                setTimeout(() => { currentBidDisplay.style.color = ''; }, 1500);
            }

            const highestBidderEl = document.getElementById('highest-bidder-name');
            if (highestBidderEl && result.highestBidderName) {
                highestBidderEl.textContent = formatBidderDisplay(result.highestBidderName);
                highestBidderEl.style.color = '#10b981';
                setTimeout(() => { highestBidderEl.style.color = ''; }, 1500);
            }

            if (result.secondsRemaining != null) {
                setCountdownFromSeconds(result.secondsRemaining);
            }

            updateMinBid();
            bidForm.reset();

            if (result.extended) {
                showToast('Bid placed! Anti-snipe rule: auction extended by 2 minutes.', 'success');
            } else {
                showToast(`Bid of ${bidAmount} BD placed successfully!`, 'success');
            }
        } catch (err) {
            showToast('Network error — please try again.', 'error');
        } finally {
            if (bidBtn && auctionStatus !== 'ENDED') {
                bidBtn.disabled = false;
                bidBtn.innerHTML = '<i class="fas fa-gavel mr-2"></i>Place Bid';
            }
        }
    });

    document.getElementById('back-to-auctions')?.addEventListener('click', () => {
        window.location.href = '/auctions';
    });

    window.changeImage = function(thumbnail) {
        const mainImage = document.getElementById('mainImage');
        if (!mainImage) return;

        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            const highResUrl = thumbnail.src.includes('unsplash.com')
                ? thumbnail.src.replace(/w=\d+&h=\d+/, 'w=600&h=500')
                : thumbnail.src;
            mainImage.src = highResUrl;
            mainImage.style.opacity = '1';
        }, 150);

        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    function showToast(message, type = 'info') {
        document.getElementById('av-toast')?.remove();
        const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
        const toast = document.createElement('div');
        toast.id = 'av-toast';
        toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colours[type] || colours.info}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
