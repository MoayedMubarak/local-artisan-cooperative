document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Track Order Button ---
    const trackBtn = document.querySelector('button:has(.fa-truck)');
    if (trackBtn) {
        trackBtn.addEventListener('click', () => {
            // In a real app, this would open a tracking modal or redirect
            // For now, we show a toast
            showToast('Tracking details sent to your email.', 'info');
        });
    }

    // --- 2. Continue Shopping Button ---
    const shopBtn = document.querySelector('a:has(.fa-arrow-left)');
    if (shopBtn) {
        shopBtn.addEventListener('click', (e) => {
            // Just ensuring smooth navigation, though href handles it
            console.log('Navigating back to shop...');
        });
    }

    // --- 3. Utility: Toast Notification ---
    function showToast(message, type = 'info') {
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 8px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px; min-width: 250px; }
                .toast.success { background-color: #10b981; border-left: 5px solid #059669; }
                .toast.info { background-color: #2563eb; border-left: 5px solid #1d4ed8; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
            if (!document.querySelector('.toast-container')) {
                document.body.insertAdjacentHTML('afterbegin', '<div class="toast-container"></div>');
            }
        }
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }
});
