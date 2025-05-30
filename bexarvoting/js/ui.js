// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY, DEFAULT_SELECTED_YEARS, PRESET_CONFIGURATIONS } from "./config.js";
import { getAllLoadedLocations, getLocationProperties, isDataLoaded, loadYearData } from "./data.js";
import { debouncedRenderChart, getCurrentChartInstance } from "./chart.js";
import { logMetric, updateURLFromState } from "./main.js";

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
    dataTableToggle: document.getElementById("data-table-toggle"),
    cumulativeToggle: document.getElementById("cumulative-toggle"), // New cumulative toggle
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    dataTableContainer: document.getElementById("data-table-container"),
    copyShareLinkButton: document.getElementById("copy-share-link-button"),
    resetViewButton: document.getElementById("reset-view-button"), // Reset button
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
            elements.chartCanvas.nextSibling
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

    Object.entries(DATA_FILES).forEach(([yearKey, { name, disabled }]) => {
        const label = document.createElement("label");
        label.className = "block inline-flex items-center"; // Tailwind for Flex + Items Center
        if (disabled) {
            label.classList.add("opacity-50", "cursor-not-allowed");
        }

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "form-checkbox rounded text-pink-600 focus:ring-pink-500";
        input.value = yearKey;

        // Use URL params first, then DEFAULT_SELECTED_YEARS
        if (selectedYearsFromURL.length > 0) {
            input.checked = selectedYearsFromURL.includes(yearKey);
        } else {
            input.checked = !disabled && DEFAULT_SELECTED_YEARS.includes(yearKey);
        }

        input.disabled = !!disabled;
        input.addEventListener("change", handleYearChange);

        const span = document.createElement("span");
        span.className = "ml-2 text-sm"; // Adjusted for spacing next to custom checkbox style
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
             // If the last specific location is unchecked, and Total is NOT checked, check Total
             totalCheckbox.checked = true;
        }
    } else if (isTotalCheckbox && !isChecked && specificCheckedCount === 0) {
        // If Total is unchecked, and no specifics are checked, allow it (user wants no location lines)
        // No action needed here, chart will show a cat.
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

    const currentSelection = getSelectedLocations();
    container.innerHTML = "";

    let effectiveSelection = selectedLocationsFromURL.length > 0 ? selectedLocationsFromURL : currentSelection;

     // If no URL params and nothing was previously selected, default to Total
    if (selectedLocationsFromURL.length === 0 && currentSelection.length === 0) {
       effectiveSelection = [TOTAL_TURNOUT_KEY];
    } else if (selectedLocationsFromURL.length > 0 && currentSelection.length === 0) {
        // If URL params exist but currentSelection was empty (first load), use URL
        effectiveSelection = selectedLocationsFromURL;
    }
    // Otherwise, stick with currentSelection


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

        // Always show "Total Turnout" if it matches search or no search is active
        if (locationName === TOTAL_TURNOUT_KEY) {
            if (noSearch || matchesSearch) isVisible = true;
        } else if (locationName) {
            const props = getLocationProperties(locationName);
            const isEDOnlyLocation = props && props.isElectionDayOnly;

            if (matchesSearch) {
                isVisible = true;
            } else if (noSearch) {
                 // If no search, filter based on data type toggles for ED-only locations
                if (isEDOnlyLocation) {
                     if (showElectionDay && !showEarlyVoting) isVisible = true;
                     // If ED is shown, but EV is not, show ED-only locations
                     // If both are shown, still show ED-only locations (they'll just have one data point)
                     // If only EV is shown, hide ED-only locations (they have no EV data)
                } else {
                    isVisible = true; // Always show non-ED-only locations if no search
                }
            }
        }
        optionLabel.style.display = isVisible ? "flex" : "none"; // Use flex to maintain layout
    });
}


function setAllSpecificLocations(checkedState) {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    // Select/Deselect only the currently visible specific location checkboxes
    const specificCheckboxes = Array.from(
        container.querySelectorAll(".location-option:not([style*='display: none']) input[type=checkbox]")
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);

    specificCheckboxes.forEach((cb) => (cb.checked = checkedState));

    // Handle the "Total" checkbox based on specific selections
    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    if (totalCheckbox) {
        if (checkedState) {
            // If selecting all specifics, uncheck total
            totalCheckbox.checked = false;
        } else {
            // If deselecting all specifics, check total (unless Total was already deselected manually)
             const currentlySelectedSpecifics = Array.from(container.querySelectorAll("input[type=checkbox]")).filter(cb => cb.value !== TOTAL_TURNOUT_KEY && cb.checked).length;
             if (currentlySelectedSpecifics === 0) {
                 totalCheckbox.checked = true;
             }
        }
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
    const chartInstance = getCurrentChartInstance();
    const { showDataTable } = getToggleStates();
    const catContainer = document.getElementById("cat-container");

    if (showDataTable) {
        elements.chartContainer.classList.add("hidden");
        if (catContainer) catContainer.classList.add("hidden");
        elements.dataTableContainer.classList.remove("hidden");
        renderDataTable(chartInstance);
    } else {
        elements.dataTableContainer.classList.add("hidden");
        elements.chartContainer.classList.remove("hidden");
        // showCat/hideCat in chart.js handles chartCanvas and catContainer visibility
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
        elements.deselectAllLocationsButton.addEventListener("click", () => setAllSpecificLocations(false));
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
    if (elements.cumulativeToggle) elements.cumulativeToggle.addEventListener("change", commonChangeHandler); // Added cumulative toggle listener

    if (elements.dataTableToggle) {
        elements.dataTableToggle.addEventListener("change", () => {
            logMetric("interactions", 1);
            manageDisplay();
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

    setupPresetButtons(); // Initialize preset buttons
};

// --- Functions to SET UI state from URL and Presets ---
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

    // If locationsToSelect is empty or null, default to checking "Total"
    if (!locationsToSelect || locationsToSelect.length === 0) {
        locationsToSelect = [TOTAL_TURNOUT_KEY];
    }

    checkboxes.forEach(cb => {
        cb.checked = locationsToSelect.includes(cb.value);
    });
    // Ensure intelligent selection rules are met (e.g., if specific selected, uncheck total)
    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    const specificSelected = locationsToSelect.some(loc => loc !== TOTAL_TURNOUT_KEY);
    if (totalCheckbox) {
        if (specificSelected) {
            totalCheckbox.checked = false;
        } else if (locationsToSelect.includes(TOTAL_TURNOUT_KEY)) {
            totalCheckbox.checked = true;
        } else {
            // If no specifics are selected and "Total" wasn't in the list,
            // we still need at least one selected, so default to Total.
            totalCheckbox.checked = true;
        }
    }
};

export const setToggleStates = (states) => {
    if (elements.earlyVotingToggle && states.ev !== undefined) elements.earlyVotingToggle.checked = states.ev;
    if (elements.electionDayToggle && states.ed !== undefined) elements.electionDayToggle.checked = states.ed;
    if (elements.yAxisToggle && states.yz !== undefined) elements.yAxisToggle.checked = states.yz;
    if (elements.dataTableToggle && states.dt !== undefined) elements.dataTableToggle.checked = states.dt;
    if (elements.cumulativeToggle && states.cum !== undefined) elements.cumulativeToggle.checked = states.cum; // Added cumulative toggle state
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
        showDataTable: elements.dataTableToggle ? elements.dataTableToggle.checked : false,
        showCumulative: elements.cumulativeToggle ? elements.cumulativeToggle.checked : false, // Added cumulative state
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

// Preset Button Logic
export const setupPresetButtons = () => {
     // Create and add preset buttons dynamically
    const presetButtonContainer = document.querySelector(".flex.flex-wrap.gap-2");
    if(presetButtonContainer) {
         presetButtonContainer.innerHTML = ''; // Clear existing
         Object.entries(PRESET_CONFIGURATIONS).forEach(([key, preset]) => {
            const button = document.createElement('button');
            button.id = `preset-${key}`;
            button.className = 'preset-button';
            button.textContent = preset.name;
            button.addEventListener('click', () => {
                applyPresetConfiguration(key);
            });
            presetButtonContainer.appendChild(button);
         });
    }

    // Reset view button
    const resetButton = document.getElementById("reset-view-button");
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            applyPresetConfiguration("default"); // Use a special key for default
        });
    }
};

const applyPresetConfiguration = async (presetKey) => {
    logMetric("interactions", 1);

    let config;
    if (presetKey === "default") {
        // Define the default state here
        config = {
            years: DEFAULT_SELECTED_YEARS,
            locations: [TOTAL_TURNOUT_KEY],
            toggles: { ev: true, ed: true, yz: true, dt: false, cum: false }
        };
    } else {
        config = PRESET_CONFIGURATIONS[presetKey];
    }

    if (!config) {
        console.error(`Unknown preset key: ${presetKey}`);
        return;
    }

    updateStatusMessage(`Applying "${config.name || presetKey}" preset...`);

    // Apply year selection first
    setSelectedYears(config.years);

    // Load any new years that are selected by this preset but not already loaded
    const yearsToLoad = config.years.filter(year => DATA_FILES[year] && !isDataLoaded(year));
    if (yearsToLoad.length > 0) {
        await Promise.allSettled(yearsToLoad.map(loadYearData));
    }

    // Repopulate and select locations
    populateLocationDropdown([]); // Repopulate first
     // Give a small delay to ensure the DOM is updated after repopulating
    setTimeout(() => {
        setSelectedLocations(config.locations);
        setToggleStates(config.toggles);

        // Ensure location filter is applied after locations are selected
        filterLocations();

        debouncedRenderChart();
        updateURLFromState();
        updateStatusMessage(""); // Clear status message
    }, 100); // Small delay might be needed
};

// Initial call to setup preset buttons on DOM ready
document.addEventListener('DOMContentLoaded', setupPresetButtons);
