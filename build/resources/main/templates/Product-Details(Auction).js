document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Image Gallery Logic ---
    window.changeImage = function(thumbnail) {
        const mainImage = document.getElementById('mainImage');
        const highResUrl = thumbnail.src.replace('w=150&h=150', 'w=600&h=500');
        
        mainImage.style.opacity = '0.5'; // Brief fade effect
        setTimeout(() => {
            mainImage.src = highResUrl;
            mainImage.style.opacity = '1';
        }, 150);

        // Update active state on thumbnails
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    };

    // --- 2. Countdown Timer Logic ---
    let hours = 2, minutes = 45, seconds = 32; // Initial values from HTML data
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    setInterval(() => {
        if (seconds > 0) {
            seconds--;
        } else {
            seconds = 59;
            if (minutes > 0) {
                minutes--;
            } else {
                minutes = 59;
                if (hours > 0) hours--;
            }
        }

        // Format with leading zeros
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');

        // Anti-Sniping Simulation (DR-1): Flash red if < 30s
        if (hours === 0 && minutes === 0 && seconds < 30 && seconds > 28) {
            document.getElementById('countdown').parentElement.style.borderColor = '#ef4444';
            setTimeout(() => {
                document.getElementById('countdown').parentElement.style.borderColor = '#c17c5f';
            }, 500);
        }
    }, 1000);

    // --- 3. Bid Form Validation & Submission ---
    const bidForm = document.querySelector('form');
    const bidInput = document.getElementById('bidAmount');
    const currentBidPrice = 120.00; // Hardcoded from HTML for simulation

    bidForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bidAmount = parseFloat(bidInput.value);
        const bidderName = document.getElementById('bidderName').value.trim();

        // Validation: Bid must be higher than current
        if (!bidAmount || bidAmount <= currentBidPrice) {
            showToast(`Bid must be higher than ${currentBidPrice.toFixed(2)} BD`, 'error');
            bidInput.focus();
            return;
        }

        if (!bidderName) {
            showToast('Please enter your name', 'error');
            return;
        }

        // Simulate API Success
        showToast(`Bid of ${bidAmount.toFixed(2)} BD placed successfully!`, 'success');
        
        // Update UI to reflect new bid (Visual feedback only)
        const currentBidDisplay = document.querySelector('.bg-white.rounded-lg p-4 .text-2xl'); // Selecting the "Current Bid" box
        if(currentBidDisplay) {
            currentBidDisplay.textContent = bidAmount.toFixed(2) + ' BD';
            currentBidDisplay.style.color = '#10b981'; // Flash green
            setTimeout(() => currentBidDisplay.style.color = '#c17c5f', 1000);
        }

        bidForm.reset();
    });

    // --- 4. Utility: Toast Notification ---
    function showToast(message, type = 'info') {
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
                .toast { padding: 12px 24px; border-radius: 8px; color: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px; min-width: 250px; }
                .toast.success { background-color: #10b981; border-left: 5px solid #059669; }
                .toast.error { background-color: #dc2626; border-left: 5px solid #991b1b; }
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
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }
});
