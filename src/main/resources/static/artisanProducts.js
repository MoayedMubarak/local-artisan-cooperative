document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initUserMenu();
    initFilters(); 
    // Navigation logic is now handled within the generated rows
    updateTable(); // Initial render
});

// --- GLOBAL STATE ---
let currentPage = 1;
const rowsPerPage = 10; // Increased table length as requested

// --- DATA SOURCE (Generated Dynamically for Date Testing) ---
// We generate dates relative to "Today" so you can test the filters immediately.
const today = new Date();
const oneDay = 24 * 60 * 60 * 1000;

const ordersData = [
    {
        id: 101, displayId: "#ORD-2024-001", customer: "John Davis", initials: "JD",
        product: "Handcrafted Ceramic Vase", qty: 1, price: "85.00 BD", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=60&h=60&fit=crop",
        date: new Date(today.getTime()), // TODAY
        status: "pending"
    },
    {
        id: 102, displayId: "#ORD-2024-002", customer: "Sarah Miller", initials: "SM",
        product: "Ceramic Bowl Set", qty: 2, price: "240.00 BD", img: "https://images.unsplash.com/photo-1578749556920-d1e28f925f40?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (1 * oneDay)), // YESTERDAY
        status: "processing"
    },
    {
        id: 103, displayId: "#ORD-2024-003", customer: "Michael Kim", initials: "MK",
        product: "Artisan Tea Set", qty: 1, price: "195.00 BD", img: "https://images.unsplash.com/photo-1590422749830-674860a6e4d4?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (3 * oneDay)), // 3 DAYS AGO
        status: "shipped"
    },
    {
        id: 104, displayId: "#ORD-2024-004", customer: "Emily Watson", initials: "EW",
        product: "Decorative Plant Pot", qty: 3, price: "135.00 BD", img: "https://images.unsplash.com/photo-1565193566173-033e4e379cda?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (10 * oneDay)), // 10 DAYS AGO (Last Week)
        status: "delivered"
    },
    {
        id: 105, displayId: "#ORD-2024-005", customer: "David Lee", initials: "DL",
        product: "Ceramic Dinner Plates", qty: 1, price: "150.00 BD", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (5 * oneDay)), // 5 DAYS AGO
        status: "refund-requested"
    },
    {
        id: 106, displayId: "#ORD-2024-006", customer: "Anna Brown", initials: "AB",
        product: "Rustic Mug Set", qty: 2, price: "90.00 BD", img: "https://images.unsplash.com/photo-1578749556920-d1e28f925f40?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (20 * oneDay)), // OLD
        status: "refund-declined"
    },
    {
        id: 107, displayId: "#ORD-2024-007", customer: "Robert Johnson", initials: "RJ",
        product: "Ceramic Serving Platter", qty: 1, price: "110.00 BD", img: "https://images.unsplash.com/photo-1590422749830-674860a6e4d4?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (25 * oneDay)), // OLD
        status: "refund-escalated"
    },
    {
        id: 108, displayId: "#ORD-2024-008", customer: "Lisa Thompson", initials: "LT",
        product: "Handcrafted Ceramic Vase", qty: 1, price: "85.00 BD", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (2 * oneDay)), // 2 DAYS AGO
        status: "refund-approved"
    },
    {
        id: 109, displayId: "#ORD-2024-009", customer: "James Wilson", initials: "JW",
        product: "Clay Sculpture", qty: 1, price: "300.00 BD", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (4 * oneDay)), // 4 DAYS AGO
        status: "pending"
    },
    {
        id: 110, displayId: "#ORD-2024-010", customer: "Patricia Moore", initials: "PM",
        product: "Mosaic Coasters", qty: 4, price: "45.00 BD", img: "https://images.unsplash.com/photo-1578749556920-d1e28f925f40?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (6 * oneDay)), // 6 DAYS AGO
        status: "shipped"
    },
    {
        id: 111, displayId: "#ORD-2024-011", customer: "Thomas Taylor", initials: "TT",
        product: "Ceramic Jug", qty: 1, price: "60.00 BD", img: "https://images.unsplash.com/photo-1590422749830-674860a6e4d4?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (12 * oneDay)), // OLD
        status: "delivered"
    },
    {
        id: 112, displayId: "#ORD-2024-012", customer: "Linda Anderson", initials: "LA",
        product: "Pottery Wheel", qty: 1, price: "450.00 BD", img: "https://images.unsplash.com/photo-1565193566173-033e4e379cda?w=60&h=60&fit=crop",
        date: new Date(today.getTime() - (1 * oneDay)), // YESTERDAY
        status: "processing"
    }
];

// --- 1. Sidebar & User Menu (Same as before) ---
function initSidebar() {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            links.forEach(l => { l.classList.remove('active', 'text-white'); l.classList.add('text-[#d4c5b5]'); });
            this.classList.add('active', 'text-white');
            this.classList.remove('text-[#d4c5b5]');
        });
    });
}

function initUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const chevronIcon = document.getElementById('chevronIcon');
    const logoutButton = document.getElementById('logoutButton');
    let hideTimeout;

    if (userMenu && userMenuButton) {
        const showMenu = () => { clearTimeout(hideTimeout); userMenuDropdown.classList.add('show'); if(chevronIcon) chevronIcon.classList.add('rotated'); };
        const hideMenu = () => { hideTimeout = setTimeout(() => { userMenuDropdown.classList.remove('show'); if(chevronIcon) chevronIcon.classList.remove('rotated'); }, 150); };
        userMenu.addEventListener('mouseenter', showMenu);
        userMenu.addEventListener('mouseleave', hideMenu);
        userMenuButton.addEventListener('click', (e) => { e.stopPropagation(); userMenuDropdown.classList.contains('show') ? hideMenu() : showMenu(); });
    }
    if (logoutButton) { logoutButton.addEventListener('click', () => { if (confirm('Are you sure you want to logout?')) window.location.href = '/index'; }); }
}

// --- 2. Filtering Logic ---
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusSelect');
    const dateSelect = document.getElementById('dateSelect');

    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; updateTable(); });
    if (statusSelect) statusSelect.addEventListener('change', () => { currentPage = 1; updateTable(); });
    if (dateSelect) dateSelect.addEventListener('change', () => { currentPage = 1; updateTable(); });
}

// --- 3. Main Table Logic (Filter + Render) ---
function updateTable() {
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusSelect');
    const dateSelect = document.getElementById('dateSelect');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const dateFilter = dateSelect ? dateSelect.value : '';

    const now = new Date();
    // Helper to reset time part for accurate day comparison
    now.setHours(0,0,0,0); 

    // 1. FILTER DATA
    const filteredData = ordersData.filter(order => {
        // Search Filter
        const textMatch = order.displayId.toLowerCase().includes(searchTerm) || order.customer.toLowerCase().includes(searchTerm);
        
        // Status Filter
        const statusMatch = statusFilter === '' || order.status === statusFilter;

        // Date Filter
        let dateMatch = true;
        if (dateFilter !== '') {
            const orderDate = new Date(order.date);
            orderDate.setHours(0,0,0,0); // Normalize time

            if (dateFilter === 'today') {
                dateMatch = orderDate.getTime() === now.getTime();
            } else if (dateFilter === 'week') {
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                dateMatch = orderDate >= oneWeekAgo && orderDate <= now;
            } else if (dateFilter === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                dateMatch = orderDate >= startOfMonth && orderDate <= endOfMonth;
            }
        }

        return textMatch && statusMatch && dateMatch;
    });

    // 2. PAGINATE DATA
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    if (currentPage > totalPages) currentPage = totalPages || 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    // 3. RENDER ROWS
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = ''; // Clear existing

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-[#8b7355]">No orders found matching your criteria.</td></tr>';
    } else {
        pageData.forEach(order => {
            const row = document.createElement('tr');
            // Add specific class for refund requested rows
            row.className = `table-row cursor-pointer ${order.status === 'refund-requested' ? 'row-refund-requested' : ''}`;
            row.setAttribute('data-order-id', order.id);
            
            // Row Click Event
            row.onclick = () => window.location.href = `/artisanOrderDetail?orderId=${order.id}`;

            // Determine Status Badge HTML
            let statusHtml = '';
            if (order.status === 'refund-requested') {
                statusHtml = `<span class="status-badge status-refund-requested"><i class="fas fa-exclamation-triangle"></i> Refund Requested</span>`;
            } else if (order.status === 'refund-declined') {
                statusHtml = `<span class="status-badge status-refund-declined">Refund Declined</span>`;
            } else if (order.status === 'refund-escalated') {
                statusHtml = `<span class="status-badge status-refund-escalated">Refund Escalated</span>`;
            } else if (order.status === 'refund-approved') {
                statusHtml = `<span class="status-badge status-refund-approved">Refund Approved</span>`;
            } else {
                statusHtml = `<span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>`;
            }

            // Determine Action Button HTML
            let actionBtn = '';
            if (order.status === 'delivered' || order.status === 'refund-escalated' || order.status === 'refund-approved') {
                actionBtn = `<button class="btn-view-details px-4 py-2 rounded-lg text-sm font-medium">View Details</button>`;
            } else if (order.status === 'refund-requested') {
                actionBtn = `<button class="btn-review-refund text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" onclick="event.stopPropagation(); window.location.href='/artisanOrderDetail?orderId=${order.id}#refund-section'"><i class="fas fa-exclamation-triangle"></i> Review Refund</button>`;
            } else {
                actionBtn = `<button class="bg-[#c17c5f] hover:bg-[#a5664d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" onclick="event.stopPropagation(); window.location.href='/artisanOrderDetail?orderId=${order.id}#status-section'">Update Status</button>`;
            }

            // Format Date for Display
            const dateDisplay = order.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            row.innerHTML = `
                <td class="px-6 py-4">
                    <span class="font-mono text-sm font-semibold text-[#5c4a3d]">${order.displayId}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-[#f5ebe0] rounded-full flex items-center justify-center">
                            <span class="text-xs font-semibold text-[#c17c5f]">${order.initials}</span>
                        </div>
                        <span class="font-medium text-[#5c4a3d]">${order.customer}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${order.img}" alt="${order.product}" class="w-12 h-12 rounded-lg object-cover" />
                        <div>
                            <p class="font-medium text-[#5c4a3d] text-sm">${order.product}</p>
                            <p class="text-xs text-[#8b7355]">Qty: ${order.qty}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="font-semibold text-[#5c4a3d]">${order.price}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-sm text-[#8b7355]">${dateDisplay}</span>
                </td>
                <td class="px-6 py-4">
                    ${statusHtml}
                </td>
                <td class="px-6 py-4" onclick="event.stopPropagation()">
                    ${actionBtn}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 4. UPDATE PAGINATION UI
    updatePaginationUI(totalRows, totalPages);
}

function updatePaginationUI(totalRows, totalPages) {
    // Update Info Text
    const infoText = document.getElementById('paginationInfo');
    if (infoText) {
        if (totalRows === 0) {
            infoText.textContent = 'No orders found';
        } else {
            const start = (currentPage - 1) * rowsPerPage + 1;
            const end = Math.min(currentPage * rowsPerPage, totalRows);
            infoText.textContent = `Showing ${start}-${end} of ${totalRows} orders`;
        }
    }

    // Update Buttons
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${currentPage === 1 ? 'border-[#e5e0d8] text-[#8b7355] opacity-50 cursor-not-allowed' : 'border-[#e5e0d8] text-[#8b7355] hover:border-[#c17c5f] hover:text-[#c17c5f]'}`;
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; updateTable(); };
    controls.appendChild(prevBtn);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        if (i === currentPage) {
            btn.className = 'px-4 py-2 bg-[#c17c5f] text-white rounded-lg font-medium';
        } else {
            btn.className = 'px-4 py-2 border border-[#e5e0d8] rounded-lg text-[#8b7355] hover:border-[#c17c5f] hover:text-[#c17c5f] transition-colors';
        }
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; updateTable(); };
        controls.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${currentPage >= totalPages || totalPages === 0 ? 'border-[#e5e0d8] text-[#8b7355] opacity-50 cursor-not-allowed' : 'border-[#e5e0d8] text-[#8b7355] hover:border-[#c17c5f] hover:text-[#c17c5f]'}`;
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    nextBtn.onclick = () => { currentPage++; updateTable(); };
    controls.appendChild(nextBtn);
}