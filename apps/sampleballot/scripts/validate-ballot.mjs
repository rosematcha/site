// Checks that a parsed ballot is complete enough to publish. Errors block it;
// warnings go in the review notes.
import { everyHouseSeatIsUp, normalizeCity, normalizeSchool } from '../assets/election.js';

const allItems = ballot => ballot.sections.flatMap(section => section.items);

function choiceCount(items) {
  return items.reduce((total, item) => {
    if (item.kind === 'question') return total + item.options.length;
    return total + item.candidates.length + (item.write_in ? 1 : 0);
  }, 0);
}

function itemErrors(item) {
  if (item.kind === 'race') {
    if (/\bElection$/.test(item.office)) return [`Election heading read as a race: ${item.office}`];
    return item.candidates.length === 0 || !item.office ? [`Race has no candidates or title: ${item.id}`] : [];
  }
  const errors = /\bElection$/.test(item.title) ? [`Election heading read as a measure: ${item.title}`] : [];
  if (item.options.length < 2) errors.push(`Measure has fewer than two choices: ${item.id}`);
  if (!item.text) errors.push(`Measure has no text: ${item.id}`);
  if (!item.title) errors.push(`Measure has no title: ${item.id}`);
  return errors;
}

function congressErrors(ballot, crosswalk) {
  const onBallot = allItems(ballot)
    .filter(item => item.district?.type === 'us_house')
    .map(item => item.district.number);
  const mapped = Object.values(crosswalk.precincts).flat();
  const fits = onBallot.every(n => mapped.includes(n));
  const complete = !everyHouseSeatIsUp(ballot.election_date) || mapped.every(n => onBallot.includes(n));
  if (fits && complete) return [];
  return [
    `U.S. House races (${[...new Set(onBallot)].sort()}) don't match the ${crosswalk.plan} districts ` +
      `(${[...new Set(mapped)].sort()}). The congressional map may have changed; rebuild congress_by_precinct.json.`
  ];
}

export function validateBallot(ballot, { expectedDate, crosswalk }) {
  const items = allItems(ballot);
  const errors = items.flatMap(itemErrors);
  if (!ballot.election_date) errors.push('No election date found in the PDF.');
  if (expectedDate && ballot.election_date !== expectedDate) {
    errors.push(`PDF is for ${ballot.election_date}, the county's current election is ${expectedDate}.`);
  }
  if (items.length === 0) errors.push('No contests found.');
  if (choiceCount(items) !== ballot.oval_count) {
    errors.push(`PDF has ${ballot.oval_count} ovals but ${choiceCount(items)} choices were parsed.`);
  }
  const ids = items.map(item => item.id);
  if (new Set(ids).size !== ids.length) errors.push('Contest ids are not unique.');
  if (crosswalk) errors.push(...congressErrors(ballot, crosswalk));
  return errors;
}

const isOnCountyMap = ({ type, name }, knownCities, knownSchools) => {
  if (type === 'city') return knownCities.has(normalizeCity(name));
  if (type === 'school') return knownSchools.has(normalizeSchool(name));
  return true;
};

// A name missing from the county's map would never match an address, so it moves
// to "if you live there" rather than disappearing for everyone.
export function placeOffMapJurisdictions(ballot, { cities, schools }) {
  const knownCities = new Set(cities.map(normalizeCity));
  const knownSchools = new Set(schools.map(normalizeSchool));
  const sections = ballot.sections.map(section =>
    isOnCountyMap(section.jurisdiction, knownCities, knownSchools)
      ? section
      : { ...section, jurisdiction: { ...section.jurisdiction, type: 'special' } }
  );
  return { ...ballot, sections };
}

export const jurisdictionWarnings = ballot =>
  ballot.sections
    .filter(section => section.jurisdiction.type === 'special')
    .map(section => `Shown only as "if you live there": ${section.title}`);
