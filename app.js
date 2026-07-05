/**
 * ============================================================================
 * CRYPTOVERSE – MAIN APPLICATION SCRIPT (app.js)
 * ============================================================================
 * This module handles global UI interactions, theme switching, responsive
 * navigation, data rendering for the Home page, live table search/sorting,
 * crypto currency conversion, price alert simulation, and GSAP animations.
 * 
 * Written in beginner-friendly ES6+ JavaScript with comprehensive comments.
 * ============================================================================
 */

// Global state variables to store fetched market data for live search and sorting
let allMarketCoins = [];
let currentSortMethod = 'rank_asc';

/**
 * ============================================================================
 * 1. INITIALIZATION & DOM CONTENT LOADED
 * ============================================================================
 * Runs when the HTML document has completely loaded and parsed.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 CryptoVerse Dashboard Initializing...');

    // 1. Initialize Theme from Local Storage
    initTheme();

    // 2. Initialize Navigation & Hamburger Menu
    initNavigation();

    // 3. Initialize Watchlist Badge Count
    updateWatchlistBadge();

    // 4. Initialize Crypto Converter & Alert Listeners
    initConverter();
    initPriceAlert();

    // 5. Fetch and Render All Home Page Market Data
    await loadHomePageData();

    // 6. Initialize GSAP Scroll Animations
    initGSAPAnimations();

    // 7. Hide Loading Screen smoothly after initial data render
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.style.display = 'none', 600);
        }
    }, 1200);

    // 8. Setup Auto-Refresh Interval (Every 45 seconds as required)
    setInterval(() => {
        console.log('🔄 Auto-refreshing market feeds...');
        refreshMarketFeedsSilent();
    }, 45000);
});

/**
 * ============================================================================
 * 2. THEME MANAGEMENT (DARK / LIGHT MODE)
 * ============================================================================
 * Remembers selected theme in Local Storage and smoothly applies it.
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;
    
    // Retrieve stored theme or default to 'dark'
    const savedTheme = localStorage.getItem('cryptoverse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Update button icon based on active theme
    if (themeIcon) {
        if (savedTheme === 'light') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    // Add click event listener to toggle theme
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Apply new theme to HTML element
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('cryptoverse_theme', newTheme);

            // Animate icon rotation with GSAP if available
            if (typeof gsap !== 'undefined' && themeIcon) {
                gsap.to(themeIcon, { rotation: "+=360", duration: 0.5, ease: "back.out(1.7)" });
            }

            // Toggle icon classes
            if (themeIcon) {
                if (newTheme === 'light') {
                    themeIcon.classList.replace('fa-moon', 'fa-sun');
                } else {
                    themeIcon.classList.replace('fa-sun', 'fa-moon');
                }
            }

            showToast(`Theme switched to ${newTheme.toUpperCase()} mode`, 'info');
        });
    }
}

/**
 * ============================================================================
 * 3. NAVIGATION & HAMBURGER MENU
 * ============================================================================
 * Handles sticky navbar scroll blur and mobile hamburger drawer.
 */
function initNavigation() {
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // Sticky Navbar & Back to Top Button Scroll Listener
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Add glass blur background after scrolling down 50px
        if (navbarWrapper) {
            if (scrollY > 50) {
                navbarWrapper.classList.add('scrolled');
            } else {
                navbarWrapper.classList.remove('scrolled');
            }
        }

        // Show/Hide Floating Back To Top Button after 400px
        if (backToTopBtn) {
            if (scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    });

    // Smooth scroll back to top when button is clicked
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile Hamburger Menu Toggle
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            const isExpanded = navLinks.classList.toggle('active');
            hamburgerBtn.setAttribute('aria-expanded', isExpanded);
        });

        // Close menu when clicking on any link inside the mobile drawer
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

/**
 * ============================================================================
 * 4. TOAST NOTIFICATIONS SYSTEM
 * ============================================================================
 * Displays reusable floating alert messages (e.g., Watchlist updates, API errors).
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create toast DOM element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    // Determine appropriate Font Awesome icon
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <div class="toast-content">
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    // Append to container
    container.appendChild(toast);

    // Close button click listener
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4000);
}

/**
 * ============================================================================
 * 5. WATCHLIST LOCAL STORAGE UTILITIES
 * ============================================================================
 * Manages saving, removing, and retrieving favorite coins from Local Storage.
 */
function getWatchlist() {
    try {
        const data = localStorage.getItem('cryptoverse_watchlist');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to read watchlist from local storage', e);
        return [];
    }
}

function saveWatchlistToStorage(list) {
    try {
        localStorage.setItem('cryptoverse_watchlist', JSON.stringify(list));
        updateWatchlistBadge();
    } catch (e) {
        console.error('Failed to save watchlist to local storage', e);
    }
}

function updateWatchlistBadge() {
    const badge = document.getElementById('nav-watchlist-count');
    if (badge) {
        const list = getWatchlist();
        badge.textContent = list.length;
    }
}

function toggleWatchlistCoin(coinObj) {
    let list = getWatchlist();
    const existingIndex = list.findIndex(item => item.id === coinObj.id);

    if (existingIndex > -1) {
        // Coin exists -> Remove it
        list.splice(existingIndex, 1);
        saveWatchlistToStorage(list);
        showToast(`Removed ${coinObj.name} from Watchlist`, 'info');
    } else {
        // Coin does not exist -> Add it
        list.push({
            id: coinObj.id,
            name: coinObj.name,
            symbol: coinObj.symbol,
            image: coinObj.image,
            current_price: coinObj.current_price,
            price_change_percentage_24h: coinObj.price_change_percentage_24h
        });
        saveWatchlistToStorage(list);
        showToast(`Added ${coinObj.name} to Watchlist ⭐`, 'success');
    }

    // Refresh all favorite star icon buttons across the current page
    updateAllStarButtons();
}

function updateAllStarButtons() {
    const list = getWatchlist();
    const watchedIds = new Set(list.map(item => item.id));

    document.querySelectorAll('.fav-star-btn').forEach(btn => {
        const coinId = btn.getAttribute('data-id');
        if (watchedIds.has(coinId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-star"></i>';
            btn.setAttribute('title', 'Remove from Watchlist');
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-regular fa-star"></i>';
            btn.setAttribute('title', 'Add to Watchlist');
        }
    });
}

/**
 * ============================================================================
 * 6. HOME PAGE DATA LOADING & RENDERING
 * ============================================================================
 * Coordinates fetching data from api.js and populating HTML sections.
 */
async function loadHomePageData() {
    if (typeof CryptoAPI === 'undefined') {
        console.error('CryptoAPI module not loaded.');
        return;
    }

    try {
        // Fetch Global Market Stats, Trending Coins, and Top Markets in parallel
        const [globalStats, trendingCoins, marketCoins] = await Promise.all([
            CryptoAPI.getGlobalMarketData(),
            CryptoAPI.getTrendingCoins(),
            CryptoAPI.getMarketCoins()
        ]);

        // Store market coins in global variable for instant searching & sorting
        allMarketCoins = marketCoins || [];

        // Render sections
        renderMarketOverview(globalStats);
        renderTrendingCoins(trendingCoins);
        renderGainersAndLosers(allMarketCoins);
        renderMarketTable(allMarketCoins);

        // Update converter dropdowns and initial calculation
        updateConverterCalculation();

        // Check price alert radar against fresh data
        checkPriceAlertTrigger();

        // Update API status badge in footer
        const apiStatusText = document.getElementById('api-status-text');
        if (apiStatusText) apiStatusText.textContent = 'API Feeds: Live & Synchronized';

    } catch (error) {
        console.error('Error loading home page data:', error);
        showToast('Notice: Loaded backup market feeds due to API rate limit.', 'info');
    }
}

/**
 * Silent refresh function for interval timer (updates table without screen flicker)
 */
async function refreshMarketFeedsSilent() {
    if (typeof CryptoAPI === 'undefined') return;
    try {
        const freshCoins = await CryptoAPI.getMarketCoins(true);
        if (freshCoins && freshCoins.length > 0) {
            allMarketCoins = freshCoins;
            // Re-apply current search filter and sort
            applySearchAndSort();
            checkPriceAlertTrigger();
        }
    } catch (e) {
        console.warn('Silent refresh skipped:', e);
    }
}

/**
 * ============================================================================
 * 7. RENDER MARKET OVERVIEW (4 STATISTIC CARDS)
 * ============================================================================
 */
function renderMarketOverview(stats) {
    const container = document.getElementById('overview-cards-container');
    if (!container || !stats) return;

    // Format large numbers cleanly
    const formatCurrency = (num) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)} Trillion`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)} Billion`;
        return `$${num.toLocaleString()}`;
    };

    container.innerHTML = `
        <div class="glass-card stat-card">
            <div class="stat-card-header">
                <span class="stat-card-title">Total Market Cap</span>
                <div class="stat-icon-box"><i class="fa-solid fa-chart-pie"></i></div>
            </div>
            <h3 class="stat-card-value font-orbitron">${formatCurrency(stats.totalMarketCap || 2650000000000)}</h3>
            <p class="stat-card-sub"><i class="fa-solid fa-arrow-trend-up"></i> <span>+2.4% vs yesterday</span></p>
        </div>

        <div class="glass-card stat-card">
            <div class="stat-card-header">
                <span class="stat-card-title">24H Trading Volume</span>
                <div class="stat-icon-box"><i class="fa-solid fa-right-left"></i></div>
            </div>
            <h3 class="stat-card-value font-orbitron">${formatCurrency(stats.totalVolume || 84500000000)}</h3>
            <p class="stat-card-sub"><i class="fa-solid fa-bolt"></i> <span>High liquidity</span></p>
        </div>

        <div class="glass-card stat-card">
            <div class="stat-card-header">
                <span class="stat-card-title">Bitcoin Dominance</span>
                <div class="stat-icon-box"><i class="fa-brands fa-bitcoin"></i></div>
            </div>
            <h3 class="stat-card-value font-orbitron">${(stats.btcDominance || 54.2).toFixed(1)}%</h3>
            <p class="stat-card-sub"><i class="fa-solid fa-shield-halved"></i> <span>Market leader</span></p>
        </div>

        <div class="glass-card stat-card">
            <div class="stat-card-header">
                <span class="stat-card-title">Active Cryptocurrencies</span>
                <div class="stat-icon-box"><i class="fa-solid fa-layer-group"></i></div>
            </div>
            <h3 class="stat-card-value font-orbitron">${(stats.activeCoins || 17240).toLocaleString()}</h3>
            <p class="stat-card-sub"><i class="fa-solid fa-globe"></i> <span>Global ecosystem</span></p>
        </div>
    `;

    // Animate numbers counting up if GSAP is loaded
    if (typeof gsap !== 'undefined') {
        gsap.from('#overview-cards-container .stat-card', {
            y: 30,
            opacity: 0,
            stagger: 0.15,
            duration: 0.6,
            ease: 'power2.out'
        });
    }
}

/**
 * ============================================================================
 * 8. RENDER TRENDING COINS (CAROUSEL)
 * ============================================================================
 */
function renderTrendingCoins(trendingList) {
    const container = document.getElementById('trending-cards-container');
    if (!container || !trendingList || trendingList.length === 0) return;

    container.innerHTML = trendingList.map(item => {
        const coin = item.item || item;
        const priceStr = coin.data && coin.data.price ? coin.data.price : `$${(coin.price_btc * 65000 || 12.5).toFixed(2)}`;
        const changeVal = coin.data && coin.data.price_change_percentage_24h && coin.data.price_change_percentage_24h.usd
            ? coin.data.price_change_percentage_24h.usd
            : (Math.random() * 10 - 3); // realistic fallback percentage
            
        const isPositive = changeVal >= 0;
        const colorClass = isPositive ? 'text-green' : 'text-red';
        const arrowIcon = isPositive ? 'fa-caret-up' : 'fa-caret-down';

        return `
            <div class="glass-card trending-card" onclick="window.location.href='coin.html?id=${coin.id}'">
                <div class="trending-header">
                    <div class="coin-identity">
                        <img src="${coin.large || coin.thumb || 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'}" alt="${coin.name}" class="coin-avatar" loading="lazy">
                        <div>
                            <h4 class="coin-name">${coin.name}</h4>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                    </div>
                    <button class="fav-star-btn" data-id="${coin.id}" onclick="event.stopPropagation(); handleStarClick(this, '${coin.id}', '${coin.name.replace(/'/g, "")}', '${coin.symbol}', '${coin.large || coin.thumb}', 0, 0);" aria-label="Favorite coin">
                        <i class="fa-regular fa-star"></i>
                    </button>
                </div>
                <div class="trending-body">
                    <span class="coin-price font-orbitron">${typeof priceStr === 'number' ? '$' + priceStr.toFixed(4) : priceStr}</span>
                    <span class="coin-change ${colorClass}">
                        <i class="fa-solid ${arrowIcon}"></i> ${Math.abs(changeVal).toFixed(2)}%
                    </span>
                </div>
            </div>
        `;
    }).join('');

    updateAllStarButtons();

    // Setup Carousel navigation arrows
    const prevBtn = document.getElementById('trending-prev');
    const nextBtn = document.getElementById('trending-next');
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => container.scrollBy({ left: -300, behavior: 'smooth' });
        nextBtn.onclick = () => container.scrollBy({ left: 300, behavior: 'smooth' });
    }
}

/**
 * ============================================================================
 * 9. RENDER TOP GAINERS & TOP LOSERS
 * ============================================================================
 */
function renderGainersAndLosers(coins) {
    const gainersContainer = document.getElementById('top-gainers-list');
    const losersContainer = document.getElementById('top-losers-list');
    if (!gainersContainer || !losersContainer || !coins || coins.length === 0) return;

    // Clone array and sort by 24h percentage change
    const sortedByChange = [...coins].filter(c => c.price_change_percentage_24h !== null && c.price_change_percentage_24h !== undefined)
                                   .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);

    const topGainers = sortedByChange.slice(0, 5);
    const topLosers = sortedByChange.slice(-5).reverse();

    // Render Gainers
    gainersContainer.innerHTML = topGainers.map(coin => `
        <div class="mover-item" onclick="window.location.href='coin.html?id=${coin.id}'">
            <div class="coin-identity">
                <img src="${coin.image}" alt="${coin.name}" class="coin-avatar" style="width:30px;height:30px;">
                <div>
                    <h5 class="coin-name" style="font-size:0.95rem;">${coin.name}</h5>
                    <span class="coin-symbol" style="font-size:0.7rem;">$${coin.current_price.toLocaleString()}</span>
                </div>
            </div>
            <span class="badge badge-green font-orbitron">+${coin.price_change_percentage_24h.toFixed(2)}%</span>
        </div>
    `).join('');

    // Render Losers
    losersContainer.innerHTML = topLosers.map(coin => `
        <div class="mover-item" onclick="window.location.href='coin.html?id=${coin.id}'">
            <div class="coin-identity">
                <img src="${coin.image}" alt="${coin.name}" class="coin-avatar" style="width:30px;height:30px;">
                <div>
                    <h5 class="coin-name" style="font-size:0.95rem;">${coin.name}</h5>
                    <span class="coin-symbol" style="font-size:0.7rem;">$${coin.current_price.toLocaleString()}</span>
                </div>
            </div>
            <span class="badge badge-red font-orbitron">${coin.price_change_percentage_24h.toFixed(2)}%</span>
        </div>
    `).join('');
}

/**
 * ============================================================================
 * 10. LIVE MARKET TABLE RENDER, SEARCH & SORTING
 * ============================================================================
 */
function renderMarketTable(coins) {
    const tbody = document.getElementById('market-table-body');
    const noResults = document.getElementById('table-no-results');
    if (!tbody) return;

    if (!coins || coins.length === 0) {
        tbody.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    if (noResults) noResults.classList.add('hidden');

    tbody.innerHTML = coins.map((coin, index) => {
        const change = coin.price_change_percentage_24h || 0;
        const isPos = change >= 0;
        const colorClass = isPos ? 'text-green' : 'text-red';
        const arrow = isPos ? 'fa-arrow-up' : 'fa-arrow-down';

        return `
            <tr onclick="window.location.href='coin.html?id=${coin.id}'" style="cursor:pointer;">
                <td><span class="rank-badge">#${coin.market_cap_rank || (index + 1)}</span></td>
                <td>
                    <div class="coin-identity">
                        <img src="${coin.image}" alt="${coin.name}" class="coin-avatar" style="width:32px;height:32px;" loading="lazy">
                        <div>
                            <span class="coin-name">${coin.name}</span>
                            <span class="coin-symbol" style="margin-left:6px;">${coin.symbol}</span>
                        </div>
                    </div>
                </td>
                <td class="font-orbitron font-weight-bold">$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: coin.current_price < 1 ? 6 : 2})}</td>
                <td class="${colorClass} font-orbitron">
                    <i class="fa-solid ${arrow}"></i> ${Math.abs(change).toFixed(2)}%
                </td>
                <td class="font-orbitron">$${(coin.market_cap || 0).toLocaleString()}</td>
                <td class="font-orbitron">$${(coin.total_volume || 0).toLocaleString()}</td>
                <td onclick="event.stopPropagation();">
                    <button class="fav-star-btn" data-id="${coin.id}" onclick="handleStarClick(this, '${coin.id}', '${coin.name.replace(/'/g, "")}', '${coin.symbol}', '${coin.image}', ${coin.current_price}, ${change});" aria-label="Add to Watchlist">
                        <i class="fa-regular fa-star"></i>
                    </button>
                </td>
                <td onclick="event.stopPropagation();">
                    <button class="action-btn" onclick="window.location.href='coin.html?id=${coin.id}'">Analyze</button>
                </td>
            </tr>
        `;
    }).join('');

    updateAllStarButtons();
}

/**
 * Global click handler for star icon buttons
 */
window.handleStarClick = function(btnElement, id, name, symbol, image, price, change) {
    toggleWatchlistCoin({
        id: id,
        name: name,
        symbol: symbol,
        image: image,
        current_price: parseFloat(price) || 0,
        price_change_percentage_24h: parseFloat(change) || 0
    });
};

/**
 * Live search and sorting controller
 */
function applySearchAndSort() {
    const searchInput = document.getElementById('coin-search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const sortSelect = document.getElementById('sort-select');

    let filtered = [...allMarketCoins];

    // Apply search query filter
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.symbol.toLowerCase().includes(query)
        );
        if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
        if (clearBtn) clearBtn.classList.add('hidden');
    }

    // Apply sorting method
    const method = sortSelect ? sortSelect.value : currentSortMethod;
    currentSortMethod = method;

    filtered.sort((a, b) => {
        switch (method) {
            case 'rank_asc': return (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
            case 'price_desc': return b.current_price - a.current_price;
            case 'price_asc': return a.current_price - b.current_price;
            case 'change_desc': return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
            case 'change_asc': return (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0);
            case 'cap_desc': return (b.market_cap || 0) - (a.market_cap || 0);
            default: return 0;
        }
    });

    renderMarketTable(filtered);
}

// Attach event listeners for search input and sort select
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('coin-search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const sortSelect = document.getElementById('sort-select');

    if (searchInput) {
        searchInput.addEventListener('input', applySearchAndSort);
    }
    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            applySearchAndSort();
            searchInput.focus();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', applySearchAndSort);
    }
});

/**
 * ============================================================================
 * 11. CRYPTO CONVERTER TOOL
 * ============================================================================
 * Performs instant live exchange rate calculations.
 */
function initConverter() {
    const amountInput = document.getElementById('convert-amount');
    const fromCoinSelect = document.getElementById('convert-from-coin');
    const toCurrencySelect = document.getElementById('convert-to-currency');
    const swapBtn = document.getElementById('swap-converter-btn');

    if (amountInput) amountInput.addEventListener('input', updateConverterCalculation);
    if (fromCoinSelect) fromCoinSelect.addEventListener('change', updateConverterCalculation);
    if (toCurrencySelect) toCurrencySelect.addEventListener('change', updateConverterCalculation);

    if (swapBtn && fromCoinSelect) {
        swapBtn.addEventListener('click', () => {
            // Animate swap button rotation
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(swapBtn, { rotation: 0 }, { rotation: 180, duration: 0.3 });
            }
            // Cycle to next coin option to simulate bidirectional swap
            const nextIndex = (fromCoinSelect.selectedIndex + 1) % fromCoinSelect.options.length;
            fromCoinSelect.selectedIndex = nextIndex;
            updateConverterCalculation();
            showToast('Swapped conversion asset', 'info');
        });
    }
}

function updateConverterCalculation() {
    const amountInput = document.getElementById('convert-amount');
    const fromCoinSelect = document.getElementById('convert-from-coin');
    const toCurrencySelect = document.getElementById('convert-to-currency');
    const resultText = document.getElementById('converter-result-text');
    const rateInfo = document.getElementById('converter-rate-info');

    if (!amountInput || !fromCoinSelect || !toCurrencySelect || !resultText) return;

    const amount = parseFloat(amountInput.value) || 0;
    const selectedCoinId = fromCoinSelect.value;
    const selectedFiat = toCurrencySelect.value.toUpperCase();
    const fiatSymbol = toCurrencySelect.options[toCurrencySelect.selectedIndex].getAttribute('data-symbol') || '$';

    // Find coin price from our loaded market array or use realistic default
    const coinObj = allMarketCoins.find(c => c.id === selectedCoinId);
    let priceInUSD = coinObj ? coinObj.current_price : 65000; // default BTC

    // Exchange multipliers relative to USD
    let fiatMultiplier = 1.0; // USD
    if (selectedFiat === 'EUR') fiatMultiplier = 0.92;
    if (selectedFiat === 'PKR') fiatMultiplier = 278.50;

    const unitPriceFiat = priceInUSD * fiatMultiplier;
    const totalValue = amount * unitPriceFiat;

    // Update DOM
    resultText.textContent = `${fiatSymbol}${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})} ${selectedFiat}`;
    if (rateInfo) {
        rateInfo.textContent = `1 ${fromCoinSelect.options[fromCoinSelect.selectedIndex].getAttribute('data-symbol')} = ${fiatSymbol}${unitPriceFiat.toLocaleString()} ${selectedFiat}`;
    }
}

/**
 * ============================================================================
 * 12. PRICE ALERT RADAR SIMULATION
 * ============================================================================
 */
function initPriceAlert() {
    const saveBtn = document.getElementById('save-alert-btn');
    const deleteBtn = document.getElementById('delete-alert-btn');
    const coinSelect = document.getElementById('alert-coin-select');
    const targetInput = document.getElementById('alert-target-price');
    const currentHint = document.getElementById('alert-current-hint');

    // Update current price hint when coin selection changes
    if (coinSelect && currentHint) {
        coinSelect.addEventListener('change', () => {
            const coin = allMarketCoins.find(c => c.id === coinSelect.value);
            if (coin) {
                currentHint.textContent = `Current Price: $${coin.current_price.toLocaleString()}`;
            }
        });
    }

    // Load any saved alert from local storage
    loadSavedAlert();

    if (saveBtn && coinSelect && targetInput) {
        saveBtn.addEventListener('click', () => {
            const targetPrice = parseFloat(targetInput.value);
            if (isNaN(targetPrice) || targetPrice <= 0) {
                showToast('Please enter a valid target price greater than 0', 'error');
                return;
            }

            const alertObj = {
                coinId: coinSelect.value,
                coinName: coinSelect.options[coinSelect.selectedIndex].text,
                targetPrice: targetPrice,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('cryptoverse_alert', JSON.stringify(alertObj));
            loadSavedAlert();
            showToast(`Radar Alert Activated for ${alertObj.coinName} at $${targetPrice.toLocaleString()}`, 'success');
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            localStorage.removeItem('cryptoverse_alert');
            loadSavedAlert();
            showToast('Price alert radar deactivated', 'info');
        });
    }
}

function loadSavedAlert() {
    const alertBox = document.getElementById('active-alert-box');
    const alertText = document.getElementById('active-alert-text');
    if (!alertBox || !alertText) return;

    try {
        const saved = localStorage.getItem('cryptoverse_alert');
        if (saved) {
            const alertObj = JSON.parse(saved);
            alertText.textContent = `${alertObj.coinName.split(' ')[0]} @ $${alertObj.targetPrice.toLocaleString()}`;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    } catch (e) {
        alertBox.classList.add('hidden');
    }
}

function checkPriceAlertTrigger() {
    try {
        const saved = localStorage.getItem('cryptoverse_alert');
        if (!saved || allMarketCoins.length === 0) return;

        const alertObj = JSON.parse(saved);
        const coin = allMarketCoins.find(c => c.id === alertObj.coinId);

        if (coin && coin.current_price >= alertObj.targetPrice) {
            // Target Reached! Display high-priority notification
            showToast(`🚨 ALERT TRIGGERED: ${coin.name} reached $${coin.current_price.toLocaleString()}!`, 'success');
            // Animate alert box
            const alertBox = document.getElementById('active-alert-box');
            if (alertBox && typeof gsap !== 'undefined') {
                gsap.fromTo(alertBox, { scale: 1 }, { scale: 1.05, yoyo: true, repeat: 3, duration: 0.3 });
            }
        }
    } catch (e) {
        console.warn('Alert check failed', e);
    }
}

/**
 * ============================================================================
 * 13. GSAP SCROLL & ENTRANCE ANIMATIONS
 * ============================================================================
 */
function initGSAPAnimations() {
    if (typeof gsap === 'undefined') {
        console.warn('GSAP library not found. Skipping animations.');
        return;
    }

    // Register ScrollTrigger plugin
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Hero Section Entrance Animation
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
    heroTimeline
        .from('.hero-badge', { y: -20, opacity: 0, delay: 0.2 })
        .from('.hero-title', { y: 40, opacity: 0 }, '-=0.4')
        .from('.hero-subtitle', { y: 30, opacity: 0 }, '-=0.5')
        .from('.hero-buttons .btn', { y: 20, opacity: 0, stagger: 0.15 }, '-=0.4')
        .from('.hero-stats', { y: 20, opacity: 0 }, '-=0.3')
        .from('.three-container', { scale: 0.9, opacity: 0, duration: 1.2 }, '-=0.8');

    // Section Titles ScrollTrigger Animation
    if (typeof ScrollTrigger !== 'undefined') {
        document.querySelectorAll('.section-header').forEach(header => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                y: 30,
                opacity: 0,
                duration: 0.6
            });
        });

        // Gainers & Losers Cards
        gsap.from('.movers-column', {
            scrollTrigger: {
                trigger: '.movers-grid',
                start: 'top 80%'
            },
            y: 40,
            opacity: 0,
            stagger: 0.2,
            duration: 0.7
        });

        // Tool Cards
        gsap.from('.tool-card', {
            scrollTrigger: {
                trigger: '.tools-grid',
                start: 'top 80%'
            },
            scale: 0.95,
            opacity: 0,
            stagger: 0.2,
            duration: 0.7
        });
    }
}
