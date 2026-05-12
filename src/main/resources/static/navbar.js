(function () {
    const loggedIn = sessionStorage.getItem('loggedIn') === 'true';

    function updateNav() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        // ── Profile section ────────────────────────────────────
        const profileLink = nav.querySelector('a[href="/profile"]');
        if (profileLink) {
            if (loggedIn) {
                profileLink.style.display = '';
                const existing = document.getElementById('nav-login-btn');
                if (existing) existing.remove();
            } else {
                profileLink.style.display = 'none';
                if (!document.getElementById('nav-login-btn')) {
                    const btn = document.createElement('a');
                    btn.id        = 'nav-login-btn';
                    btn.href      = '/login';
                    btn.className = 'px-5 py-2 bg-[#c17c5f] hover:bg-[#a5664d] text-white rounded-full font-semibold text-sm transition-colors';
                    btn.style.cssText = 'background-color:#c17c5f;color:#fff;padding:0.5rem 1.25rem;border-radius:9999px;font-weight:600;font-size:0.875rem;text-decoration:none;transition:background-color .2s;';
                    btn.textContent = 'Login';
                    btn.addEventListener('mouseover', () => btn.style.backgroundColor = '#a5664d');
                    btn.addEventListener('mouseout',  () => btn.style.backgroundColor = '#c17c5f');
                    profileLink.parentNode.insertBefore(btn, profileLink);
                }
            }
        }

        // ── Notification badge ─────────────────────────────────
        const notifBadge = document.getElementById('notification-badge');
        if (notifBadge) {
            notifBadge.style.display = loggedIn ? '' : 'none';
        }

        // ── Cart badge ─────────────────────────────────────────
        const cartLink = nav.querySelector('a[href="/cart"]');
        if (cartLink) {
            const cartBadge = cartLink.querySelector('span');
            if (cartBadge) {
                cartBadge.style.display = loggedIn ? '' : 'none';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNav);
    } else {
        updateNav();
    }
})();
