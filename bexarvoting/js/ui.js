// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { getAllLoadedLocations, getLocationProperties } from "./data.js"; // Import getLocationProperties
import { debouncedRenderChart } from "./chart.js";
import { loadYearData } from "./data.js";
import { logMetric } from "./main.js";

// DOM Elements
const elements = {
    yearOptionsContainer: document.getElementById("year-options"),
    locationCheckboxContainer: document.getElementById(
        "location-checkbox-container"
    ),
    locationFilterInput: document.getElementById("location-filter"), // NEW
    selectAllButton: document.getElementById("select-all-locations"), // NEW
    deselectAllButton: document.getElementById("deselect-all-locations"), // NEW
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
 * Handles changes on any location checkbox, implementing intelligent selection.
 * @param {Event} event - The change event object.
 */
function handleLocationChange(event) {
    logMetric("interactions", 1);
    const changedCheckbox = event.target;
    const isTotalCheckbox = changedCheckbox.value === TOTAL_TURNOUT_KEY;
    const isChecked = changedCheckbox.checked;

    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const allCheckboxes = Array.from(
        container.querySelectorAll("input[type=checkbox]")
    );
    const totalCheckbox = allCheckboxes.find(
        (cb) => cb.value === TOTAL_TURNOUT_KEY
    );
    const specificCheckboxes = allCheckboxes.filter(
        (cb) => cb.value !== TOTAL_TURNOUT_KEY
    );
    const specificCheckedCount = specificCheckboxes.filter((cb) => cb.checked)
        .length;

    // Apply selection rules (without triggering recursive changes)
    if (isTotalCheckbox && isChecked) {
        // If Total was checked, uncheck all specifics
        specificCheckboxes.forEach((cb) => (cb.checked = false));
    } else if (!isTotalCheckbox && isChecked) {
        // If a specific was checked, uncheck Total
        if (totalCheckbox) totalCheckbox.checked = false;
    } else if (!isTotalCheckbox && !isChecked) {
        // If a specific was unchecked...
        if (specificCheckedCount === 0 && totalCheckbox) {
            // ...and it was the last one, check Total
            totalCheckbox.checked = true;
        }
    }
    // No special action needed if Total is unchecked (user can deselect all)

    debouncedRenderChart(); // Update chart after applying rules
}

/**
 * Helper function to create a checkbox option. (MODIFIED)
 * @param {HTMLElement} container - The parent container.
 * @param {string} labelText - Text for the label.
 * @param {string} value - Value for the checkbox.
 * @param {boolean} checked - Initial checked state.
 */
function createCheckboxOption(container, labelText, value, checked) {
    const label = document.createElement("label");
    label.className =
        "location-option block flex items-center hover:bg-gray-600 px-1 rounded cursor-pointer transition-colors duration-150"; // Add class for filtering

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className =
        "form-checkbox rounded text-pink-600 focus:ring-pink-500 h-4 w-4";
    input.value = value;
    input.checked = checked;
    // Use the dedicated handler function
    input.addEventListener("change", handleLocationChange);

    const span = document.createElement("span");
    span.className = "ml-2 text-sm select-none";
    span.textContent = labelText;

    // Visual distinction for Total Turnout
    if (value === TOTAL_TURNOUT_KEY) {
        span.classList.add("font-semibold"); // Make text bold
    }

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
}

/**
 * Populates the location checkbox list. (MODIFIED)
 */
export const populateLocationDropdown = () => {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const currentSelection = getSelectedLocations();
    container.innerHTML = "";

    const isFirstRun = currentSelection.length === 0;

    // Add "Total Turnout" option first
    createCheckboxOption(
        container,
        "Total Turnout",
        TOTAL_TURNOUT_KEY,
        isFirstRun || currentSelection.includes(TOTAL_TURNOUT_KEY)
    );

    // Add locations from all loaded data
    const locations = getAllLoadedLocations();
    locations.forEach((name) => {
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
    populateLocationDropdown();
    debouncedRenderChart();
};

/**
 * Filters the location checkbox list based on input.
 */
function filterLocations() {
    const filterText = elements.locationFilterInput.value.toLowerCase().trim();
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const { showEarlyVoting, showElectionDay } = getToggleStates();

    const options = container.querySelectorAll(".location-option");

    options.forEach((optionLabel) => {
        const inputElement = optionLabel.querySelector("input");
        const locationName = inputElement?.value;
        const labelSpan = optionLabel.querySelector("span");
        const locationText = labelSpan ? labelSpan.textContent.toLowerCase() : "";

        const isTotal = locationName === TOTAL_TURNOUT_KEY;
        let isVisible = isTotal || locationText.includes(filterText);

        if (!isTotal && locationName) {
            const props = getLocationProperties(locationName);
            if (props && props.isElectionDayOnly) {
                // Hide if not (only Election Day checked)
                if (!(!showEarlyVoting && showElectionDay)) {
                    isVisible = false;
                }
                // If searched for, it should be visible regardless of toggles
                if (locationText.includes(filterText) && filterText.length > 0) {
                    isVisible = true;
                }
            }
        }

        if (isVisible) {
            optionLabel.style.display = "flex";
        } else {
            optionLabel.style.display = "none";
        }
    });
}

/**
 * Sets or unsets the checked state for all *specific* location checkboxes.
 * @param {boolean} checkedState - True to check all, false to uncheck all.
 */
function setAllSpecificLocations(checkedState) {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const specificCheckboxes = Array.from(
        container.querySelectorAll("input[type=checkbox]")
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);

    specificCheckboxes.forEach((cb) => (cb.checked = checkedState));

    // After changing checks, enforce rules:
    // If we just checked all specifics, uncheck Total.
    // If we just unchecked all specifics, check Total.
    const totalCheckbox = container.querySelector(
        `input[value="${TOTAL_TURNOUT_KEY}"]`
    );
    if (totalCheckbox) {
        totalCheckbox.checked = !checkedState;
    }

    logMetric("interactions", 1); // Log one interaction for the bulk action
    debouncedRenderChart(); // Update chart
}

/**
 * Sets up event listeners for UI controls. (MODIFIED)
 */
export const setupEventListeners = () => {
    // Location filter input
    if (elements.locationFilterInput) {
        // Use 'input' for real-time filtering
        elements.locationFilterInput.addEventListener("input", filterLocations);
    }

    // Select/Deselect All buttons
    if (elements.selectAllButton) {
        elements.selectAllButton.addEventListener("click", () =>
            setAllSpecificLocations(true)
        );
    }
    if (elements.deselectAllButton) {
        elements.deselectAllButton.addEventListener("click", () =>
            setAllSpecificLocations(false)
        );
    }

    // Other toggles
    if (elements.earlyVotingToggle) {
        elements.earlyVotingToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            filterLocations(); // Add this call
            debouncedRenderChart();
        });
    }
    if (elements.electionDayToggle) {
        elements.electionDayToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            filterLocations(); // Add this call
            debouncedRenderChart();
        });
    }
    if (elements.yAxisToggle) {
        elements.yAxisToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            debouncedRenderChart();
        });
    }
    // Year/Location checkbox listeners are added during population
};

// --- getSelectedYears() remains the same ---
export const getSelectedYears = () => {
    if (!elements.yearOptionsContainer) return [];
    return Array.from(
        elements.yearOptionsContainer.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

// --- getSelectedLocations() remains the same ---
export const getSelectedLocations = () => {
    const container = elements.locationCheckboxContainer;
    if (!container) return [];
    return Array.from(
        container.querySelectorAll("input[type=checkbox]:checked")
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
