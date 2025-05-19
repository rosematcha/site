// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { getAllLoadedLocations, getLocationProperties } from "./data.js";
import { debouncedRenderChart, getCurrentChartInstance } from "./chart.js"; // Import getCurrentChartInstance
import { loadYearData } from "./data.js";
import { logMetric, updateURLFromState } from "./main.js"; // Import updateURLFromState

// DOM Elements
const elements = {
    yearOptionsContainer: document.getElementById("year-options"),
    locationCheckboxContainer: document.getElementById("location-checkbox-container"),
    locationFilterInput: document.getElementById("location-filter"),
    selectAllButton: document.getElementById("select-all-locations"),
    deselectAllButton: document.getElementById("deselect-all-locations"),
    earlyVotingToggle: document.getElementById("early-voting-toggle"),
    electionDayToggle: document.getElementById("election-day-toggle"),
    yAxisToggle: document.getElementById("y-axis-toggle"),
    dataTableToggle: document.getElementById("data-table-toggle"), // New
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    dataTableContainer: document.getElementById("data-table-container"), // New
    copyShareLinkButton: document.getElementById("copy-share-link-button"), // New
    attribution: document.getElementById("attribution"),
};

let statusMessageElement = null;

function ensureStatusMessageElement() {
    if (!statusMessageElement && elements.chartContainer) {
        statusMessageElement = document.createElement("p");
        statusMessageElement.className =
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4 z-10";
        elements.chartContainer.insertBefore(
            statusMessageElement,
            elements.chartCanvas.nextSibling // Insert before cat or after canvas
        );
    } else if (!elements.chartContainer) {
        console.error("Chart container not found for status message.");
    }
}

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
            statusMessageElement.classList.toggle("hidden", !message);
        }
    }
};

export const populateYearCheckboxes = (selectedYearsFromURL = []) => {
    if (!elements.yearOptionsContainer) return;
    elements.yearOptionsContainer.innerHTML = "";

    const mostRecentYearKey = Object.keys(DATA_FILES)[0]; // Assumes DATA_FILES is ordered newest to oldest

    Object.entries(DATA_FILES).forEach(([yearKey, { name, disabled }]) => {
        const label = document.createElement("label");
        label.className = "block inline-flex items-center";
        if (disabled) {
            label.classList.add("opacity-50", "cursor-not-allowed");
        }

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "form-checkbox rounded text-pink-600 focus:ring-pink-500";
        input.value = yearKey;
        if (selectedYearsFromURL.length > 0) {
            input.checked = selectedYearsFromURL.includes(yearKey);
        } else {
            input.checked = !disabled && yearKey === mostRecentYearKey; // Default to most recent if no URL params
        }
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

function handleLocationChange(event) {
    logMetric("interactions", 1);
    const changedCheckbox = event.target;
    const isTotalCheckbox = changedCheckbox.value === TOTAL_TURNOUT_KEY;
    const isChecked = changedCheckbox.checked;

    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const allCheckboxes = Array.from(container.querySelectorAll("input[type=checkbox]"));
    const totalCheckbox = allCheckboxes.find((cb) => cb.value === TOTAL_TURNOUT_KEY);
    const specificCheckboxes = allCheckboxes.filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);
    const specificCheckedCount = specificCheckboxes.filter((cb) => cb.checked).length;

    if (isTotalCheckbox && isChecked) {
        specificCheckboxes.forEach((cb) => (cb.checked = false));
    } else if (!isTotalCheckbox && isChecked) {
        if (totalCheckbox) totalCheckbox.checked = false;
    } else if (!isTotalCheckbox && !isChecked) {
        if (specificCheckedCount === 0 && totalCheckbox && !totalCheckbox.checked) {
            totalCheckbox.checked = true;
        }
    } else if (isTotalCheckbox && !isChecked && specificCheckedCount === 0) {
        // If "Total" is unchecked and no specifics are checked, allow it (user wants no location lines)
        // Or, re-check "Total" if you want at least one thing always selected.
        // For now, let's allow deselecting all. The chart will show a cat.
    }

    debouncedRenderChart();
    updateURLFromState();
}

function createCheckboxOption(container, labelText, value, checked) {
    const label = document.createElement("label");
    label.className = "location-option block flex items-center hover:bg-gray-600 px-1 rounded cursor-pointer transition-colors duration-150";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-checkbox rounded text-pink-600 focus:ring-pink-500 h-4 w-4";
    input.value = value;
    input.checked = checked;
    input.addEventListener("change", handleLocationChange);

    const span = document.createElement("span");
    span.className = "ml-2 text-sm select-none";
    span.textContent = labelText;

    if (value === TOTAL_TURNOUT_KEY) {
        span.classList.add("font-semibold");
    }

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
}

export const populateLocationDropdown = (selectedLocationsFromURL = []) => {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const currentSelection = getSelectedLocations(); // Get what's actually checked *now* if repopulating
    container.innerHTML = "";

    const isInitialPopulation = selectedLocationsFromURL.length > 0 && currentSelection.length === 0;
    let useURLState = isInitialPopulation;
    let effectiveSelection = useURLState ? selectedLocationsFromURL : currentSelection;

    // If after URL parsing or initial load, nothing is selected, default to Total
    if (effectiveSelection.length === 0 && !useURLState && !currentSelection.includes(TOTAL_TURNOUT_KEY)) {
       effectiveSelection = [TOTAL_TURNOUT_KEY];
    }


    createCheckboxOption(
        container,
        "Total Turnout",
        TOTAL_TURNOUT_KEY,
        effectiveSelection.includes(TOTAL_TURNOUT_KEY)
    );

    const locations = getAllLoadedLocations();
    locations.forEach((name) => {
        createCheckboxOption(
            container,
            name,
            name,
            effectiveSelection.includes(name)
        );
    });
    filterLocations();
};


const handleYearChange = async (event) => {
    logMetric("interactions", 1);
    const year = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
        await loadYearData(year);
    }
    // Repopulate locations if a year was added/removed, as available locations might change.
    // Pass current selections so they are preserved.
    populateLocationDropdown(getSelectedLocations());
    debouncedRenderChart();
    updateURLFromState();
};

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
        const locationDisplayName = labelSpan ? labelSpan.textContent.toLowerCase() : "";

        let isVisible = false;
        const matchesSearch = filterText.length > 0 && locationDisplayName.includes(filterText);
        const noSearch = filterText.length === 0;

        if (locationName === TOTAL_TURNOUT_KEY) {
            if (noSearch || matchesSearch) isVisible = true;
        } else if (locationName) {
            const props = getLocationProperties(locationName);
            const isEDOnlyLocation = props && props.isElectionDayOnly;

            if (matchesSearch) {
                isVisible = true;
            } else if (noSearch) {
                if (isEDOnlyLocation) {
                    if (showElectionDay && !showEarlyVoting) isVisible = true;
                } else {
                    isVisible = true;
                }
            }
        }
        optionLabel.style.display = isVisible ? "flex" : "none";
    });
}

function setAllSpecificLocations(checkedState) {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const specificCheckboxes = Array.from(
        container.querySelectorAll("input[type=checkbox]")
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY && cb.closest('.location-option').style.display !== 'none'); // Only act on visible

    specificCheckboxes.forEach((cb) => (cb.checked = checkedState));

    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    if (totalCheckbox) {
        totalCheckbox.checked = !checkedState;
    }

    logMetric("interactions", 1);
    debouncedRenderChart();
    updateURLFromState();
}

/**
 * Renders the data from the chart into an HTML table.
 * @param {Chart|null} chartInstance - The current Chart.js instance.
 */
export const renderDataTable = (chartInstance) => {
    if (!elements.dataTableContainer) return;

    if (!chartInstance || !chartInstance.data || !chartInstance.data.labels || !chartInstance.data.datasets) {
        elements.dataTableContainer.innerHTML = `<p class="p-4 text-gray-400">No data to display in table.</p>`;
        return;
    }

    const { labels, datasets } = chartInstance.data;

    if (datasets.length === 0 || labels.length === 0) {
        elements.dataTableContainer.innerHTML = `<p class="p-4 text-gray-400">No data selected for table view.</p>`;
        return;
    }

    let tableHTML = '<table class="data-table"><thead><tr><th>Date/Day</th>';
    datasets.forEach(dataset => {
        tableHTML += `<th>${dataset.label}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    labels.forEach((label, index) => {
        tableHTML += `<tr><td>${label}</td>`;
        datasets.forEach(dataset => {
            const value = dataset.data[index];
            tableHTML += `<td>${value !== null && value !== undefined ? value.toLocaleString() : 'N/A'}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    elements.dataTableContainer.innerHTML = tableHTML;
};


/**
 * Manages the visibility of the chart, data table, and cat image.
 * Called after chart rendering logic.
 */
export const manageDisplay = () => {
    const chartInstance = getCurrentChartInstance(); // Get the current chart instance
    const { showDataTable } = getToggleStates();
    const catContainer = document.getElementById("cat-container"); // Assuming chart.js creates this

    if (showDataTable) {
        elements.chartContainer.classList.add("hidden");
        if (catContainer) catContainer.classList.add("hidden"); // Hide cat if table is shown
        elements.dataTableContainer.classList.remove("hidden");
        renderDataTable(chartInstance); // chartInstance can be null if cat was shown
    } else {
        elements.dataTableContainer.classList.add("hidden");
        elements.chartContainer.classList.remove("hidden");
        // chart.js's showCat/hideCat logic will handle chartCanvas and catContainer visibility
        // If chartInstance is null, showCat() would have been called.
        // If chartInstance exists, hideCat() would have been called.
        // So, we just ensure the chartContainer itself is visible.
    }
};


export const setupEventListeners = () => {
    if (elements.locationFilterInput) {
        elements.locationFilterInput.addEventListener("input", filterLocations);
    }
    if (elements.selectAllButton) {
        elements.selectAllButton.addEventListener("click", () => setAllSpecificLocations(true));
    }
    if (elements.deselectAllButton) {
        elements.deselectAllButton.addEventListener("click", () => setAllSpecificLocations(false));
    }

    const commonChangeHandler = () => {
        logMetric("interactions", 1);
        filterLocations(); // Filter might be affected by EV/ED toggles for ED-only sites
        debouncedRenderChart();
        updateURLFromState();
    };

    if (elements.earlyVotingToggle) elements.earlyVotingToggle.addEventListener("change", commonChangeHandler);
    if (elements.electionDayToggle) elements.electionDayToggle.addEventListener("change", commonChangeHandler);
    if (elements.yAxisToggle) elements.yAxisToggle.addEventListener("change", commonChangeHandler);

    if (elements.dataTableToggle) {
        elements.dataTableToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            manageDisplay(); // This will handle showing/hiding table/chart
            updateURLFromState();
        });
    }

    if (elements.copyShareLinkButton) {
        elements.copyShareLinkButton.addEventListener("click", () => {
            logMetric("interactions", 1);
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                const originalText = elements.copyShareLinkButton.textContent;
                elements.copyShareLinkButton.textContent = "Copied!";
                setTimeout(() => {
                    elements.copyShareLinkButton.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy URL: ", err);
                alert("Failed to copy URL. Please copy it manually from the address bar.");
            });
        });
    }
};

export const getSelectedYears = () => {
    if (!elements.yearOptionsContainer) return [];
    return Array.from(
        elements.yearOptionsContainer.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

export const getSelectedLocations = () => {
    const container = elements.locationCheckboxContainer;
    if (!container) return [];
    return Array.from(
        container.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

export const getToggleStates = () => {
    return {
        showEarlyVoting: elements.earlyVotingToggle ? elements.earlyVotingToggle.checked : true,
        showElectionDay: elements.electionDayToggle ? elements.electionDayToggle.checked : true,
        startYAtZero: elements.yAxisToggle ? elements.yAxisToggle.checked : true,
        showDataTable: elements.dataTableToggle ? elements.dataTableToggle.checked : false, // New
    };
};

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


// --- Functions to SET UI state from URL ---
export const setSelectedYears = (yearsToSelect) => {
    if (!elements.yearOptionsContainer) return;
    const checkboxes = elements.yearOptionsContainer.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach(cb => {
        cb.checked = yearsToSelect.includes(cb.value);
    });
};

export const setSelectedLocations = (locationsToSelect) => {
    const container = elements.locationCheckboxContainer;
    if (!container) return;
    const checkboxes = container.querySelectorAll("input[type=checkbox]");
    
    // If locationsToSelect is empty from URL, default to checking "Total"
    if (locationsToSelect.length === 0) {
        locationsToSelect = [TOTAL_TURNOUT_KEY];
    }

    checkboxes.forEach(cb => {
        cb.checked = locationsToSelect.includes(cb.value);
    });
    // Ensure intelligent selection rules are met (e.g., if specific selected, uncheck total)
    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    const specificSelected = locationsToSelect.some(loc => loc !== TOTAL_TURNOUT_KEY);
    if (totalCheckbox && specificSelected && locationsToSelect.includes(TOTAL_TURNOUT_KEY)) {
        // If URL said select Total AND specifics, prioritize specifics
        totalCheckbox.checked = false;
    } else if (totalCheckbox && specificSelected) {
        totalCheckbox.checked = false;
    } else if (totalCheckbox && locationsToSelect.includes(TOTAL_TURNOUT_KEY) && !specificSelected) {
        totalCheckbox.checked = true;
    }


};

export const setToggleStates = (states) => {
    if (elements.earlyVotingToggle && states.ev !== undefined) elements.earlyVotingToggle.checked = states.ev;
    if (elements.electionDayToggle && states.ed !== undefined) elements.electionDayToggle.checked = states.ed;
    if (elements.yAxisToggle && states.yz !== undefined) elements.yAxisToggle.checked = states.yz;
    if (elements.dataTableToggle && states.dt !== undefined) elements.dataTableToggle.checked = states.dt;
};