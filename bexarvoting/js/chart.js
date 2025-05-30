// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates, manageDisplay } from "./ui.js";
import { debounce } from "./utils.js";
import { updateURLFromState } from "./main.js";

let turnoutChart = null;
let catContainer = null;

const chartCanvas = document.getElementById("turnoutChart");
const chartContainerElement = document.getElementById("chart-container");

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
    catContainer.classList.remove("hidden"); // Ensure it's not hidden

    const catMessage = document.createElement("p");
    catMessage.textContent = "oops, no data... have a cat instead?";
    catMessage.className = "text-gray-300 text-lg mb-4";

    const img = document.createElement("img");
    img.src = getRandomCatImage();
    img.alt = "A cute cat";
    img.className = "max-w-full max-h-[70%] object-contain rounded";

    catContainer.innerHTML = ""; // Clear previous content
    catContainer.appendChild(catMessage);
    catContainer.appendChild(img);
};

const hideCat = () => {
    if (catContainer) {
        catContainer.style.display = "none";
        catContainer.classList.add("hidden"); // Explicitly hide
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
    const startTime = performance.now(); // Start timing for performance metric
    const selectedYears = getSelectedYears();
    const selectedLocations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero, showDataTable, showCumulative } = getToggleStates();

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        manageDisplay();
        return;
    }

    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat();
        manageDisplay();
        updateURLFromState();
        logMetric("renderTime", performance.now() - startTime); // Log render time even if showing cat
        return;
    }

     // --- ELECTION DAY ONLY GROUPED BAR CHART MODE ---
    // This mode is specifically for comparing ONLY Election Day turnout
    // across multiple years for the SAME set of locations.
    const isElectionDayOnlyComparison =
        showElectionDay && !showEarlyVoting && selectedYears.length > 1 && selectedLocations.length > 0;

    if (isElectionDayOnlyComparison && !showCumulative) { // Cumulative doesn't make sense for single day
        hideCat();
        const labels = selectedLocations;
        let datasets = [];
        let colorIndex = 0;
        for (const year of selectedYears) {
            const data = [];
            for (const location of selectedLocations) {
                 // Need to get data for the *Election Day* only for this year/location
                const selectionData = getDataForSelection(year, location, false, true); // Only get ED data

                let edValue = null;
                if (selectionData && selectionData.data && selectionData.data.length > 0) {
                     // Assuming getDataForSelection(false, true) returns an array with only the ED value if present
                     edValue = selectionData.data[0];
                }
                data.push(edValue);
            }
             // If all locations for a year have null ED data, skip this year's dataset
             if (data.some(val => val !== null)) {
                const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;
                datasets.push({
                    label: year,
                    data,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1, // Add border for better visibility
                });
            }
        }

         if (datasets.length === 0) {
            showCat();
            manageDisplay();
            updateURLFromState();
            logMetric("renderTime", performance.now() - startTime);
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

        manageDisplay();
        updateURLFromState();
        logMetric("renderTime", performance.now() - startTime);
        return;
    }
    // --- END ELECTION DAY ONLY GROUPED BAR CHART MODE ---


    // --- LINE / CUMULATIVE / STANDARD BAR CHART MODE ---
    hideCat();

    let datasets = [];
    let labels = [];
    let colorIndex = 0;
    let maxDays = 0; // Max number of voting days (EV + possibly ED) across selected years/data types

    // Determine the maximum number of relevant days (EV + ED if selected) to set labels
    selectedYears.forEach(year => {
        const yearDates = getDatesForYear(year);
        if (!yearDates) return;

        // Filter dates based on toggles
        const relevantDates = yearDates.filter(dateInfo =>
            (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
        );

        if (relevantDates.length > maxDays) {
            maxDays = relevantDates.length;
        }
    });

    // Generate labels based on maxDays and toggles
    const allDatesFromMostDaysYear = selectedYears
        .map(year => ({ year, dates: getDatesForYear(year) }))
        .filter(({ dates }) => dates && dates.filter(d => (d.isElectionDay && showElectionDay) || (!d.isElectionDay && showEarlyVoting)).length === maxDays)
        .sort((a, b) => Object.keys(DATA_FILES).indexOf(a.year) - Object.keys(DATA_FILES).indexOf(b.year)) // Prefer earlier years for label consistency if maxDays are equal
        [0]?.dates || [];


    let dayCounter = 1;
     allDatesFromMostDaysYear.forEach(dateInfo => {
         if (!dateInfo.isElectionDay && showEarlyVoting) {
             labels.push(`Day ${dayCounter++}`);
         } else if (dateInfo.isElectionDay && showElectionDay) {
             labels.push("Election Day");
         }
     });

    // Fallback if somehow labels didn't generate (e.g., no data, or only ED and no ED data)
     if (labels.length === 0 && selectedYears.length > 0 && selectedLocations.length > 0) {
         if (showElectionDay && selectedYears.some(year => getDatesForYear(year)?.some(d => d.isElectionDay))) {
              // If only ED is toggled and at least one year has ED data, add "Election Day" label
             labels.push("Election Day");
         } else if (showEarlyVoting && selectedYears.some(year => getDatesForYear(year)?.some(d => !d.isElectionDay))) {
             // If only EV is toggled and at least one year has EV data, find max EV days and add labels
              let maxEVDays = 0;
              selectedYears.forEach(year => {
                  const yearDates = getDatesForYear(year);
                  if (yearDates) {
                      const evDays = yearDates.filter(d => !d.isElectionDay).length;
                      if (evDays > maxEVDays) maxEVDays = evDays;
                  }
              });
              for(let i = 1; i <= maxEVDays; i++) labels.push(`Day ${i}`);
         }
     }


    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year);
        if (!yearDates) return;

        selectedLocations.forEach((locationKey) => {
            const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);

            if (selectionData && selectionData.data.length > 0) {
                let processedData = selectionData.data;

                if (showCumulative) {
                     processedData = processedData.map((sum => value => sum += value)(0));
                }

                 // Align data to the common set of labels (maxDays)
                 const alignedData = new Array(labels.length).fill(null);
                 let processedDataIndex = 0;

                 // Map days from selectionData back to the labels array
                 selectionData.dates.forEach((dateInfo) => {
                     let labelToFind = '';
                     if (dateInfo.isElectionDay) labelToFind = "Election Day";
                     else labelToFind = `Day ${dateInfo.dayIndex}`; // Use original dayIndex

                     const labelIndex = labels.indexOf(labelToFind);

                     if (labelIndex !== -1 && processedDataIndex < processedData.length) {
                         alignedData[labelIndex] = processedData[processedDataIndex];
                         processedDataIndex++;
                     } else {
                         // If label not found or processed data exhausted, skip
                         // This can happen if a year has fewer EV days than the maxDays year
                         // or if Election Day wasn't present in the maxDays year's labels
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
                    fill: false, // Changed fill to false for line charts by default
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    spanGaps: true, // Connect points over null values
                });
            }
        });
    });

    if (datasets.length === 0 || labels.length === 0) {
        showCat();
        manageDisplay();
        updateURLFromState();
        logMetric("renderTime", performance.now() - startTime);
        return;
    }

    // Determine chart type (line or bar)
    let chartType = "line";
    // If it's a single dataset and only one data point (e.g., only Election Day selected for one year)
    if (datasets.length === 1 && datasets[0].data.filter(d => d !== null).length === 1) {
         const singleDataPointIndex = datasets[0].data.findIndex(d => d !== null);
         if (singleDataPointIndex !== -1 && labels[singleDataPointIndex] === "Election Day" && !showEarlyVoting && showElectionDay && !showCumulative) {
             chartType = "bar";
         }
    }


    const chartTitleBase = showCumulative ? "Cumulative Turnout" : "Daily Turnout";
    const chartTitle = datasets.length === 1 && datasets[0].label ? `${datasets[0].label} ${chartTitleBase}` : `Comparative ${chartTitleBase}`;


    if (turnoutChart && turnoutChart.config.type !== chartType) {
        turnoutChart.destroy();
        turnoutChart = null;
    }

    if (turnoutChart) {
        turnoutChart.data.labels = labels;
        turnoutChart.data.datasets = datasets;
        turnoutChart.options.plugins.title.text = chartTitle;
        turnoutChart.options.scales.y.beginAtZero = startYAtZero;

        // Adjust dataset properties based on chart type
         datasets.forEach(ds => {
             if (chartType === "bar") {
                ds.backgroundColor = ds.borderColor; // Solid color for bars
                ds.borderWidth = 1;
                delete ds.tension; delete ds.fill; delete ds.pointRadius; delete ds.pointHoverRadius; delete ds.spanGaps;
            } else { // Line chart properties
                ds.backgroundColor = ds.borderColor + "33";
                ds.tension = 0.1;
                ds.fill = false;
                ds.pointRadius = 3;
                ds.pointHoverRadius = 5;
                ds.spanGaps = true;
                delete ds.borderWidth; // Remove border if not a bar chart
            }
         });


        turnoutChart.update();
    } else {
         // Adjust dataset properties for the initial config based on determined chart type
         datasets.forEach(ds => {
             if (chartType === "bar") {
                ds.backgroundColor = ds.borderColor; // Solid color for bars
                ds.borderWidth = 1;
                delete ds.tension; delete ds.fill; delete ds.pointRadius; delete ds.pointHoverRadius; delete ds.spanGaps;
            } else { // Line chart properties
                ds.backgroundColor = ds.borderColor + "33";
                ds.tension = 0.1;
                ds.fill = false;
                ds.pointRadius = 3;
                ds.pointHoverRadius = 5;
                ds.spanGaps = true;
                 delete ds.borderWidth; // Remove border if not a bar chart
            }
         });
        const config = createChartConfig(labels, datasets, chartTitle, startYAtZero, chartType);
        turnoutChart = new Chart(ctx, config);
    }

    manageDisplay();
    updateURLFromState();
    logMetric("renderTime", performance.now() - startTime); // Log render time
};


export const debouncedRenderChart = debounce(renderChart, 250);
