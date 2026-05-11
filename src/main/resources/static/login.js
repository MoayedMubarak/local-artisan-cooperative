// ============================================================
// login.js — ArtsyVibe Login / Register Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------
    // 1. Tab switching (Login ↔ Register)
    // ----------------------------------------------------------
    window.switchTab = function (tab) {
        const loginForm    = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const tabBtns      = document.querySelectorAll('.tab-btn');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            tabBtns[0].classList.add('active');
            tabBtns[1].classList.remove('active');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            tabBtns[0].classList.remove('active');
            tabBtns[1].classList.add('active');
        }
    };

    // ----------------------------------------------------------
    // 2. Customer / Artisan type toggle
    // ----------------------------------------------------------
    window.switchType = function (type) {
        const customerForm = document.getElementById('customer-form');
        const artisanForm  = document.getElementById('artisan-form');
        const typePills    = document.querySelectorAll('.type-pill');

        if (type === 'customer') {
            customerForm.classList.remove('hidden');
            artisanForm.classList.add('hidden');
            typePills[0].classList.add('active');
            typePills[1].classList.remove('active');
        } else {
            customerForm.classList.add('hidden');
            artisanForm.classList.remove('hidden');
            typePills[0].classList.remove('active');
            typePills[1].classList.add('active');
        }
    };

    // ----------------------------------------------------------
    // 3. Custom "Remember me" checkbox visual
    // ----------------------------------------------------------
    initCustomCheckboxes();

    // Navigation from the login page is unrestricted —
    // protected pages redirect to login themselves via initAuthGuard.

    // ----------------------------------------------------------
    // 5. Login form submission
    // ----------------------------------------------------------
    window.handleLogin = function (event) {
        event.preventDefault();
        const form     = event.target;
        const email    = form.querySelector('input[type="email"]')?.value.trim();
        const password = form.querySelector('input[type="password"]')?.value;

        if (!email || !password) {
            showFormError(form, 'Please fill in all fields.');
            return;
        }

        if (!isValidEmail(email)) {
            showFormError(form, 'Please enter a valid email address.');
            return;
        }

        // Simulate login — replace with real API call
        showButtonLoading(form.querySelector('button[type="submit"]'), 'Logging in…');

        setTimeout(() => {
            // Store minimal session data
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userName', 'John Doe');

            // Redirect back to the originally requested page (if any)
            const url = new URL(window.location.href);
            const next = url.searchParams.get('next') || sessionStorage.getItem('postLoginNext');
            sessionStorage.removeItem('postLoginNext');

            window.location.href = next || '/index';
        }, 1200);
    };

    // ----------------------------------------------------------
    // 5. Customer registration form submission
    // ----------------------------------------------------------
    window.handleRegister = function (event) {
        event.preventDefault();
        const form = event.target;

        // Determine which form is active
        const isArtisan = form.id === 'artisan-form';

        const inputs    = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
        const email     = form.querySelector('input[type="email"]')?.value.trim();
        const passwords = form.querySelectorAll('input[type="password"]');

        // Basic validation
        for (const input of inputs) {
            if (input.required && !input.value.trim()) {
                showFormError(form, 'Please fill in all required fields.');
                input.focus();
                return;
            }
        }

        if (!isValidEmail(email)) {
            showFormError(form, 'Please enter a valid email address.');
            return;
        }

        // Password match check (customer form has confirm password)
        if (!isArtisan && passwords.length === 2) {
            if (passwords[0].value !== passwords[1].value) {
                showFormError(form, 'Passwords do not match.');
                passwords[1].focus();
                return;
            }
        }

        if (isValidPasswordStrength(passwords[0].value) === false) {
            showFormError(form, 'Password must be at least 8 characters.');
            passwords[0].focus();
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        showButtonLoading(submitBtn, isArtisan ? 'Sending request…' : 'Creating account…');

        setTimeout(() => {
            if (isArtisan) {
                showToast('Your artisan account request has been submitted for review!', 'success');
                resetButtonLoading(submitBtn, 'Send Request to Create Artisan Account');
                form.reset();
            } else {
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                showToast('Account created! Welcome to ArtsyVibe.', 'success');

                // Redirect back to the originally requested page (if any)
                setTimeout(() => {
                    const url = new URL(window.location.href);
                    const next = url.searchParams.get('next') || sessionStorage.getItem('postLoginNext');
                    sessionStorage.removeItem('postLoginNext');
                    window.location.href = next || '/index';
                }, 1500);
            }
        }, 1500);
    };

    // ----------------------------------------------------------
    // 6. File upload drag-and-drop areas
    // ----------------------------------------------------------
    document.querySelectorAll('.border-dashed').forEach(area => {
        area.addEventListener('click', () => {
            area.querySelector('input[type="file"]')?.click();
        });

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('border-[#c17c5f]', 'bg-[#faf9f6]');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('border-[#c17c5f]', 'bg-[#faf9f6]');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('border-[#c17c5f]', 'bg-[#faf9f6]');
            const fileInput = area.querySelector('input[type="file"]');
            if (fileInput && e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileLabel(area, e.dataTransfer.files[0].name);
            }
        });

        const fileInput = area.querySelector('input[type="file"]');
        fileInput?.addEventListener('change', () => {
            if (fileInput.files.length) {
                updateFileLabel(area, fileInput.files[0].name);
            }
        });
    });

    // ----------------------------------------------------------
    // 7. Pre-fill from URL params (e.g. ?tab=register)
    // ----------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') {
        switchTab('register');
    }
});

// ============================================================
// Helpers
// ============================================================

function initCustomCheckboxes() {
    document.querySelectorAll('.Remember-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleCheckboxVisual(this);
        });
    });
}

function initLoginPageNavigationGuard() {
    const loggedIn = sessionStorage.getItem('loggedIn') === 'true';
    if (loggedIn) return;

    // Public pages — always accessible without login
    const publicPaths = ['/', '/products', '/auctions', '/about', '/contact'];

    function isPublicPath(href) {
        try {
            const url = new URL(href, window.location.origin);
            // Allow auth flow pages
            if (/login|forget(?:[-_]password)?|forgot/i.test(url.pathname)) return true;
            // Allow exact public paths
            return publicPaths.some(p => url.pathname === p || url.pathname.startsWith(p + '/'));
        } catch {
            return false;
        }
    }

    function showLoginRequiredToast(message) {
        if (document.getElementById('login-page-blocker-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'login-page-blocker-toast';
        toast.className = 'fixed bottom-6 left-1/2 z-50 max-w-xl w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-[#e5e0d8] bg-white p-4 text-[#5c4a3d] shadow-xl';
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">⚠️</div>
                <div>
                    <h2 class="font-semibold text-lg">Login Required</h2>
                    <p class="text-sm text-[#8b7355]">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3800);
    }

    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        // Always allow navigation to public pages
        if (isPublicPath(href)) return;

        event.preventDefault();
        showLoginRequiredToast('You need to login or register first to access this page.');
    }, true);
}

function toggleCheckboxVisual(checkbox) {
    const icon   = checkbox.parentElement.querySelector('.checkbox-icon');
    const visual = checkbox.parentElement.querySelector('div');
    if (checkbox.checked) {
        if (icon) icon.style.opacity = '1';
        visual?.classList.add('bg-[#c17c5f]', 'border-[#c17c5f]');
    } else {
        if (icon) icon.style.opacity = '0';
        visual?.classList.remove('bg-[#c17c5f]', 'border-[#c17c5f]');
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPasswordStrength(password) {
    return password.length >= 8;
}

function showFormError(form, message) {
    // Remove existing error
    form.querySelector('.form-error')?.remove();

    const div = document.createElement('div');
    div.className = 'form-error text-red-500 text-sm mt-2 text-center';
    div.textContent = message;
    form.querySelector('button[type="submit"]')?.before(div);

    setTimeout(() => div.remove(), 4000);
}

function showButtonLoading(btn, text) {
    if (!btn) return;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
}

function resetButtonLoading(btn, text) {
    if (!btn) return;
    btn.textContent = text ?? btn.dataset.originalText ?? 'Submit';
    btn.disabled = false;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
}

function updateFileLabel(area, filename) {
    const para = area.querySelector('p');
    if (para) para.textContent = `Selected: ${filename}`;
}

function showToast(message, type = 'info') {
    document.getElementById('av-toast')?.remove();
    const colours = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-[#c17c5f]' };
    const toast = document.createElement('div');
    toast.id = 'av-toast';
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg ${colours[type]}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
