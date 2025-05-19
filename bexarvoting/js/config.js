// js/config.js

export const DATA_FILES = {
    2025_1: { name: "May 2025", path: "csv/May 2025 Municipal.csv" },
    2023_2: { name: "June 2023", path: "csv/June 2023 Municipal Runoff.csv" },
    2021_2: { name: "June 2021", path: "csv/June 2021 Municipal Runoff.csv" },
    2019_2: { name: "June 2019", path: "csv/June 2019 Municipal Runoff.csv" },
    // Add future years here when data is available
    // 2024: { name: "May 2024", path: "csv/May 2024 Municipal.csv", disabled: true },
};

export const CAT_IMAGES = [
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/1914_Ready_for_bed_%28LOC%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/A_hungry_bunch_LCCN2013648273.jpg/1280px-A_hungry_bunch_LCCN2013648273.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/A_joy-ride_LCCN2013648296.jpg/1280px-A_joy-ride_LCCN2013648296.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hanging_up_the_wash_LCCN2013648270.jpg/1280px-Hanging_up_the_wash_LCCN2013648270.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/28/Harry_Whittier_Frees_-_Good_Morning.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d3/Harry_Whittier_Frees_-_Mrs._Bufkins_Finds_Plenty_of_Eggs.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/27/Harry_Whittier_Frees_-_Mrs._Bufkins_Takes_Barker%27s_Place.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/80/Harry_Whittier_Frees_-_Prowler_and_Furra_Cleaned_the_Rugs.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/09/Harry_Whittier_Frees_-_Prowler_and_Purra_Try_the_Jam.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Harry_Whittier_Frees_-_Prowler_Upsets_the_Cocoanut.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Harry_Whittier_Frees_-_Purra_Plays_a_Joke_on_Prowler.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/24/Harry_Whittier_Frees_-_Resting_in_the_Hammock.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3a/Harry_Whittier_Frees_-_Rosie_and_Jennie_Took_a_Cat-Nap.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/Harry_Whittier_Frees_-_Rosie_Bufkins_Gave_Jennie_an_Airing.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Harry_Whittier_Frees_-_The_Bufkins_Twins_Were_Swinging.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/07/Harry_Whittier_Frees_-_The_Twins_Looked_Like_Girls.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Mischief_makers_LCCN2013648268.jpg/1280px-Mischief_makers_LCCN2013648268.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Planting_time_LCCN2013648290.jpg/1280px-Planting_time_LCCN2013648290.jpg",
];

// Color palette for chart lines (add more if needed)
export const CHART_COLORS = [
    "#EC4899", // Pink-500
    "#8B5CF6", // Violet-500
    "#10B981", // Emerald-500
    "#F59E0B", // Amber-500
    "#3B82F6", // Blue-500
    "#EF4444", // Red-500
    "#6EE7B7", // Emerald-300
    "#F97316", // Orange-500
    "#6366F1", // Indigo-500
    "#06B6D4", // Cyan-500
];

export const TOTAL_TURNOUT_KEY = "total"; // Consistent key for total turnout
export const REFRESH_INTERVAL = 900000; // 15 minutes
export const CACHE_EXPIRY = 900000; // 15 minutes
