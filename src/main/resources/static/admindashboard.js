// ============================================================
// admindashboard.js — ArtsyVibe Admin Dashboard
// ============================================================

const adminEmail = () => sessionStorage.getItem('userEmail') || '';

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('userRole') || '';
    if (role !== 'ADMIN') {
        window.location.href = '/login';
        return;
    }
    const name = sessionStorage.getItem('userName') || 'Admin';
    const el = document.getElementById('admin-name');
    if (el) el.textContent = name;

    showSection('overview');
});

// ── Section Navigation ────────────────────────────────────────────────────────

window.showSection = function (section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById('section-' + section);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('sidebar-active'));
    const link = document.querySelector('[data-section="' + section + '"]');
    if (link) link.classList.add('sidebar-active');

    switch (section) {
        case 'overview': loadStats(); break;
        case 'users': loadUsers(); break;
        case 'artisans': loadPendingArtisans(); break;
        case 'reviews': loadReviews('all'); break;
        case 'disputes': loadDisputes(); break;
    }
};

window.handleLogout = function () {
    sessionStorage.clear();
    window.location.href = '/login';
};

// ── Overview / Stats ──────────────────────────────────────────────────────────

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats?adminEmail=' + encodeURIComponent(adminEmail()));
        if (!res.ok) { handleForbidden(); return; }
        const d = await res.json();
        setText('stat-total-users', d.totalUsers ?? 0);
        setText('stat-products', d.totalProducts ?? 0);
        setText('stat-auctions', d.openAuctions ?? 0);
        setText('stat-weekly-sales', formatBD(d.weeklySales ?? 0));
        setText('stat-orders', d.totalOrders ?? 0);
        setText('stat-pending', d.pendingArtisans ?? 0);
        setText('stat-flagged', d.flaggedReviews ?? 0);
        setText('stat-disputes', d.openDisputes ?? 0);

        updateBadge('badge-artisans', d.pendingArtisans ?? 0);
        updateBadge('badge-reviews', d.flaggedReviews ?? 0);
        updateBadge('badge-disputes', d.openDisputes ?? 0);
    } catch (e) {
        console.error('Stats error', e);
    }
}

// ── Users ─────────────────────────────────────────────────────────────────────

let usersCache = [];

async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users?adminEmail=' + encodeURIComponent(adminEmail()));
        if (!res.ok) { handleForbidden(); return; }
        usersCache = await res.json();
        renderUsers();
    } catch (e) {
        console.error('Users error', e);
    }
}

function renderUsers() {
    const roleFilter = document.getElementById('user-role-filter')?.value || 'ALL';
    const search = (document.getElementById('user-search')?.value || '').toLowerCase();
    let list = usersCache;
    if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter);
    if (search) list = list.filter(u =>
        (u.name || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search)
    );

    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-10 text-center text-[#8b7355]">No users found.</td></tr>';
        return;
    }

    list.forEach(u => {
        const suspended = !!u.suspended;
        const tr = document.createElement('tr');
        tr.className = 'border-b border-[#e5e0d8] hover:bg-[#faf9f6] transition-colors';
        tr.innerHTML =
            '<td class="px-5 py-3 font-medium text-[#5c4a3d]">' + esc(u.name || '') + '</td>' +
            '<td class="px-5 py-3 text-[#8b7355] text-sm">' + esc(u.email || '') + '</td>' +
            '<td class="px-5 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + roleBadge(u.role) + '">' + esc(u.role || '') + '</span></td>' +
            '<td class="px-5 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + (suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') + '">' + (suspended ? 'Suspended' : 'Active') + '</span></td>' +
            '<td class="px-5 py-3">' +
            (u.role !== 'ADMIN'
                ? '<div class="flex gap-2">' +
                '<button onclick="toggleSuspend(' + u.userId + ')" class="px-3 py-1 text-xs rounded-lg border ' + (suspended ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-[#c17c5f] text-[#c17c5f] hover:bg-[#fdf0ea]') + ' font-medium transition-colors">' + (suspended ? 'Unsuspend' : 'Suspend') + '</button>' +
                '<button onclick="deleteUser(' + u.userId + ')" class="px-3 py-1 text-xs rounded-lg border border-red-400 text-red-500 hover:bg-red-50 font-medium transition-colors">Delete</button>' +
                '</div>'
                : '<span class="text-xs text-[#b8a99a] italic">Protected</span>') +
            '</td>';
        tbody.appendChild(tr);
    });
}

window.toggleSuspend = async function (userId) {
    try {
        const res = await fetch('/api/admin/users/' + userId + '/suspend?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'PATCH' });
        const d = await res.json();
        showToast(d.suspended ? 'User suspended.' : 'User unsuspended.', d.suspended ? 'warn' : 'success');
        await loadUsers();
    } catch (e) { showToast('Failed to update user.', 'error'); }
};

window.deleteUser = async function (userId) {
    if (!confirm('Permanently delete this user account? This cannot be undone.')) return;
    try {
        await fetch('/api/admin/users/' + userId + '?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'DELETE' });
        showToast('User deleted.', 'info');
        await loadUsers();
    } catch (e) { showToast('Failed to delete user.', 'error'); }
};

window.onUserSearch = function () { renderUsers(); };
window.onUserRoleFilter = function () { renderUsers(); };

// ── Artisan Approvals ─────────────────────────────────────────────────────────

async function loadPendingArtisans() {
    const grid = document.getElementById('artisan-approvals-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="col-span-2 text-center py-8 text-[#8b7355]"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
    try {
        const res = await fetch('/api/admin/artisans/pending?adminEmail=' + encodeURIComponent(adminEmail()));
        if (!res.ok) { handleForbidden(); return; }
        const artisans = await res.json();
        grid.innerHTML = '';

        if (artisans.length === 0) {
            grid.innerHTML =
                '<div class="col-span-2 text-center py-14 text-[#8b7355]">' +
                '<i class="fas fa-check-circle text-5xl text-green-400 mb-4 block"></i>' +
                '<p class="text-lg font-semibold text-[#5c4a3d]">All caught up!</p>' +
                '<p class="text-sm mt-1">No pending artisan accounts at this time.</p>' +
                '</div>';
            return;
        }

        artisans.forEach(a => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl border border-[#e5e0d8] p-6 card-shadow';
            card.innerHTML =
                '<div class="flex items-start justify-between mb-4">' +
                '<div class="flex items-center gap-3">' +
                '<div class="w-11 h-11 rounded-full bg-[#f5ebe0] flex items-center justify-center flex-shrink-0">' +
                '<i class="fas fa-user text-[#c17c5f]"></i>' +
                '</div>' +
                '<div>' +
                '<p class="font-semibold text-[#5c4a3d]">' + esc(a.name || '') + '</p>' +
                '<p class="text-sm text-[#8b7355]">' + esc(a.email || '') + '</p>' +
                '</div>' +
                '</div>' +
                '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold">Pending</span>' +
                '</div>' +
                (a.shopName ? '<p class="text-sm font-medium text-[#5c4a3d] mb-1"><i class="fas fa-store mr-2 text-[#c17c5f]"></i>' + esc(a.shopName) + '</p>' : '') +
                (a.biography ? '<p class="text-sm text-[#8b7355] mb-5 leading-relaxed line-clamp-2">' + esc(a.biography) + '</p>' : '<div class="mb-5"></div>') +
                '<div class="flex gap-3">' +
                '<button onclick="approveArtisan(' + a.userId + ')" class="flex-1 py-2 bg-[#c17c5f] hover:bg-[#a5664d] text-white rounded-lg text-sm font-semibold transition-colors"><i class="fas fa-check mr-1"></i>Approve</button>' +
                '<button onclick="rejectArtisan(' + a.userId + ')" class="flex-1 py-2 border-2 border-red-400 text-red-500 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"><i class="fas fa-times mr-1"></i>Reject</button>' +
                '</div>';
            grid.appendChild(card);
        });
    } catch (e) { console.error('Artisans error', e); }
}

window.approveArtisan = async function (id) {
    try {
        await fetch('/api/admin/artisans/' + id + '/approve?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'PATCH' });
        showToast('Artisan approved!', 'success');
        loadPendingArtisans();
        loadStats();
    } catch (e) { showToast('Failed to approve artisan.', 'error'); }
};

window.rejectArtisan = async function (id) {
    if (!confirm('Reject and permanently remove this artisan account?')) return;
    try {
        await fetch('/api/admin/artisans/' + id + '/reject?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'DELETE' });
        showToast('Artisan rejected and removed.', 'info');
        loadPendingArtisans();
        loadStats();
    } catch (e) { showToast('Failed to reject artisan.', 'error'); }
};

// ── Reviews / Content Moderation ──────────────────────────────────────────────

let currentReviewFilter = 'all';

window.loadReviews = async function (filter) {
    if (filter !== undefined) currentReviewFilter = filter;

    document.querySelectorAll('.review-filter-btn').forEach(b => {
        b.classList.toggle('filter-active', b.dataset.filter === currentReviewFilter);
        b.classList.toggle('filter-inactive', b.dataset.filter !== currentReviewFilter);
    });

    const url = currentReviewFilter === 'flagged'
        ? '/api/admin/reviews?adminEmail=' + encodeURIComponent(adminEmail()) + '&flagged=true'
        : '/api/admin/reviews?adminEmail=' + encodeURIComponent(adminEmail());

    try {
        const res = await fetch(url);
        if (!res.ok) { handleForbidden(); return; }
        const reviews = await res.json();
        const tbody = document.getElementById('reviews-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-10 text-center text-[#8b7355]">No reviews found.</td></tr>';
            return;
        }

        reviews.forEach(r => {
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e5e0d8] hover:bg-[#faf9f6] transition-colors';
            tr.innerHTML =
                '<td class="px-4 py-3 text-sm text-[#5c4a3d] max-w-[130px]"><div class="truncate">' + esc(r.product?.title || '—') + '</div></td>' +
                '<td class="px-4 py-3 text-sm text-[#8b7355]">' + esc(r.customer?.name || '—') + '</td>' +
                '<td class="px-4 py-3 text-sm text-yellow-500 whitespace-nowrap">' + stars + '</td>' +
                '<td class="px-4 py-3 text-sm text-[#5c4a3d] max-w-[220px]"><div class="truncate" title="' + esc(r.comment || '') + '">' + esc(r.comment || '') + '</div></td>' +
                '<td class="px-4 py-3 text-sm text-[#8b7355] whitespace-nowrap">' + (r.date || '') + '</td>' +
                '<td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + (r.flagged ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500') + '">' + (r.flagged ? 'Flagged' : 'Clean') + '</span></td>' +
                '<td class="px-4 py-3"><div class="flex gap-2">' +
                '<button onclick="toggleFlagReview(' + r.reviewId + ')" class="px-2 py-1 text-xs rounded-lg border ' + (r.flagged ? 'border-gray-400 text-gray-500 hover:bg-gray-50' : 'border-[#c17c5f] text-[#c17c5f] hover:bg-[#fdf0ea]') + ' transition-colors font-medium">' + (r.flagged ? 'Unflag' : 'Flag') + '</button>' +
                '<button onclick="deleteReview(' + r.reviewId + ')" class="px-2 py-1 text-xs rounded-lg border border-red-400 text-red-500 hover:bg-red-50 transition-colors font-medium">Delete</button>' +
                '</div></td>';
            tbody.appendChild(tr);
        });
    } catch (e) { console.error('Reviews error', e); }
};

window.toggleFlagReview = async function (id) {
    try {
        await fetch('/api/admin/reviews/' + id + '/flag?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'PATCH' });
        window.loadReviews();
    } catch (e) { showToast('Failed to update review.', 'error'); }
};

window.deleteReview = async function (id) {
    if (!confirm('Delete this review permanently?')) return;
    try {
        await fetch('/api/admin/reviews/' + id + '?adminEmail=' + encodeURIComponent(adminEmail()), { method: 'DELETE' });
        showToast('Review deleted.', 'info');
        window.loadReviews();
        loadStats();
    } catch (e) { showToast('Failed to delete review.', 'error'); }
};

// ── Disputes ──────────────────────────────────────────────────────────────────

async function loadDisputes() {
    const list = document.getElementById('disputes-list');
    if (!list) return;
    list.innerHTML = '<div class="text-center py-8 text-[#8b7355]"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
    try {
        const res = await fetch('/api/admin/disputes?adminEmail=' + encodeURIComponent(adminEmail()));
        if (!res.ok) { handleForbidden(); return; }
        const disputes = await res.json();
        list.innerHTML = '';

        if (disputes.length === 0) {
            list.innerHTML =
                '<div class="text-center py-14 text-[#8b7355]">' +
                '<i class="fas fa-handshake text-5xl text-[#c17c5f] mb-4 block"></i>' +
                '<p class="text-lg font-semibold text-[#5c4a3d]">No disputes on record.</p>' +
                '<p class="text-sm mt-1">Log a dispute to start tracking it here.</p>' +
                '</div>';
            return;
        }

        disputes.forEach(d => {
            const isOpen = d.status === 'OPEN';
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl border border-[#e5e0d8] p-6 card-shadow mb-4';
            card.innerHTML =
                '<div class="flex items-start justify-between gap-4 mb-3">' +
                '<div>' +
                '<h4 class="font-semibold text-[#5c4a3d] text-base">' + esc(d.title || '') + '</h4>' +
                '<p class="text-sm text-[#8b7355] mt-1 leading-relaxed">' + esc(d.description || '') + '</p>' +
                '</div>' +
                '<span class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ' + (isOpen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') + '">' + esc(d.status || '') + '</span>' +
                '</div>' +
                '<div class="flex flex-wrap gap-4 text-sm text-[#8b7355] mb-3">' +
                (d.customerName ? '<span><i class="fas fa-user mr-1 text-[#c17c5f]"></i>' + esc(d.customerName) + '</span>' : '') +
                (d.artisanName ? '<span><i class="fas fa-store mr-1 text-[#c17c5f]"></i>' + esc(d.artisanName) + '</span>' : '') +
                (d.createdDate ? '<span><i class="fas fa-calendar mr-1 text-[#c17c5f]"></i>' + esc(d.createdDate) + '</span>' : '') +
                (d.resolvedDate ? '<span><i class="fas fa-check mr-1 text-green-600"></i>Resolved ' + esc(d.resolvedDate) + '</span>' : '') +
                '</div>' +
                (d.resolution ? '<div class="text-sm bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 mb-4"><i class="fas fa-gavel mr-2"></i><strong>Resolution:</strong> ' + esc(d.resolution) + '</div>' : '') +
                (isOpen ? '<button onclick="openResolveModal(' + d.id + ')" class="px-5 py-2 bg-[#c17c5f] hover:bg-[#a5664d] text-white rounded-lg text-sm font-semibold transition-colors"><i class="fas fa-gavel mr-1"></i>Resolve Dispute</button>' : '');
            list.appendChild(card);
        });
    } catch (e) { console.error('Disputes error', e); }
}

window.openCreateDisputeModal = function () {
    toggleModal('create-dispute-modal', true);
};
window.closeCreateDisputeModal = function () {
    toggleModal('create-dispute-modal', false);
    document.getElementById('create-dispute-form')?.reset();
};

window.saveNewDispute = async function (event) {
    event.preventDefault();
    const f = event.target;
    const title = f.querySelector('#dispute-title')?.value.trim();
    const description = f.querySelector('#dispute-description')?.value.trim();
    const customerName = f.querySelector('#dispute-customer')?.value.trim();
    const artisanName = f.querySelector('#dispute-artisan')?.value.trim();
    if (!title || !description) { showToast('Title and description are required.', 'error'); return; }
    try {
        await fetch('/api/admin/disputes?adminEmail=' + encodeURIComponent(adminEmail()), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, customerName, artisanName })
        });
        window.closeCreateDisputeModal();
        showToast('Dispute logged.', 'success');
        loadDisputes();
        loadStats();
    } catch (e) { showToast('Failed to create dispute.', 'error'); }
};

let resolveTargetId = null;
window.openResolveModal = function (id) {
    resolveTargetId = id;
    toggleModal('resolve-dispute-modal', true);
};
window.closeResolveModal = function () {
    toggleModal('resolve-dispute-modal', false);
    const el = document.getElementById('resolution-text');
    if (el) el.value = '';
    resolveTargetId = null;
};

window.submitResolution = async function () {
    const resolution = document.getElementById('resolution-text')?.value.trim();
    if (!resolution) { showToast('Please enter a resolution note.', 'error'); return; }
    try {
        await fetch('/api/admin/disputes/' + resolveTargetId + '/resolve?adminEmail=' + encodeURIComponent(adminEmail()), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution })
        });
        window.closeResolveModal();
        showToast('Dispute resolved!', 'success');
        loadDisputes();
        loadStats();
    } catch (e) { showToast('Failed to resolve dispute.', 'error'); }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatBD(n) {
    return Number(n).toFixed(3) + ' BD';
}

function roleBadge(role) {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700';
    if (role === 'ARTISAN') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
}

function updateBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
        el.textContent = count;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
        el.classList.remove('hidden');
        el.classList.add('flex');
    } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
    }
}

function handleForbidden() {
    showToast('Access denied. Admin privileges required.', 'error');
    setTimeout(() => { window.location.href = '/login'; }, 2000);
}

function showToast(message, type) {
    const old = document.getElementById('av-admin-toast');
    if (old) old.remove();
    const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#8b7355]', warn: 'bg-orange-500' };
    const toast = document.createElement('div');
    toast.id = 'av-admin-toast';
    toast.className = 'fixed bottom-6 right-6 z-[9999] px-6 py-3 rounded-xl text-white font-medium shadow-xl ' + (colours[type] || 'bg-[#c17c5f]');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
