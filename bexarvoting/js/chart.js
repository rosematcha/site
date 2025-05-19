// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates, manageDisplay } from "./ui.js"; // Import manageDisplay
import { debounce } from "./utils.js";
import { updateURLFromState } from "./main.js"; // For updating URL after chart render

let turnoutChart = null;
let catContainer = null;

const chartCanvas = document.getElementById("turnoutChart");
const chartContainerElement = document.getElementById("chart-container"); // Renamed to avoid conflict with local chartContainer var

export const getCurrentChartInstance = () => turnoutChart; // Export for ui.js

const getRandomCatImage = () => {
    return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
};

const showCat = () => {
    if (!chartContainerElement || !chartCanvas) return;

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
        // Prepend to chartContainerElement so it's behind status message if status is also absolute
        chartContainerElement.insertBefore(catContainer, chartContainerElement.firstChild);
    }
    catContainer.style.display = "flex";
    catContainer.classList.remove("hidden");


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

const hideCat = () => {
    if (catContainer) {
        catContainer.style.display = "none";
        catContainer.classList.add("hidden");
    }
    if (chartCanvas) {
        chartCanvas.style.display = "block";
    }
};

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
                    mode: "index",
                    intersect: false,
                    backgroundColor: themeColors.tooltipBgColor,
                    titleColor: themeColors.tooltipTitleColor,
                    bodyColor: themeColors.tooltipBodyColor,
                    itemSort: (a, b) => b.parsed.y - a.parsed.y,
                },
                title: {
                    display: true,
                    text: title,
                    color: themeColors.titleColor,
                    font: { size: 16 },
                },
                legend: {
                    position: "top",
                    labels: {
                        color: themeColors.legendColor,
                        boxWidth: 20,
                        padding: 10,
                    },
                },
            },
            interaction: { mode: "index", axis: "x", intersect: false },
        },
    };
};

const renderChart = () => {
    const selectedYears = getSelectedYears();
    const selectedLocations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero, showDataTable } = getToggleStates();

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        manageDisplay(); // Manage display even if canvas fails
        return;
    }

    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat(); // This will set turnoutChart to null
        manageDisplay();
        updateURLFromState(); // Update URL to reflect empty state
        return;
    }

    // --- GROUPED BAR MODE ---
    if (showElectionDay && !showEarlyVoting && selectedYears.length > 1 && selectedLocations.length > 0) {
        hideCat();
        const labels = selectedLocations;
        let datasets = [];
        let colorIndex = 0;
        for (const year of selectedYears) {
            const data = [];
            for (const location of selectedLocations) {
                const selectionData = getDataForSelection(year, location, false, true);
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
            const config = createChartConfig(labels, datasets, chartTitle, startYAtZero, chartType);
            turnoutChart = new Chart(ctx, config);
        }
        manageDisplay();
        updateURLFromState();
        return;
    }
    hideCat(); // Hide cat for other line/bar chart types

    let datasets = [];
    let labels = [];
    let colorIndex = 0;
    let maxDays = 0;

    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year);
        if (yearDates) {
            const nonElectionDayCount = yearDates.filter((d) => !d.isElectionDay).length;
            const electionDayPresent = yearDates.some((d) => d.isElectionDay);
            let currentYearMaxDays = nonElectionDayCount;
            if (electionDayPresent && showElectionDay) currentYearMaxDays++; // Only count ED if shown
            else if (!showEarlyVoting && electionDayPresent && showElectionDay) currentYearMaxDays = 1; // If only ED shown
            
            if (!showEarlyVoting && !showElectionDay) currentYearMaxDays = 0;


            if (currentYearMaxDays > maxDays) {
                maxDays = currentYearMaxDays;
            }
        }
    });
    
    // If only ED is shown, maxDays might be 1. If only EV, it's the count of EV days.
    // If both, it's EV days + 1 for ED (if ED exists and is shown).

    // Generate labels based on maxDays, considering what's toggled
    let dayCounter = 1;
    for (let i = 1; i <= maxDays; i++) {
        // This simplified logic assumes that if Election Day is shown and present,
        // it will be the last day in the 'maxDays' sequence.
        if (showElectionDay && i === maxDays && selectedYears.some(year => getDatesForYear(year)?.some(d => d.isElectionDay))) {
            labels.push("Election Day");
        } else if (showEarlyVoting) {
             labels.push(`Day ${dayCounter++}`);
        } else if (showElectionDay && maxDays === 1) { // Only ED is shown across all years
             labels.push("Election Day");
             break; // Only one label needed
        }
    }
    // If after loop, labels is empty (e.g. only ED checked but no year has ED, or maxDays was 0)
    if (labels.length === 0 && showElectionDay && selectedYears.some(year => getDatesForYear(year)?.some(d => d.isElectionDay))) {
        labels.push("Election Day"); // Fallback if only ED is possible and was missed
    }


    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year);
        if (!yearDates) return;

        selectedLocations.forEach((locationKey) => {
            const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);

            if (selectionData && selectionData.data.length > 0) {
                const alignedData = new Array(labels.length).fill(null);
                let currentLabelIndex = 0;

                selectionData.dates.forEach((dateInfo, dataIndex) => {
                    if (currentLabelIndex < labels.length) {
                         // Map selectionData.data to the correct position in alignedData based on generated labels
                        if (dateInfo.isElectionDay && showElectionDay && labels[labels.length-1] === "Election Day") {
                            alignedData[labels.length-1] = selectionData.data[dataIndex];
                        } else if (!dateInfo.isElectionDay && showEarlyVoting) {
                            // Find the `Day X` label that corresponds to this early voting day
                            // This requires careful indexing if `labels` are generated generically
                            // For now, assume they align if both EV and ED are shown, or just EV.
                             const targetLabel = `Day ${dateInfo.dayIndex}`; // Assuming dayIndex is from original full set
                             const labelIdxInCurrent = labels.findIndex(l => l === targetLabel);
                             if (labelIdxInCurrent !== -1) {
                                alignedData[labelIdxInCurrent] = selectionData.data[dataIndex];
                             } else if (labels[currentLabelIndex] && labels[currentLabelIndex].startsWith("Day ")) {
                                // Fallback: place sequentially if labels are just "Day X"
                                alignedData[currentLabelIndex] = selectionData.data[dataIndex];
                             }
                        }
                        currentLabelIndex++;
                    }
                });


                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;

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

    if (datasets.length === 0 || labels.length === 0) {
        showCat();
        manageDisplay();
        updateURLFromState();
        return;
    }


    const chartType =
        datasets.length === 1 &&
        showElectionDay &&
        !showEarlyVoting &&
        datasets[0].data.filter((d) => d !== null).length === 1 &&
        labels[datasets[0].data.findIndex((d) => d !== null)]?.startsWith("Election Day")
            ? "bar"
            : "line";

    const chartTitle = datasets.length === 1 ? `${datasets[0].label} Daily Turnout` : "Comparative Daily Turnout";

    if (chartType === "bar") {
        datasets.forEach((ds) => {
            ds.backgroundColor = ds.borderColor; // Solid color for bars
            delete ds.tension; delete ds.fill; delete ds.pointRadius; delete ds.pointHoverRadius; delete ds.spanGaps;
        });
    } else {
         datasets.forEach((ds) => { // Ensure line chart properties are correctly set
            ds.backgroundColor = ds.borderColor + "33"; // For area fill if enabled
            ds.tension = 0.1;
            ds.fill = false; // Explicitly false for line
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
        turnoutChart.update();
    } else {
        const config = createChartConfig(labels, datasets, chartTitle, startYAtZero, chartType);
        turnoutChart = new Chart(ctx, config);
    }

    manageDisplay(); // Let UI module handle showing chart/table
    updateURLFromState(); // Update URL after successful render
};

export const debouncedRenderChart = debounce(renderChart, 250);