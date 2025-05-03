// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { getAllLoadedLocations } from "./data.js";
import { debouncedRenderChart } from "./chart.js";
import { loadYearData } from "./data.js";
import { logMetric } from "./main.js";

// DOM Elements
const elements = {
    yearOptionsContainer: document.getElementById("year-options"),
    // REMOVE: locationSelect: document.getElementById("location-select"),
    locationCheckboxContainer: document.getElementById( // NEW
        "location-checkbox-container"
    ),
    earlyVotingToggle: document.getElementById("early-voting-toggle"),
    electionDayToggle: document.getElementById("election-day-toggle"),
    yAxisToggle: document.getElementById("y-axis-toggle"),
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    attribution: document.getElementById("attribution"),
};

let statusMessageElement = null;

// --- ensureStatusMessageElement() remains the same ---
function ensureStatusMessageElement() {
    if (!statusMessageElement && elements.chartContainer) {
        statusMessageElement = document.createElement("p");
        statusMessageElement.className =
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4 z-10";
        elements.chartContainer.insertBefore(
            statusMessageElement,
            elements.chartCanvas
        );
    } else if (!elements.chartContainer) {
        console.error("Chart container not found for status message.");
    }
}

// --- updateStatusMessage() remains the same ---
export const updateStatusMessage = (message) => {
    ensureStatusMessageElement();
    if (statusMessageElement) {
        if (
            message &&
            !message.includes("⚠️") &&
            statusMessageElement.textContent.includes("⚠️")
        ) {
            // Don't overwrite error
        } else {
            statusMessageElement.textContent = message;
        }
    }
};

// --- populateYearCheckboxes() remains the same ---
export const populateYearCheckboxes = () => {
    if (!elements.yearOptionsContainer) return;
    elements.yearOptionsContainer.innerHTML = "";

    Object.entries(DATA_FILES).forEach(([year, { name, disabled }]) => {
        const label = document.createElement("label");
        label.className = "block inline-flex items-center";
        if (disabled) {
            label.classList.add("opacity-50", "cursor-not-allowed");
        }

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className =
            "form-checkbox rounded text-pink-600 focus:ring-pink-500";
        input.value = year;
        input.checked = !disabled;
        input.disabled = !!disabled;
        input.addEventListener("change", handleYearChange);

        const span = document.createElement("span");
        span.className = "ml-2 text-sm";
        span.textContent = name + (disabled ? " (pending)" : "");

        label.appendChild(input);
        label.appendChild(span);
        elements.yearOptionsContainer.appendChild(label);
    });
};

/**
 * Helper function to create a checkbox option.
 * @param {HTMLElement} container - The parent container.
 * @param {string} labelText - Text for the label.
 * @param {string} value - Value for the checkbox.
 * @param {boolean} checked - Initial checked state.
 */
function createCheckboxOption(container, labelText, value, checked) {
    const label = document.createElement("label");
    label.className =
        "block flex items-center hover:bg-gray-600 px-1 rounded cursor-pointer transition-colors duration-150";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className =
        "form-checkbox rounded text-pink-600 focus:ring-pink-500 h-4 w-4"; // Explicit size
    input.value = value;
    input.checked = checked;
    // Add listener to trigger chart update on change
    input.addEventListener("change", () => {
        logMetric("interactions", 1);
        debouncedRenderChart();
    });

    const span = document.createElement("span");
    span.className = "ml-2 text-sm select-none"; // Prevent text selection on click
    span.textContent = labelText;

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
}

/**
 * Populates the location checkbox list. (MODIFIED)
 */
export const populateLocationDropdown = () => {
    // Use the new container ID
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const currentSelection = getSelectedLocations(); // Preserve selection
    container.innerHTML = ""; // Clear existing checkboxes

    // Determine if this is the first population run (no selection preserved)
    const isFirstRun = currentSelection.length === 0;

    // Add "Total Turnout" option first
    createCheckboxOption(
        container,
        "Total Turnout",
        TOTAL_TURNOUT_KEY,
        isFirstRun || currentSelection.includes(TOTAL_TURNOUT_KEY) // Check by default on first run
    );

    // Add locations from all loaded data
    const locations = getAllLoadedLocations();
    locations.forEach((name) => {
        // Don't check others by default on first run
        createCheckboxOption(
            container,
            name,
            name,
            !isFirstRun && currentSelection.includes(name)
        );
    });
};

// --- handleYearChange() remains the same ---
const handleYearChange = async (event) => {
    logMetric("interactions", 1);
    const year = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
        await loadYearData(year);
    }
    populateLocationDropdown(); // Repopulate locations
    debouncedRenderChart();
};

/**
 * Sets up event listeners for UI controls. (MODIFIED)
 */
export const setupEventListeners = () => {
    // No listener needed for the container itself, handled by individual checkboxes
    // if (elements.locationSelect) { ... } // REMOVE THIS BLOCK

    if (elements.earlyVotingToggle) {
        elements.earlyVotingToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    }
    if (elements.electionDayToggle) {
        elements.electionDayToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    }
    if (elements.yAxisToggle) {
        elements.yAxisToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    }
    // Year checkbox listeners are added during population
};

// --- getSelectedYears() remains the same ---
export const getSelectedYears = () => {
    if (!elements.yearOptionsContainer) return [];
    return Array.from(
        elements.yearOptionsContainer.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

/**
 * Gets the currently selected locations/total from the checkbox list. (MODIFIED)
 * @returns {string[]} Array of selected location/total keys.
 */
export const getSelectedLocations = () => {
    const container = elements.locationCheckboxContainer;
    if (!container) return [];
    return Array.from(
        container.querySelectorAll("input[type=checkbox]:checked") // Query container
    ).map((cb) => cb.value);
};

// --- getToggleStates() remains the same ---
export const getToggleStates = () => {
    return {
        showEarlyVoting: elements.earlyVotingToggle
            ? elements.earlyVotingToggle.checked
            : true,
        showElectionDay: elements.electionDayToggle
            ? elements.electionDayToggle.checked
            : true,
        startYAtZero: elements.yAxisToggle ? elements.yAxisToggle.checked : true,
    };
};

// --- updateAttribution() remains the same ---
export const updateAttribution = () => {
    if (elements.attribution) {
        const today = new Date();
        const dateString = today.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        elements.attribution.textContent = `Data sourced from the Bexar County Elections Department. Updated as of ${dateString}.`;
    }
};
