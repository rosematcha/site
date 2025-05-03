let turnoutChart = null;
const parsedData = {
    2025: { locations: [], dates: [], totals: [] },
};
const dataFiles = {
    2025: "csv/May 2025 Municipal.csv",
};

const CAT_IMAGES = [
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/1914_Ready_for_bed_%28LOC%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/A_hungry_bunch_LCCN2013648273.jpg/1280px-A_hungry_bunch_LCCN2013648273.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/A_joy-ride_LCCN2013648296.jpg/1280px-A_joy-ride_LCCN2013648296.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hanging_up_the_wash_LCCN2013648270.jpg/1280px-Hanging_up_the_wash_LCCN2013648270.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/28/Harry_Whittier_Frees_-_Good_Morning.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d3/Harry_Whittier_Frees_-_Mrs._Bufkins_Finds_Plenty_of_Eggs.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/27/Harry_Whittier_Frees_-_Mrs._Bufkins_Takes_Barker%27s_Place.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/80/Harry_Whittier_Frees_-_Prowler_and_Furra_Cleaned_the_Rugs.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/09/Harry_Whittier_Frees_-_Prowler_and_Purra_Try_the_Jam.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Harry_Whittier_Frees_-_Prowler_Upsets_the_Cocoanut.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Harry_Whittier_Frees_-_Purra_Plays_a_Joke_on_Prowler.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/24/Harry_Whittier_Frees_-_Resting_in_the_Hammock.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3a/Harry_Whittier_Frees_-_Rosie_and_Jennie_Took_a_Cat-Nap.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/Harry_Whittier_Frees_-_Rosie_Bufkins_Gave_Jennie_an_Airing.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Harry_Whittier_Frees_-_The_Bufkins_Twins_Were_Swinging.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/07/Harry_Whittier_Frees_-_The_Twins_Looked_Like_Girls.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Mischief_makers_LCCN2013648268.jpg/1280px-Mischief_makers_LCCN2013648268.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Planting_time_LCCN2013648290.jpg/1280px-Planting_time_LCCN2013648290.jpg"
];

const locationSelect = document.getElementById("location-select");
const chartCanvas = document.getElementById("turnoutChart");
const yAxisToggle = document.getElementById("y-axis-toggle");
const earlyVotingToggle = document.getElementById("early-voting-toggle");
const electionDayToggle = document.getElementById("election-day-toggle");
const statusMessage = document.createElement("p");
statusMessage.className =
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4";

if (chartCanvas?.parentNode) {
    chartCanvas.parentNode.insertBefore(statusMessage, chartCanvas);
} else {
    console.error("Chart canvas or its parent not found.");
    document.body.appendChild(statusMessage);
}

// caching
const metrics = {
    renderTime: [],
    dataLoadTime: [],
    interactions: 0,
};

const logMetric = (category, durationOrCount) => {
    if (typeof durationOrCount === "number" && category === "interactions") {
        metrics[category] = (metrics[category] || 0) + durationOrCount;
    } else if (typeof durationOrCount === "number") {
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
            statusMessage.textContent =
                `⚠️ Error loading latest data. Displaying older data.`;
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
    const data = parsedData[year].locations.find(
        (loc) => loc.name === locationName
    );
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

    // Parse headers, identify election days
    const headers = lines[0]
        .split(",")
        .slice(2)
        .map((h) => {
            const trimmedHeader = h.trim();
            const isElectionDay = trimmedHeader.startsWith("*");
            return {
                date: trimmedHeader.replace("*", ""),
                isElectionDay: isElectionDay,
            };
        })
        .filter((h) => h.date); // Filter out empty headers

    parsedData[year].dates = headers;

    lines.slice(1).forEach((line) => {
        const columns = line.split(",");
        const locationName = columns[0]?.trim();
        if (!locationName) return;

        // Map data points corresponding to the parsed headers
        const dailyData = headers.map(
            (_, index) => parseFloat(columns[index + 2]?.trim() || "0") || 0
        );

        if (locationName.toLowerCase().startsWith("total")) {
            parsedData[year].totals = dailyData;
        } else {
            parsedData[year].locations.push({
                name: locationName,
                data: dailyData,
            });
        }
    });

    parsedData[year].locations.sort((a, b) => a.name.localeCompare(b.name));
}, () => {
    console.error("CSV Parsing failed. Resetting data for the year.");
    parsedData[2025] = { locations: [], dates: [], totals: [] };
    if (turnoutChart) {
        turnoutChart.destroy();
        turnoutChart = null;
    }
    if (chartCanvas) {
        const ctx = chartCanvas.getContext("2d");
        ctx?.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
});

const getRandomCatImage = () => {
    return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
};

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
            statusMessage.textContent =
                `Could not load location list for ${yearToUse}.`;
        }
    }
};

const createChartConfig = (labels, datasets, title, chartType = "line") => {
    const startAtZero = yAxisToggle ? yAxisToggle.checked : true;
    const themeColors = {
        ticksColor: "#9CA3AF",
        gridColor: "#374151",
        legendColor: "#E5E7EB",
        titleColor: "#F9FAFB",
        tooltipBgColor: "#1F2937",
        tooltipTitleColor: "#E5E7EB",
        tooltipBodyColor: "#D1D5DB",
    };

    return {
        type: chartType, // Use the passed chartType
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: startAtZero,
                    title: {
                        display: true,
                        text: "Number of Voters",
                        color: themeColors.legendColor,
                    },
                    ticks: { color: themeColors.ticksColor },
                    grid: { color: themeColors.gridColor },
                },
                x: {
                    title: {
                        display: true,
                        text: "Date",
                        color: themeColors.legendColor,
                    },
                    ticks: { color: themeColors.ticksColor },
                    grid: { color: themeColors.gridColor },
                },
            },
            plugins: {
                tooltip: {
                    mode: "index",
                    intersect: false,
                    backgroundColor: themeColors.tooltipBgColor,
                    titleColor: themeColors.tooltipTitleColor,
                    bodyColor: themeColors.tooltipBodyColor,
                },
                title: {
                    display: true,
                    text: title,
                    color: themeColors.titleColor,
                    font: { size: 16 },
                },
                legend: {
                    position: "top",
                    labels: { color: themeColors.legendColor },
                },
            },
            interaction: { mode: "nearest", axis: "x", intersect: false },
        },
    };
};

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

    // Clear previous status messages if not critical
    if (
        !statusMessage.textContent.startsWith("⚠️") &&
        !statusMessage.textContent.startsWith("Loading")
    ) {
        statusMessage.textContent = "";
    }

    // Check if toggles exist before reading checked state
    const showEarlyVoting = earlyVotingToggle ? earlyVotingToggle.checked : true;
    const showElectionDay = electionDayToggle
        ? electionDayToggle.checked
        : true;

    // If neither toggle is checked, show a cat
    if (!showEarlyVoting && !showElectionDay) {
        if (turnoutChart) {
            turnoutChart.destroy();
            turnoutChart = null;
        }
        chartCanvas.style.display = "none"; // Hide canvas
        statusMessage.textContent = ""; // Clear loading/error messages

        // Create or get cat container
        let catContainer = document.getElementById("cat-container");
        if (!catContainer) {
            catContainer = document.createElement("div");
            catContainer.id = "cat-container";
            catContainer.className =
                "absolute inset-0 flex flex-col items-center justify-center p-4"; // Center content
            chartCanvas.parentNode.appendChild(catContainer);
        }
        catContainer.style.display = "flex"; // Show container

        // Add message
        const catMessage = document.createElement("p");
        catMessage.textContent = "oops, no data... have a cat instead?";
        catMessage.className = "text-gray-300 text-lg mb-4";

        // Add image
        const img = document.createElement("img");
        img.src = getRandomCatImage();
        img.alt = "A cute cat";
        img.className = "max-w-full max-h-[80%] object-contain rounded"; // Ensure image fits and looks good

        // Clear previous content and add new
        catContainer.innerHTML = "";
        catContainer.appendChild(catMessage);
        catContainer.appendChild(img);

        return; // Stop further chart rendering
    } else {
        // Hide cat container if it exists and show canvas
        const catContainer = document.getElementById("cat-container");
        if (catContainer) {
            catContainer.style.display = "none";
        }
        chartCanvas.style.display = "block";
    }

    if (!yearData || !yearData.dates?.length) {
        console.warn(`renderChart: No data available to render for ${year}.`);
        statusMessage.textContent = `No data loaded for ${year}.`;
        if (turnoutChart) {
            turnoutChart.destroy();
            turnoutChart = null;
        }
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        return;
    }

    // Filter data based on toggles
    const indicesToKeep = yearData.dates
        .map((dateInfo, index) => {
            if (dateInfo.isElectionDay && showElectionDay) return index;
            if (!dateInfo.isElectionDay && showEarlyVoting) return index;
            return -1; // Mark for removal
        })
        .filter((index) => index !== -1);

    if (indicesToKeep.length === 0) {
        if (turnoutChart) {
            turnoutChart.destroy();
            turnoutChart = null;
        }
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        statusMessage.textContent = "No data to display for this selection.";
        return;
    }

    const filteredLabels = indicesToKeep.map(
        (index) => yearData.dates[index].date
    );
    const hasOnlyElectionDay =
        indicesToKeep.length > 0 &&
        indicesToKeep.every((index) => yearData.dates[index].isElectionDay);

    let datasets = [];
    let chartTitle = `Daily Early Voting Turnout - ${year}`;
    const accentColor = "#EC4899"; // Pink-500
    const chartType = hasOnlyElectionDay ? "bar" : "line"; // Switch to bar if only Election Day

    if (selectedLocation === "total") {
        if (yearData.totals?.length) {
            const filteredTotals = indicesToKeep.map(
                (index) => yearData.totals[index]
            );
            datasets.push({
                label: `Total Turnout ${year}`,
                data: filteredTotals,
                borderColor: accentColor,
                backgroundColor:
                    chartType === "bar" ? accentColor : accentColor + "33", // Solid for bar
                tension: 0.1,
                fill: chartType === "line" ? false : undefined, // No fill for line unless specified
                pointRadius: chartType === "line" ? 3 : undefined,
                pointHoverRadius: chartType === "line" ? 5 : undefined,
            });
            chartTitle = `Total Daily Early Voting Turnout - ${year}`;
        } else {
            console.warn(`renderChart: No 'Total' data found for ${year}.`);
            statusMessage.textContent = `Total turnout data missing for ${year}.`;
        }
    } else {
        const locationData = getLocationData(year, selectedLocation);
        if (locationData?.data?.length) {
            const filteredLocationData = indicesToKeep.map(
                (index) => locationData.data[index]
            );
            datasets.push({
                label: `${locationData.name} ${year}`,
                data: filteredLocationData,
                borderColor: accentColor,
                backgroundColor:
                    chartType === "bar" ? accentColor : accentColor + "33",
                tension: 0.1,
                fill: chartType === "line" ? false : undefined,
                pointRadius: chartType === "line" ? 3 : undefined,
                pointHoverRadius: chartType === "line" ? 5 : undefined,
            });
            chartTitle = `Daily Turnout for ${locationData.name} - ${year}`;
        } else {
            console.warn(
                `renderChart: No data found or empty for location: "${selectedLocation}"`
            );
            statusMessage.textContent =
                `Data for location "${selectedLocation}" not found.`;
        }
    }

    if (datasets.length === 0 || datasets[0].data.length === 0) {
        if (turnoutChart) {
            turnoutChart.destroy();
            turnoutChart = null;
        }
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        if (!statusMessage.textContent.includes("⚠️")) {
            statusMessage.textContent = "No data to display for this selection.";
        }
        return;
    }

    // If chart exists and type changes, destroy and recreate
    if (turnoutChart && turnoutChart.config.type !== chartType) {
        turnoutChart.destroy();
        turnoutChart = null;
    }

    if (turnoutChart) {
        turnoutChart.data.labels = filteredLabels;
        turnoutChart.data.datasets = datasets;
        turnoutChart.options.plugins.title.text = chartTitle;
        turnoutChart.options.scales.y.beginAtZero = yAxisToggle
            ? yAxisToggle.checked
            : true;
        turnoutChart.update();
    } else {
        const config = createChartConfig(
            filteredLabels,
            datasets,
            chartTitle,
            chartType // Pass the determined chart type
        );
        turnoutChart = new Chart(ctx, config);
    }
};

const debouncedRenderChart = debounce(() => {
    const startTime = performance.now();
    try {
        renderChart();
        logMetric("renderTime", performance.now() - startTime);
    } catch (error) {
        console.error("Error during debounced renderChart:", error);
        statusMessage.textContent = "Error updating chart display.";
    }
}, 250);

const setupEventListeners = () => {
    if (locationSelect) {
        locationSelect.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    } else {
        console.error("Location select element not found for event listener.");
    }

    if (yAxisToggle) {
        yAxisToggle.addEventListener("change", () => {
            if (turnoutChart) {
                // Only update if chart exists and isn't showing a cat
                if (chartCanvas.style.display !== "none") {
                    turnoutChart.options.scales.y.beginAtZero =
                        yAxisToggle.checked;
                    turnoutChart.update();
                }
                logMetric("interactions", 1);
            }
        });
    } else {
        console.error("Y-axis toggle element not found for event listener.");
    }

    // Add listeners for the new toggles
    if (earlyVotingToggle) {
        earlyVotingToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart(); // Re-render needed as data filtering changes
        });
    } else {
        console.error("Early voting toggle not found for event listener.");
    }

    if (electionDayToggle) {
        electionDayToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart(); // Re-render needed as data filtering changes
        });
    } else {
        console.error("Election day toggle not found for event listener.");
    }
};

const initialize = wrapAsyncErrorHandler(async () => {
    statusMessage.textContent = "Loading data...";
    chartCanvas.style.display = "block"; // Ensure canvas is visible initially
    const catContainer = document.getElementById("cat-container");
    if (catContainer) catContainer.style.display = "none"; // Hide cat container

    const year = 2025;
    const csvText = await fetchWithCache(year);
    await parseCSV(csvText, year);

    if (!parsedData[year]?.dates?.length) {
        console.warn("Initialization halted: No valid data after parsing.");
        // Don't clear status message if it's already showing an error
        if (!statusMessage.textContent.includes("⚠️")) {
             statusMessage.textContent = "Failed to load initial data.";
        }
        return; // Stop if parsing failed or yielded no data
    }

    populateLocationDropdown();
    setupEventListeners(); // Setup listeners before first render
    debouncedRenderChart(); // Initial chart render

    // Clear loading message only if successful and no other message is set
     if (!statusMessage.textContent.includes("⚠️") && statusMessage.textContent === "Loading data...") {
         statusMessage.textContent = "";
     }


    // Set up auto-refresh interval
    setInterval(async () => {
        try {
            const newData = await fetchWithCache(year);
            const cacheKey = `voting-data-${year}`;
            const cached = localStorage.getItem(cacheKey);
            const oldRawData = cached ? JSON.parse(cached).data : null;

            if (newData !== oldRawData) {
                console.log("Data changed. Reparsing and updating chart...");
                await parseCSV(newData, year);
                if (parsedData[year]?.dates?.length) {
                    // Re-populate dropdown in case locations changed (unlikely but possible)
                    populateLocationDropdown();
                    debouncedRenderChart(); // Update chart with new data
                } else {
                    console.warn("Auto-refresh: Parsing resulted in no data.");
                     if (!statusMessage.textContent.includes("⚠️")) {
                         statusMessage.textContent = "Failed to refresh data.";
                     }
                }
            }
        } catch (error) {
            console.error("Auto-refresh failed:", error);
             if (!statusMessage.textContent.includes("⚠️")) {
                 statusMessage.textContent = "⚠️ Error during auto-refresh.";
             }
        }
    }, 900000); // 15 minutes
});

// Function to expose performance metrics (optional)
window.getPerformanceMetrics = () => {
    const safeReduce = (arr) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
        averageRenderTime: safeReduce(metrics.renderTime).toFixed(2) + "ms",
        averageLoadTime: safeReduce(metrics.dataLoadTime).toFixed(2) + "ms",
        totalInteractions: metrics.interactions || 0,
    };
};

// Initialize the application once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initialize);