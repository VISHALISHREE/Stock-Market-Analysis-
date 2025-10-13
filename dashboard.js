let priceChart, volumeChart;
let chartData = { dates: [], prices: [], volumes: [] };
let userHoldings = [];
let targetTrades = [];
let marginTrades = [];
let watchlist = [];
const availableStocks = ['RELIANCE'];

// ------------------- Watchlist -------------------
function addStock() {
    const symbol = document.getElementById('newStock').value.toUpperCase();
    if (symbol && !watchlist.includes(symbol)) {
        watchlist.push(symbol);
        updateWatchlistDropdown();
        saveWatchlist();
    }
    document.getElementById('newStock').value = '';
}

function updateWatchlistDropdown() {
    const select = document.getElementById('selectedStock');
    select.innerHTML = '';
    watchlist.forEach(stock => {
        const opt = document.createElement('option');
        opt.value = stock;
        opt.textContent = stock;
        select.appendChild(opt);
    });
}

function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function loadWatchlist() {
    watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (watchlist.length === 0) watchlist = [...availableStocks];
    updateWatchlistDropdown();
}

// ------------------- Target Trade -------------------
document.getElementById('targetTradeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const trade = {
        stock: document.getElementById('targetStock').value.toUpperCase(),
        company: document.getElementById('targetCompany').value,
        target: parseFloat(document.getElementById('targetPrice').value),
        qty: parseFloat(document.getElementById('targetQty').value),
        buyPrice: parseFloat(document.getElementById('targetBuyPrice').value),
        timer: null
    };
    targetTrades.push(trade);
    userHoldings.push({ stock: trade.stock, qty: trade.qty, buyPrice: trade.buyPrice });
    displayTargetTrades();
    updatePortfolioKPI();
    updateTodaysEarnings();

    trade.timer = setTimeout(() => {
        alert(`Auto-executed Target Trade for ${trade.stock}!`);
    }, 30000);

    e.target.reset();
});

function displayTargetTrades() {
    const container = document.getElementById('targetAlerts');
    container.innerHTML = '';
    targetTrades.forEach(t => {
        const div = document.createElement('div');
        div.textContent = `${t.stock} (${t.company}) — Target: ₹${t.target.toLocaleString('en-IN')}, Qty: ${t.qty}`;
        container.appendChild(div);
    });
}

// ------------------- Margin Trade -------------------
document.getElementById('marginTradeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const trade = {
        stock: document.getElementById('marginStock').value.toUpperCase(),
        company: document.getElementById('marginCompany').value,
        margin: parseFloat(document.getElementById('marginPrice').value),
        qty: parseFloat(document.getElementById('marginQty').value),
        buyPrice: parseFloat(document.getElementById('marginBuyPrice').value),
        timer: null
    };
    marginTrades.push(trade);
    userHoldings.push({ stock: trade.stock, qty: trade.qty, buyPrice: trade.buyPrice });
    displayMarginTrades();
    updatePortfolioKPI();
    updateTodaysEarnings();

    trade.timer = setTimeout(() => {
        alert(`Auto-executed Margin Trade for ${trade.stock}!`);
    }, 30000);

    e.target.reset();
});

function displayMarginTrades() {
    const container = document.getElementById('marginAlerts');
    container.innerHTML = '';
    marginTrades.forEach(t => {
        const div = document.createElement('div');
        div.textContent = `${t.stock} (${t.company}) — Margin: ₹${t.margin.toLocaleString('en-IN')}, Qty: ${t.qty}`;
        container.appendChild(div);
    });
}

// ------------------- Charts -------------------
function loadChart() {
    const stock = document.getElementById('selectedStock').value;
    const timeframe = document.getElementById('timeframe').value;
    if (!stock) return;

    fetch(`/api/chart-data?stock=${stock}&timeframe=${timeframe}`)
        .then(res => res.json())
        .then(data => {
            chartData.dates = data.map(d => d.date);
            chartData.prices = data.map(d => d.close);
            chartData.volumes = data.map(d => d.volume);
            renderCharts();
        });
}

function renderCharts() {
    if (priceChart) priceChart.destroy();
    const ctx1 = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Price (₹)',
                data: chartData.prices,
                borderColor: '#5AA6FF',
                backgroundColor: 'rgba(127,183,255,0.15)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });

    if (volumeChart) volumeChart.destroy();
    const ctx2 = document.getElementById('volumeChart').getContext('2d');
    volumeChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Volume',
                data: chartData.volumes,
                backgroundColor: 'rgba(90,166,255,0.6)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    updateDateData();
    updatePortfolioKPI();
    updateTodaysEarnings();
    updateDailyQuote();
}

// ------------------- Date Data -------------------
function updateDateData() {
    const selected = document.getElementById('selectedDate').value;
    if (selected && chartData.dates.includes(selected)) {
        const idx = chartData.dates.indexOf(selected);
        document.getElementById('dateData').textContent =
            `Price: ₹${chartData.prices[idx].toLocaleString('en-IN')}, Volume: ${chartData.volumes[idx].toLocaleString('en-IN')}`;
    } else document.getElementById('dateData').textContent = '';
}

// ------------------- KPIs -------------------
function updatePortfolioKPI() {
    let total = 0;
    userHoldings.forEach(h => {
        const latestPrice = chartData.prices[chartData.prices.length - 1] || 0;
        total += h.qty * latestPrice;
    });
    document.getElementById('portfolioValue').textContent = '₹' + total.toLocaleString('en-IN');

    const latestPrice = chartData.prices[chartData.prices.length - 1] || 0;
    const yesterdayPrice = chartData.prices[chartData.prices.length - 2] || latestPrice;
    const trend = latestPrice > yesterdayPrice ? 'Bullish 🤚' : latestPrice < yesterdayPrice ? 'Bearish 🤚' : 'Neutral 🤚';
    document.getElementById('portfolioTrend').textContent = trend;
}

function updateTodaysEarnings() {
    let earnings = 0;
    userHoldings.forEach(h => {
        const latestPrice = chartData.prices[chartData.prices.length - 1] || 0;
        earnings += (latestPrice - h.buyPrice) * h.qty;
    });
    document.getElementById('todaysPL').textContent = '₹' + earnings.toLocaleString('en-IN');
    document.getElementById('earningsStatus').textContent = earnings >= 0 ? 'Profit 🤚' : 'Loss 🤚';
}

// ------------------- Daily Quote -------------------
const quotes = [
    "Buy low, sell high!",
    "Patience is key in trading.",
    "Invest in knowledge.",
    "Consistency beats intensity.",
    "Adapt, don’t panic."
];

function updateDailyQuote() {
    const day = new Date().getDate();
    const quote = quotes[day % quotes.length];
    document.getElementById('dailyQuote').textContent = quote;
}

// ------------------- Initial Load -------------------
window.onload = () => {
    loadWatchlist();
    loadChart();
    updateDailyQuote();
};
