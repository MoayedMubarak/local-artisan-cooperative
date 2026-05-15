// ============================================================
// artisanDashboard.js — ArtsyVibe Artisan Dashboard
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------
    // 1. User Menu Dropdown (hover + click, with outside-click close)
    // ----------------------------------------------------------
    const userMenu         = document.querySelector('.user-menu');
    const userMenuButton   = document.getElementById('userMenuButton');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const chevronIcon      = document.getElementById('chevronIcon');
    const logoutButton     = document.getElementById('logoutButton');

    let hideTimeout;

    function showUserMenu() {
        clearTimeout(hideTimeout);
        userMenuDropdown?.classList.add('show');
        chevronIcon?.classList.add('rotated');
    }

    function hideUserMenu() {
        hideTimeout = setTimeout(() => {
            userMenuDropdown?.classList.remove('show');
            chevronIcon?.classList.remove('rotated');
        }, 150);
    }

    userMenu?.addEventListener('mouseenter', showUserMenu);
    userMenu?.addEventListener('mouseleave', hideUserMenu);

    // Also toggle on click (mobile friendly)
    userMenuButton?.addEventListener('click', () => {
        const isOpen = userMenuDropdown?.classList.contains('show');
        isOpen ? hideUserMenu() : showUserMenu();
    });

    // Close if clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (!userMenu?.contains(e.target)) {
            userMenuDropdown?.classList.remove('show');
            chevronIcon?.classList.remove('rotated');
        }
    });

    // Logout confirmation
    logoutButton?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/';
        }
    });

    // ----------------------------------------------------------
    // 2. Sidebar Navigation — active state only, never block real hrefs
    // ----------------------------------------------------------
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Only block navigation for placeholder # links
            if (href === '#') e.preventDefault();

            // Always update active highlight regardless
            sidebarLinks.forEach(l => {
                l.classList.remove('active', 'text-white');
                l.classList.add('text-[#d4c5b5]');
            });

            this.classList.add('active', 'text-white');
            this.classList.remove('text-[#d4c5b5]');

            // Real hrefs (e.g. /artisanSettings, /artisanOrders) navigate normally
        });
    });

    // Ensure settings navigation always works (covers cases where click may be swallowed)
    const settingsLink = document.getElementById('settingsLink');
    settingsLink?.addEventListener('click', function (e) {
        e.preventDefault();
        // Small protective delay to allow UI highlight updates to run
        setTimeout(() => window.location.href = '/artisanSettings', 10);
    });

    // ----------------------------------------------------------
    // 3. Notification Bell — badge dismiss on click
    // ----------------------------------------------------------
    const notifButton = document.querySelector('button .fa-bell')?.closest('button');
    const notifBadge  = notifButton?.querySelector('span');

    notifButton?.addEventListener('click', () => {
        if (notifBadge) {
            notifBadge.style.display = 'none';
        }
        showToast('No new notifications.', 'info');
    });

    // ----------------------------------------------------------
    // 4. Stat Cards — animated count-up on load
    // ----------------------------------------------------------
    const statValues = [
        { selector: '.stat-card:nth-child(1) h3', end: 24,   suffix: '',     duration: 800 },
        { selector: '.stat-card:nth-child(2) h3', end: 8,    suffix: '',     duration: 600 },
        { selector: '.stat-card:nth-child(3) h3', end: 5,    suffix: '',     duration: 600 },
        { selector: '.stat-card:nth-child(4) h3', end: 3245, suffix: ' BD',  duration: 1200 },
    ];

    statValues.forEach(({ selector, end, suffix, duration }) => {
        const el = document.querySelector(selector);
        if (!el) return;

        let start     = 0;
        const step    = Math.ceil(end / (duration / 16)); // ~60fps
        el.textContent = '0' + suffix;

        const timer = setInterval(() => {
            start = Math.min(start + step, end);
            el.textContent = start.toLocaleString() + suffix;
            if (start >= end) clearInterval(timer);
        }, 16);
    });

    // ----------------------------------------------------------
    // 5. Recent Orders — "View" buttons → /artisanOrderDetail?id=
    // ----------------------------------------------------------
    document.querySelectorAll('tbody .table-row').forEach(row => {
        const viewBtn = row.querySelector('button');
        if (!viewBtn) return;

        viewBtn.addEventListener('click', () => {
            // Prefer data-order-id set by Thymeleaf; fall back to parsing the text
            const orderId = row.getAttribute('data-order-id')
                ?? row.querySelector('td:first-child')?.textContent.trim().replace(/[^0-9]/g, '');

            if (orderId) {
                window.location.href = `/artisanOrderDetail?id=${orderId}`;
            } else {
                showToast('Could not load order details.', 'error');
            }
        });
    });

    // ----------------------------------------------------------
    // 6. "View All" orders link → /artisanOrders
    // ----------------------------------------------------------
    document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim().startsWith('View All')) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/artisanOrders';
            });
        }
    });

    // ----------------------------------------------------------
    // 7. Quick Action Cards — routes match ArtisanController
    // ----------------------------------------------------------
    const quickActions = document.querySelectorAll('.mt-8 a');

    quickActions.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const label = card.querySelector('h3')?.textContent.trim();

            if (label === 'Add New Product') {
                window.location.href = '/artisanProducts';
            } else if (label === 'Create Auction') {
                window.location.href = '/artisanAuction';
            } else if (label === 'Download Report') {
                handleDownloadReport(card);
            }
        });
    });

    // ----------------------------------------------------------
    // 8. Download Report — simulated export
    // ----------------------------------------------------------
    function handleDownloadReport(card) {
        const icon = card.querySelector('i');
        const text = card.querySelector('p');

        // Show loading state
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin text-xl text-blue-600';
        }
        if (text) text.textContent = 'Preparing report...';

        showToast('Generating your sales report...', 'info');

        setTimeout(() => {
            // Restore UI
            if (icon) icon.className = 'fas fa-download text-xl text-blue-600';
            if (text) text.textContent = 'Get your sales summary';

            // Trigger download (in production this would be a real API endpoint)
            const blob = new Blob(
                [`Artisan Sales Report\nGenerated: ${new Date().toLocaleString()}\n\nTotal Revenue: 3,245 BD\nTotal Products: 24\nActive Auctions: 8\nPending Orders: 5`],
                { type: 'text/plain' }
            );
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            showToast('Report downloaded!', 'success');
        }, 1800);
    }

    // ----------------------------------------------------------
    // 9. Table row — highlight on click (selected state)
    // ----------------------------------------------------------
    document.querySelectorAll('.table-row').forEach(row => {
        row.addEventListener('click', function (e) {
            // Don't interfere with the View button click
            if (e.target.closest('button')) return;

            document.querySelectorAll('.table-row').forEach(r => r.classList.remove('bg-[#fdf6f0]'));
            this.classList.add('bg-[#fdf6f0]');
        });
    });

    // ----------------------------------------------------------
    // 10. Toast Notification helper
    // ----------------------------------------------------------
    function showToast(message, type = 'info') {
        document.getElementById('av-toast')?.remove();

        const colours = {
            success: 'bg-green-600',
            error:   'bg-red-500',
            info:    'bg-[#c17c5f]',
        };

        const icons = {
            success: 'fa-check-circle',
            error:   'fa-times-circle',
            info:    'fa-info-circle',
        };

        const toast = document.createElement('div');
        toast.id        = 'av-toast';
        toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-white font-medium shadow-lg transition-opacity duration-300 ${colours[type]}`;
        toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ----------------------------------------------------------
    // 11. Keyboard shortcut: Escape closes user menu
    // ----------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            userMenuDropdown?.classList.remove('show');
            chevronIcon?.classList.remove('rotated');
        }
    });
});
