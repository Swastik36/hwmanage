document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }
    
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // Sleek mobile-friendly floating toast notification system
    function showToast(message, type = 'error') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 86px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 90%;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
            color: #fff;
            padding: 12px 18px;
            border-radius: 14px;
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            text-align: center;
            pointer-events: auto;
        `;
        toast.textContent = message;
        container.appendChild(toast);
        
        // Trigger reflow & animate in
        toast.offsetHeight; 
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        // Slide up/out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3200);
    }

    // Wishlist Toggles
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (btn.classList.contains('loading')) return;
            btn.classList.add('loading');
            
            // Visual throttle feedback
            btn.style.opacity = '0.5';
            btn.style.transform = 'scale(0.85)';
            
            const cardId = btn.dataset.cardId;
            if (!cardId) {
                btn.classList.remove('loading');
                btn.style.opacity = '';
                btn.style.transform = '';
                return;
            }
            
            try {
                const response = await fetch('/wishlist/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ card_id: parseInt(cardId) })
                });
                const data = await response.json();
                
                if (data.success) {
                    if (data.status === 'added') {
                        btn.classList.add('active');
                        showToast('Added to wishlist', 'success');
                    } else {
                        btn.classList.remove('active');
                        showToast('Removed from wishlist', 'success');
                    }
                    
                    // Update count display if it exists in the parent card elements
                    const countSpan = btn.querySelector('.w-count');
                    if (countSpan) {
                        countSpan.textContent = data.count;
                    }
                } else {
                    showToast(data.message || 'Error updating wishlist.');
                }
            } catch (err) {
                console.error('Wishlist error:', err);
                showToast('Network error. Please try again.');
            } finally {
                btn.classList.remove('loading');
                btn.style.opacity = '';
                btn.style.transform = '';
            }
        });
    });

    // Buy Card Action
    const buyBtns = document.querySelectorAll('.buy-btn');
    buyBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const cardId = btn.dataset.cardId;
            if (!cardId) return;

            // Immediate frontend button throttling
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'Buying...';
            showLoading();

            try {
                const response = await fetch('/buy_card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ card_id: parseInt(cardId) })
                });
                const data = await response.json();

                if (data.success) {
                    showToast('Purchase successful!', 'success');
                    
                    // Update global balance counter
                    const balanceVals = document.querySelectorAll('.balance-val');
                    balanceVals.forEach(el => {
                        el.textContent = `$${data.new_balance.toFixed(2)}`;
                    });

                    // Update Card visual state to Out of Stock
                    const cardItem = btn.closest('.card-item');
                    if (cardItem) {
                        cardItem.classList.add('out-of-stock');
                        btn.textContent = 'Owned';
                        btn.disabled = true;
                        
                        // Add an owner badge underneath the card name
                        const cardNameContainer = cardItem.querySelector('.card-name');
                        if (cardNameContainer) {
                            let ownerBadge = cardItem.querySelector('.owner-badge');
                            if (!ownerBadge) {
                                ownerBadge = document.createElement('span');
                                ownerBadge.className = 'owner-badge';
                                cardNameContainer.after(ownerBadge);
                            }
                            // Get current logged in username from body attribute or session
                            const currentUsername = document.body.dataset.username || 'You';
                            ownerBadge.textContent = `Owned by ${currentUsername}`;
                        }
                    }
                } else {
                    showToast(data.message || 'Purchase failed.');
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (err) {
                console.error('Buy error:', err);
                showToast('Network error. Please try again.');
                btn.disabled = false;
                btn.textContent = originalText;
            } finally {
                hideLoading();
            }
        });
    });

    // Sell Card Action
    const sellBtns = document.querySelectorAll('.sell-btn');
    sellBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const cardId = btn.dataset.cardId;
            if (!cardId) return;

            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'Selling...';
            showLoading();

            try {
                const response = await fetch('/sell_card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ card_id: parseInt(cardId) })
                });
                const data = await response.json();

                if (data.success) {
                    showToast('Card sold successfully!', 'success');
                    
                    // Update balance counters
                    const balanceVals = document.querySelectorAll('.balance-val');
                    balanceVals.forEach(el => {
                        el.textContent = `$${data.new_balance.toFixed(2)}`;
                    });

                    // Smooth fade out and remove card from portfolio page
                    const cardItem = btn.closest('.card-item');
                    if (cardItem) {
                        cardItem.style.transition = 'all 0.3s ease';
                        cardItem.style.opacity = '0';
                        cardItem.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            cardItem.remove();
                            // Check if grid is empty
                            const grid = document.querySelector('.card-grid');
                            if (grid && grid.children.length === 0) {
                                grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); margin-top: 20px;">You do not own any cards yet.</p>';
                            }
                        }, 300);
                    }
                } else {
                    showToast(data.message || 'Sale failed.');
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (err) {
                console.error('Sell error:', err);
                showToast('Network error. Please try again.');
                btn.disabled = false;
                btn.textContent = originalText;
            } finally {
                hideLoading();
            }
        });
    });

    // Claim Starting Cards Action
    const claimBtn = document.getElementById('claim-cards-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            claimBtn.disabled = true;
            showLoading();

            try {
                const response = await fetch('/claim_starting_cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();

                if (data.success) {
                    showToast(data.message || 'Starting cards unlocked!', 'success');
                    // Delay reload by 1.2s to let the user read the success toast
                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                } else {
                    showToast(data.message || 'Claim failed.');
                    claimBtn.disabled = false;
                }
            } catch (err) {
                console.error('Claim error:', err);
                showToast('Network error. Please try again.');
                claimBtn.disabled = false;
            } finally {
                hideLoading();
            }
        });
    }

    // Theme Toggle click handler
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateChartsTheme(isLight);
        });
    }

    function updateChartsTheme(isLight) {
        const textColor = isLight ? '#4b5563' : '#6b7280';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)';
        
        if (window.marketChart) {
            const chart = window.marketChart;
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.update();
        }
        
        if (window.sparklineCharts && window.sparklineCharts.length > 0) {
            window.sparklineCharts.forEach(chart => {
                chart.options.scales.y.grid.color = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';
                chart.options.scales.y.ticks.color = isLight ? '#4b5563' : '#9ca3af';
                chart.update();
            });
        }
    }
});
