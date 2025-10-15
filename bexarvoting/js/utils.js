// js/utils.js

/**
 * Debounce function: Limits the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

const hasListFormatter = typeof Intl !== "undefined" && typeof Intl.ListFormat === "function";
const listFormatter = hasListFormatter
    ? new Intl.ListFormat("en", { style: "long", type: "conjunction" })
    : null;

export const formatReadableList = (items, maxItems = 3) => {
    if (!Array.isArray(items) || items.length === 0) {
        return "None";
    }

    if (items.length <= maxItems) {
        return listFormatter ? listFormatter.format(items) : items.join(", ");
    }

    const visibleItems = items.slice(0, maxItems);
    const remainingCount = items.length - maxItems;
    const visible = listFormatter ? listFormatter.format(visibleItems) : visibleItems.join(", ");
    return `${visible} + ${remainingCount} more`;
};
