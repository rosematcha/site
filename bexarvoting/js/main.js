// js/main.js
import { DATA_FILES, REFRESH_INTERVAL } from "./config.js";
import { loadYearData, isDataLoaded } from "./data.js";
import {
    populateYearCheckboxes,
    populateLocationDropdown,
    setupEventListeners,
    updateStatusMessage,
    updateAttribution,
    getSelectedYears,
    // Note: statusMessageElement is internal to ui.js now
} from "./ui.js";
import { debouncedRenderChart } from "./chart.js";

// Performance Metrics
const metrics = {
    renderTime: [],
    dataLoadTime: [],
    interactions: 0,
};

/**
 * Logs performance metrics. Exported for use in other modules.
 * @param {'renderTime'|'dataLoadTime'|'interactions'} category - Metric category.
 * @param {number} durationOrCount - Duration in ms or count.
 */
export const logMetric = (category, durationOrCount) => {
    if (typeof durationOrCount === "number" && category === "interactions") {
        metrics[category] = (metrics[category] || 0) + durationOrCount;
    } else if (typeof durationOrCount === "number") {
        metrics[category].push(durationOrCount);
        // Keep only the last 100 entries to avoid memory leak
        if (metrics[category].length > 100) {
            metrics[category].shift();
        }
    }
};

/**
 * Initializes the application.
 */
const initialize = async () => {
    updateStatusMessage("Initializing...");
    populateYearCheckboxes(); // Set up year controls first

    // Load data for initially checked years
    const initialYears = getSelectedYears();
    const loadPromises = initialYears.map((year) => loadYearData(year));

    try {
        // Wait for all initial data loads to attempt completion
        await Promise.allSettled(loadPromises); // Use allSettled to continue even if some fail
    } catch (error) {
        // This catch might not be strictly necessary with allSettled,
        // but good practice in case of unexpected errors during Promise creation.
        console.error("Unexpected error during initial data load setup:", error);
        updateStatusMessage("⚠️ Unexpected error during initialization.");
    }

    // Check if *any* data actually loaded successfully
    const hasLoadedData = initialYears.some((year) => isDataLoaded(year));

    // Populate controls based on whatever data loaded
    populateLocationDropdown();
    setupEventListeners();
    updateAttribution();

    // Initial chart render (will show cat if no data/selections)
    debouncedRenderChart();

    // Update status message based on load results
    const statusElement = document.querySelector(
        "#chart-container > p.absolute"
    ); // Re-select in case it wasn't created yet
    if (hasLoadedData) {
        // Clear "Initializing..." if successful and no prior error shown
        if (statusElement && !statusElement.textContent.includes("⚠️")) {
            updateStatusMessage("");
        }
    } else {
        // If no data loaded at all, ensure a message is shown
        updateStatusMessage("No data available to display.");
        // debouncedRenderChart() called above will handle showing the cat
    }

    // Set up auto-refresh interval
    setInterval(async () => {
        console.log("Checking for data updates...");
        const yearsToCheck = getSelectedYears(); // Refresh only selected years
        let dataChanged = false;

        // Use Promise.allSettled to fetch updates concurrently
        const updatePromises = yearsToCheck.map(async (year) => {
            const cacheKey = `voting-data-${year}`;
            const oldDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;

            await loadYearData(year); // Fetches/parses if needed or expired

            const newDataTimestamp = localStorage.getItem(cacheKey)
                ? JSON.parse(localStorage.getItem(cacheKey)).timestamp
                : null;

            // Consider data changed if timestamp is different
            if (oldDataTimestamp !== newDataTimestamp) {
                return true; // Indicate change for this year
            }
            return false;
        });

        const results = await Promise.allSettled(updatePromises);
        dataChanged = results.some(
            (result) => result.status === "fulfilled" && result.value === true
        );

        if (dataChanged) {
            console.log("Data changed, re-rendering chart...");
            // Repopulate dropdown in case locations changed
            populateLocationDropdown();
            debouncedRenderChart();
            updateAttribution(); // Update date in attribution
        } else {
            console.log("No data changes detected.");
        }
    }, REFRESH_INTERVAL);
};

// Expose performance metrics globally (optional)
window.getPerformanceMetrics = () => {
    const safeReduce = (arr) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
        averageRenderTime: safeReduce(metrics.renderTime).toFixed(2) + "ms",
        averageLoadTime: safeReduce(metrics.dataLoadTime).toFixed(2) + "ms",
        totalInteractions: metrics.interactions || 0,
    };
};

// Start the application
document.addEventListener("DOMContentLoaded", initialize);
