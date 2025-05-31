import { DATA_FILES, DEFAULT_SELECTED_YEARS } from "./config.js";
import { loadYearData, initializeMasterLocationList } from "./data.js";
import {
    populateYearCheckboxes,
    populateLocationDropdown,
    setupEventListeners,
    updateStatusMessage,
    updateAttribution,
    getSelectedYears,
    setSelectedYears,
    setSelectedLocations,
    setToggleStates,
} from "./ui.js";
import { debouncedRenderChart } from "./chart.js";

// Simplified performance tracking
let interactionCount = 0;
export const logMetric = (category, value) => {
    if (category === "interactions") {
        interactionCount += value;
    }
    // Simplified - just log for debugging if needed
    console.debug(`Metric ${category}:`, value);
};

const applyStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);

    const years = params.get("y")?.split(",") || [];
    const locations = params.get("l")?.split(",") || [];
    const showEV = params.get("ev");
    const showED = params.get("ed");
    const yz = params.get("yz");
    const presentation = params.get("pres");
    const display = params.get("disp");

    if (years.length > 0) {
        setSelectedYears(years);
    }

    const toggleStates = {};
    if (showEV !== null) toggleStates.ev = showEV === "1";
    if (showED !== null) toggleStates.ed = showED === "1";
    if (yz !== null) toggleStates.yz = yz === "1";
    if (presentation !== null) toggleStates.presentation = presentation;
    if (display !== null) toggleStates.display = display;

    if (Object.keys(toggleStates).length > 0) {
        setToggleStates(toggleStates);
    }
    return locations;
};

const initialize = async () => {
    updateStatusMessage("Initializing...");

    // Initialize master location list first
    await initializeMasterLocationList();

    const locationsFromURL = applyStateFromURL();
    populateYearCheckboxes(locationsFromURL.length > 0 ? getSelectedYears() : DEFAULT_SELECTED_YEARS);

    const selectedYears = getSelectedYears();
    if (selectedYears.length === 0 && DEFAULT_SELECTED_YEARS.length > 0) {
        setSelectedYears(DEFAULT_SELECTED_YEARS);
    }

    // Load data for selected years
    const loadPromises = getSelectedYears().map(loadYearData);
    await Promise.allSettled(loadPromises);

    populateLocationDropdown(locationsFromURL);
    setupEventListeners();
    updateAttribution();

    // Initial render
    const { displayAs } = await import('./ui.js').then(ui => ui.getToggleStates());
    if (displayAs === 'table') {
        await import('./ui.js').then(ui => ui.manageDisplay());
    }
    debouncedRenderChart();

    updateStatusMessage("");
};

// Simplified performance getter
window.getPerformanceMetrics = () => ({
    totalInteractions: interactionCount,
});

document.addEventListener("DOMContentLoaded", initialize);