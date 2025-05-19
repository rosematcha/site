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

    // --- GROUPED BAR MODE: Election Day only, multiple years, multiple locations ---
    if (showElectionDay && !showEarlyVoting && selectedYears.length > 1 && selectedLocations.length > 0) {
        hideCat();
        // x-axis: locations
        const labels = selectedLocations;
        let datasets = [];
        let colorIndex = 0;
        for (const year of selectedYears) {
            const data = [];
            for (const location of selectedLocations) {
                const selectionData = getDataForSelection(year, location, false, true);
                // Find the election day value (should be only one value)
                let edValue = null;
                if (selectionData && selectionData.dates && selectionData.dates.length > 0) {
                    for (let i = 0; i < selectionData.dates.length; i++) {
                        if (selectionData.dates[i].isElectionDay) {
                            edValue = selectionData.data[i];
                            break;
                        }
                    }
                }
                data.push(edValue);
            }
            const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
            colorIndex++;
            datasets.push({
                label: year,
                data,
                backgroundColor: color,
                borderColor: color,
            });
        }
        const chartTitle = `Election Day Turnout by Location (Grouped by Year)`;
        const chartType = "bar";
        if (turnoutChart && turnoutChart.config.type !== chartType) {
            turnoutChart.destroy();
            turnoutChart = null;
        }
        if (turnoutChart) {
            turnoutChart.data.labels = labels;
            turnoutChart.data.datasets = datasets;
            turnoutChart.options.plugins.title.text = chartTitle;
            turnoutChart.options.scales.y.beginAtZero = startYAtZero;
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
        return;
    }
    hideCat();

    let datasets = [];
    let labels = []; // This will now store "Day X" or "Election Day"
    let colorIndex = 0;
    let hasOnlyElectionDayData = true; // This seems specific to single dataset view, might need re-eval for multi-year

    // Determine the maximum number of days across all selected years for the x-axis
    let maxDays = 0;
    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year);
        if (yearDates) {
            const nonElectionDayCount = yearDates.filter(
                (d) => !d.isElectionDay
            ).length;
            const electionDayPresent = yearDates.some((d) => d.isElectionDay);
            let currentYearMaxDays = nonElectionDayCount;
            if (electionDayPresent) currentYearMaxDays++; // Add one for election day if present
            if (currentYearMaxDays > maxDays) {
                maxDays = currentYearMaxDays;
            }
        }
    });

    // Generate labels based on maxDays
    for (let i = 1; i <= maxDays; i++) {
        // Check if this day index corresponds to an election day in *any* of the selected years
        // This is a simplification; assumes election day is the last day if present.
        let isCommonElectionDay = false;
        if (showElectionDay) {
            let allYearsHaveThisAsED = true;
            let atLeastOneYearHasThisAsED = false;
            for (const year of selectedYears) {
                const yearDates = getDatesForYear(year);
                if (yearDates) {
                    const edDate = yearDates.find((d) => d.isElectionDay);
                    const nonEdDatesCount = yearDates.filter((d) => !d.isElectionDay)
                        .length;
                    if (edDate && (nonEdDatesCount + 1 === i)) {
                        atLeastOneYearHasThisAsED = true;
                    } else if (edDate && (nonEdDatesCount + 1 !== i)) {
                        // This year has an ED, but not at this day index
                    } else if (!edDate && i > nonEdDatesCount) {
                        // This year doesn't have ED, and i is beyond its non-ED days
                        allYearsHaveThisAsED = false; // This logic might need refinement for differing lengths
                    }
                }
            }
            // A more robust way: if i is the last day in our maxDays sequence, and showElectionDay is true,
            // and at least one selected year has an election day, label it "Election Day".
            if (
                i === maxDays &&
                selectedYears.some((year) =>
                    getDatesForYear(year)?.some((d) => d.isElectionDay)
                )
            ) {
                isCommonElectionDay = true;
            }
        }

        if (isCommonElectionDay) {
            labels.push("Election Day");
        } else {
            labels.push(`Day ${i}`);
        }
    }
    // Ensure labels are unique if multiple election days end up being the same label (e.g. if not all years have ED)
    // This is a basic fix; a more complex scenario might need smarter label generation.
    if (labels.filter((l) => l === "Election Day").length > 1) {
        let edCount = 1;
        labels = labels.map((l) =>
            l === "Election Day" ? `Election Day ${edCount++}` : l
        );
        // If only one ED, remove the number
        if (edCount === 2)
            labels = labels.map((l) => (l === "Election Day 1" ? "Election Day" : l));
    }

    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year); // Get all dates for this year
        if (!yearDates) return;

        selectedLocations.forEach((locationKey) => {
            const selectionData = getDataForSelection(
                year,
                locationKey,
                showEarlyVoting,
                showElectionDay
            );

            if (selectionData && selectionData.data.length > 0) {
                // This logic needs to change to map to "Day X" labels
                const alignedData = new Array(labels.length).fill(null);
                let edDataFoundForThisSet = false;

                selectionData.dates.forEach((dateInfo, dataIndex) => {
                    let labelIndex = -1;
                    if (dateInfo.isElectionDay && showElectionDay) {
                        // Find the "Election Day" label. This assumes one ED label or the last one.
                        labelIndex = labels.lastIndexOf("Election Day");
                        // If multiple ED labels, find the one that makes sense (e.g. based on relative position)
                        if (labels.filter((l) => l.startsWith("Election Day")).length > 1) {
                            // This part is tricky. For now, let's assume the last ED label is the one.
                            // A more robust solution would require matching ED dayIndex across years if they differ.
                        }
                        edDataFoundForThisSet = true;
                    } else if (!dateInfo.isElectionDay && showEarlyVoting) {
                        // dateInfo.dayIndex should exist now
                        const dayLabel = `Day ${dateInfo.dayIndex}`;
                        labelIndex = labels.indexOf(dayLabel);
                    }

                    if (labelIndex !== -1 && dataIndex < selectionData.data.length) {
                        alignedData[labelIndex] = selectionData.data[dataIndex];
                    }
                });

                // Special handling if only election day data is shown and it's the only data point
                if (
                    selectionData.dates.length === 1 &&
                    selectionData.dates[0].isElectionDay &&
                    showElectionDay &&
                    !showEarlyVoting
                ) {
                    hasOnlyElectionDayData = true; // For this specific dataset
                } else {
                    // Check if all *displayed* data points for this dataset are from election days
                    let allDisplayedIsEd = true;
                    for (let i = 0; i < selectionData.dates.length; i++) {
                        const dateInfo = selectionData.dates[i];
                        const dataVal = selectionData.data[i];
                        if (dataVal !== null && dataVal > 0) {
                            // Consider only points with data
                            if (dateInfo.isElectionDay && !showElectionDay) allDisplayedIsEd = false;
                            if (!dateInfo.isElectionDay && !showEarlyVoting) allDisplayedIsEd = false;
                            if (!dateInfo.isElectionDay && showEarlyVoting) allDisplayedIsEd = false; // If any EV day has data, it's not ED-only display
                        }
                    }
                    if (!selectionData.dates.some((d) => !d.isElectionDay && selectionData.data[selectionData.dates.indexOf(d)] > 0 && showEarlyVoting)) {
                        // No early voting data shown for this set
                    } else {
                        hasOnlyElectionDayData = false;
                    }
                }

                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;

                datasets.push({
                    label: `${selectionData.name} - ${year}`,
                    data: alignedData,
                    borderColor: color,
                    backgroundColor: color + "33", // Slight transparency for area fill
                    tension: 0.1,
                    fill: false, // No fill for line charts by default
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: true, // Connect points with nulls in between
                });
            }
        });
    });

    if (datasets.length === 0) {
        showCat();
        return;
    }

    // Determine chart type (bar if single ED-only dataset, line otherwise)
    const chartType =
        datasets.length === 1 &&
        showElectionDay &&
        !showEarlyVoting &&
        datasets[0].data.filter((d) => d !== null).length === 1 && // Only one data point
        labels[datasets[0].data.findIndex((d) => d !== null)]?.startsWith("Election Day") // That point is ED
            ? "bar"
            : "line";
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
