import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { updateStatusMessage } from "./ui.js";
import { logMetric } from "./main.js";

// In-memory store for parsed data { year: { locations: [], dates: [], totals: [] } }
const parsedData = {};

// Master location list for search functionality
let masterLocationNames = new Set();
let masterLocationListInitialized = false;

/**
 * Initialize master location list by scanning all CSV files for location names
 */
export async function initializeMasterLocationList() {
    if (masterLocationListInitialized) return;
    console.log("Initializing master location list...");

    const allFileKeys = Object.keys(DATA_FILES);
    const namePromises = allFileKeys.map(async (yearKey) => {
        const fileInfo = DATA_FILES[yearKey];
        if (!fileInfo || !fileInfo.path) {
            console.warn(`No path for ${yearKey} in DATA_FILES.`);
            return [];
        }
        const filePath = fileInfo.path;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`Could not fetch ${filePath} for master location list. Status: ${response.status}`);
                return [];
            }
            const csvString = await response.text();
            const lines = csvString.trim().split('\n');
            const namesInFile = new Set();
            // Start from the first data row (index 1), assuming header is index 0
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines

                const firstCommaIndex = line.indexOf(',');
                if (firstCommaIndex !== -1) {
                    const locationName = line.substring(0, firstCommaIndex).trim();
                    // Ensure it's a valid location name and not a summary line like "Total in Person"
                    if (locationName && 
                        locationName.toLowerCase() !== "total in person" && 
                        !locationName.toLowerCase().startsWith("total")) {
                        namesInFile.add(locationName);
                    }
                }
            }
            return Array.from(namesInFile);
        } catch (error) {
            console.warn(`Error processing ${filePath} for master location list:`, error);
            return [];
        }
    });

    const results = await Promise.allSettled(namePromises);
    results.forEach(result => {
        if (result.status === "fulfilled" && result.value) {
            result.value.forEach(name => masterLocationNames.add(name));
        }
    });

    masterLocationListInitialized = true;
    console.log(`Master location list initialized with ${masterLocationNames.size} unique names.`);
}

/**
 * Get all master location names for UI population
 */
export function getAllMasterLocationNames() {
    if (!masterLocationListInitialized) {
        console.warn("Master location list accessed before initialization.");
        return [];
    }
    return Array.from(masterLocationNames).sort();
}

/**
 * Fetches data for a given year (no caching).
 */
const fetchData = async (year) => {
    const fileInfo = DATA_FILES[year];
    if (!fileInfo || !fileInfo.path) {
        console.error(`No data file path defined for year ${year}`);
        return null;
    }

    console.log(`Fetching data for ${year}`);
    const startTime = performance.now();
    try {
        const response = await fetch(fileInfo.path);
        if (!response.ok) {
            throw new Error(
                `Fetch failed for ${year}: ${response.status} ${response.statusText}`
            );
        }
        const data = await response.text();
        if (!data?.trim()) {
            throw new Error(`Fetched file ${fileInfo.path} is empty.`);
        }

        logMetric("dataLoadTime", performance.now() - startTime);
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        updateStatusMessage(`⚠️ Error loading data for ${year}.`);
        return null;
    }
};

/**
 * Parses CSV string into structured data for a given year.
 */
const parseCSV = (csvString, year) => {
    parsedData[year] = { locations: [], dates: [], totals: [] };

    if (!csvString) {
        console.warn(`No CSV string provided for year ${year}.`);
        return false;
    }

    const lines = csvString.trim().split("\n");
    if (lines.length < 2) {
        console.warn(`CSV for year ${year} is incomplete or missing headers.`);
        updateStatusMessage(`Data for ${year} is missing or incomplete.`);
        return false;
    }

    try {
        const headers = lines[0]
            .split(",")
            .slice(2)
            .map((h, index) => {
                const trimmedHeader = h.trim();
                const isElectionDay = trimmedHeader.startsWith("*");
                return {
                    date: trimmedHeader.replace("*", ""),
                    isElectionDay: isElectionDay,
                    dayIndex: index + 1,
                };
            })
            .filter((h) => h.date);

        if (headers.length === 0) {
            console.warn(`No valid date headers found in CSV for ${year}.`);
            return false;
        }
        parsedData[year].dates = headers;

        lines.slice(1).forEach((line) => {
            const columns = line.split(",");
            const locationName = columns[0]?.trim();
            if (!locationName) return;

            const dailyData = headers.map(
                (_, index) => parseFloat(columns[index + 2]?.trim() || "0") || 0
            );

            // Revised EDO logic: if all EV days are zero, it's considered EDO
            let isElectionDayOnly = false;
            if (dailyData.length > 0 && headers.length === dailyData.length) {
                let hasNonZeroEVData = false;
                for (let i = 0; i < headers.length; i++) {
                    if (!headers[i].isElectionDay && dailyData[i] > 0) {
                        hasNonZeroEVData = true;
                        break;
                    }
                }
                if (!hasNonZeroEVData) {
                    // If there's no non-zero early voting data, it's considered EDO.
                    // This includes cases where all data (EV and ED) is zero.
                    isElectionDayOnly = true;
                }
            }

            if (locationName.toLowerCase().startsWith("total")) {
                parsedData[year].totals = dailyData;
            } else {
                parsedData[year].locations.push({
                    name: locationName,
                    data: dailyData,
                    isElectionDayOnly: isElectionDayOnly,
                });
            }
        });

        parsedData[year].locations.sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Successfully parsed data for ${year}`);
        return true;
    } catch (error) {
        console.error(`Error parsing CSV for ${year}:`, error);
        updateStatusMessage(`⚠️ Error processing data for ${year}.`);
        parsedData[year] = { locations: [], dates: [], totals: [] };
        return false;
    }
};

/**
 * Loads and parses data for a specific year if not already loaded.
 */
export const loadYearData = async (year) => {
    if (parsedData[year] && parsedData[year].dates.length > 0) {
        console.log(`Data for ${year} already loaded.`);
        return true;
    }
    updateStatusMessage(`Loading data for ${year}...`);
    const csvText = await fetchData(year);
    if (csvText) {
        const success = parseCSV(csvText, year);
        if (success) {
            updateStatusMessage("");
        }
        return success;
    }
    updateStatusMessage(`Failed to load data for ${year}.`);
    return false;
};

export const getAllLoadedLocations = () => {
    const locationSet = new Set();
    Object.values(parsedData).forEach((yearData) => {
        yearData.locations?.forEach((loc) => locationSet.add(loc.name));
    });
    return Array.from(locationSet).sort();
};

export const getLocationProperties = (locationName) => {
    for (const year in parsedData) {
        const yearData = parsedData[year];
        const locationData = yearData.locations?.find(
            (loc) => loc.name === locationName
        );
        if (locationData) {
            return {
                isElectionDayOnly: !!locationData.isElectionDayOnly,
            };
        }
    }
    return null;
};

/**
 * Check if a location exists in a specific year's data
 */
export const isLocationInYearData = (locationName, year) => {
    if (isDataLoaded(year) && parsedData[year] && parsedData[year].locations) {
        return parsedData[year].locations.some(loc => loc.name === locationName);
    }
    return false;
};

const getRawData = (year, locationOrTotalKey) => {
    if (!parsedData[year]) return null;

    if (locationOrTotalKey === TOTAL_TURNOUT_KEY) {
        if (parsedData[year].totals?.length > 0) {
            return { name: "Total Turnout", data: parsedData[year].totals };
        }
    } else {
        return parsedData[year].locations.find(
            (loc) => loc.name === locationOrTotalKey
        ) || null;
    }
    return null;
};

export const getDataForSelection = (
    year,
    locationOrTotalKey,
    showEarlyVoting,
    showElectionDay
) => {
    const raw = getRawData(year, locationOrTotalKey);
    const yearDates = parsedData[year]?.dates;

    if (!raw || !yearDates || yearDates.length === 0) {
        return null;
    }

    const indicesToKeep = yearDates
        .map((dateInfo, index) => {
            if (dateInfo.isElectionDay && showElectionDay) return index;
            if (!dateInfo.isElectionDay && showEarlyVoting) return index;
            return -1;
        })
        .filter((index) => index !== -1);

    if (indicesToKeep.length === 0) {
        return null;
    }

    const filteredData = indicesToKeep.map((index) => raw.data[index]);
    const filteredDates = indicesToKeep.map((index) => yearDates[index]);

    return {
        name: raw.name,
        data: filteredData,
        dates: filteredDates,
        indices: indicesToKeep,
    };
};

export const getDatesForYear = (year) => {
    return parsedData[year]?.dates || null;
};

export const isDataLoaded = (year) => {
    return !!parsedData[year] && parsedData[year].dates?.length > 0;
};