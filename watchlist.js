/**
 * ============================================================================
 * CRYPTOVERSE – WATCHLIST MANAGEMENT MODULE (watchlist.js)
 * ============================================================================
 * This script powers the dedicated My Watchlist page (watchlist.html).
 * It loads saved coin items from Local Storage, updates their live prices from
 * CoinGecko API, renders interactive cards, and handles item removal.
 * 
 * Written in beginner-friendly ES6+ JavaScript with clear documentation.
 * ============================================================================
 */

/**
 * ============================================================================
 * 1. INITIALIZE WATCHLIST PAGE ON DOM LOAD
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', async () => {
    const watchlistContainer = document.getElementById('watchlist-cards-container');
    if (!watchlistContainer) return; // Exit if not on watchlist.html page

    console.log('⭐ Watchlist Page Initializing...');

    // 1. Load and Render Watchlist Items
    await renderWatchlistPage();

    // 2. Initialize Clear All Button
    initClearWatchlistButton();
});

/**
 * ============================================================================
 * 2. RENDER WATCHLIST ITEMS WITH LIVE DATA SYNC
 * ============================================================================
 */
async function renderWatchlistPage() {
    const container = document.getElementById('watchlist-cards-container');
    const emptyState = document.getElementById('watchlist-empty-state');
    const clearBtn = document.getElementById('clear-watchlist-btn');

    if (!container || !emptyState) return;


    // Retrieve saved items from localStorage using global utility in app.js
    const list = getWatchlist();

    if (!list || list.length === 0) {
        // Watchlist is empty -> Display empty state banner
        container.innerHTML = '';
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (clearBtn) clearBtn.classList.add('hidden');
        return;
    }

    // Watchlist has items -> Hide empty state and show grid
    emptyState.classList.add('hidden');
    container.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');

    // Show temporary loading shimmer while syncing live prices
    container.innerHTML = `
        <div class="glass-card tool-card skeleton-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short font-orbitron"></div>
        </div>
        <div class="glass-card tool-card skeleton-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short font-orbitron"></div>
        </div>
    `;

    // Attempt to sync live prices from market API
    let liveMarketMap = {};
    try {
        if (typeof CryptoAPI !== 'undefined') {
            const marketCoins = await CryptoAPI.getMarketCoins();
            if (marketCoins) {
                marketCoins.forEach(c => {
                    liveMarketMap[c.id] = c;
                });
            }
        }
    } catch (e) {
        console.warn('Could not sync live prices for watchlist, using stored values.', e);
    }

   // Render updated cards
console.log("Total Watchlist:", list.length);
console.log(list);

container.innerHTML = list.map(item => {

    console.log(item.name);

    // Use synced live price if available, else fallback to stored price
    const liveCoin = liveMarketMap[item.id];
    const price = liveCoin ? liveCoin.current_price : (item.current_price || 0);
    const change = liveCoin
        ? liveCoin.price_change_percentage_24h
        : (item.price_change_percentage_24h || 0);

    const isPos = change >= 0;
    const colorClass = isPos ? 'text-green' : 'text-red';
    const arrow = isPos ? 'fa-arrow-up' : 'fa-arrow-down';

    return `
        <div class="glass-card tool-card" style="position: relative; display: flex; flex-direction: column; justify-content: space-between;">

            <div>

                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">

                    <div class="coin-identity">

                        <img src="${item.image || 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'}"
                             alt="${item.name}"
                             class="coin-avatar"
                             style="width:44px;height:44px;">

                        <div>
                            <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-white);">
                                ${item.name}
                            </h3>

                            <span class="badge badge-primary">
                                ${item.symbol.toUpperCase()}
                            </span>
                        </div>

                    </div>

                    <button
                        class="delete-icon-btn"
                        onclick="removeFromWatchlistPage('${item.id}','${item.name.replace(/'/g, "")}')">

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                </div>

                <div style="margin-bottom:24px;">

                    <span style="font-size:.85rem;color:var(--color-gray);display:block;margin-bottom:4px;">
                        Live Market Value:
                    </span>

                    <div class="font-orbitron"
                         style="font-size:1.8rem;font-weight:800;color:var(--color-white);">

                        $${price.toLocaleString(undefined,{
                            minimumFractionDigits:2,
                            maximumFractionDigits:price < 1 ? 6 : 2
                        })}

                    </div>

                    <div class="${colorClass} font-orbitron"
                         style="font-size:.95rem;font-weight:600;margin-top:6px;">

                        <i class="fa-solid ${arrow}"></i>
                        ${Math.abs(change).toFixed(2)}% (24H)

                    </div>

                </div>

            </div>

            <div style="padding-top:16px;border-top:1px solid var(--glass-border);display:flex;gap:12px;">

                <a href="coin.html?id=${item.id}"
                   class="btn btn-primary full-width"
                   style="text-align:center;">

                    <i class="fa-solid fa-chart-line btn-icon-left"></i>

                    <span>Analyze Trajectory</span>

                </a>

            </div>

        </div>
    `;

}).join('');

    // Animate cards entering with GSAP
    if (typeof gsap !== 'undefined') {
        gsap.from('#watchlist-cards-container .tool-card', {
            scale: 0.9,
            opacity: 0,
            stagger: 0.15,
            duration: 0.5,
            ease: 'back.out(1.5)'
        });
    }
}

/**
 * ============================================================================
 * 3. REMOVE SPECIFIC ITEM FROM WATCHLIST PAGE
 * ============================================================================
 */
window.removeFromWatchlistPage = function(coinId, coinName) {
    let list = getWatchlist();
    const updatedList = list.filter(item => item.id !== coinId);

    // Save to storage
    try {
        localStorage.setItem('cryptoverse_watchlist', JSON.stringify(updatedList));
        updateWatchlistBadge();
        showToast(`Removed ${coinName} from Watchlist`, 'info');
        // Re-render grid immediately
        renderWatchlistPage();
    } catch (e) {
        console.error('Failed to update watchlist', e);
    }
};

/**
 * ============================================================================
 * 4. CLEAR ALL BUTTON CONTROLLER
 * ============================================================================
 */
function initClearWatchlistButton() {
    const clearBtn = document.getElementById('clear-watchlist-btn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved favorite coins from your Watchlist?')) {
            localStorage.removeItem('cryptoverse_watchlist');
            updateWatchlistBadge();
            showToast('Cleared all coins from Watchlist', 'info');
            renderWatchlistPage();
        }
    });
}
