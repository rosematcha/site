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
} from "./ui.js";
import { debouncedRenderChart } from "./chart.js";

// Performance Metrics
const metrics = {
    renderTime: [],
    dataLoadTime: [],
    interactions: 0,
};

/**
 * Logs performance metrics.
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

// Debounce utility
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

/**
 * Initializes the application.
 */
const initialize = async () => {
    updateStatusMessage("Initializing...");
    populateYearCheckboxes(); // Set up year controls first

    // Load data for initially checked years
    const initialYears = getSelectedYears();
    const loadPromises = initialYears.map(year => loadYearData(year));

    try {
        await Promise.all(loadPromises);
    } catch (error) {
        console.error("Error during initial data load:", error);
        updateStatusMessage("⚠️ Failed to load some initial data.");
        // Continue initialization even if some years fail
    }

    // Populate controls based on loaded data
    populateLocationDropdown();
    setupEventListeners();
    updateAttribution();

    // Initial chart render
    debouncedRenderChart();

    // Clear initializing message if no errors occurred during load
    const hasLoadedData = initialYears.some(year => isDataLoaded(year));
    if (hasLoadedData && !statusMessageElement.textContent.includes("⚠️")) {
         updateStatusMessage("");
    } else if (!hasLoadedData) {
         updateStatusMessage("No data available to display.");
         // Potentially show cat immediately if no data loaded at all
         debouncedRenderChart();
    }


    // Set up auto-refresh interval
    setInterval(async () => {
        console.log("Checking for data updates...");
        const yearsToCheck = getSelectedYears(); // Refresh only selected years
        let dataChanged = false;
        for (const year of yearsToCheck) {
            const oldData = localStorage.getItem(`voting-data-${year}`); // Simple check
            await loadYearData(year); // This fetches/parses if needed
            const newData = localStorage.getItem(`voting-data-${year}`);
            if (oldData !== newData) {
                dataChanged = true;
            }
        }

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
