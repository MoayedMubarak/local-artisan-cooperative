document.addEventListener('DOMContentLoaded', () => {

    // ── Login State ──────────────────────────────────────────────────────────
    const loginButtonWrapper = document.getElementById('login-button-wrapper');
    const userSection        = document.getElementById('user-section');
    const navUserName        = document.getElementById('nav-user-name');
    const notificationBadge  = document.getElementById('notification-badge');

    function updateLoginState() {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('loggedIn') === 'true';
        if (loggedIn) {
            loginButtonWrapper?.classList.add('hidden');
            userSection?.classList.remove('hidden');
            if (navUserName) navUserName.textContent = sessionStorage.getItem('userName') || 'Account';
            updateNotificationBadge();
        } else {
            loginButtonWrapper?.classList.remove('hidden');
            userSection?.classList.add('hidden');
        }
        updateCartBadge();
    }

    // ── Star Rating Summary (product header) ────────────────────────────────
    function renderRatingStars(avg) {
        const container = document.getElementById('rating-stars');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const icon = document.createElement('i');
            if (i <= Math.floor(avg)) {
                icon.className = 'fas fa-star star-filled';
            } else if (i === Math.ceil(avg) && avg % 1 >= 0.25) {
                icon.className = 'fas fa-star-half-alt star-filled';
            } else {
                icon.className = 'far fa-star star-empty';
            }
            container.appendChild(icon);
        }
    }

    const avgEl   = document.getElementById('rating-avg');
    const countEl = document.getElementById('rating-count');
    const initialAvg = parseFloat(avgEl?.textContent || '0');
    renderRatingStars(initialAvg);

    // ── Image Gallery ────────────────────────────────────────────────────────
    window.changeImage = function (thumbnail) {
        const mainImage = document.getElementById('mainImage');
        if (!mainImage) return;
        mainImage.src = thumbnail.src
            .replace(/([?&])w=\d+(&|$)/, '$1w=600$2')
            .replace(/([?&])h=\d+(&|$)/, '$1h=500$2');
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    // ── Add to Cart ──────────────────────────────────────────────────────────
    document.querySelectorAll('button:has(.fa-shopping-cart)').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to add items to your cart.')) return;
            const meta      = document.getElementById('product-page-meta');
            const productId = meta?.dataset?.productId || new URLSearchParams(window.location.search).get('id');
            if (!productId) { showToast('Product not available.', 'error'); return; }
            if (meta?.dataset?.auction === 'true') { showToast('Auction items cannot be added to the cart.', 'info'); return; }
            const orig = this.innerHTML;
            this.disabled = true;
            try {
                if (!window.addProductToCart) throw new Error('Cart unavailable. Refresh the page.');
                await window.addProductToCart(productId, 1);
                this.innerHTML = '<i class="fas fa-check mr-2"></i>Added!';
                this.classList.replace('bg-[#c17c5f]', 'bg-green-600');
                showToast('Added to Cart!', 'success');
                setTimeout(() => {
                    this.innerHTML = orig;
                    this.classList.replace('bg-green-600', 'bg-[#c17c5f]');
                    this.disabled = false;
                }, 900);
            } catch (err) {
                showToast(err.message || 'Could not add to cart', 'error');
                this.disabled = false;
            }
        });
    });

    // ── Add to Wishlist ──────────────────────────────────────────────────────
    document.querySelectorAll('button:has(.fa-heart)').forEach(btn => {
        btn.addEventListener('click', function () {
            if (window.requireLoginForAction && !window.requireLoginForAction('Login/Register first to use your wishlist.')) return;
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.replace('far', 'fas');
                icon.classList.add('text-red-500');
                showToast('Added to Wishlist', 'success');
            } else {
                icon.classList.replace('fas', 'far');
                icon.classList.remove('text-red-500');
                showToast('Removed from Wishlist', 'info');
            }
        });
    });

    // ── Review Modal ─────────────────────────────────────────────────────────
    const modal          = document.getElementById('review-modal');
    const openBtn        = document.getElementById('write-review-btn');
    const closeBtn       = document.getElementById('close-modal-btn');
    const reviewForm     = document.getElementById('review-form');
    const commentInput   = document.getElementById('review-comment');
    const ratingError    = document.getElementById('rating-error');
    const commentError   = document.getElementById('comment-error');
    const submitBtn      = document.getElementById('submit-review-btn');

    function openModal() {
        modal?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal?.classList.remove('open');
        document.body.style.overflow = '';
        reviewForm?.reset();
        ratingError?.classList.add('hidden');
        commentError?.classList.add('hidden');
    }

    openBtn?.addEventListener('click', () => {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('loggedIn') === 'true';
        const role     = sessionStorage.getItem('userRole') || '';
        if (!loggedIn) {
            showToast('Please log in to write a review.', 'info');
            setTimeout(() => { window.location.href = '/login'; }, 1500);
            return;
        }
        if (role.toUpperCase() !== 'CUSTOMER') {
            showToast('Only customers can write reviews.', 'info');
            return;
        }
        openModal();
    });

    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // ── Review Form Submission ────────────────────────────────────────────────
    reviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedRating = reviewForm.querySelector('input[name="rating"]:checked');
        const comment        = commentInput?.value.trim();
        let valid = true;

        if (!selectedRating) {
            ratingError?.classList.remove('hidden');
            valid = false;
        } else {
            ratingError?.classList.add('hidden');
        }
        if (!comment) {
            commentError?.classList.remove('hidden');
            valid = false;
        } else {
            commentError?.classList.add('hidden');
        }
        if (!valid) return;

        const productId = document.getElementById('product-page-meta')?.dataset?.productId
                       || new URLSearchParams(window.location.search).get('id');
        const email     = sessionStorage.getItem('userEmail');

        if (!productId || !email) {
            showToast('Session error. Please log in again.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting…';

        try {
            const res  = await fetch(`/api/reviews/product/${productId}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, rating: parseInt(selectedRating.value), comment })
            });
            const data = await res.json();

            if (data.success) {
                closeModal();
                showToast('Review submitted! Thank you.', 'success');
                appendReview({ reviewId: data.reviewId, name: sessionStorage.getItem('userName') || 'You', email: sessionStorage.getItem('userEmail'), rating: parseInt(selectedRating.value), comment, date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
                updateRatingSummary(data.averageRating, data.reviewCount);
            } else {
                showToast(data.message || 'Could not submit review.', 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Review';
        }
    });

    // ── Append new review to the DOM instantly ───────────────────────────────
    function appendReview({ reviewId, name, email, rating, comment, date }) {
        const list    = document.getElementById('reviews-list');
        const noMsg   = document.getElementById('no-reviews-msg');
        if (noMsg) noMsg.remove();

        const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const stars    = Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < rating ? 'fas fa-star star-filled' : 'far fa-star star-empty'}"></i>`
        ).join('');

        const el = document.createElement('div');
        el.className = 'review-card border-t border-[#e5e0d8] py-6';
        el.dataset.reviewId      = reviewId || '';
        el.dataset.customerEmail = email    || '';
        el.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-[#f5ebe0] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span class="text-[#c17c5f] font-semibold text-sm">${initials}</span>
                    </div>
                    <div>
                        <h4 class="font-semibold text-[#5c4a3d]">${name}</h4>
                        <div class="flex text-sm mt-0.5">${stars}</div>
                    </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="text-[#8b7355] text-sm">${date}</span>
                    <button class="delete-review-btn text-[#8b7355] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50" title="Delete your review">
                        <i class="fas fa-trash-alt text-sm"></i>
                    </button>
                </div>
            </div>
            <p class="text-[#8b7355] leading-relaxed mt-2">${comment}</p>
        `;
        list.insertBefore(el, list.firstChild);
    }

    // ── Update header rating summary ─────────────────────────────────────────
    function updateRatingSummary(avg, count) {
        if (avgEl)   avgEl.textContent   = avg;
        if (countEl) countEl.textContent = `(${count} review${count === 1 ? '' : 's'})`;
        renderRatingStars(avg);
    }

    // ── Toast Utility ────────────────────────────────────────────────────────
    window.showToast = function showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
        toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
    };

    // ── Reveal delete buttons for the logged-in user's own reviews ───────────
    function applyDeleteButtons() {
        const email = sessionStorage.getItem('userEmail');
        const role  = (sessionStorage.getItem('userRole') || '').toUpperCase();
        if (!email || role !== 'CUSTOMER') return;

        document.querySelectorAll('.review-card').forEach(card => {
            if (card.dataset.customerEmail === email) {
                card.querySelector('.delete-review-btn')?.classList.remove('hidden');
            }
        });
    }

    // ── Delete review handler (event delegation on #reviews-list) ────────────
    document.getElementById('reviews-list')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-review-btn');
        if (!btn) return;

        const card     = btn.closest('.review-card');
        const reviewId = card?.dataset?.reviewId;
        const email    = sessionStorage.getItem('userEmail');
        if (!reviewId || !email) return;

        // Show inline confirmation inside the button row
        if (!card.dataset.confirming) {
            card.dataset.confirming = 'true';
            const row = btn.parentElement;
            const confirmEl = document.createElement('div');
            confirmEl.id = 'confirm-' + reviewId;
            confirmEl.className = 'flex items-center gap-2 text-sm';
            confirmEl.innerHTML = `
                <span class="text-[#5c4a3d] font-medium">Delete this review?</span>
                <button id="confirm-yes-${reviewId}" class="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Yes, delete</button>
                <button id="confirm-no-${reviewId}"  class="px-3 py-1 rounded-lg border border-[#e5e0d8] hover:bg-[#f5ebe0] text-[#8b7355] font-medium transition-colors">Cancel</button>
            `;
            btn.classList.add('hidden');
            row.appendChild(confirmEl);

            // Cancel button
            document.getElementById('confirm-no-' + reviewId)?.addEventListener('click', () => {
                confirmEl.remove();
                btn.classList.remove('hidden');
                delete card.dataset.confirming;
            });

            // Confirm delete button
            document.getElementById('confirm-yes-' + reviewId)?.addEventListener('click', async () => {
                confirmEl.innerHTML = '<i class="fas fa-spinner fa-spin text-[#8b7355]"></i>';
                try {
                    const res  = await fetch(`/api/reviews/${reviewId}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        // Fade out and remove card
                        card.style.transition = 'opacity 0.3s, max-height 0.4s';
                        card.style.overflow   = 'hidden';
                        card.style.opacity    = '0';
                        card.style.maxHeight  = card.offsetHeight + 'px';
                        setTimeout(() => { card.style.maxHeight = '0'; card.style.padding = '0'; }, 10);
                        setTimeout(() => {
                            card.remove();
                            updateRatingSummary(data.averageRating, data.reviewCount);
                            // Show empty state if no more reviews
                            if (data.reviewCount === 0) {
                                const list = document.getElementById('reviews-list');
                                list.innerHTML = `<div id="no-reviews-msg" class="text-center py-10 text-[#8b7355]">
                                    <i class="fas fa-comment-slash text-4xl mb-3 opacity-30"></i>
                                    <p class="text-lg">No reviews yet. Be the first to share your thoughts!</p>
                                </div>`;
                            }
                        }, 420);
                        showToast('Review deleted.', 'success');
                    } else {
                        showToast(data.message || 'Could not delete review.', 'error');
                        confirmEl.remove();
                        btn.classList.remove('hidden');
                        delete card.dataset.confirming;
                    }
                } catch {
                    showToast('Network error. Please try again.', 'error');
                    confirmEl.remove();
                    btn.classList.remove('hidden');
                    delete card.dataset.confirming;
                }
            });
        }
    });

    updateLoginState();
    applyDeleteButtons();

// ── Notification badge ────────────────────────────────────────────────────────
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '0', 10);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

// ── Cart badge ────────────────────────────────────────────────────────────────
function updateCartBadge() {
    document.querySelectorAll('.fa-shopping-cart').forEach(icon => {
        const badge = icon.parentElement?.querySelector('span');
        if (!badge) return;
        badge.textContent = parseInt(sessionStorage.getItem('cartCount') ?? '0', 10);
    });
}
