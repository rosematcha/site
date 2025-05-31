import { DATA_FILES, TOTAL_TURNOUT_KEY, DEFAULT_SELECTED_YEARS, PRESET_CONFIGURATIONS } from "./config.js";
import { getAllLoadedLocations, getLocationProperties, isDataLoaded, loadYearData, getAllMasterLocationNames, isLocationInYearData } from "./data.js";
import { debouncedRenderChart, getCurrentChartInstance } from "./chart.js";
import { logMetric } from "./main.js";

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
    displayAsRadios: document.querySelectorAll('input[name="display-as"]'),
    chartContainer: document.getElementById("chart-container"),
    chartCanvas: document.getElementById("turnoutChart"),
    dataTableContainer: document.getElementById("data-table-container"),
    copyShareLinkButton: document.getElementById("copy-share-link-button"),
    resetViewButton: document.getElementById("reset-view-button"),
    presetButtonsContainer: document.getElementById("preset-buttons-container"),
    attribution: document.getElementById("attribution"),
};

let statusMessageElement = null;

export const updateURLFromState = () => {
    const years = getSelectedYears();
    const locations = getSelectedLocations();
    const { showEarlyVoting, showElectionDay, startYAtZero, dataPresentation, displayAs } = getToggleStates();

    const params = new URLSearchParams();
    if (years.length > 0) params.set("y", years.join(","));
    if (locations.length > 0) params.set("l", locations.join(","));

    params.set("ev", showEarlyVoting ? "1" : "0");
    params.set("ed", showElectionDay ? "1" : "0");
    params.set("yz", startYAtZero ? "1" : "0");
    params.set("pres", dataPresentation);
    params.set("disp", displayAs);

    const newRelativePathQuery = window.location.pathname + "?" + params.toString();
    history.replaceState(null, "", newRelativePathQuery);
};

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

    // Determine initial checked state for "Total Turnout"
    let totalChecked = false;
    if (selectedLocationsFromURL.length > 0) {
        totalChecked = selectedLocationsFromURL.includes(TOTAL_TURNOUT_KEY);
    } else {
        const currentSelected = getSelectedLocations();
        if (currentSelected.length === 0 || (currentSelected.length === 1 && currentSelected[0] === TOTAL_TURNOUT_KEY)) {
            totalChecked = true;
        }
    }

    if (selectedLocationsFromURL.length === 0 && getSelectedLocations().length === 0) {
        totalChecked = true;
    }

    // Always add "Total Turnout" first
    createCheckboxOption(
        container,
        "Total Turnout",
        TOTAL_TURNOUT_KEY,
        totalChecked
    );

    // Add all master location names
    const masterNames = getAllMasterLocationNames();
    masterNames.forEach((name) => {
        const isChecked = selectedLocationsFromURL.includes(name);
        createCheckboxOption(container, name, name, isChecked);
    });

    // Apply filters to set initial visibility
    filterLocations();

    // Handle total/specific checkbox logic after filtering
    const allCheckboxes = Array.from(container.querySelectorAll("input[type=checkbox]"));
    const totalCheckbox = allCheckboxes.find((cb) => cb.value === TOTAL_TURNOUT_KEY);
    const specificCheckboxes = allCheckboxes.filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);
    const specificCheckedCount = specificCheckboxes.filter((cb) => cb.checked).length;

    if (totalCheckbox) {
        if (specificCheckedCount > 0 && totalCheckbox.checked && 
            selectedLocationsFromURL.includes(TOTAL_TURNOUT_KEY) && 
            selectedLocationsFromURL.some(loc => loc !== TOTAL_TURNOUT_KEY)) {
            totalCheckbox.checked = false;
        } else if (specificCheckedCount === 0 && !totalCheckbox.checked) {
            if (selectedLocationsFromURL.length === 0 || selectedLocationsFromURL.includes(TOTAL_TURNOUT_KEY)) {
                totalCheckbox.checked = true;
            }
        }
    }
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
    populateLocationDropdown(getSelectedLocations());
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

        // Rule 5: "Total Turnout" visibility
        if (locationName === TOTAL_TURNOUT_KEY) {
            if (filterText) {
                isVisible = locationDisplayName.includes(filterText);
            } else {
                isVisible = true; // Always visible by default if no search
            }
            optionLabel.style.display = isVisible ? "flex" : "none";
            return;
        }

        // Rule 3 & 4: Search Override
        if (filterText) {
            isVisible = locationDisplayName.includes(filterText);
        } else {
            // No search text, apply Rules #1 and #2
            // Rule 1: Contextual Listing (Selected Years)
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
                // Rule 2: "Election Day Only" (EDO) Location Logic
                const props = getLocationProperties(locationName);
                const isEDOLocation = props ? props.isElectionDayOnly : false;

                if (!showEarlyVoting && !showElectionDay) {
                    isVisible = false; // Edge case: nothing selected to show
                } else if (showEarlyVoting && showElectionDay) {
                    // Show if NOT EDO (i.e., has EV data). EDOs are hidden here.
                    isVisible = !isEDOLocation;
                } else if (!showEarlyVoting && showElectionDay) {
                    // Show all (EDOs and non-EDOs, as they all have ED data if present in dataset)
                    isVisible = true;
                } else if (showEarlyVoting && !showElectionDay) {
                    // Show if NOT EDO (i.e., has EV data). EDOs are hidden.
                    isVisible = !isEDOLocation;
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
        container.querySelectorAll(".location-option:not([style*='display: none']) input[type=checkbox]")
    ).filter((cb) => cb.value !== TOTAL_TURNOUT_KEY);

    specificCheckboxes.forEach((cb) => (cb.checked = checkedState));

    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    if (totalCheckbox) {
        if (checkedState && specificCheckboxes.length > 0) {
            totalCheckbox.checked = false;
        } else if (!checkedState) {
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
        filterLocations();
        debouncedRenderChart();
        updateURLFromState();
    };

    if (elements.earlyVotingToggle) elements.earlyVotingToggle.addEventListener("change", commonChangeHandler);
    if (elements.electionDayToggle) elements.electionDayToggle.addEventListener("change", commonChangeHandler);
    if (elements.yAxisToggle) elements.yAxisToggle.addEventListener("change", commonChangeHandler);
    
    elements.dataPresentationRadios.forEach(radio => radio.addEventListener('change', () => {
        updateRadioVisuals(elements.dataPresentationRadios);
        commonChangeHandler();
    }));
    
    elements.displayAsRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            logMetric("interactions", 1);
            updateRadioVisuals(elements.displayAsRadios);
            manageDisplay();
            updateURLFromState();
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
};

export const setSelectedLocations = (locationsToSelect) => {
    const container = elements.locationCheckboxContainer;
    if (!container) return;
    const checkboxes = container.querySelectorAll("input[type=checkbox]");

    if (!locationsToSelect || locationsToSelect.length === 0) {
        locationsToSelect = [TOTAL_TURNOUT_KEY];
    }

    checkboxes.forEach(cb => {
        cb.checked = locationsToSelect.includes(cb.value);
    });
    
    const totalCheckbox = container.querySelector(`input[value="${TOTAL_TURNOUT_KEY}"]`);
    const specificSelected = locationsToSelect.some(loc => loc !== TOTAL_TURNOUT_KEY);
    if (totalCheckbox) {
        if (specificSelected) {
            totalCheckbox.checked = false;
        } else if (locationsToSelect.includes(TOTAL_TURNOUT_KEY)) {
            totalCheckbox.checked = true;
        } else {
            totalCheckbox.checked = true;
        }
    }
};

export const setToggleStates = (states) => {
    if (elements.earlyVotingToggle && states.ev !== undefined) elements.earlyVotingToggle.checked = states.ev;
    if (elements.electionDayToggle && states.ed !== undefined) elements.electionDayToggle.checked = states.ed;
    if (elements.yAxisToggle && states.yz !== undefined) elements.yAxisToggle.checked = states.yz;

    if (states.presentation !== undefined) {
        elements.dataPresentationRadios.forEach(radio => {
            radio.checked = radio.value === states.presentation;
        });
        updateRadioVisuals(elements.dataPresentationRadios);
    } else {
        elements.dataPresentationRadios.forEach(radio => {
            if (radio.value === 'per-day') radio.checked = true;
        });
        updateRadioVisuals(elements.dataPresentationRadios);
    }

    if (states.display !== undefined) {
        elements.displayAsRadios.forEach(radio => {
            radio.checked = radio.value === states.display;
        });
        updateRadioVisuals(elements.displayAsRadios);
    } else {
        elements.displayAsRadios.forEach(radio => {
            if (radio.value === 'graph') radio.checked = true;
        });
        updateRadioVisuals(elements.displayAsRadios);
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
    let dataPresentationValue = 'per-day';
    if (elements.dataPresentationRadios && elements.dataPresentationRadios.length > 0) {
        elements.dataPresentationRadios.forEach(radio => {
            if (radio.checked) dataPresentationValue = radio.value;
        });
    }

    let displayAsValue = 'graph';
    if (elements.displayAsRadios && elements.displayAsRadios.length > 0) {
        elements.displayAsRadios.forEach(radio => {
            if (radio.checked) displayAsValue = radio.value;
        });
    }

    return {
        showEarlyVoting: elements.earlyVotingToggle ? elements.earlyVotingToggle.checked : true,
        showElectionDay: elements.electionDayToggle ? elements.electionDayToggle.checked : true,
        startYAtZero: elements.yAxisToggle ? elements.yAxisToggle.checked : true,
        dataPresentation: dataPresentationValue,
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
    if (!elements.presetButtonsContainer) {
        console.error("Preset buttons container not found");
        return;
    }
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
            toggles: { ev: true, ed: true, yz: true, presentation: 'per-day', display: 'graph' }
        };
    } else {
        config = PRESET_CONFIGURATIONS[presetKey];
    }

    if (!config) {
        console.error(`Unknown preset key: ${presetKey}`);
        return;
    }
    updateStatusMessage(`Applying "${config.name || presetKey}" preset...`);
    setSelectedYears(config.years);

    const yearsToLoad = config.years.filter(year => DATA_FILES[year] && !isDataLoaded(year));
    if (yearsToLoad.length > 0) {
        await Promise.allSettled(yearsToLoad.map(loadYearData));
    }

    populateLocationDropdown([]);
    
    setTimeout(() => {
        setSelectedLocations(config.locations);
        setToggleStates(config.toggles);
        filterLocations();
        
        manageDisplay();
        debouncedRenderChart();
        updateURLFromState();
        updateStatusMessage("");
    }, 150);
};