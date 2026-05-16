// adminDashboard.js – UI helper for Admin Dashboard
// ---------------------------------------------------------------
// This script is loaded on all admin pages (adminDashboard.html and others).
// It provides:
//  • Sidebar navigation active link handling based on current URL
//  • User profile dropdown with smooth hover behavior
//  • Logout button with confirmation, session cleanup, and redirect
//  • Optional fetch utilities for admin stats (e.g., user counts)
// ---------------------------------------------------------------
(() => {
  // ---------- Helper Functions ----------
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Highlight the active sidebar link based on URL path
  function setActiveSidebarLink() {
    const path = window.location.pathname.toLowerCase();
    qsa('.sidebar-link').forEach(link => {
      link.classList.remove('active', 'text-white');
      link.classList.add('text-[#d4c5b5]');
      const href = link.getAttribute('href')?.toLowerCase() || '';
      if (href && path.includes(href.replace(/^\//, ''))) {
        link.classList.add('active');
        link.classList.remove('text-[#d4c5b5]');
        link.classList.add('text-white');
      }
    });
  }

  // User menu dropdown handling (hover + click for mobile)
  function initUserMenu() {
    const btn = qs('#userMenuButton');
    const dropdown = qs('#userMenuDropdown');
    const chevron = qs('#chevronIcon');
    const menu = qs('.user-menu');
    let hideTimeout;
    if (!btn || !dropdown || !chevron || !menu) return;

    const showMenu = () => {
      clearTimeout(hideTimeout);
      dropdown.classList.add('show');
      chevron.classList.add('rotated');
    };
    const hideMenu = () => {
      hideTimeout = setTimeout(() => {
        dropdown.classList.remove('show');
        chevron.classList.remove('rotated');
      }, 150);
    };
    menu.addEventListener('mouseenter', showMenu);
    menu.addEventListener('mouseleave', hideMenu);
    // For touch devices, toggle on click
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (dropdown.classList.contains('show')) hideMenu(); else showMenu();
    });
    // Close when clicking outside
    document.addEventListener('click', e => {
      if (!menu.contains(e.target)) hideMenu();
    });
  }

  // Logout flow – clears sessionStorage and redirects to public index
  function initLogout() {
    const logoutBtn = qs('#logoutButton');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        sessionStorage.clear();
        // Use replace so the back button does not land back on a protected page
        window.location.replace('/index');
      }
    });
  }

  // Optional: fetch admin stats (demo implementation)
  async function loadAdminStats() {
    try {
      const res = await fetch('/api/admin/stats'); // adjust endpoint as needed
      if (!res.ok) return;
      const data = await res.json();
      // Example: populate placeholders
      const totalUsersEl = qs('#total-users');
      const totalProductsEl = qs('#total-products');
      if (totalUsersEl) totalUsersEl.textContent = data.totalUsers ?? '';
      if (totalProductsEl) totalProductsEl.textContent = data.totalProducts ?? '';
    } catch (e) {
      console.warn('Failed to load admin stats', e);
    }
  }

  // ----------- Init -----------
  document.addEventListener('DOMContentLoaded', () => {
    setActiveSidebarLink();
    initUserMenu();
    initLogout();
    // Uncomment if you have an endpoint for stats
    // loadAdminStats();
  });
})();
