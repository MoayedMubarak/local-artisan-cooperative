// ============================================================
// artisan-common.js — session, URL id, nav sync for artisan pages
// ============================================================

(function () {
    function isArtisanLoggedIn() {
        try {
            const loggedIn = sessionStorage.getItem('loggedIn') === 'true' ||
                sessionStorage.getItem('isLoggedIn') === 'true';
            const role = (sessionStorage.getItem('userRole') || '').toUpperCase();
            return loggedIn && role === 'ARTISAN';
        } catch (e) {
            return false;
        }
    }

    function getArtisanUserId() {
        return sessionStorage.getItem('userId');
    }

    function appendIdToHref(href, userId) {
        if (!href || href === '#' || href.includes('javascript:')) return href;
        try {
            const url = new URL(href, window.location.origin);
            if (url.pathname.startsWith('/artisan')) {
                url.searchParams.set('id', userId);
                return url.pathname + url.search;
            }
        } catch (e) {
            // ignore
        }
        return href;
    }

    function syncArtisanNavLinks(userId) {
        if (!userId) return;
        document.querySelectorAll('a[href^="/artisan"]').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) return;
            link.setAttribute('href', appendIdToHref(href.split('?')[0], userId));
        });
    }

    function syncArtisanProfileFromApi() {
        const email = sessionStorage.getItem('userEmail');
        if (!email) return;

        fetch(`/api/user/me?email=${encodeURIComponent(email)}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data.success || !data.user) return;
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
                sessionStorage.setItem('userName', data.user.name || '');
                sessionStorage.setItem('userId', String(data.user.userId));

                const profilePicture = data.user.profilePicture ||
                    'https://cdn-icons-png.flaticon.com/512/149/149071.png';

                document.querySelectorAll('aside img.rounded-full, .user-menu img.rounded-full').forEach((img) => {
                    img.src = profilePicture;
                    if (data.user.name) img.alt = data.user.name;
                });

                document.querySelectorAll('aside h3.text-white').forEach((el) => {
                    el.textContent = data.user.name || 'Artisan';
                });

                document.querySelectorAll('aside .text-\\[\\#d4c5b5\\]').forEach((el) => {
                    if (el.closest('aside') && el.textContent !== data.user.email) {
                        el.textContent = data.user.shopName || '';
                    }
                });

                document.querySelectorAll('.user-menu .font-semibold.text-\\[\\#5c4a3d\\]').forEach((el) => {
                    el.textContent = data.user.name || 'Artisan';
                });

                document.querySelectorAll('.user-menu .text-xs.text-\\[\\#8b7355\\]').forEach((el) => {
                    el.textContent = data.user.email || '';
                });
            })
            .catch((err) => console.error('Artisan profile sync failed', err));
    }

    window.initArtisanPage = function initArtisanPage() {
        if (!isArtisanLoggedIn()) {
            try {
                sessionStorage.setItem('postLoginNext', window.location.pathname + window.location.search);
            } catch (e) {
                // ignore
            }
            window.location.href = '/login';
            return;
        }

        const userId = getArtisanUserId();
        if (!userId) {
            window.location.href = '/login';
            return;
        }

        const url = new URL(window.location.href);
        const urlId = url.searchParams.get('id');

        if (!urlId || urlId !== userId) {
            url.searchParams.set('id', userId);
            window.location.replace(url.toString());
            return;
        }

        syncArtisanNavLinks(userId);
        syncArtisanProfileFromApi();
    };

    window.artisanLogout = function artisanLogout() {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userProfile');
        sessionStorage.removeItem('postLoginNext');
        window.location.href = '/login';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initArtisanPage);
    } else {
        window.initArtisanPage();
    }
})();
