/* global Chart */
import { CAT_IMAGES, CHART_COLORS } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates, manageDisplay, updateURLFromState } from "./ui.js";
import { debounce } from "./utils.js";

let turnoutChart = null;
let catContainer = null;

const chartCanvas = document.getElementById("turnoutChart");
const chartContainerElement = document.getElementById("chart-container");

const DEFAULT_COLLAPSED_EARLY_VOTING_DAYS = 12; // Fallback used when we cannot derive a typical window

const getQuartileValue = (sortedValues, percentile) => {
    if (!sortedValues.length) return 0;
    if (sortedValues.length === 1) return sortedValues[0];
    const position = (sortedValues.length - 1) * percentile;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
    const weight = position - lowerIndex;
    return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * weight;
};

const analyzeEarlyVotingDurations = (years) => {
    const entries = [];
    years.forEach((year) => {
        const dates = getDatesForYear(year);
        if (!dates || dates.length === 0) return;
        const earlyVotingDays = dates.filter((dateInfo) => !dateInfo.isElectionDay).length;
        if (earlyVotingDays === 0) return;
        entries.push({
            year,
            earlyVotingDays,
            totalDays: dates.length,
        });
    });

    if (entries.length === 0) {
        return {
            entries: [],
            typicalEarlyVotingDays: 0,
            maxEarlyVotingDays: 0,
            outlierYears: [],
        };
    }

    const sortedCounts = entries
        .map((entry) => entry.earlyVotingDays)
        .sort((a, b) => a - b);

    const q1 = getQuartileValue(sortedCounts, 0.25);
    const q3 = getQuartileValue(sortedCounts, 0.75);
    const iqr = q3 - q1;
    const upperFence = q3 + iqr * 1.5;

    const nonOutlierCounts = sortedCounts.filter((count) => count <= upperFence);
    const typicalEarlyVotingDays = nonOutlierCounts.length
        ? Math.round(nonOutlierCounts[nonOutlierCounts.length - 1])
        : Math.round(sortedCounts[sortedCounts.length - 1]);
    const maxEarlyVotingDays = sortedCounts[sortedCounts.length - 1];
    const outlierYears = entries
        .filter((entry) => entry.earlyVotingDays > upperFence)
        .map((entry) => ({
            year: entry.year,
            earlyVotingDays: entry.earlyVotingDays,
        }));

    return {
        entries,
        typicalEarlyVotingDays,
        maxEarlyVotingDays,
        outlierYears,
    };
};

export const getCurrentChartInstance = () => turnoutChart;

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

const chartFootnoteElement = document.getElementById("chart-footnote");

const setChartFootnote = (message) => {
    if (!chartFootnoteElement) return;
    if (message) {
        chartFootnoteElement.textContent = message;
        chartFootnoteElement.classList.remove("hidden");
    } else {
        chartFootnoteElement.textContent = "";
        chartFootnoteElement.classList.add("hidden");
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
    const {
        showEarlyVoting,
        showElectionDay,
        startYAtZero,
        dataPresentation,
        displayAs,
        includeExtendedDays
    } = getToggleStates();

    setChartFootnote("");
    const showCumulative = dataPresentation === 'cumulative';
    const earlyVotingStats = showEarlyVoting ? analyzeEarlyVotingDurations(selectedYears) : null;
    const typicalEarlyVotingDays = earlyVotingStats?.typicalEarlyVotingDays || 0;
    const maxEarlyVotingDays = earlyVotingStats?.maxEarlyVotingDays || 0;
    const outlierYears = earlyVotingStats?.outlierYears || [];

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        manageDisplay();
        return;
    }

    if (displayAs === 'table') {
        // Data still needs to be processed for the table, so chart logic runs.
        // manageDisplay() will handle showing the table and hiding the canvas.
    }

    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat();
        setChartFootnote("");
        manageDisplay(); // Ensure table is hidden if cat is shown
        updateURLFromState();
        return;
    }

    const isElectionDayOnlyComparison =
        showElectionDay && !showEarlyVoting && selectedYears.length > 1 && selectedLocations.length > 0;

    if (isElectionDayOnlyComparison && !showCumulative) {
        hideCat();
        const labels = selectedLocations;
        let datasets = [];
        let colorIndex = 0;
        for (const year of selectedYears) {
            const data = [];
            for (const location of selectedLocations) {
                const selectionData = getDataForSelection(year, location, false, true);
                let edValue = null;
                if (selectionData && selectionData.data && selectionData.data.length > 0) {
                     edValue = selectionData.data[0];
                }
                data.push(edValue);
            }
             if (data.some(val => val !== null)) {
                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;
                datasets.push({
                    label: year,
                    data,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1,
                });
            }
        }

         if (datasets.length === 0) {
            showCat();
            manageDisplay();
            updateURLFromState();
            return;
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
        setChartFootnote("");
    } else { // Line / Cumulative / Standard Bar Chart Mode
        hideCat();
        let datasets = [];
        let labelKeys = [];
        let chartLabels = [];
        let colorIndex = 0;

        const fallbackEarlyVotingDays = maxEarlyVotingDays || DEFAULT_COLLAPSED_EARLY_VOTING_DAYS;
        const trimmedDayCount = Math.max(1, typicalEarlyVotingDays || fallbackEarlyVotingDays);
        const totalEarlyVotingDays = showEarlyVoting ? maxEarlyVotingDays : 0;

        let visibleEarlyVotingDays = 0;
        if (showEarlyVoting) {
            if (includeExtendedDays) {
                visibleEarlyVotingDays = totalEarlyVotingDays;
            } else if (totalEarlyVotingDays > 0) {
                visibleEarlyVotingDays = Math.min(trimmedDayCount, totalEarlyVotingDays);
            } else {
                visibleEarlyVotingDays = 0;
            }
        }

        const hiddenDayCount =
            showEarlyVoting && totalEarlyVotingDays > 0
                ? Math.max(0, totalEarlyVotingDays - visibleEarlyVotingDays)
                : 0;
        const hasExtendedDays = hiddenDayCount > 0;

        if (showEarlyVoting && visibleEarlyVotingDays > 0) {
            for (let i = 1; i <= visibleEarlyVotingDays; i++) {
                labelKeys.push(`Day ${i}`);
            }
        }

        if (showElectionDay) {
            labelKeys.push("Election Day");
        }

        const labelIndexMap = new Map(labelKeys.map((label, index) => [label, index]));

        selectedYears.forEach((year) => {
            const yearDatesFull = getDatesForYear(year);
            if (!yearDatesFull) return;

            selectedLocations.forEach((locationKey) => {
                const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);
                if (!selectionData || selectionData.data.length === 0) return;

                let processedData = [...selectionData.data];
                if (showCumulative) {
                    processedData = processedData.map(((sum) => (value) => sum += (value || 0))(0));
                }

                const alignedData = new Array(labelKeys.length).fill(null);
                let currentDataIndex = 0;
                let evDayCounterForThisSeries = 0;

                selectionData.dates.forEach((dateInfoFromSelection) => {
                    let labelToFind;
                    if (dateInfoFromSelection.isElectionDay) {
                        labelToFind = "Election Day";
                    } else {
                        evDayCounterForThisSeries++;
                        labelToFind = `Day ${evDayCounterForThisSeries}`;
                    }

                    const targetLabelIndex = labelIndexMap.get(labelToFind);
                    if (dateInfoFromSelection.isElectionDay) {
                        if (targetLabelIndex !== undefined && targetLabelIndex !== -1 && currentDataIndex < processedData.length) {
                            alignedData[targetLabelIndex] = processedData[currentDataIndex];
                        }
                    } else if (
                        targetLabelIndex !== undefined &&
                        targetLabelIndex !== -1 &&
                        currentDataIndex < processedData.length
                    ) {
                        alignedData[targetLabelIndex] = processedData[currentDataIndex];
                    }
                    currentDataIndex++;
                });

                if (!alignedData.some((val) => val !== null)) return;

                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;
                datasets.push({
                    label: `${selectionData.name} - ${year}`,
                    data: alignedData,
                    borderColor: color,
                    backgroundColor: color + "33",
                    tension: 0.1,
                    fill: false,
                    spanGaps: false,
                });
            });
        });

        chartLabels = [...labelKeys];

        if (!includeExtendedDays && hasExtendedDays) {
            const extendedEntries = earlyVotingStats?.entries || [];
            const supportingYears = extendedEntries
                .filter((entry) => entry.earlyVotingDays > visibleEarlyVotingDays)
                .map((entry) => `${entry.year} (${entry.earlyVotingDays} days)`)
                .join(", ");
            const yearDetails = supportingYears ? ` (${supportingYears})` : "";
            const visibleLabel = visibleEarlyVotingDays === 1 ? "day" : "days";
            const hiddenLabel = hiddenDayCount === 1 ? "day remains hidden" : "days remain hidden";
            setChartFootnote(
                `Showing the first ${visibleEarlyVotingDays} ${visibleLabel} of early voting; ${hiddenDayCount} ${hiddenLabel}. Enable "Show full early voting period" to view everything${yearDetails}.`
            );
        } else {
            setChartFootnote("");
        }

        if (datasets.length === 0 || chartLabels.length === 0) {
            showCat();
            setChartFootnote("");
        } else {
            let chartType = "line";
            if (datasets.length === 1 && datasets[0].data.filter((d) => d !== null).length === 1) {
                const singleDataPointIndex = datasets[0].data.findIndex((d) => d !== null);
                if (
                    singleDataPointIndex !== -1 &&
                    chartLabels[singleDataPointIndex] === "Election Day" &&
                    !showEarlyVoting &&
                    showElectionDay &&
                    !showCumulative
                ) {
                    chartType = "bar";
                }
            }

            const chartTitleBase = showCumulative ? "Cumulative Turnout" : "Per-Day Turnout";
            const chartTitle =
                datasets.length === 1 && datasets[0].label
                    ? `${datasets[0].label} ${chartTitleBase}`
                    : `Comparative ${chartTitleBase}`;

            if (turnoutChart && turnoutChart.config.type !== chartType) {
                turnoutChart.destroy();
                turnoutChart = null;
            }

            datasets.forEach((ds) => {
                if (chartType === "bar") {
                    ds.backgroundColor = ds.borderColor;
                    ds.borderWidth = 1;
                    delete ds.tension;
                    delete ds.fill;
                    delete ds.spanGaps;
                } else {
                    ds.backgroundColor = ds.backgroundColor || ds.borderColor + "33";
                    ds.tension = ds.tension ?? 0.1;
                    ds.fill = ds.fill ?? false;
                    ds.spanGaps = ds.spanGaps ?? false;
                    delete ds.borderWidth;
                }
            });

            if (turnoutChart) {
                turnoutChart.data.labels = chartLabels;
                turnoutChart.data.datasets = datasets;
                turnoutChart.options.plugins.title.text = chartTitle;
                turnoutChart.options.scales.y.beginAtZero = startYAtZero;
                turnoutChart.update();
            } else {
                const config = createChartConfig(
                    chartLabels,
                    datasets,
                    chartTitle,
                    startYAtZero,
                    chartType
                );
                turnoutChart = new Chart(ctx, config);
            }
        }
    }

    manageDisplay();
    updateURLFromState();
};

export const debouncedRenderChart = debounce(renderChart, 300);
