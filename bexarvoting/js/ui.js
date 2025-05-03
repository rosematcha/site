// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { getAllLoadedLocations } from "./data.js";
import { debouncedRenderChart } from "./chart.js";
import { loadYearData } from "./data.js";
import { logMetric } from "./main.js"; // Import logMetric

// DOM Elements
const elements = {
    yearOptionsContainer: document.getElementById("year-options"),
    locationSelect: document.getElementById("location-select"),
    earlyVotingToggle: document.getElementById("early-voting-toggle"),
    electionDayToggle: document.getElementById("election-day-toggle"),
    yAxisToggle: document.getElementById("y-axis-toggle"),
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    attribution: document.getElementById("attribution"),
};

let statusMessageElement = null;

/**
 * Creates and inserts the status message element if it doesn't exist.
 */
function ensureStatusMessageElement() {
    if (!statusMessageElement && elements.chartContainer) {
        statusMessageElement = document.createElement("p");
        statusMessageElement.className =
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4 z-10"; // Ensure it's above canvas
        // Insert before canvas
        elements.chartContainer.insertBefore(
            statusMessageElement,
            elements.chartCanvas
        );
    } else if (!elements.chartContainer) {
        console.error("Chart container not found for status message.");
    }
}

/**
 * Updates the status message displayed in the chart area.
 * @param {string} message - The message to display. Clears if empty.
 */
export const updateStatusMessage = (message) => {
    ensureStatusMessageElement();
    if (statusMessageElement) {
        // Avoid clearing critical error messages with generic ones
        if (
            message &&
            !message.includes("⚠️") &&
            statusMessageElement.textContent.includes("⚠️")
        ) {
            // Don't overwrite an error with a non-error message unless it's empty
        } else {
            statusMessageElement.textContent = message;
        }
    }
};

/**
 * Populates the year selection checkboxes.
 */
export const populateYearCheckboxes = () => {
    if (!elements.yearOptionsContainer) return;
    elements.yearOptionsContainer.innerHTML = ""; // Clear existing

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
        input.checked = !disabled; // Check by default unless disabled
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
 * Populates the location multi-select dropdown.
 */
export const populateLocationDropdown = () => {
    if (!elements.locationSelect) return;

    const currentSelection = getSelectedLocations(); // Preserve selection
    elements.locationSelect.innerHTML = ""; // Clear existing

    // Add "Total Turnout" option first
    const totalOption = new Option("Total Turnout", TOTAL_TURNOUT_KEY);
    elements.locationSelect.add(totalOption);

    // Add locations from all loaded data
    const locations = getAllLoadedLocations();
    locations.forEach((name) => {
        elements.locationSelect.add(new Option(name, name));
    });

    // Re-apply selection
    Array.from(elements.locationSelect.options).forEach((option) => {
        if (currentSelection.includes(option.value)) {
            option.selected = true;
        }
    });

    // Ensure at least one option is selected if nothing was preserved
    if (getSelectedLocations().length === 0 && elements.locationSelect.options.length > 0) {
        elements.locationSelect.options[0].selected = true;
    }
};

/**
 * Handles changes in year selection checkboxes.
 * Loads data if a year is checked and triggers UI updates.
 */
const handleYearChange = async (event) => {
    logMetric("interactions", 1);
    const year = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
        await loadYearData(year); // Load data if checked
    }
    // Always repopulate locations in case the list changes
    populateLocationDropdown();
    debouncedRenderChart(); // Re-render the chart
};

/**
 * Sets up event listeners for UI controls.
 */
export const setupEventListeners = () => {
    if (elements.locationSelect) {
        elements.locationSelect.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    }
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
            debouncedRenderChart(); // Re-render needed to apply axis setting
        });
    }
    // Year checkbox listeners are added during population
};

/**
 * Gets the currently selected years from checkboxes.
 * @returns {string[]} Array of selected year strings.
 */
export const getSelectedYears = () => {
    if (!elements.yearOptionsContainer) return [];
    return Array.from(
        elements.yearOptionsContainer.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

/**
 * Gets the currently selected locations/total from the multi-select.
 * @returns {string[]} Array of selected location/total keys.
 */
export const getSelectedLocations = () => {
    if (!elements.locationSelect) return [];
    return Array.from(elements.locationSelect.selectedOptions).map(
        (opt) => opt.value
    );
};

/**
 * Gets the state of the data type and axis toggles.
 * @returns {{showEarlyVoting: boolean, showElectionDay: boolean, startYAtZero: boolean}}
 */
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

/**
 * Updates the data attribution text with the latest date.
 */
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
