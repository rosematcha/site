// js/ui.js
import { DATA_FILES, TOTAL_TURNOUT_KEY, DEFAULT_SELECTED_YEARS, PRESET_CONFIGURATIONS } from "./config.js";
import { getLocationProperties, isDataLoaded, loadYearData, getAllMasterLocationNames, isLocationInYearData } from "./data.js";
import { debouncedRenderChart, getCurrentChartInstance } from "./chart.js";
import { logMetric } from "./main.js";
import { formatReadableList } from "./utils.js";

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
    dataPresentationRadios: document.querySelectorAll('input[name="data-presentation"]'),
    timelineModeRadios: document.querySelectorAll('input[name="timeline-mode"]'),
    displayAsRadios: document.querySelectorAll('input[name="display-as"]'),
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    dataTableContainer: document.getElementById("data-table-container"),
    copyShareLinkButton: document.getElementById("copy-share-link-button"),
    resetViewButton: document.getElementById("reset-view-button"),
    presetButtonsContainer: document.getElementById("preset-buttons-container"),
    attribution: document.getElementById("attribution"),
};

// Chart description removed - no longer needed
export const updateChartDescription = () => {
    // Function kept for compatibility but does nothing
};

let statusMessageElement = null;
const STATUS_WARNING_PREFIX = "Warning:";
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const updateURLFromState = () => {
    const years = getSelectedYears();
    const locations = getSelectedLocations();
    const {
        showEarlyVoting,
        showElectionDay,
        startYAtZero,
        dataPresentation,
        displayAs,
        timelineMode
    } = getToggleStates();

    const params = new URLSearchParams();
    if (years.length > 0) params.set("y", years.join(","));
    if (locations.length > 0) params.set("l", locations.join(","));

    params.set("ev", showEarlyVoting ? "1" : "0");
    params.set("ed", showElectionDay ? "1" : "0");
    params.set("yz", startYAtZero ? "1" : "0");
    params.set("pres", dataPresentation);
    params.set("tl", timelineMode);
    params.set("disp", displayAs);

    const newRelativePathQuery = window.location.pathname + "?" + params.toString();
    history.replaceState(null, "", newRelativePathQuery);
};

export const refreshSelectionSummary = () => {
    // Removed "Currently Viewing" section for cleaner UX
    // The chart and controls are now self-explanatory
};


function ensureStatusMessageElement() {
    if (!statusMessageElement && elements.chartContainer) {
        statusMessageElement = document.createElement("p");
        statusMessageElement.className =
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 my-4 z-10";
        // Append to the chart container instead of using insertBefore
        const wrapper = elements.chartContainer.querySelector('.chart-canvas-wrapper');
        if (wrapper) {
            wrapper.appendChild(statusMessageElement);
        } else {
            elements.chartContainer.appendChild(statusMessageElement);
        }
    } else if (!elements.chartContainer) {
        // console.error("Chart container not found for status message."); // Keep if needed for debugging
    }
}

export const updateStatusMessage = (message) => {
    ensureStatusMessageElement();
    if (statusMessageElement) {
        if (
            message &&
            !message.startsWith(STATUS_WARNING_PREFIX) &&
            statusMessageElement.textContent.startsWith(STATUS_WARNING_PREFIX)
        ) {
            // Preserve warning copy until a new warning or clear message replaces it
        } else {
            statusMessageElement.textContent = message;
            statusMessageElement.classList.toggle("hidden", !message);
        }
    }
};

const updateYearLabelState = (label, checked) => {
    if (label && label.classList) {
        if (checked) {
            label.classList.add("checked");
        } else {
            label.classList.remove("checked");
        }
    }
};

export const populateYearCheckboxes = (selectedYearsFromURLOrDefaults = []) => {
    if (!elements.yearOptionsContainer) return;
    elements.yearOptionsContainer.innerHTML = "";

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

        input.checked = !disabled && selectedYearsFromURLOrDefaults.includes(yearKey);
        input.disabled = !!disabled;

        input.addEventListener("change", (event) => {
            updateYearLabelState(label, event.target.checked);
            handleYearChange(event);
        });

        const span = document.createElement("span");
        span.className = "ml-2 text-sm";
        span.textContent = name + (disabled ? " (pending)" : "");

        label.appendChild(input);
        label.appendChild(span);
        elements.yearOptionsContainer.appendChild(label);
        updateYearLabelState(label, input.checked);
    });
    refreshSelectionSummary();
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
    }
    updateSelectAllVisibleButtonState(); // Update button state after a manual check/uncheck
    refreshSelectionSummary();
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

    container.innerHTML = "";

    const allMasterNames = getAllMasterLocationNames();
    const initialCheckboxStates = {};

    let totalIsInitiallyChecked = false;
    if (selectedLocationsFromURL.length > 0) {
        if (selectedLocationsFromURL.includes(TOTAL_TURNOUT_KEY)) {
            const specificLocationsInURL = selectedLocationsFromURL.filter(loc => loc !== TOTAL_TURNOUT_KEY);
            totalIsInitiallyChecked = specificLocationsInURL.length === 0;
        }
    } else {
        totalIsInitiallyChecked = true;
    }
    initialCheckboxStates[TOTAL_TURNOUT_KEY] = totalIsInitiallyChecked;

    allMasterNames.forEach(name => {
        if (selectedLocationsFromURL.includes(name)) {
            initialCheckboxStates[name] = true;
            if (totalIsInitiallyChecked) {
                 initialCheckboxStates[TOTAL_TURNOUT_KEY] = false;
            }
        } else {
            initialCheckboxStates[name] = false;
        }
    });

    const anySpecificChecked = Object.entries(initialCheckboxStates)
                                .filter(([key, value]) => key !== TOTAL_TURNOUT_KEY && value)
                                .length > 0;
    if (!anySpecificChecked && !initialCheckboxStates[TOTAL_TURNOUT_KEY]) {
        initialCheckboxStates[TOTAL_TURNOUT_KEY] = true;
    }

    createCheckboxOption(
        container,
        "Total Turnout",
        TOTAL_TURNOUT_KEY,
        initialCheckboxStates[TOTAL_TURNOUT_KEY] || false
    );

    allMasterNames.forEach((name) => {
        createCheckboxOption(
            container,
            name,
            name,
            initialCheckboxStates[name] || false
        );
    });

    filterLocations();

    const allCheckboxes = Array.from(container.querySelectorAll("input[type=checkbox]"));
    const totalCheckbox = allCheckboxes.find((cb) => cb.value === TOTAL_TURNOUT_KEY);
    const specificCheckboxes = allCheckboxes.filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);
    
    if (totalCheckbox) {
        const specificVisibleCheckedCount = specificCheckboxes.filter((cb) => cb.checked && cb.parentElement && cb.parentElement.style.display !== 'none').length;
        if (specificVisibleCheckedCount > 0) {
             totalCheckbox.checked = false;
        } else {
            const urlHadSpecificsOnly = selectedLocationsFromURL.length > 0 && 
                                         !selectedLocationsFromURL.includes(TOTAL_TURNOUT_KEY) &&
                                         selectedLocationsFromURL.some(loc => loc !== TOTAL_TURNOUT_KEY);
             if (!urlHadSpecificsOnly || selectedLocationsFromURL.length === 0) {
                 totalCheckbox.checked = true;
             } else {
                 totalCheckbox.checked = false;
             }
        }
    }
    updateSelectAllVisibleButtonState();
    refreshSelectionSummary();
};

const handleYearChange = async (event) => {
    logMetric("interactions", 1);
    const year = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
        updateStatusMessage(`Loading data for ${year}...`);
        await loadYearData(year);
        updateStatusMessage("");
    }
    // Preserve current selections when repopulating based on year changes
    const currentSelectedLocations = getSelectedLocations();
    populateLocationDropdown(currentSelectedLocations.length > 0 ? currentSelectedLocations : [TOTAL_TURNOUT_KEY]);
    refreshSelectionSummary();
    debouncedRenderChart();
    updateURLFromState();
};

function filterLocations() {
    const filterText = elements.locationFilterInput?.value?.toLowerCase().trim() || "";
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const { showEarlyVoting, showElectionDay } = getToggleStates();
    const selectedYears = getSelectedYears();
    const options = container.querySelectorAll(".location-option");

    options.forEach((optionLabel) => {
        const inputElement = optionLabel.querySelector("input");
        if (!inputElement) return;
        const locationName = inputElement.value;
        const labelSpan = optionLabel.querySelector("span");
        const locationDisplayName = labelSpan ? labelSpan.textContent.toLowerCase() : "";

        let isVisible = false;

        if (locationName === TOTAL_TURNOUT_KEY) {
            if (filterText) {
                isVisible = locationDisplayName.includes(filterText);
            } else {
                isVisible = true;
            }
        } else {
            if (filterText) {
                isVisible = locationDisplayName.includes(filterText);
            } else {
                let isInSelectedYearData = false;
                if (selectedYears.length > 0) {
                    for (const year of selectedYears) {
                        if (isLocationInYearData(locationName, year)) {
                            isInSelectedYearData = true;
                            break;
                        }
                    }
                } else {
                    isInSelectedYearData = false;
                }

                if (!isInSelectedYearData) {
                    isVisible = false;
                } else {
                    const props = getLocationProperties(locationName);
                    const isEDOLocation = props ? props.isElectionDayOnly : false;

                    if (!showEarlyVoting && !showElectionDay) {
                        isVisible = false;
                    } else if (showEarlyVoting && showElectionDay) {
                        isVisible = !isEDOLocation; // Show if not EDO (i.e., has EV data) or if it's EDO and we show ED
                    } else if (!showEarlyVoting && showElectionDay) { // Only ED
                        isVisible = true; // All locations are potentially visible if they have ED data
                    } else if (showEarlyVoting && !showElectionDay) { // Only EV
                        isVisible = !isEDOLocation; // Show only if it's not an EDO location
                    }
                }
            }
        }
        optionLabel.style.display = isVisible ? "flex" : "none";
    });
    updateSelectAllVisibleButtonState();
}

function updateSelectAllVisibleButtonState() {
    const container = elements.locationCheckboxContainer;
    if (!container || !elements.selectAllButton || !elements.deselectAllButton) return;

    const visibleSpecificCheckboxes = Array.from(
        container.querySelectorAll(".location-option:not([style*='display: none']) input[type=checkbox]")
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);

    const visibleCheckedCount = visibleSpecificCheckboxes.filter(cb => cb.checked).length;

    if (visibleSpecificCheckboxes.length > 0) {
        elements.selectAllButton.textContent = `Select All Visible (${visibleSpecificCheckboxes.length})`;
        elements.deselectAllButton.textContent = `Deselect All Visible (${visibleCheckedCount} Selected)`;
        elements.selectAllButton.disabled = visibleCheckedCount === visibleSpecificCheckboxes.length;
        elements.deselectAllButton.disabled = visibleCheckedCount === 0;
    } else {
        elements.selectAllButton.textContent = `Select All Visible (0)`;
        elements.deselectAllButton.textContent = `Deselect All Visible (0 Selected)`;
        elements.selectAllButton.disabled = true;
        elements.deselectAllButton.disabled = true;
    }
}

function setAllSpecificLocations(checkedState) {
    const container = elements.locationCheckboxContainer;
    if (!container) return;

    const specificCheckboxes = Array.from(
        container.querySelectorAll(".location-option input[type=checkbox]") // Get all, then filter by visibility
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);

    let changed = false;
    specificCheckboxes.forEach((cb) => {
         if (cb.parentElement && cb.parentElement.style.display !== 'none') {
             if (cb.checked !== checkedState) {
                cb.checked = checkedState;
                changed = true;
                // Dispatch change event to trigger handleLocationChange
                const event = new Event('change', { bubbles: true });
                cb.dispatchEvent(event); // This will call handleLocationChange
             }
         }
     });

    if (changed) {
        // handleLocationChange calls debouncedRenderChart and updateURLFromState.
    } else {
        const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
        if (totalCheckbox) {
            const shouldTotalBeChecked = !checkedState; 
            if (totalCheckbox.checked !== shouldTotalBeChecked) {
                totalCheckbox.checked = shouldTotalBeChecked;
                const event = new Event('change', { bubbles: true });
                totalCheckbox.dispatchEvent(event);
            }
        }
    }
    updateSelectAllVisibleButtonState();
    logMetric("interactions", 1);
}

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
            tableHTML += `<td>${value !== null && value !== undefined ? numberFormatter.format(value) : 'N/A'}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    elements.dataTableContainer.innerHTML = tableHTML;
};

export const manageDisplay = () => {
    const chartInstance = getCurrentChartInstance();
    const { displayAs } = getToggleStates();
    const catContainer = document.getElementById("cat-container");

    if (displayAs === "table") {
        elements.chartContainer.classList.add("hidden");
        if (catContainer) catContainer.classList.add("hidden");
        elements.dataTableContainer.classList.remove("hidden");
        renderDataTable(chartInstance);
    } else {
        elements.dataTableContainer.classList.add("hidden");
        elements.chartContainer.classList.remove("hidden");
        if (chartInstance && catContainer) {
            catContainer.classList.add("hidden");
            elements.chartCanvas.style.display = "block";
        } else if (!chartInstance && catContainer) {
            catContainer.classList.remove("hidden");
            elements.chartCanvas.style.display = "none";
        }
    }
};

const updateRadioVisuals = (radioNodeList) => {
    radioNodeList.forEach(radio => {
        const span = radio.nextElementSibling;
        if (span) {
            if (radio.checked) {
                span.classList.add('radio-selected');
            } else {
                span.classList.remove('radio-selected');
            }
        }
    });
};

export const setupEventListeners = () => {
    if (elements.locationFilterInput) {
        elements.locationFilterInput.addEventListener("input", () => {
            filterLocations();
            debouncedRenderChart();
            updateURLFromState();
        });
    }
    if (elements.selectAllButton) {
        elements.selectAllButton.addEventListener("click", () => setAllSpecificLocations(true));
    }
    if (elements.deselectAllButton) { 
        elements.deselectAllButton.addEventListener("click", () => setAllSpecificLocations(false));
    }

    const commonChangeHandler = () => {
        logMetric("interactions", 1);
        filterLocations(); // Ensure location visibility is updated based on EV/ED toggles
        refreshSelectionSummary();
        debouncedRenderChart();
        updateURLFromState();
    };

    if (elements.earlyVotingToggle) elements.earlyVotingToggle.addEventListener("change", commonChangeHandler);
    if (elements.electionDayToggle) elements.electionDayToggle.addEventListener("change", commonChangeHandler);
    if (elements.yAxisToggle) elements.yAxisToggle.addEventListener("change", commonChangeHandler);

    elements.dataPresentationRadios.forEach(radio => radio.addEventListener('change', () => {
        updateRadioVisuals(elements.dataPresentationRadios);
        updateChartDescription();
        refreshSelectionSummary();
        commonChangeHandler();
    }));

    if (elements.timelineModeRadios && elements.timelineModeRadios.length > 0) {
        elements.timelineModeRadios.forEach(radio => radio.addEventListener('change', () => {
            updateRadioVisuals(elements.timelineModeRadios);
            refreshSelectionSummary();
            commonChangeHandler();
        }));
    }

    elements.displayAsRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            logMetric("interactions", 1);
            updateRadioVisuals(elements.displayAsRadios);
            updateChartDescription();
            manageDisplay(); // This will call renderDataTable if switching to table
            refreshSelectionSummary();
            updateURLFromState();
            // If switching to graph, and data is already processed, chart might need explicit re-render
            // if manageDisplay doesn't trigger it (e.g. if cat was shown).
            // debouncedRenderChart will handle cat logic.
            if (radio.value === 'graph') {
                debouncedRenderChart();
            }
        });
    });

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

    setupPresetButtons();
};

export const setSelectedYears = (yearsToSelect) => {
    if (!elements.yearOptionsContainer) return;
    const labels = elements.yearOptionsContainer.querySelectorAll("label");
    labels.forEach(label => {
        const checkbox = label.querySelector("input[type=checkbox]");
        if (checkbox) {
            checkbox.checked = yearsToSelect.includes(checkbox.value);
            updateYearLabelState(label, checkbox.checked);
        }
    });
    refreshSelectionSummary();
};

export const setSelectedLocations = (locationsToSelect) => { // eslint-disable-line no-unused-vars
    // This function is mostly a placeholder now.
    // populateLocationDropdown is the primary way to set location selections based on an array.
    // Presets or URL loading will call populateLocationDropdown directly or indirectly.
};

export const setToggleStates = (states) => { // states is an object
    if (elements.earlyVotingToggle && states.ev !== undefined) elements.earlyVotingToggle.checked = states.ev;
    if (elements.electionDayToggle && states.ed !== undefined) elements.electionDayToggle.checked = states.ed;
    if (elements.yAxisToggle && states.yz !== undefined) elements.yAxisToggle.checked = states.yz;

    if (states.presentation !== undefined) {
        elements.dataPresentationRadios.forEach(radio => {
            radio.checked = radio.value === states.presentation;
        });
        updateRadioVisuals(elements.dataPresentationRadios);
    } // No 'else' for defaulting if not specified

    if (states.timeline !== undefined && elements.timelineModeRadios && elements.timelineModeRadios.length > 0) {
        elements.timelineModeRadios.forEach(radio => {
            radio.checked = radio.value === states.timeline;
        });
        updateRadioVisuals(elements.timelineModeRadios);
    }

    if (states.display !== undefined) {
        elements.displayAsRadios.forEach(radio => {
            radio.checked = radio.value === states.display;
        });
        updateRadioVisuals(elements.displayAsRadios);
    } // No 'else' for defaulting if not specified
    refreshSelectionSummary();
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
        container.querySelectorAll(".location-option input[type=checkbox]:checked")
    ).map((cb) => cb.value);
};

export const getToggleStates = () => {
    let dataPresentationValue = 'per-day'; // Default if no radio is checked (should not happen with HTML)
    if (elements.dataPresentationRadios && elements.dataPresentationRadios.length > 0) {
        const checkedRadio = Array.from(elements.dataPresentationRadios).find(radio => radio.checked);
        if (checkedRadio) dataPresentationValue = checkedRadio.value;
    }

    let timelineModeValue = 'actual';
    if (elements.timelineModeRadios && elements.timelineModeRadios.length > 0) {
        const checkedTimelineRadio = Array.from(elements.timelineModeRadios).find(radio => radio.checked);
        if (checkedTimelineRadio) timelineModeValue = checkedTimelineRadio.value;
    }

    let displayAsValue = 'graph'; // Default
    if (elements.displayAsRadios && elements.displayAsRadios.length > 0) {
        const checkedRadio = Array.from(elements.displayAsRadios).find(radio => radio.checked);
        if (checkedRadio) displayAsValue = checkedRadio.value;
    }

    return {
        showEarlyVoting: elements.earlyVotingToggle ? elements.earlyVotingToggle.checked : true,
        showElectionDay: elements.electionDayToggle ? elements.electionDayToggle.checked : true,
        startYAtZero: elements.yAxisToggle ? elements.yAxisToggle.checked : true,
        dataPresentation: dataPresentationValue,
        timelineMode: timelineModeValue,
        displayAs: displayAsValue,
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
        elements.attribution.textContent = `Data sourced from the Bexar County Elections Department via Public Information Act request. Updated as of ${dateString}.`;
    }
};

export const setupPresetButtons = () => {
    if (!elements.presetButtonsContainer) return;
    elements.presetButtonsContainer.innerHTML = '';
    Object.entries(PRESET_CONFIGURATIONS).forEach(([key, preset]) => {
        const button = document.createElement('button');
        button.id = `preset-${key}`;
        button.className = 'preset-button';
        button.textContent = preset.name;
        button.addEventListener('click', () => {
            applyPresetConfiguration(key);
        });
        elements.presetButtonsContainer.appendChild(button);
    });

    if (elements.resetViewButton) {
        elements.resetViewButton.addEventListener("click", () => {
            applyPresetConfiguration("default");
        });
    }
};

const applyPresetConfiguration = async (presetKey) => {
    logMetric("interactions", 1);
    let config;
    if (presetKey === "default") {
        config = {
            name: "Default View",
            years: DEFAULT_SELECTED_YEARS,
            locations: [TOTAL_TURNOUT_KEY],
            toggles: { ev: true, ed: true, yz: true, presentation: 'per-day', timeline: 'actual', display: 'graph' }
        };
    } else {
        config = PRESET_CONFIGURATIONS[presetKey];
    }

    if (!config) {
        console.error(`Unknown preset key: ${presetKey}`);
        return;
    }
    updateStatusMessage(`Applying "${config.name || presetKey}" preset...`);
    
    // 1. Apply years if specified
    if (config.years) {
        setSelectedYears(config.years); // Updates year checkboxes

        // Manually trigger data loading for newly selected years
        const yearsToLoad = config.years.filter(year => DATA_FILES[year] && !isDataLoaded(year));
        if (yearsToLoad.length > 0) {
            await Promise.allSettled(yearsToLoad.map(loadYearData));
        }
    }

    // 2. Apply toggles ONLY if specified in the preset configuration
    if (config.toggles && typeof config.toggles === 'object') {
        setToggleStates(config.toggles);
    }
    // If config.toggles is not defined for a preset, current toggle states are preserved.

    // 3. Handle locations:
    // If config.locations is specified, use them.
    // Otherwise, preserve current selections.
    // In either case, repopulateLocationDropdown to refresh the list based on (potentially new) years
    // and apply the determined selections.
    const locationsToUseForRepopulation = config.locations 
        ? config.locations 
        : getSelectedLocations();
    
    populateLocationDropdown(locationsToUseForRepopulation.length > 0 ? locationsToUseForRepopulation : [TOTAL_TURNOUT_KEY]);
    
    // All necessary updates (filter, render, URL) should be triggered.
    // filterLocations() is called by populateLocationDropdown.
    // Toggle changes (if any) would have called their handlers.
    // Explicitly call render and update URL to ensure all changes are reflected.
    debouncedRenderChart();
    updateURLFromState();
    refreshSelectionSummary();
    updateStatusMessage("");
};
