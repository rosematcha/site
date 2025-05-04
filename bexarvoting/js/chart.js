// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates } from "./ui.js";
import { debounce } from "./utils.js";

let turnoutChart = null;
let catContainer = null;

const chartCanvas = document.getElementById("turnoutChart");
const chartContainer = document.getElementById("chart-container");

// --- getRandomCatImage() remains the same ---
const getRandomCatImage = () => {
    return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
};

// --- showCat() remains the same ---
const showCat = () => {
    if (!chartContainer || !chartCanvas) return;

    if (turnoutChart) {
        turnoutChart.destroy();
        turnoutChart = null;
    }
    chartCanvas.style.display = "none";

    if (!catContainer) {
        catContainer = document.createElement("div");
        catContainer.id = "cat-container";
        catContainer.className =
            "absolute inset-0 flex flex-col items-center justify-center p-4 text-center";
        chartContainer.appendChild(catContainer);
    }
    catContainer.style.display = "flex";

    const catMessage = document.createElement("p");
    catMessage.textContent = "oops, no data... have a cat instead?";
    catMessage.className = "text-gray-300 text-lg mb-4";

    const img = document.createElement("img");
    img.src = getRandomCatImage();
    img.alt = "A cute cat";
    img.className = "max-w-full max-h-[70%] object-contain rounded";

    catContainer.innerHTML = "";
    catContainer.appendChild(catMessage);
    catContainer.appendChild(img);
};

// --- hideCat() remains the same ---
const hideCat = () => {
    if (catContainer) {
        catContainer.style.display = "none";
    }
    if (chartCanvas) {
        chartCanvas.style.display = "block";
    }
};

/**
 * Creates the configuration object for Chart.js. (MODIFIED)
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
        ticksColor: "#9CA3AF",
        gridColor: "#374151",
        legendColor: "#E5E7EB",
        titleColor: "#F9FAFB",
        tooltipBgColor: "#1F2937",
        tooltipTitleColor: "#E5E7EB",
        tooltipBodyColor: "#D1D5DB",
    };

    return {
        type: chartType,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Crucial for fixed container height
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
                    ticks: {
                        color: themeColors.ticksColor,
                        maxRotation: 45,
                        minRotation: 0,
                    },
                    grid: { color: themeColors.gridColor },
                },
            },
            plugins: {
                tooltip: {
                    mode: "index", // Show all datasets at the hovered index
                    intersect: false, // Don't require direct hover on point
                    backgroundColor: themeColors.tooltipBgColor,
                    titleColor: themeColors.tooltipTitleColor,
                    bodyColor: themeColors.tooltipBodyColor,
                    // Sort tooltip items by value, descending
                    itemSort: (a, b) => {
                        return b.parsed.y - a.parsed.y;
                    },
                },
                title: {
                    display: true,
                    text: title,
                    color: themeColors.titleColor,
                    font: { size: 16 },
                },
                legend: {
                    position: "top", // Legend at the top
                    labels: {
                        color: themeColors.legendColor,
                        boxWidth: 20, // Adjust legend color box size if needed
                        padding: 10, // Adjust padding between legend items
                    },
                },
            },
            interaction: { mode: "index", axis: "x", intersect: false }, // Ensure interaction mode matches tooltip
        },
    };
};

// --- renderChart() remains the same ---
// (No changes needed here, the config function handles the updates)
const renderChart = () => {
    const selectedYears = getSelectedYears();
    const selectedLocations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero } = getToggleStates();

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        return;
    }

    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat();
        return;
    }

    hideCat();

    let datasets = [];
    let labels = [];
    let colorIndex = 0;
    let hasOnlyElectionDayData = true;

    const primaryYear = selectedYears.find((year) => getDatesForYear(year));
    if (primaryYear) {
        const yearDates = getDatesForYear(primaryYear);
        if (yearDates) {
            labels = yearDates
                .filter(
                    (d) =>
                        (d.isElectionDay && showElectionDay) ||
                        (!d.isElectionDay && showEarlyVoting)
                )
                .map((d) => d.date);
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
                if (selectionData.dates.some((d) => !d.isElectionDay)) {
                    hasOnlyElectionDayData = false;
                }

                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;

                const alignedData = labels.map((labelDate) => {
                    const dataIndex = selectionData.dates.findIndex(
                        (d) => d.date === labelDate
                    );
                    return dataIndex !== -1
                        ? selectionData.data[dataIndex]
                        : null;
                });

                datasets.push({
                    label: `${selectionData.name} - ${year}`,
                    data: alignedData,
                    borderColor: color,
                    backgroundColor: color + "33",
                    tension: 0.1,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: true,
                });
            }
        });
    });

    if (datasets.length === 0) {
        showCat();
        return;
    }

    const chartType =
        datasets.length === 1 && hasOnlyElectionDayData ? "bar" : "line";
    const chartTitle =
        datasets.length === 1
            ? `${datasets[0].label} Daily Turnout`
            : "Comparative Daily Turnout";

    if (chartType === "bar") {
        datasets.forEach((ds) => {
            ds.backgroundColor = ds.borderColor;
            delete ds.tension;
            delete ds.fill;
            delete ds.pointRadius;
            delete ds.pointHoverRadius;
            delete ds.spanGaps;
        });
    } else {
        datasets.forEach((ds) => {
            ds.backgroundColor = ds.borderColor + "33";
            ds.tension = 0.1;
            ds.fill = false;
            ds.pointRadius = 3;
            ds.pointHoverRadius = 5;
            ds.spanGaps = true;
        });
    }

    if (turnoutChart && turnoutChart.config.type !== chartType) {
        turnoutChart.destroy();
        turnoutChart = null;
    }

    if (turnoutChart) {
        turnoutChart.data.labels = labels;
        turnoutChart.data.datasets = datasets;
        turnoutChart.options.plugins.title.text = chartTitle;
        turnoutChart.options.scales.y.beginAtZero = startYAtZero;
        // Update tooltip sort function if needed (though it's set in config)
        turnoutChart.options.plugins.tooltip.itemSort = (a, b) => b.parsed.y - a.parsed.y;
        turnoutChart.update();
    } else {
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

// --- debouncedRenderChart() remains the same ---
export const debouncedRenderChart = debounce(renderChart, 250);
