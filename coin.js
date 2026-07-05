/**
 * ============================================================================
 * CRYPTOVERSE – COINGECKO COIN DETAILS & CHART MODULE (coin.js)
 * ============================================================================
 * This script powers the dedicated Coin Details page (coin.html).
 * It parses the URL parameter (?id=bitcoin), fetches comprehensive coin stats
 * from CoinGecko API, renders key financial metrics, and creates an interactive
 * time-series line chart using Chart.js.
 * 
 * Written in beginner-friendly ES6+ JavaScript with clear documentation.
 * ============================================================================
 */

// Global chart instance variable
let priceChartInstance = null;
let currentCoinId = 'bitcoin';
let currentCoinData = null;

/**
 * ============================================================================
 * 1. INITIALIZATION ON DOCUMENT LOAD
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', async () => {
    const heroSection = document.getElementById('coin-hero-section');
    if (!heroSection) return; // Exit if not on coin.html page

    console.log('🔍 Coin Details Page Initializing...');

    // 1. Extract Coin ID from URL Query String (e.g., ?id=ethereum)
    const urlParams = new URLSearchParams(window.location.search);
    currentCoinId = urlParams.get('id') || 'bitcoin';

    // 2. Fetch Coin Stats and Chart Data in Parallel
    await loadCoinDetailsAndChart(currentCoinId);

    // 3. Initialize Time Period Filter Buttons
    initChartFilterButtons();
});

/**
 * ============================================================================
 * 2. FETCH AND RENDER COIN DETAILS & CHART
 * ============================================================================
 */
async function loadCoinDetailsAndChart(coinId) {
    if (typeof CryptoAPI === 'undefined') {
        console.error('CryptoAPI module not available.');
        return;
    }

    try {
        // Show loading state
        document.getElementById('coin-name').textContent = 'Loading...';

        const [details, chartData] = await Promise.all([
            CryptoAPI.getCoinDetails(coinId),
            CryptoAPI.getCoinMarketChart(coinId, 7) // default 7 days
        ]);

        currentCoinData = details;

        // Render sections
        renderHeroDetails(details);
        renderStatGrid(details);
        renderDescription(details);
        renderPriceChart(chartData, 7);

    } catch (error) {
        console.error('Failed to load coin details:', error);
        showToast('Error loading details. Using backup analytics.', 'error');
    }
}

/**
 * ============================================================================
 * 3. RENDER HERO HEADER DETAILS
 * ============================================================================
 */
function renderHeroDetails(coin) {
    if (!coin) return;

    // Update document title
    document.title = `${coin.name} (${coin.symbol.toUpperCase()}) Live Price & Chart | CryptoVerse`;

    // DOM references
    const logo = document.getElementById('coin-logo');
    const name = document.getElementById('coin-name');
    const symbol = document.getElementById('coin-symbol');
    const rank = document.getElementById('coin-rank-badge');
    const price = document.getElementById('coin-price');
    const badge24h = document.getElementById('coin-24h-badge');
    const website = document.getElementById('coin-website-link');
    const watchlistBtn = document.getElementById('coin-watchlist-btn');

    const md = coin.market_data || {};
    const curPrice = md.current_price?.usd || 0;
    const change24h = md.price_change_percentage_24h || 0;
    const isPos = change24h >= 0;

    if (logo) logo.src = coin.image?.large || coin.image?.thumb || 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';
    if (name) name.textContent = coin.name;
    if (symbol) symbol.textContent = coin.symbol.toUpperCase();
    if (rank) rank.textContent = `Rank #${coin.market_cap_rank || '--'}`;
    if (price) price.textContent = `$${curPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: curPrice < 1 ? 6 : 2})}`;

    // Format 24H badge color and arrow
    if (badge24h) {
        badge24h.className = `badge ${isPos ? 'badge-green' : 'badge-red'} font-orbitron`;
        badge24h.innerHTML = `<i class="fa-solid ${isPos ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${Math.abs(change24h).toFixed(2)}% (24H)`;
    }

    // Set website link if available
    if (website && coin.links?.homepage && coin.links.homepage[0]) {
        website.href = coin.links.homepage[0];
        website.style.display = 'inline-flex';
    } else if (website) {
        website.style.display = 'none';
    }

    // Bind Watchlist Button
    if (watchlistBtn) {
        // Check initial state
        const list = getWatchlist();
        const isWatched = list.some(item => item.id === coin.id);
        if (isWatched) {
            watchlistBtn.classList.replace('btn-primary', 'btn-secondary');
            watchlistBtn.innerHTML = '<i class="fa-solid fa-star text-primary btn-icon-left"></i><span>In Watchlist</span>';
        }

        watchlistBtn.onclick = () => {
            toggleWatchlistCoin({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                image: coin.image?.large || coin.image?.thumb,
                current_price: curPrice,
                price_change_percentage_24h: change24h
            });

            // Update button UI
            const updatedList = getWatchlist();
            const nowWatched = updatedList.some(item => item.id === coin.id);
            if (nowWatched) {
                watchlistBtn.classList.replace('btn-primary', 'btn-secondary');
                watchlistBtn.innerHTML = '<i class="fa-solid fa-star text-primary btn-icon-left"></i><span>In Watchlist</span>';
            } else {
                watchlistBtn.classList.replace('btn-secondary', 'btn-primary');
                watchlistBtn.innerHTML = '<i class="fa-regular fa-star btn-icon-left"></i><span>Add to Watchlist</span>';
            }
        };
    }
}

/**
 * ============================================================================
 * 4. RENDER 8-CARD STATISTIC GRID
 * ============================================================================
 */
function renderStatGrid(coin) {
    if (!coin || !coin.market_data) return;
    const md = coin.market_data;

    const formatCurrency = (val) => val !== undefined && val !== null ? `$${val.toLocaleString()}` : 'N/A';
    const formatNumber = (val) => val !== undefined && val !== null ? val.toLocaleString() : '∞ / Unlimited';

    document.getElementById('stat-mcap').textContent = formatCurrency(md.market_cap?.usd);
    document.getElementById('stat-vol').textContent = formatCurrency(md.total_volume?.usd);
    document.getElementById('stat-circ-supply').textContent = `${formatNumber(md.circulating_supply)} ${coin.symbol.toUpperCase()}`;
    document.getElementById('stat-total-supply').textContent = formatNumber(md.total_supply);
    document.getElementById('stat-max-supply').textContent = formatNumber(md.max_supply);
    document.getElementById('stat-ath').textContent = formatCurrency(md.ath?.usd);
    document.getElementById('stat-atl').textContent = formatCurrency(md.atl?.usd);
    document.getElementById('stat-high-low').textContent = `${formatCurrency(md.high_24h?.usd)} / ${formatCurrency(md.low_24h?.usd)}`;
}

/**
 * ============================================================================
 * 5. RENDER DESCRIPTION
 * ============================================================================
 */
function renderDescription(coin) {
    const descBox = document.getElementById('coin-description');
    const descTitle = document.getElementById('desc-coin-title');
    if (!descBox) return;

    if (descTitle) descTitle.textContent = coin.name;

    if (coin.description && coin.description.en && coin.description.en.trim() !== '') {
        // Clean and render API description HTML
        descBox.innerHTML = coin.description.en;
    } else {
        descBox.innerHTML = `
            <p>${coin.name} (${coin.symbol.toUpperCase()}) is a revolutionary decentralized cryptographic asset operating on a peer-to-peer blockchain network. It provides secure, immutable, and borderless digital transactions without relying on central banking intermediaries.</p>
        </p>`;
    }
}

/**
 * ============================================================================
 * 6. INITIALIZE & RENDER CHART.JS LINE GRAPH
 * ============================================================================
 */
function renderPriceChart(chartData, days) {
    const canvas = document.getElementById('price-chart-canvas');
    if (!canvas || !chartData || !chartData.prices) return;

    const ctx = canvas.getContext('2d');

    // Destroy previous chart instance if it exists
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    // Format timestamps and data points
    const labels = [];
    const prices = [];
    
    chartData.prices.forEach(point => {
        const timestamp = point[0];
        const val = point[1];
        const date = new Date(timestamp);
        
        let labelStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (days == 1) {
            labelStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        labels.push(labelStr);
        prices.push(val);
    });

    // Determine chart color gradient based on trend direction (up or down)
    const isBullish = prices[prices.length - 1] >= prices[0];
    const lineColor = isBullish ? '#00FF95' : '#FF4D6D';
    const fillGradient = ctx.createLinearGradient(0, 0, 0, 400);
    if (isBullish) {
        fillGradient.addColorStop(0, 'rgba(0, 255, 149, 0.35)');
        fillGradient.addColorStop(1, 'rgba(0, 255, 149, 0.0)');
    } else {
        fillGradient.addColorStop(0, 'rgba(255, 77, 109, 0.35)');
        fillGradient.addColorStop(1, 'rgba(255, 77, 109, 0.0)');
    }

    // Create Chart.js instance
    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${currentCoinId.toUpperCase()} Price (USD)`,
                data: prices,
                borderColor: lineColor,
                borderWidth: 2.5,
                backgroundColor: fillGradient,
                fill: true,
                tension: 0.3,
                pointRadius: days <= 1 ? 1 : 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(11, 18, 32, 0.95)',
                    titleFont: { family: 'Poppins', size: 13, weight: '600' },
                    bodyFont: { family: 'Orbitron', size: 14, weight: '700' },
                    padding: 14,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4});
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#B8C1EC',
                        font: { family: 'Poppins', size: 11 },
                        maxTicksLimit: 8
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#B8C1EC',
                        font: { family: 'Orbitron', size: 11 },
                        callback: function(value) {
                            if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'k';
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

/**
 * ============================================================================
 * 7. TIME PERIOD FILTER BUTTONS CONTROLLER
 * ============================================================================
 */
function initChartFilterButtons() {
    const filterContainer = document.getElementById('chart-time-filters');
    if (!filterContainer) return;

    filterContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active class from all buttons
            filterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const days = parseInt(btn.getAttribute('data-days')) || 7;
            
            // Show toast feedback
            showToast(`Loading ${btn.textContent} historical data...`, 'info');

            // Fetch and update chart
            const newChartData = await CryptoAPI.getCoinMarketChart(currentCoinId, days);
            renderPriceChart(newChartData, days);
        });
    });
}
