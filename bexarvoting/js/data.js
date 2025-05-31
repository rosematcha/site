// js/data.js
import { DATA_FILES, TOTAL_TURNOUT_KEY } from "./config.js";
import { updateStatusMessage } from "./ui.js";
import { logMetric } from "./main.js";

// In-memory store for parsed data { year: { locations: [], dates: [], totals: [] } }
const parsedData = {};

/**
 * Fetches data for a given year (no caching).
 * @param {string} year - The year to fetch data for.
 * @returns {Promise<string|null>} CSV data as string or null on error.
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

            // Determine if location is election day only
            let isElectionDayOnly = false;
            if (dailyData.length > 0 && headers.length === dailyData.length) {
                const hasNonZeroData = dailyData.some(d => d > 0);
                if (hasNonZeroData) {
                    isElectionDayOnly = !dailyData.some((value, idx) => 
                        value > 0 && !headers[idx].isElectionDay
                    );
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
