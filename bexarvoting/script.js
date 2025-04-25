// --- Global Variables ---
//lorem ipsum
let turnoutChart = null;
const parsedData = {
    2025: { locations: [], dates: [], totals: [] },
};
const dataFiles = {
    2025: "csv/May 2025 Municipal.csv",
};

// --- DOM Elements ---
const locationSelect = document.getElementById("location-select");
const chartCanvas = document.getElementById("turnoutChart");
const yAxisToggle = document.getElementById("y-axis-toggle");
const statusMessage = document.createElement("p");
statusMessage.className =
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4"; // Adjusted default color

// Insert status message relative to the chart canvas
if (chartCanvas?.parentNode) {
    chartCanvas.parentNode.insertBefore(statusMessage, chartCanvas);
} else {
    console.error("Chart canvas or its parent not found.");
    document.body.appendChild(statusMessage);
}

// --- Theme Management Removed ---

// --- Performance and Caching Utilities ---
const metrics = {
    renderTime: [],
    dataLoadTime: [],
    interactions: 0,
};

const logMetric = (category, durationOrCount) => {
    if (typeof durationOrCount === 'number' && category === 'interactions') {
         metrics[category] = (metrics[category] || 0) + durationOrCount;
    } else if (typeof durationOrCount === 'number') {
         metrics[category].push(durationOrCount);
         if (metrics[category].length > 100) {
             metrics[category].shift();
         }
    }
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

const fetchWithCache = async (year) => {
    const cacheKey = `voting-data-${year}`;
    const now = new Date();
    const currentTime = now.getTime();

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cachedDate = new Date(timestamp);
        if (
            cachedDate.toDateString() === now.toDateString() &&
            currentTime - timestamp < 900000 // 15 minutes
        ) {
            return data;
        }
    }

    // console.log(`Fetching data for year ${year}...`);
    const startTime = performance.now();
    try {
        const filePath = dataFiles[year];
        if (!filePath) throw new Error(`No data file defined for year ${year}`);

        const response = await fetch(filePath);
        if (!response.ok)
            throw new Error(
                `Fetch failed: ${response.status} ${response.statusText}`
            );

        const data = await response.text();
        if (!data?.trim()) throw new Error(`Fetched file ${filePath} is empty.`);

        localStorage.setItem(
            cacheKey,
            JSON.stringify({ data, timestamp: currentTime })
        );
        logMetric("dataLoadTime", performance.now() - startTime);
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        if (cached) {
            console.warn("Fetch failed, using stale cached data as fallback.");
            statusMessage.textContent = `⚠️ Error loading latest data. Displaying older data.`;
            return JSON.parse(cached).data;
        }
        throw error;
    }
};

const memoizedLocations = new Map();
const getLocationData = (year, locationName) => {
    const key = `${year}-${locationName}`;
    if (memoizedLocations.has(key)) {
        return memoizedLocations.get(key);
    }
    if (!parsedData[year]?.locations) return null;
    const data = parsedData[year].locations.find(loc => loc.name === locationName);
    memoizedLocations.set(key, data);
    return data;
};

const wrapAsyncErrorHandler = (fn, fallback) => {
    return async (...args) => {
        try {
            if (!statusMessage.textContent.includes("⚠️")) {
                 statusMessage.textContent = "";
            }
            return await fn(...args);
        } catch (error) {
            console.error("Operation failed:", error.message);
            if (!statusMessage.textContent.includes("⚠️")) {
                 statusMessage.textContent = "An unexpected error occurred.";
            }
            return fallback?.();
        }
    };
};

const parseCSV = wrapAsyncErrorHandler(async (csvString, year) => {
    parsedData[year] = { locations: [], dates: [], totals: [] };
    memoizedLocations.clear();

    const lines = csvString?.trim().split("\n");
    if (!lines || lines.length < 2) {
        console.warn(`CSV for year ${year} is incomplete or missing.`);
        statusMessage.textContent = `Data for ${year} is missing or incomplete.`;
        return;
    }

    const headers = lines[0].split(",").slice(2).map(h => h.trim()).filter(Boolean);
    parsedData[year].dates = headers;

    lines.slice(1).forEach((line) => {
        const columns = line.split(",");
        const locationName = columns[0]?.trim();
        if (!locationName) return;

        const dailyData = headers.map(
            (_, index) => parseFloat(columns[index + 2]?.trim() || "0") || 0
        );

        if (locationName.toLowerCase().startsWith("total")) {
            parsedData[year].totals = dailyData;
        } else {
            parsedData[year].locations.push({ name: locationName, data: dailyData });
        }
    });

    parsedData[year].locations.sort((a, b) => a.name.localeCompare(b.name));
    // console.log(`Parsed data for ${year}`);
}, () => {
    console.error("CSV Parsing failed. Resetting data for the year.");
    parsedData[2025] = { locations: [], dates: [], totals: [] };
    if (turnoutChart) { turnoutChart.destroy(); turnoutChart = null; }
    if (chartCanvas) {
         const ctx = chartCanvas.getContext("2d");
         ctx?.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
});

const populateLocationDropdown = () => {
    if (!locationSelect) return;
    locationSelect.options.length = 1; // Keep "Total Turnout"

    const yearToUse = 2025;
    if (parsedData[yearToUse]?.locations) {
        parsedData[yearToUse].locations.forEach(({ name }) => {
            locationSelect.appendChild(new Option(name, name));
        });
    } else {
        console.warn(`No location data available for ${yearToUse}.`);
        if (!statusMessage.textContent) {
            statusMessage.textContent = `Could not load location list for ${yearToUse}.`;
        }
    }
};

// --- Chart Theming Removed ---

// --- Chart Rendering Configuration ---
// Simplified to use hardcoded dark mode colors
const createChartConfig = (labels, datasets, title) => {
    const startAtZero = yAxisToggle ? yAxisToggle.checked : true;
    // Hardcoded dark mode colors
    const themeColors = {
        ticksColor: "#9CA3AF", gridColor: "#374151", legendColor: "#E5E7EB",
        titleColor: "#F9FAFB", tooltipBgColor: "#1F2937",
        tooltipTitleColor: "#E5E7EB", tooltipBodyColor: "#D1D5DB",
    };

    return {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: startAtZero,
                    title: { display: true, text: "Number of Voters", color: themeColors.legendColor },
                    ticks: { color: themeColors.ticksColor }, grid: { color: themeColors.gridColor },
                },
                x: {
                    title: { display: true, text: "Date", color: themeColors.legendColor },
                    ticks: { color: themeColors.ticksColor }, grid: { color: themeColors.gridColor },
                },
            },
            plugins: {
                tooltip: {
                    mode: "index", intersect: false, backgroundColor: themeColors.tooltipBgColor,
                    titleColor: themeColors.tooltipTitleColor, bodyColor: themeColors.tooltipBodyColor,
                },
                title: { display: true, text: title, color: themeColors.titleColor, font: { size: 16 } },
                legend: { position: "top", labels: { color: themeColors.legendColor } },
            },
            interaction: { mode: "nearest", axis: "x", intersect: false },
        },
    };
};

// --- Chart Rendering Logic ---
const renderChart = () => {
    const selectedLocation = locationSelect.value;
    const year = 2025;
    const yearData = parsedData[year];

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        statusMessage.textContent = "Error initializing chart canvas.";
        return;
    }

    if (statusMessage.textContent.startsWith("No data") || statusMessage.textContent.includes("not found")) {
        statusMessage.textContent = "";
    }

    if (!yearData || !yearData.dates?.length) {
        console.warn(`renderChart: No data available to render for ${year}.`);
        statusMessage.textContent = `No data loaded for ${year}.`;
        if (turnoutChart) { turnoutChart.destroy(); turnoutChart = null; }
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        return;
    }

    let datasets = [];
    let chartTitle = `Daily Early Voting Turnout - ${year}`;
    const labels = yearData.dates;
    const accentColor = "#EC4899"; // Pink-500

    if (selectedLocation === "total") {
        if (yearData.totals?.length) {
            datasets.push({
                label: `Total Turnout ${year}`, data: yearData.totals,
                borderColor: accentColor, backgroundColor: accentColor + "33",
                tension: 0.1, fill: false, pointRadius: 3, pointHoverRadius: 5,
            });
            chartTitle = `Total Daily Early Voting Turnout - ${year}`;
        } else {
            console.warn(`renderChart: No 'Total' data found for ${year}.`);
            statusMessage.textContent = `Total turnout data missing for ${year}.`;
        }
    } else {
        const locationData = getLocationData(year, selectedLocation);
        if (locationData?.data?.length) {
            datasets.push({
                label: `${locationData.name} ${year}`, data: locationData.data,
                borderColor: accentColor, backgroundColor: accentColor + "33",
                tension: 0.1, fill: false, pointRadius: 3, pointHoverRadius: 5,
            });
            chartTitle = `Daily Turnout for ${locationData.name} - ${year}`;
        } else {
            console.warn(`renderChart: No data found or empty for location: "${selectedLocation}"`);
            statusMessage.textContent = `Data for location "${selectedLocation}" not found.`;
        }
    }

    if (datasets.length === 0) {
         if (turnoutChart) { turnoutChart.destroy(); turnoutChart = null; }
         ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
         if (!statusMessage.textContent) {
             statusMessage.textContent = "No data to display for this selection.";
         }
         return;
    }

    // Update existing chart or create a new one
    if (turnoutChart) {
        turnoutChart.data.labels = labels;
        turnoutChart.data.datasets = datasets;
        turnoutChart.options.plugins.title.text = chartTitle;
        turnoutChart.options.scales.y.beginAtZero = yAxisToggle ? yAxisToggle.checked : true;
        // No need to call updateChartTheme anymore
        turnoutChart.update(); // Just update the chart
    } else {
        const config = createChartConfig(labels, datasets, chartTitle);
        turnoutChart = new Chart(ctx, config);
    }
};

const debouncedRenderChart = debounce(() => {
    const startTime = performance.now();
    try {
        renderChart();
        logMetric('renderTime', performance.now() - startTime);
    } catch (error) {
        console.error('Error during debounced renderChart:', error);
        statusMessage.textContent = "Error updating chart display.";
    }
}, 250);

// --- Event Listeners ---
const setupEventListeners = () => {
    if (locationSelect) {
        locationSelect.addEventListener("change", () => {
            logMetric('interactions', 1);
            debouncedRenderChart();
        });
    } else {
         console.error("Location select element not found for event listener.");
    }

    if (yAxisToggle) {
        yAxisToggle.addEventListener("change", () => {
            if (turnoutChart) {
                turnoutChart.options.scales.y.beginAtZero = yAxisToggle.checked;
                turnoutChart.update();
                logMetric('interactions', 1);
            }
        });
    } else {
        console.error("Y-axis toggle element not found for event listener.");
    }
};

// --- Initialization ---
const initialize = wrapAsyncErrorHandler(async () => {
    statusMessage.textContent = "Loading data...";
    // Removed initializeTheme() call

    const year = 2025;
    const csvText = await fetchWithCache(year);
    await parseCSV(csvText, year);

    if (!parsedData[year]?.dates?.length) {
         console.warn("Initialization halted: No valid data after parsing.");
         return;
    }

    populateLocationDropdown();
    debouncedRenderChart(); // Initial render will use dark mode config
    setupEventListeners();
    statusMessage.textContent = "";

    // Auto-refresh interval
    setInterval(async () => {
        // console.log('Checking for data updates...');
        try {
            const newData = await fetchWithCache(year);
            const cacheKey = `voting-data-${year}`;
            const cached = localStorage.getItem(cacheKey);
            const oldRawData = cached ? JSON.parse(cached).data : null;

            if (newData !== oldRawData) {
                 console.log('Data changed. Reparsing and updating chart...');
                 await parseCSV(newData, year);
                 if (parsedData[year]?.dates?.length) {
                     debouncedRenderChart();
                 } else {
                     console.warn("Auto-refresh: Parsing resulted in no data.");
                 }
            } // else { console.log('Auto-refresh: Data unchanged.'); }
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, 900000); // 15 minutes
});

// --- Performance Monitoring ---
window.getPerformanceMetrics = () => {
    const safeReduce = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
        averageRenderTime: safeReduce(metrics.renderTime).toFixed(2) + 'ms',
        averageLoadTime: safeReduce(metrics.dataLoadTime).toFixed(2) + 'ms',
        totalInteractions: metrics.interactions || 0
    };
};

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initialize);
