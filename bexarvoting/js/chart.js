// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates } from "./ui.js";
import { debounce } from "./main.js"; // Import debounce

let turnoutChart = null;
let catContainer = null; // Reference to the cat display container

const chartCanvas = document.getElementById("turnoutChart");
const chartContainer = document.getElementById("chart-container");

/**
 * Gets a random cat image URL.
 * @returns {string} URL of a cat image.
 */
const getRandomCatImage = () => {
    return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
};

/**
 * Displays the cat image and message, hiding the chart canvas.
 */
const showCat = () => {
    if (!chartContainer || !chartCanvas) return;

    if (turnoutChart) {
        turnoutChart.destroy();
        turnoutChart = null;
    }
    chartCanvas.style.display = "none"; // Hide canvas

    if (!catContainer) {
        catContainer = document.createElement("div");
        catContainer.id = "cat-container";
        catContainer.className =
            "absolute inset-0 flex flex-col items-center justify-center p-4 text-center"; // Center content
        chartContainer.appendChild(catContainer);
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
    // Style for fitting without distortion
    img.className = "max-w-full max-h-[70%] object-contain rounded";

    // Clear previous content and add new
    catContainer.innerHTML = "";
    catContainer.appendChild(catMessage);
    catContainer.appendChild(img);
};

/**
 * Hides the cat image container and shows the chart canvas.
 */
const hideCat = () => {
    if (catContainer) {
        catContainer.style.display = "none";
    }
    if (chartCanvas) {
        chartCanvas.style.display = "block";
    }
};

/**
 * Creates the configuration object for Chart.js.
 * @param {string[]} labels - X-axis labels (dates).
 * @param {object[]} datasets - Array of dataset objects for Chart.js.
 * @param {string} title - Chart title.
 * @param {boolean} startYAtZero - Whether the Y-axis should start at zero.
 * @param {string} chartType - 'line' or 'bar'.
 * @returns {object} Chart.js configuration object.
 */
const createChartConfig = (
    labels,
    datasets,
    title,
    startYAtZero,
    chartType = "line"
) => {
    const themeColors = {
        ticksColor: "#9CA3AF", // gray-400
        gridColor: "#374151", // gray-700
        legendColor: "#E5E7EB", // gray-200
        titleColor: "#F9FAFB", // gray-50
        tooltipBgColor: "#1F2937", // gray-800
        tooltipTitleColor: "#E5E7EB", // gray-200
        tooltipBodyColor: "#D1D5DB", // gray-300
    };

    return {
        type: chartType,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: startYAtZero,
                    title: {
                        display: true,
                        text: "Number of Voters",
                        color: themeColors.legendColor,
                    },
                    ticks: { color: themeColors.ticksColor },
                    grid: { color: themeColors.gridColor },
                },
                x: {
                    // Potentially hide title if labels are self-explanatory dates
                    // title: { display: true, text: "Date", color: themeColors.legendColor },
                    ticks: { color: themeColors.ticksColor, maxRotation: 45, minRotation: 0 },
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

/**
 * Renders the chart based on current selections.
 */
const renderChart = () => {
    const selectedYears = getSelectedYears();
    const selectedLocations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero } = getToggleStates();

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        // updateStatusMessage("Error initializing chart canvas."); // Handled elsewhere
        return;
    }

    // Condition for showing the cat
    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat();
        return;
    }

    hideCat(); // Ensure cat is hidden if we proceed

    let datasets = [];
    let labels = [];
    let colorIndex = 0;
    let hasOnlyElectionDayData = true; // Assume true initially

    // Determine primary labels (use dates from the first selected year with data)
    const primaryYear = selectedYears.find(year => getDatesForYear(year));
    if (primaryYear) {
        const yearDates = getDatesForYear(primaryYear);
        if (yearDates) {
             // Filter labels based on toggles *for the primary year*
             labels = yearDates
                 .filter(d => (d.isElectionDay && showElectionDay) || (!d.isElectionDay && showEarlyVoting))
                 .map(d => d.date);
        }
    }


    selectedYears.forEach((year) => {
        selectedLocations.forEach((locationKey) => {
            const selectionData = getDataForSelection(
                year,
                locationKey,
                showEarlyVoting,
                showElectionDay
            );

            if (selectionData && selectionData.data.length > 0) {
                // Check if this dataset contains non-election day data
                if (selectionData.dates.some(d => !d.isElectionDay)) {
                    hasOnlyElectionDayData = false;
                }

                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;

                // Align data points with the primary labels
                // This is a simplified alignment: assumes dates match by string
                const alignedData = labels.map(labelDate => {
                    const dataIndex = selectionData.dates.findIndex(d => d.date === labelDate);
                    return dataIndex !== -1 ? selectionData.data[dataIndex] : null; // Use null for missing points
                });


                datasets.push({
                    label: `${selectionData.name} - ${year}`,
                    data: alignedData, // Use aligned data
                    borderColor: color,
                    backgroundColor: color + "33", // Semi-transparent for line area/bar fill
                    tension: 0.1,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: true, // Connect lines over null points
                });
            }
        });
    });

    // If no datasets were generated after filtering, show cat/message
    if (datasets.length === 0) {
        showCat(); // Or display a "No data for selection" message
        return;
    }

    // Determine chart type and title
    const chartType =
        datasets.length === 1 && hasOnlyElectionDayData ? "bar" : "line";
    const chartTitle =
        datasets.length === 1
            ? `${datasets[0].label} Daily Turnout`
            : "Comparative Daily Turnout";

    // Adjust dataset appearance for bar chart
    if (chartType === "bar") {
        datasets.forEach(ds => {
            ds.backgroundColor = ds.borderColor; // Solid color for bars
            delete ds.tension;
            delete ds.fill;
            delete ds.pointRadius;
            delete ds.pointHoverRadius;
            delete ds.spanGaps;
        });
    } else {
         datasets.forEach(ds => {
             ds.backgroundColor = ds.borderColor + "33";
             ds.tension = 0.1;
             ds.fill = false;
             ds.pointRadius = 3;
             ds.pointHoverRadius = 5;
             ds.spanGaps = true;
         });
    }


    // If chart exists and type changes, destroy and recreate
    if (turnoutChart && turnoutChart.config.type !== chartType) {
        turnoutChart.destroy();
        turnoutChart = null;
    }

    if (turnoutChart) {
        // Update existing chart
        turnoutChart.data.labels = labels;
        turnoutChart.data.datasets = datasets;
        turnoutChart.options.plugins.title.text = chartTitle;
        turnoutChart.options.scales.y.beginAtZero = startYAtZero;
        turnoutChart.update();
    } else {
        // Create new chart
        const config = createChartConfig(
            labels,
            datasets,
            chartTitle,
            startYAtZero,
            chartType
        );
        turnoutChart = new Chart(ctx, config);
    }
};

// Debounced version for frequent updates
export const debouncedRenderChart = debounce(renderChart, 250);
