// js/main.js
import { DATA_FILES, REFRESH_INTERVAL, DEFAULT_SELECTED_YEARS } from "./config.js"; // Removed TOTAL_TURNOUT_KEY as it's not directly used here
import { loadYearData, isDataLoaded } from "./data.js";
import {
    populateYearCheckboxes,
    populateLocationDropdown,
    setupEventListeners,
    updateStatusMessage,
    updateAttribution,
    getSelectedYears,    // Still needed for interval check
    // setSelectedYears,  // applyStateFromURL calls this
    // setSelectedLocations, // applyStateFromURL calls this
    // setToggleStates, // applyStateFromURL calls this
    // manageDisplay, // Called by chart.js or event handlers in ui.js
    // updateURLFromState, // MOVED to ui.js
    setSelectedYears, // Keep for applyStateFromURL
    setSelectedLocations, // Keep for applyStateFromURL
    setToggleStates, // Keep for applyStateFromURL
} from "./ui.js";
import { debouncedRenderChart } from "./chart.js";

// Performance Metrics
const metrics = {
    renderTime: [],
    dataLoadTime: [],
    interactions: 0,
};

export const logMetric = (category, durationOrCount) => {
    if (typeof durationOrCount === "number" && category === "interactions") {
        metrics[category] = (metrics[category] || 0) + durationOrCount;
    } else if (typeof durationOrCount === "number") {
        metrics[category].push(durationOrCount);
        if (metrics[category].length > 100) {
            metrics[category].shift();
        }
    }
};

/**
 * Applies application state from URL query parameters.
 */
const applyStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);

    const years = params.get("y")?.split(",") || [];
    const locations = params.get("l")?.split(",") || [];
    const showEV = params.get("ev");
    const showED = params.get("ed");
    const yz = params.get("yz");
    // New radio button params
    const presentation = params.get("pres"); // e.g., 'per-day' or 'cumulative'
    const display = params.get("disp");      // e.g., 'graph' or 'table'


    if (years.length > 0) {
        setSelectedYears(years);
    }
    // Locations will be set after initial year loads in initialize

    const toggleStates = {};
    if (showEV !== null) toggleStates.ev = showEV === "1";
    if (showED !== null) toggleStates.ed = showED === "1";
    if (yz !== null) toggleStates.yz = yz === "1";
    if (presentation !== null) toggleStates.presentation = presentation;
    if (display !== null) toggleStates.display = display;


    if (Object.keys(toggleStates).length > 0) {
        setToggleStates(toggleStates);
    }
    return locations; // Return locations from URL to be applied later
};

// updateURLFromState is now in ui.js and imported/called by chart.js and ui.js event handlers

const initialize = async () => {
    updateStatusMessage("Initializing...");

    const locationsFromURL = applyStateFromURL();

    // Populate year checkboxes based on current state (potentially from URL or defaults)
    // If URL had years, setSelectedYears was called. If not, populateYearCheckboxes uses defaults.
    populateYearCheckboxes(locationsFromURL.length > 0 ? getSelectedYears() : DEFAULT_SELECTED_YEARS);


    const initialYears = getSelectedYears();
    if (initialYears.length === 0 && DEFAULT_SELECTED_YEARS.length > 0) {
        // If no years selected (e.g. bad URL or cleared state), apply defaults
        setSelectedYears(DEFAULT_SELECTED_YEARS);
        // initialYears = DEFAULT_SELECTED_YEARS; // Re-fetch after setting
    }


    const loadPromises = getSelectedYears().map((year) => loadYearData(year)); // Use current selection

    try {
        await Promise.allSettled(loadPromises);
    } catch (error) {
        console.error("Unexpected error during initial data load setup:", error);
        updateStatusMessage("⚠️ Unexpected error during initialization.");
    }

    const hasLoadedData = getSelectedYears().some((year) => isDataLoaded(year));

    populateLocationDropdown(locationsFromURL);
    setupEventListeners();
    updateAttribution();

    // Initial render will use current (possibly URL-derived or default) state
    // manageDisplay() is called at the end of renderChart (or debouncedRenderChart flow)
    // or by displayAs radio button handler.
    // We need to ensure the correct view (graph/table) is set initially.
    const { displayAs } = await import('./ui.js').then(ui => ui.getToggleStates()); // Dynamically import to avoid issues if ui.js isn't ready
    if (displayAs === 'table') {
        await import('./ui.js').then(ui => ui.manageDisplay());
    }
    debouncedRenderChart();


    const statusElement = document.querySelector("#chart-container > p.absolute"); // More robust selector
    if (hasLoadedData) {
        if (statusElement && !statusMessageElement.textContent.includes("⚠️")) { // Check the actual status message element
            updateStatusMessage("");
        }
    } else if (getSelectedYears().length > 0) { // Only show "no data" if years were actually selected
        updateStatusMessage("No data available for selected year(s).");
    } else {
        updateStatusMessage("Please select one or more years to display data.");
    }


    setInterval(async () => {
        console.log("Checking for data updates...");
        const currentSelectedYears = getSelectedYears(); // Get current selection
        let dataChanged = false;

        const updatePromises = currentSelectedYears.map(async (year) => {
            const cacheKey = `voting-data-${year}`;
            const oldDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;
            await loadYearData(year); // This fetches with cache logic
            const newDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;
            if (oldDataTimestamp !== newDataTimestamp) {
                return true; // Data changed for this year
            }
            return false;
        });

        const results = await Promise.allSettled(updatePromises);
        dataChanged = results.some(
            (result) => result.status === "fulfilled" && result.value === true
        );

        if (dataChanged) {
            console.log("Data changed, re-rendering...");
            // Preserve current location selections while refreshing list if necessary
            const currentSelectedLocations = await import('./ui.js').then(ui => ui.getSelectedLocations());
            populateLocationDropdown(currentSelectedLocations);
            debouncedRenderChart();
            updateAttribution();
        } else {
            console.log("No data changes detected.");
        }
    }, REFRESH_INTERVAL);
};

window.getPerformanceMetrics = () => {
    const safeReduce = (arr) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
        averageRenderTime: safeReduce(metrics.renderTime).toFixed(2) + "ms",
        averageLoadTime: safeReduce(metrics.dataLoadTime).toFixed(2) + "ms",
        totalInteractions: metrics.interactions || 0,
    };
};

document.addEventListener("DOMContentLoaded", initialize);
