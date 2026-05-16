document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initUserMenu();
    initFilters();
    initNavigation();
    initPagination();
});

// --- GLOBAL STATE ---
let currentPage = 1;
const rowsPerPage = 5; // You can change this number to show more/less rows per page

// --- 1. Sidebar Navigation ---
function initSidebar() {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            links.forEach(l => {
                l.classList.remove('active', 'text-white');
                l.classList.add('text-[#d4c5b5]');
            });
            this.classList.add('active', 'text-white');
            this.classList.remove('text-[#d4c5b5]');
        });
    });
}

// --- 2. User Profile Dropdown ---
function initUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const chevronIcon = document.getElementById('chevronIcon');
    const logoutButton = document.getElementById('logoutButton');
    let hideTimeout;

    if (userMenu && userMenuButton) {
        const showMenu = () => {
            clearTimeout(hideTimeout);
            userMenuDropdown.classList.add('show');
            if(chevronIcon) chevronIcon.classList.add('rotated');
        };
        const hideMenu = () => {
            hideTimeout = setTimeout(() => {
                userMenuDropdown.classList.remove('show');
                if(chevronIcon) chevronIcon.classList.remove('rotated');
            }, 150);
        };
        userMenu.addEventListener('mouseenter', showMenu);
        userMenu.addEventListener('mouseleave', hideMenu);
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.contains('show') ? hideMenu() : showMenu();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/index'; 
            }
        });
    }
}

// --- 3. Client-Side Filtering (Search, Status, AND DATE) ---
function initFilters() {
    const searchInput = document.querySelector('input[placeholder="Search by order ID or customer name..."]');
    const statusSelect = document.querySelector('.bg-white.rounded-xl.card-shadow.p-4.mb-6 select:nth-of-type(1)');
    // Select the Date dropdown (it is the second select in the filter div)
    const dateSelect = document.querySelector('.bg-white.rounded-xl.card-shadow.p-4.mb-6 select:nth-of-type(2)');

    // Add event listeners
    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; updateTable(); });
    if (statusSelect) statusSelect.addEventListener('change', () => { currentPage = 1; updateTable(); });
    if (dateSelect) dateSelect.addEventListener('change', () => { currentPage = 1; updateTable(); });
}

// --- HELPER: Render Table (Filters + Pagination Logic) ---
function updateTable() {
    const searchInput = document.querySelector('input[placeholder="Search by order ID or customer name..."]');
    const statusSelect = document.querySelector('.bg-white.rounded-xl.card-shadow.p-4.mb-6 select:nth-of-type(1)');
    const dateSelect = document.querySelector('.bg-white.rounded-xl.card-shadow.p-4.mb-6 select:nth-of-type(2)');
    const allRows = Array.from(document.querySelectorAll('tbody tr.table-row'));

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const dateFilter = dateSelect ? dateSelect.value : '';

    // 1. FILTERING LOGIC
    const filteredRows = allRows.filter(row => {
        const textContent = row.textContent.toLowerCase();
        const statusBadge = row.querySelector('.status-badge');
        let rowStatus = '';

        // Get Status
        if (statusBadge) {
            statusBadge.classList.forEach(cls => {
                if (cls.startsWith('status-')) rowStatus = cls.replace('status-', '');
            });
        }

        // Get Date (Assuming Date is in the 5th column index [4])
        // Format in HTML: "Jan 15, 2024"
        const dateCell = row.cells[4]; 
        const dateStr = dateCell ? dateCell.textContent.trim() : '';
        const rowDate = new Date(dateStr);
        const now = new Date();

        let matchesDate = true;

        if (dateFilter !== '' && dateStr) {
            if (dateFilter === 'today') {
                matchesDate = rowDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                matchesDate = rowDate >= oneWeekAgo && rowDate <= now;
            } else if (dateFilter === 'month') {
                matchesDate = rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear();
            }
        }

        const matchesSearch = textContent.includes(searchTerm);
        const matchesStatus = statusFilter === '' || rowStatus === statusFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    // 2. PAGINATION LOGIC
    // Hide all rows first
    allRows.forEach(row => row.style.display = 'none');

    const totalRows = filteredRows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // Ensure current page is valid
    if (currentPage > totalPages) currentPage = totalPages || 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    // Show only the rows for the current page
    const rowsToShow = filteredRows.slice(startIndex, endIndex);
    rowsToShow.forEach(row => row.style.display = '');

    // 3. UPDATE UI TEXT ("Showing 1-5 of 10")
    const infoText = document.querySelector('.flex.items-center.justify-between.px-6.py-4 p');
    if (infoText && totalRows > 0) {
        const showStart = totalRows === 0 ? 0 : startIndex + 1;
        const showEnd = Math.min(endIndex, totalRows);
        infoText.textContent = `Showing ${showStart}-${showEnd} of ${totalRows} orders`;
    } else if (infoText) {
        infoText.textContent = `No orders found`;
    }

    // 4. UPDATE BUTTON STATES
    updatePaginationButtons(totalPages);
}

// --- 4. NAVIGATION LOGIC ---
function extractOrderId(row) {
    const dataId = row.getAttribute('data-order-id');
    if (dataId) return dataId;
    const firstCell = row.querySelector('td:first-child');
    if (!firstCell) return null;
    const codeText = firstCell.textContent.trim();
    const digits = codeText.replace(/\D/g, '');
    return digits || null;
}

function initNavigation() {
    const rows = document.querySelectorAll('tbody tr.table-row');

    rows.forEach(row => {
        // 1. Handle Row Click
        row.addEventListener('click', () => {
            const orderId = extractOrderId(row);
            if (!orderId) return;
            window.location.href = `/artisanOrderDetail?orderId=${orderId}`;
        });

        // 2. Handle "Update Status" Button
        const updateBtn = row.querySelector('button');
        if (updateBtn && updateBtn.textContent.trim() === 'Update Status') {
            updateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = extractOrderId(row);
                if (!orderId) return;
                window.location.href = `/artisanOrderDetail?orderId=${orderId}#status-section`;
            });
        }

        // 3. Handle "Review Refund" Button
        const refundBtn = row.querySelector('.btn-review-refund');
        if (refundBtn) {
            refundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = extractOrderId(row);
                if (!orderId) return;
                window.location.href = `/artisanOrderDetail?orderId=${orderId}#refund-section`;
            });
        }

        // 4. Handle "View Details" Button
        const detailsBtn = row.querySelector('.btn-view-details');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = extractOrderId(row);
                if (!orderId) return;
                window.location.href = `/artisanOrderDetail?orderId=${orderId}`;
            });
        }
    });
}

// --- 5. PAGINATION LOGIC (Functional) ---
function initPagination() {
    const buttons = document.querySelectorAll('.flex.items-center.gap-2 button');

    // Initial render
    updateTable();

    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const btnText = this.textContent.trim();

            if (btnText === 'Previous') {
                if (currentPage > 1) {
                    currentPage--;
                    updateTable();
                }
            } else if (btnText === 'Next') {
                // We need to check total pages dynamically inside updateTable, 
                // but here we just increment and let updateTable clamp it if needed.
                currentPage++; 
                updateTable();
            } else {
                // It's a number button
                const pageNum = parseInt(btnText);
                if (!isNaN(pageNum)) {
                    currentPage = pageNum;
                    updateTable();
                }
            }
        });
    });
}

function updatePaginationButtons(totalPages) {
    const buttons = document.querySelectorAll('.flex.items-center.gap-2 button');

    buttons.forEach(btn => {
        const btnText = btn.textContent.trim();

        // Reset Styles
        btn.classList.remove('bg-[#c17c5f]', 'text-white', 'font-medium', 'btn-disabled', 'opacity-50', 'cursor-not-allowed');
        btn.disabled = false;

        // 1. Handle Number Buttons
        if (!btnText.includes('Previous') && !btnText.includes('Next')) {
            const pageNum = parseInt(btnText);

            // Active State
            if (pageNum === currentPage) {
                btn.classList.add('bg-[#c17c5f]', 'text-white', 'font-medium');
                btn.classList.remove('border', 'border-[#e5e0d8]', 'text-[#8b7355]');
            } else {
                // Inactive State
                if (!btn.classList.contains('border')) {
                    btn.classList.add('border', 'border-[#e5e0d8]', 'text-[#8b7355]');
                }
                // Hide number buttons that don't exist (optional, keeps UI clean)
                if (pageNum > totalPages) {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = 'block'; // Or inline-block depending on CSS
                }
            }
        }

        // 2. Handle Previous Button
        if (btnText === 'Previous') {
            if (currentPage === 1) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        // 3. Handle Next Button
        if (btnText === 'Next') {
            if (currentPage >= totalPages || totalPages === 0) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    });
}