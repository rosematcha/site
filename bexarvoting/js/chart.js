/* global Chart */
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY, DATA_FILES } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates, manageDisplay, updateURLFromState } from "./ui.js";
import { debounce } from "./utils.js";

let turnoutChart = null;
let catContainer = null;

const chartCanvas = document.getElementById("turnoutChart");
const chartContainerElement = document.getElementById("chart-container");

const NORMALIZED_EARLY_VOTING_DAYS = 8; // Captures standard week while leaving room for an extra day

const normalizeEarlyVotingSeries = (rawValues, targetLength) => {
    const normalized = new Array(targetLength).fill(null);
    if (!rawValues || rawValues.length === 0 || targetLength <= 0) {
        return normalized;
    }

    const sanitizedValues = rawValues.map((value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (value === null || value === undefined || value === "") {
            return 0;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    });

    if (sanitizedValues.length === 1) {
        return normalized.map(() => Math.round(sanitizedValues[0]));
    }

    const lastIndex = sanitizedValues.length - 1;
    for (let i = 0; i < targetLength; i++) {
        if (targetLength === 1) {
            normalized[i] = Math.round(sanitizedValues[lastIndex]);
            continue;
        }
        const position = (i * lastIndex) / (targetLength - 1);
        const lowerIndex = Math.floor(position);
        const upperIndex = Math.ceil(position);
        if (lowerIndex === upperIndex) {
            normalized[i] = Math.round(sanitizedValues[lowerIndex]);
        } else {
            const ratio = position - lowerIndex;
            const lowerValue = sanitizedValues[lowerIndex];
            const upperValue = sanitizedValues[upperIndex];
            const interpolated = lowerValue + (upperValue - lowerValue) * ratio;
            normalized[i] = Math.round(interpolated);
        }
    }

    if (targetLength >= 1) {
        normalized[0] = Math.round(sanitizedValues[0]);
        normalized[targetLength - 1] = Math.round(sanitizedValues[lastIndex]);
    }
    return normalized;
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
        timelineMode
    } = getToggleStates();
    const showCumulative = dataPresentation === 'cumulative';

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
    } else { // Line / Cumulative / Standard Bar Chart Mode
        hideCat();
        let datasets = [];
        let labels = [];
        let colorIndex = 0;
        const useNormalizedTimeline = timelineMode === "normalized" && showEarlyVoting;

        if (useNormalizedTimeline) {
            labels = Array.from({ length: NORMALIZED_EARLY_VOTING_DAYS }, (_, index) => `Day ${index + 1}`);
            if (showElectionDay) {
                labels.push("Election Day");
            }

            selectedYears.forEach((year) => {
                selectedLocations.forEach((locationKey) => {
                    const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);
                    if (!selectionData || selectionData.data.length === 0) return;

                    let processedData = [...selectionData.data];
                    if (showCumulative) {
                        processedData = processedData.map(((sum) => (value) => sum += (value || 0))(0));
                    }

                    const evValues = [];
                    let electionDayValue = null;
                    selectionData.dates.forEach((dateInfo, index) => {
                        const value = processedData[index];
                        if (dateInfo.isElectionDay) {
                            electionDayValue = value ?? null;
                        } else {
                            evValues.push(value);
                        }
                    });

                    const hasEarlyVotingData = evValues.some((val) => val !== null && val !== undefined);
                    const normalizedEvValues = hasEarlyVotingData
                        ? normalizeEarlyVotingSeries(evValues, NORMALIZED_EARLY_VOTING_DAYS)
                        : new Array(NORMALIZED_EARLY_VOTING_DAYS).fill(null);

                    const alignedData = [...normalizedEvValues];
                    if (showElectionDay) {
                        alignedData.push(electionDayValue ?? null);
                    }

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
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        spanGaps: false,
                    });
                });
            });
        } else {
            let maxRelevantDays = 0;

            selectedYears.forEach(year => {
                const yearDates = getDatesForYear(year);
                if (!yearDates) return;
                const relevantDatesForYear = yearDates.filter(dateInfo =>
                    (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
                );
                if (relevantDatesForYear.length > maxRelevantDays) {
                    maxRelevantDays = relevantDatesForYear.length;
                }
            });
            
            let representativeYearForLabels = null;
            for (const year of selectedYears) {
                const yearDates = getDatesForYear(year);
                if (yearDates) {
                    const relevantDatesForYear = yearDates.filter(dateInfo =>
                        (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
                    );
                    if (relevantDatesForYear.length === maxRelevantDays) {
                        if (!representativeYearForLabels || Object.keys(DATA_FILES).indexOf(year) < Object.keys(DATA_FILES).indexOf(representativeYearForLabels)) {
                            representativeYearForLabels = year;
                        }
                    }
                }
            }
            if (!representativeYearForLabels && selectedYears.length > 0) {
                representativeYearForLabels = selectedYears.find(year => {
                    const yearDates = getDatesForYear(year);
                    return yearDates && yearDates.filter(dateInfo =>
                        (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
                    ).length > 0;
                }) || selectedYears[0];
            }

            if (representativeYearForLabels) {
                const representativeDates = getDatesForYear(representativeYearForLabels).filter(dateInfo =>
                    (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
                );
                let dayCounter = 1;
                representativeDates.forEach(dateInfo => {
                    if (!dateInfo.isElectionDay && showEarlyVoting) {
                        labels.push(`Day ${dayCounter++}`);
                    } else if (dateInfo.isElectionDay && showElectionDay) {
                        labels.push("Election Day");
                    }
                });
            } else if (maxRelevantDays > 0) { // Fallback if no representative year found but we know max days
                if (showEarlyVoting && !showElectionDay) { // Only EV days
                    for (let i = 1; i <= maxRelevantDays; i++) labels.push(`Day ${i}`);
                } else if (showElectionDay && !showEarlyVoting && maxRelevantDays === 1) { // Only ED
                    labels.push("Election Day");
                }
                // If both EV and ED are shown, this fallback might be tricky; representativeYearForLabels should ideally cover it.
            }

            const labelIndexMap = new Map(labels.map((label, index) => [label, index]));


            selectedYears.forEach((year) => {
                const yearDatesFull = getDatesForYear(year);
                if (!yearDatesFull) return;

                selectedLocations.forEach((locationKey) => {
                    const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);

                    if (selectionData && selectionData.data.length > 0) {
                        let processedData = [...selectionData.data];
                        if (showCumulative) {
                             processedData = processedData.map(((sum) => (value) => sum += (value || 0))(0));
                        }
                        
                        const alignedData = new Array(labels.length).fill(null);
                        let currentDataIndex = 0;
                        let evDayCounterForThisSeries = 0; // Tracks EV day number within this specific series

                        selectionData.dates.forEach(dateInfoFromSelection => {
                            let labelToFind;
                            if (dateInfoFromSelection.isElectionDay) {
                                labelToFind = "Election Day";
                            } else { // Is an Early Voting day for this series
                                evDayCounterForThisSeries++;
                                labelToFind = `Day ${evDayCounterForThisSeries}`;
                            }

                            const targetLabelIndex = labelIndexMap.get(labelToFind);
                            if (targetLabelIndex !== -1 && currentDataIndex < processedData.length) {
                                alignedData[targetLabelIndex] = processedData[currentDataIndex];
                            }
                            currentDataIndex++;
                        });


                        const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                        colorIndex++;
                        datasets.push({
                            label: `${selectionData.name} - ${year}`,
                            data: alignedData,
                            borderColor: color,
                            backgroundColor: color + "33", // Default for line, will be overridden for bar
                            tension: 0.1,
                            fill: false,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            spanGaps: false, // MODIFIED: Do not span gaps for line charts
                        });
                    }
                });
            });
        }

        if (datasets.length === 0 || labels.length === 0) {
            showCat();
        } else {
            let chartType = "line";
            // Check if it should be a bar chart (single ED point, not cumulative, only ED shown)
            if (datasets.length === 1 && datasets[0].data.filter(d => d !== null).length === 1) {
                 const singleDataPointIndex = datasets[0].data.findIndex(d => d !== null);
                 if (singleDataPointIndex !== -1 && 
                     labels[singleDataPointIndex] === "Election Day" && 
                     !showEarlyVoting && 
                     showElectionDay && 
                     !showCumulative) {
                     chartType = "bar";
                 }
            }

            const chartTitleBase = showCumulative ? "Cumulative Turnout" : "Per-Day Turnout";
            const chartTitleSuffix = useNormalizedTimeline ? " (Normalized Early Voting Window)" : "";
            const chartTitle = (datasets.length === 1 && datasets[0].label
                ? `${datasets[0].label} ${chartTitleBase}`
                : `Comparative ${chartTitleBase}`) + chartTitleSuffix;

            if (turnoutChart && turnoutChart.config.type !== chartType) {
                turnoutChart.destroy();
                turnoutChart = null;
            }
            
            datasets.forEach(ds => {
                if (chartType === "bar") {
                   ds.backgroundColor = ds.borderColor; // Solid color for bars
                   ds.borderWidth = 1;
                   delete ds.tension; 
                   delete ds.fill; 
                   delete ds.pointRadius; 
                   delete ds.pointHoverRadius; 
                   delete ds.spanGaps; // Bar charts don't use spanGaps in this way
               } else { // Line chart properties
                   ds.backgroundColor = ds.borderColor + "33"; 
                   ds.tension = 0.1;
                   ds.fill = false; 
                   ds.pointRadius = 3;
                   ds.pointHoverRadius = 5;
                   ds.spanGaps = false; // Ensure spanGaps is false for lines
                   delete ds.borderWidth; 
               }
            });

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
        }
    }

    manageDisplay();
    updateURLFromState();
};

export const debouncedRenderChart = debounce(renderChart, 300);
