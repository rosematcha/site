// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY, DATA_FILES } from "./config.js"; // Added DATA_FILES
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
        // logMetric("renderTime", performance.now() - startTime); // Log render time even if showing cat
        return;
    }

     // --- ELECTION DAY ONLY GROUPED BAR CHART MODE ---
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
            // logMetric("renderTime", performance.now() - startTime);
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
        // logMetric("renderTime", performance.now() - startTime);
        return;
    }
    // --- END ELECTION DAY ONLY GROUPED BAR CHART MODE ---


    // --- LINE / CUMULATIVE / STANDARD BAR CHART MODE ---
    hideCat();

    let datasets = [];
    let labels = [];
    let colorIndex = 0;
    let maxDays = 0;

    selectedYears.forEach(year => {
        const yearDates = getDatesForYear(year);
        if (!yearDates) return;

        const relevantDates = yearDates.filter(dateInfo =>
            (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
        );

        if (relevantDates.length > maxDays) {
            maxDays = relevantDates.length;
        }
    });

    const allDatesFromMostDaysYear = selectedYears
        .map(year => ({ year, dates: getDatesForYear(year) }))
        .filter(({ dates }) => dates && dates.filter(d => (d.isElectionDay && showElectionDay) || (!d.isElectionDay && showEarlyVoting)).length === maxDays)
        .sort((a, b) => Object.keys(DATA_FILES).indexOf(a.year) - Object.keys(DATA_FILES).indexOf(b.year))
        [0]?.dates || [];


    let dayCounter = 1;
     allDatesFromMostDaysYear.forEach(dateInfo => {
         if (!dateInfo.isElectionDay && showEarlyVoting) {
             labels.push(`Day ${dayCounter++}`);
         } else if (dateInfo.isElectionDay && showElectionDay) {
             labels.push("Election Day");
         }
     });

     if (labels.length === 0 && selectedYears.length > 0 && selectedLocations.length > 0) {
         if (showElectionDay && selectedYears.some(year => getDatesForYear(year)?.some(d => d.isElectionDay))) {
             labels.push("Election Day");
         } else if (showEarlyVoting && selectedYears.some(year => getDatesForYear(year)?.some(d => !d.isElectionDay))) {
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
                     processedData = processedData.map((sum => value => sum += (value || 0))(0)); // Ensure nulls are treated as 0 for sum
                }

                 const alignedData = new Array(labels.length).fill(null);
                 let processedDataIndex = 0;

                 selectionData.dates.forEach((dateInfo) => {
                     let labelToFind = '';
                     // Use the dayIndex from the original full set of dates for the year
                     const originalDayIndex = yearDates.findIndex(d => d.date === dateInfo.date && d.isElectionDay === dateInfo.isElectionDay) + 1;

                     if (dateInfo.isElectionDay) {
                        labelToFind = "Election Day";
                     } else {
                        // Find the correct "Day X" label based on its position among *visible* EV days
                        // This requires knowing how many EV days *before* this one were *also visible*
                        let visibleEVDayCounter = 0;
                        for(let i=0; i < selectionData.dates.length; i++){
                            if(i > selectionData.dates.indexOf(dateInfo)) break;
                            if(!selectionData.dates[i].isElectionDay) visibleEVDayCounter++;
                        }
                        labelToFind = `Day ${visibleEVDayCounter}`;
                     }


                     const labelIndex = labels.indexOf(labelToFind);

                     if (labelIndex !== -1 && processedDataIndex < processedData.length) {
                         alignedData[labelIndex] = processedData[processedDataIndex];
                         processedDataIndex++;
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
        // logMetric("renderTime", performance.now() - startTime);
        return;
    }

    let chartType = "line";
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

         datasets.forEach(ds => {
             if (chartType === "bar") {
                ds.backgroundColor = ds.borderColor;
                ds.borderWidth = 1;
                delete ds.tension; delete ds.fill; delete ds.pointRadius; delete ds.pointHoverRadius; delete ds.spanGaps;
            } else {
                ds.backgroundColor = ds.borderColor + "33";
                ds.tension = 0.1;
                ds.fill = false;
                ds.pointRadius = 3;
                ds.pointHoverRadius = 5;
                ds.spanGaps = true;
                delete ds.borderWidth;
            }
         });


        turnoutChart.update();
    } else {
         datasets.forEach(ds => {
             if (chartType === "bar") {
                ds.backgroundColor = ds.borderColor;
                ds.borderWidth = 1;
                delete ds.tension; delete ds.fill; delete ds.pointRadius; delete ds.pointHoverRadius; delete ds.spanGaps;
            } else {
                ds.backgroundColor = ds.borderColor + "33";
                ds.tension = 0.1;
                ds.fill = false;
                ds.pointRadius = 3;
                ds.pointHoverRadius = 5;
                ds.spanGaps = true;
                 delete ds.borderWidth;
            }
         });
        const config = createChartConfig(labels, datasets, chartTitle, startYAtZero, chartType);
        turnoutChart = new Chart(ctx, config);
    }

    manageDisplay();
    updateURLFromState();
    // logMetric("renderTime", performance.now() - startTime);
};


export const debouncedRenderChart = debounce(renderChart, 250);
