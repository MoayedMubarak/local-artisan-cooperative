(function () {
  function getLoggedIn() {
    try {
      return sessionStorage.getItem('loggedIn') === 'true';
    } catch (e) {
      return false;
    }
  }

  function normalizeRedirectTo(redirectTo) {
    if (!redirectTo) return '/login';
    // allow full URLs or relative paths
    return redirectTo;
  }

  function getNextFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get('next');
  }

  function setNextIfMissing(next) {
    try {
      if (!sessionStorage.getItem('postLoginNext') && next) {
        sessionStorage.setItem('postLoginNext', next);
      }
    } catch (e) {
      // ignore
    }
  }

  function redirectToLogin({ redirectTo, next }) {
    const loginPath = normalizeRedirectTo(redirectTo);
    const params = new URLSearchParams();
    if (next) params.set('next', next);
    // Clear message param if present? keep it simple.
    window.location.href = params.toString()
      ? `${loginPath}?${params.toString()}`
      : loginPath;
  }

  function showLockedOverlay(message) {
    // Replace body content to block all clicks/JS-driven actions.
    document.documentElement.innerHTML = `
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login Required</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div class="max-w-xl w-full mx-4">
          <div class="bg-white rounded-2xl shadow-lg p-8 border border-[#e5e0d8]">
            <div class="text-[#c17c5f] text-4xl mb-4">🔒</div>
            <h1 class="text-2xl font-bold text-[#5c4a3d] mb-2">Login / Register Required</h1>
            <p class="text-[#8b7355] text-lg mb-6">${message || 'You need to login or register first.'}</p>
            <div class="flex flex-col sm:flex-row gap-3">
              <a href="/login" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#c17c5f] text-white font-semibold hover:bg-[#a5664d] transition-colors">Go to Login</a>
              <button id="auth-guard-redirect" class="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[#c17c5f] text-[#c17c5f] font-semibold hover:bg-[#f5ebe0] transition-colors">Continue</button>
            </div>
            <p class="text-sm text-[#8b7355] mt-4">You will be redirected to login automatically.</p>
          </div>
        </div>
      </body>
    `;

    const btn = document.getElementById('auth-guard-redirect');
    if (btn) {
      btn.addEventListener('click', function () {
        // No-op; actual redirect handled by setTimeout below.
      });
    }
  }

  function showActionBlockedToast(message) {
    if (document.getElementById('auth-guard-action-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'auth-guard-action-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '14px 20px';
    toast.style.borderRadius = '16px';
    toast.style.backgroundColor = 'rgba(34, 197, 94, 0.95)';
    toast.style.color = '#ffffff';
    toast.style.fontFamily = 'Inter, sans-serif';
    toast.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)';
    toast.style.maxWidth = '320px';
    toast.textContent = message || 'Please login or register first to perform this action.';

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 250);
    }, 2800);
  }

  window.isUserAuthenticated = function () {
    return getLoggedIn();
  };

  window.requireLoginForAction = function (message) {
    if (getLoggedIn()) return true;
    showActionBlockedToast(message || 'Please login or register first to perform this action.');
    return false;
  };

  window.initAuthGuard = function initAuthGuard(options) {
    const opts = options || {};
    const redirectTo = opts.redirectTo || '/login';
    const message = opts.message || 'Please login or register first to access this page.';

    // Allow login page / public assets.
    if (getLoggedIn()) return;

    // Preserve attempted path for after login.
    // Use exact pathname + search.
    const next = opts.next || (window.location.pathname + window.location.search);
    setNextIfMissing(getNextFromUrl() || next);

    const intendedNext = getNextFromUrl() || next;

    showLockedOverlay(message);

    // Redirect after overlay renders.
    setTimeout(function () {
      redirectToLogin({ redirectTo, next: intendedNext });
    }, 1200);
  };

  window.updateNavAuthState = function updateNavAuthState() {
    const loginWrapper = document.getElementById('login-button-wrapper');
    const userSection = document.getElementById('user-section');
    const userName = document.getElementById('nav-user-name');
    const userEmail = document.getElementById('nav-user-email');
    const userMenuBtn = document.getElementById('user-menu-button') || document.getElementById('userMenuButton') || document.querySelector('a[href="/profile"]');
    const loggedIn = getLoggedIn();
    const storedEmail = sessionStorage.getItem('userEmail');

    if (loggedIn && storedEmail) {
      // Sync with server in background
      fetch(`/api/user/me?email=${encodeURIComponent(storedEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            sessionStorage.setItem('userProfile', JSON.stringify(data.user));
            sessionStorage.setItem('userName', data.user.name);
            applyNavState(data.user);
            updateNotificationBadge();
            
            // Sync cart count from database
            fetch(`/api/cart?email=${encodeURIComponent(storedEmail)}`)
              .then(r => r.json())
              .then(cartData => {
                if (cartData.success) {
                  sessionStorage.setItem('cartCount', cartData.items.length);
                  updateCartBadge();
                }
              })
              .catch(err => console.error("Cart sync failed", err));

            // Also update any other profile images on the page (e.g. sidebar)
            document.querySelectorAll('img[alt="' + data.user.name + '"], aside img.w-14.h-14').forEach(img => {
                img.src = data.user.profilePicture;
            });
          }
        })
        .catch(err => console.error("Nav sync failed", err));

      // Initial apply from session storage
      const userProfileStr = sessionStorage.getItem('userProfile');
      if (userProfileStr) {
        try { applyNavState(JSON.parse(userProfileStr)); } catch(e) {}
      }
    } else {
      if (loginWrapper) loginWrapper.classList.remove('hidden');
      if (userSection) userSection.classList.add('hidden');
    }

    function applyNavState(profile) {
      if (loginWrapper) loginWrapper.classList.add('hidden');
      if (userSection) userSection.classList.remove('hidden');
      if (userName) userName.textContent = profile.name || 'Profile';
      if (userEmail) userEmail.textContent = profile.email || '';
      
      if (userMenuBtn) {
        const profileIcon = userMenuBtn.querySelector('i.fas.fa-user-circle');
        let profileImg = userMenuBtn.querySelector('img.nav-profile-img');
        const profilePicture = profile.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

        if (profileIcon) {
          const img = document.createElement('img');
          img.src = profilePicture;
          img.className = 'w-8 h-8 rounded-full object-cover border border-[#c17c5f] nav-profile-img';
          profileIcon.replaceWith(img);
        } else if (profileImg) {
          profileImg.src = profilePicture;
        } else {
            // Check if the button itself is an image or contains one
            const innerImg = userMenuBtn.querySelector('img');
            if (innerImg) innerImg.src = profilePicture;
        }
      }
    }
  };

  window.updateNotificationBadge = function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = parseInt(sessionStorage.getItem('notificationCount') ?? '0', 10);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  };

  window.updateCartBadge = function updateCartBadge() {
    document.querySelectorAll('.fa-shopping-cart').forEach(icon => {
      const badge = icon.parentElement?.querySelector('span');
      if (!badge) return;
      const count = parseInt(sessionStorage.getItem('cartCount') ?? '0', 10);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.updateNavAuthState();
    window.updateNotificationBadge();
    window.updateCartBadge();
  });
})();

