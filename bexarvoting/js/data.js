// js/data.js
import { DATA_FILES, TOTAL_TURNOUT_KEY, CACHE_EXPIRY } from "./config.js";
import { updateStatusMessage } from "./ui.js"; // For error reporting
import { logMetric } from "./main.js"; // Import logMetric

// In-memory store for parsed data { year: { locations: [], dates: [], totals: [] } }
const parsedData = {};
const memoizedLocations = new Map(); // Cache for specific location data access

/**
 * Fetches data for a given year, using cache if available and not expired.
 * @param {string} year - The year to fetch data for.
 * @returns {Promise<string|null>} CSV data as string or null on error.
 */
const fetchWithCache = async (year) => {
    const cacheKey = `voting-data-${year}`;
    const now = new Date();
    const currentTime = now.getTime();
    const fileInfo = DATA_FILES[year];

    if (!fileInfo || !fileInfo.path) {
        console.error(`No data file path defined for year ${year}`);
        return null;
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            const cachedDate = new Date(timestamp);
            // Use cache if same day and within expiry time
            if (
                cachedDate.toDateString() === now.toDateString() &&
                currentTime - timestamp < CACHE_EXPIRY
            ) {
                console.log(`Using cached data for ${year}`);
                return data;
            }
        } catch (e) {
            console.error("Error parsing cache, fetching fresh data", e);
            localStorage.removeItem(cacheKey); // Clear corrupted cache
        }
    }

    console.log(`Fetching fresh data for ${year}`);
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

        localStorage.setItem(
            cacheKey,
            JSON.stringify({ data, timestamp: currentTime })
        );
        logMetric("dataLoadTime", performance.now() - startTime);
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        updateStatusMessage(`⚠️ Error loading data for ${year}.`);
        // Fallback to stale cache if fetch fails
        if (cached) {
            console.warn("Fetch failed, using stale cached data as fallback.");
            updateStatusMessage(
                `⚠️ Error loading latest data for ${year}. Displaying older data.`
            );
            try {
                return JSON.parse(cached).data;
            } catch (e) {
                console.error("Error parsing stale cache during fallback", e);
                return null;
            }
        }
        return null; // No data could be retrieved
    }
};

/**
 * Parses CSV string into structured data for a given year.
 * @param {string} csvString - The raw CSV data.
 * @param {string} year - The year this data represents.
 * @returns {boolean} True if parsing was successful, false otherwise.
 */
const parseCSV = (csvString, year) => {
    // Reset data for the year
    parsedData[year] = { locations: [], dates: [], totals: [] };
    memoizedLocations.clear(); // Clear memoization cache when data changes

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
        // Parse headers, identify election days
        const headers = lines[0]
            .split(",")
            .slice(2) // Skip location and total columns
            .map((h) => {
                const trimmedHeader = h.trim();
                const isElectionDay = trimmedHeader.startsWith("*");
                return {
                    date: trimmedHeader.replace("*", ""),
                    isElectionDay: isElectionDay,
                };
            })
            .filter((h) => h.date); // Filter out potentially empty headers

        if (headers.length === 0) {
            console.warn(`No valid date headers found in CSV for ${year}.`);
            return false;
        }
        parsedData[year].dates = headers;

        lines.slice(1).forEach((line) => {
            // Robust splitting: handle commas within quoted fields if necessary
            // Basic split for now, assuming no quoted commas in location names
            const columns = line.split(",");
            const locationName = columns[0]?.trim();
            if (!locationName) return; // Skip empty lines

            // Map data points corresponding to the parsed headers
            const dailyData = headers.map(
                (_, index) => parseFloat(columns[index + 2]?.trim() || "0") || 0
            );

            if (locationName.toLowerCase().startsWith("total")) {
                parsedData[year].totals = dailyData;
            } else {
                parsedData[year].locations.push({
                    name: locationName,
                    data: dailyData,
                });
            }
        });

        // Sort locations alphabetically
        parsedData[year].locations.sort((a, b) => a.name.localeCompare(b.name));
        console.log(`Successfully parsed data for ${year}`);
        return true;
    } catch (error) {
        console.error(`Error parsing CSV for ${year}:`, error);
        updateStatusMessage(`⚠️ Error processing data for ${year}.`);
        // Clear potentially corrupted data
        parsedData[year] = { locations: [], dates: [], totals: [] };
        return false;
    }
};

/**
 * Loads and parses data for a specific year if not already loaded.
 * @param {string} year - The year to load data for.
 * @returns {Promise<boolean>} True if data is loaded and parsed successfully, false otherwise.
 */
export const loadYearData = async (year) => {
    if (parsedData[year] && parsedData[year].dates.length > 0) {
        console.log(`Data for ${year} already loaded.`);
        return true; // Already loaded
    }
    updateStatusMessage(`Loading data for ${year}...`);
    const csvText = await fetchWithCache(year);
    if (csvText) {
        const success = parseCSV(csvText, year);
        if (success) {
            updateStatusMessage(""); // Clear loading message on success
        }
        return success;
    }
    // Fetch failed or returned null
    updateStatusMessage(`Failed to load data for ${year}.`);
    return false;
};

/**
 * Gets all unique location names from the currently loaded years.
 * @returns {string[]} Sorted list of unique location names.
 */
export const getAllLoadedLocations = () => {
    const locationSet = new Set();
    Object.values(parsedData).forEach((yearData) => {
        yearData.locations?.forEach((loc) => locationSet.add(loc.name));
    });
    return Array.from(locationSet).sort();
};

/**
 * Retrieves the raw data for a specific location or total for a given year.
 * Uses memoization for efficiency.
 * @param {string} year - The year.
 * @param {string} locationOrTotalKey - Location name or TOTAL_TURNOUT_KEY.
 * @returns {{name: string, data: number[]}|null} The location/total data or null if not found.
 */
const getRawData = (year, locationOrTotalKey) => {
    if (!parsedData[year]) return null;

    const cacheKey = `${year}-${locationOrTotalKey}`;
    if (memoizedLocations.has(cacheKey)) {
        return memoizedLocations.get(cacheKey);
    }

    let result = null;
    if (locationOrTotalKey === TOTAL_TURNOUT_KEY) {
        if (parsedData[year].totals?.length > 0) {
            result = { name: "Total Turnout", data: parsedData[year].totals };
        }
    } else {
        result =
            parsedData[year].locations.find(
                (loc) => loc.name === locationOrTotalKey
            ) || null;
    }

    memoizedLocations.set(cacheKey, result);
    return result;
};

/**
 * Gets data for a specific selection, filtered by date type toggles.
 * @param {string} year - The year.
 * @param {string} locationOrTotalKey - Location name or TOTAL_TURNOUT_KEY.
 * @param {boolean} showEarlyVoting - Whether to include early voting days.
 * @param {boolean} showElectionDay - Whether to include election day.
 * @returns {{name: string, data: number[], dates: {date: string, isElectionDay: boolean}[], indices: number[]}|null} Filtered data or null.
 */
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
            return -1; // Mark for removal
        })
        .filter((index) => index !== -1);

    if (indicesToKeep.length === 0) {
        return null; // No data points match the filter
    }

    const filteredData = indicesToKeep.map((index) => raw.data[index]);
    const filteredDates = indicesToKeep.map((index) => yearDates[index]);

    return {
        name: raw.name,
        data: filteredData,
        dates: filteredDates, // Dates corresponding to the filtered data points
        indices: indicesToKeep, // Original indices kept after filtering
    };
};

/**
 * Gets the date objects for a specific year.
 * @param {string} year The year.
 * @returns {{date: string, isElectionDay: boolean}[] | null} Array of date objects or null.
 */
export const getDatesForYear = (year) => {
    return parsedData[year]?.dates || null;
};

/**
 * Checks if data for a specific year is loaded.
 * @param {string} year The year to check.
 * @returns {boolean} True if data is loaded, false otherwise.
 */
export const isDataLoaded = (year) => {
    return !!parsedData[year] && parsedData[year].dates?.length > 0;
};
