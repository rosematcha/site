// js/main.js
import { DATA_FILES, REFRESH_INTERVAL, TOTAL_TURNOUT_KEY } from "./config.js";
import { loadYearData, isDataLoaded } from "./data.js";
import {
    populateYearCheckboxes,
    populateLocationDropdown,
    setupEventListeners,
    updateStatusMessage,
    updateAttribution,
    getSelectedYears,
    getSelectedLocations,
    getToggleStates,
    setSelectedYears,     // New setter
    setSelectedLocations, // New setter
    setToggleStates,      // New setter
    manageDisplay,        // For managing chart/table view
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
    const showDT = params.get("dt"); // Data Table

    if (years.length > 0) {
        setSelectedYears(years);
    }
    // setSelectedLocations will be called after initial years are loaded and populateLocationDropdown runs,
    // so we store the locationsFromURL to be applied then.
    // However, if called here, it might try to check locations that aren't populated yet.
    // Let's defer specific location setting to after initial year loads in initialize().

    const toggleStates = {};
    if (showEV !== null) toggleStates.ev = showEV === "1";
    if (showED !== null) toggleStates.ed = showED === "1";
    if (yz !== null) toggleStates.yz = yz === "1";
    if (showDT !== null) toggleStates.dt = showDT === "1";

    if (Object.keys(toggleStates).length > 0) {
        setToggleStates(toggleStates);
    }
    return locations; // Return locations from URL to be applied later
};

/**
 * Updates the URL query parameters based on the current UI state.
 */
export const updateURLFromState = () => {
    const years = getSelectedYears();
    const locations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero, showDataTable } = getToggleStates();

    const params = new URLSearchParams();
    if (years.length > 0) params.set("y", years.join(","));
    if (locations.length > 0) params.set("l", locations.join(","));

    params.set("ev", showEarlyVoting ? "1" : "0");
    params.set("ed", showElectionDay ? "1" : "0");
    params.set("yz", startYAtZero ? "1" : "0");
    params.set("dt", showDataTable ? "1" : "0"); // Data Table

    const newRelativePathQuery = window.location.pathname + "?" + params.toString();
    history.pushState(null, "", newRelativePathQuery);
};


const initialize = async () => {
    updateStatusMessage("Initializing...");

    // Apply state from URL first to determine which years/toggles are active
    const locationsFromURL = applyStateFromURL(); // This sets year checkboxes and toggles

    populateYearCheckboxes(getSelectedYears()); // Populates based on current state (potentially from URL)

    const initialYears = getSelectedYears();
    const loadPromises = initialYears.map((year) => loadYearData(year));

    try {
        await Promise.allSettled(loadPromises);
    } catch (error) {
        console.error("Unexpected error during initial data load setup:", error);
        updateStatusMessage("⚠️ Unexpected error during initialization.");
    }

    const hasLoadedData = initialYears.some((year) => isDataLoaded(year));

    // Populate location dropdown now that initial years are loaded
    populateLocationDropdown(locationsFromURL); // Pass locations from URL to ensure they are selected
    setupEventListeners(); // Setup all listeners, including new buttons
    updateAttribution();

    debouncedRenderChart(); // Initial render will use current (possibly URL-derived) state
    // manageDisplay() is called at the end of renderChart (or debouncedRenderChart flow)

    const statusElement = document.querySelector("#chart-container > p.absolute");
    if (hasLoadedData) {
        if (statusElement && !statusElement.textContent.includes("⚠️")) {
            updateStatusMessage("");
        }
    } else {
        updateStatusMessage("No data available to display.");
    }

    setInterval(async () => {
        console.log("Checking for data updates...");
        const yearsToCheck = getSelectedYears();
        let dataChanged = false;

        const updatePromises = yearsToCheck.map(async (year) => {
            const cacheKey = `voting-data-${year}`;
            const oldDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;
            await loadYearData(year);
            const newDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;
            if (oldDataTimestamp !== newDataTimestamp) {
                return true;
            }
            return false;
        });

        const results = await Promise.allSettled(updatePromises);
        dataChanged = results.some(
            (result) => result.status === "fulfilled" && result.value === true
        );

        if (dataChanged) {
            console.log("Data changed, re-rendering...");
            populateLocationDropdown(getSelectedLocations()); // Preserve current selections while refreshing list
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