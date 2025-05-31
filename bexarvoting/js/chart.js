// js/chart.js
import { CAT_IMAGES, CHART_COLORS, TOTAL_TURNOUT_KEY, DATA_FILES } from "./config.js";
import { getDataForSelection, getDatesForYear } from "./data.js";
import { getSelectedYears, getSelectedLocations, getToggleStates, manageDisplay } from "./ui.js";
import { debounce } from "./utils.js";
import { updateURLFromState } from "./main.js"; // For updating URL after chart render

// ... (rest of the existing chart.js code remains the same until renderChart)

const renderChart = () => {
    // const startTime = performance.now(); // If you re-enable logging
    const selectedYears = getSelectedYears();
    const selectedLocations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero, dataPresentation, displayAs } = getToggleStates();
    const showCumulative = dataPresentation === 'cumulative';

    const ctx = chartCanvas?.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context.");
        manageDisplay();
        return;
    }

    // If displayAs is 'table', we might not need to do full chart rendering,
    // but data still needs to be processed for the table.
    // manageDisplay() will handle showing the table.
    if (displayAs === 'table') {
        // Table is handled by manageDisplay, but chart logic might still run to prepare data
    }


    if (
        selectedYears.length === 0 ||
        selectedLocations.length === 0 ||
        (!showEarlyVoting && !showElectionDay)
    ) {
        showCat();
        manageDisplay(); 
        updateURLFromState(); // This now comes from ui.js
        return;
    }

    // --- ELECTION DAY ONLY GROUPED BAR CHART MODE ---
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

        manageDisplay(); // Call after chart update/creation
        updateURLFromState();
        return;
    }
    // --- END ELECTION DAY ONLY GROUPED BAR CHART MODE ---

    // --- LINE / CUMULATIVE / STANDARD BAR CHART MODE ---
    hideCat();

    let datasets = [];
    let labels = []; // This will be populated based on the data
    let colorIndex = 0;
    let maxRelevantDays = 0; // Max number of data points for any single series

    // Determine the maximum number of relevant days (EV + ED if selected) to set labels
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
    
    // Generate labels based on maxRelevantDays
    // Find a representative year that has maxRelevantDays to derive label names
    let representativeYearForLabels = null;
    for (const year of selectedYears) {
        const yearDates = getDatesForYear(year);
        if (yearDates) {
            const relevantDatesForYear = yearDates.filter(dateInfo =>
                (dateInfo.isElectionDay && showElectionDay) || (!dateInfo.isElectionDay && showEarlyVoting)
            );
            if (relevantDatesForYear.length === maxRelevantDays) {
                representativeYearForLabels = year;
                break;
            }
        }
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
    } else if (maxRelevantDays > 0) { // Fallback if no single year matches maxRelevantDays (e.g. only one type of day shown)
        if (showEarlyVoting && !showElectionDay) {
            for (let i = 1; i <= maxRelevantDays; i++) labels.push(`Day ${i}`);
        } else if (showElectionDay && !showEarlyVoting && maxRelevantDays === 1) {
            labels.push("Election Day");
        }
    }
    // If labels is still empty, it means no data points will be shown.
    // The cat will be shown later if datasets array is empty.


    selectedYears.forEach((year) => {
        const yearDates = getDatesForYear(year); // Full list of dates for this year
        if (!yearDates) return;

        selectedLocations.forEach((locationKey) => {
            // Get data filtered by EV/ED toggles
            const selectionData = getDataForSelection(year, locationKey, showEarlyVoting, showElectionDay);

            if (selectionData && selectionData.data.length > 0) {
                let processedData = [...selectionData.data]; // Clone data

                if (showCumulative) {
                     processedData = processedData.map(((sum) => (value) => sum += (value || 0))(0));
                }
                
                // Align data to the common set of labels
                const alignedData = new Array(labels.length).fill(null);
                let currentDataIndex = 0; // Index for processedData

                // Iterate through the *filtered* dates from selectionData to map to the common labels
                selectionData.dates.forEach(dateInfoFromSelection => {
                    let labelToFind;
                    if (dateInfoFromSelection.isElectionDay) {
                        labelToFind = "Election Day";
                    } else {
                        // Find the correct "Day X" for this early voting day
                        // This needs to count visible EV days *within this specific selectionData.dates*
                        let evDayCounterForThisSeries = 0;
                        for(const d of selectionData.dates){
                            if(d.date === dateInfoFromSelection.date && d.isElectionDay === dateInfoFromSelection.isElectionDay) {
                                if(!d.isElectionDay) evDayCounterForThisSeries++;
                                break;
                            }
                            if(!d.isElectionDay) evDayCounterForThisSeries++;
                        }
                        labelToFind = `Day ${evDayCounterForThisSeries}`;
                    }

                    const targetLabelIndex = labels.indexOf(labelToFind);
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
                    backgroundColor: color + "33", // For area fill if enabled
                    tension: 0.1,
                    fill: false,
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
        return;
    }

    let chartType = "line";
    if (datasets.length === 1 && datasets[0].data.filter(d => d !== null).length === 1) {
         const singleDataPointIndex = datasets[0].data.findIndex(d => d !== null);
         if (singleDataPointIndex !== -1 && labels[singleDataPointIndex] === "Election Day" && !showEarlyVoting && showElectionDay && !showCumulative) {
             chartType = "bar";
         }
    }

    const chartTitleBase = showCumulative ? "Cumulative Turnout" : "Per-Day Turnout";
    const chartTitle = datasets.length === 1 && datasets[0].label ? `${datasets[0].label} ${chartTitleBase}` : `Comparative ${chartTitleBase}`;

    if (turnoutChart && turnoutChart.config.type !== chartType) {
        turnoutChart.destroy();
        turnoutChart = null;
    }
    
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

    manageDisplay(); // Call after chart update/creation
    updateURLFromState();
};

export const debouncedRenderChart = debounce(renderChart, 300);
export const getCurrentChartInstance = () => turnoutChart;