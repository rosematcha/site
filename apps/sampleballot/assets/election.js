// Pure election logic, shared by the page and the sync script. No DOM or network.
export const TIME_ZONE = 'America/Chicago';

const NO_DETAILS = 'No additional information';
const VOTE_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const dateKey = ms => dateKeyFormat.format(ms);

export function readControl(attributes) {
  if (!attributes) return null;
  return {
    name: attributes.Description,
    active: attributes.Active === 'Yes',
    primary: /^y/i.test(attributes.PrimaryFlag ?? ''),
    early_begin: attributes.EarlyVoteBegin,
    early_end: attributes.EarlyVoteEnd,
    day_begin: attributes.ElectionDateBegin,
    day_end: attributes.ElectionDateEnd,
    date: dateKey(attributes.ElectionDateBegin)
  };
}

const hasAllDates = control =>
  Boolean(control) &&
  [control.early_begin, control.early_end, control.day_begin, control.day_end].every(Number.isFinite);

export function getPhase(control, now) {
  if (!hasAllDates(control) || !control.active) return 'none';
  if (now > control.day_end) return 'over';
  if (now >= control.day_begin) return 'election-day';
  if (now > control.early_end) return 'before-election-day';
  if (now >= control.early_begin) return 'early';
  return 'before-early';
}

// The ballot only shows when it belongs to the election the county says is
// current. If the county can't be reached, the last saved copy of its dates
// stands in, so a past election still can't pass as upcoming.
export function resolveElection({ liveControl, savedControl, ballot, now }) {
  const control = liveControl ?? savedControl ?? null;
  const phase = getPhase(control, now);
  const isOpen = phase !== 'none' && phase !== 'over';
  return {
    control,
    phase,
    verified: Boolean(liveControl),
    showBallot: isOpen && ballot?.election_date === control.date
  };
}

// The county's site lists carry no election label, so until early voting opens
// they may still be from the last election.
export const locationKind = phase => {
  if (phase === 'early') return 'early';
  if (phase === 'before-election-day' || phase === 'election-day') return 'election_day';
  return null;
};

export function readSite(feature) {
  const { attributes: site, geometry } = feature;
  if (site.ACTIVE !== 'Yes' || !Number.isFinite(geometry?.x) || !Number.isFinite(geometry?.y)) return null;
  return {
    name: String(site.NAME || site.LABEL).replace(/[\s*]+$/, ''),
    address: site.ADDRESS,
    details: site.DETAILS && site.DETAILS !== NO_DETAILS ? site.DETAILS : '',
    lat: geometry.y,
    lng: geometry.x
  };
}

export const readSites = features => features.map(readSite).filter(Boolean);

const toRadians = degrees => (degrees * Math.PI) / 180;

export function milesBetween(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export function nearestSites(sites, origin, limit) {
  return sites
    .map(site => ({ ...site, distance_miles: milesBetween(origin, site) }))
    .sort((a, b) => a.distance_miles - b.distance_miles)
    .slice(0, limit);
}

export const normalizeCity = name =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

export const normalizeSchool = name =>
  String(name ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/independent school district|\bisd\b/g, '')
    .replace(/[^a-z]/g, '');

export function firstNumber(value) {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function maxVotes(voteFor) {
  const words = String(voteFor ?? '').toLowerCase().match(/[a-z]+|\d+/g) ?? [];
  const counts = words.map(word => VOTE_WORDS[word] ?? Number(word)).filter(Boolean);
  return counts.length ? Math.max(...counts) : 1;
}

const usHouseNumbers = ballot =>
  ballot.sections.flatMap(section =>
    section.items.filter(item => item.district?.type === 'us_house').map(item => item.district.number)
  );

// All U.S. House seats are up in November of even years.
export const everyHouseSeatIsUp = isoDate => /^\d{3}[02468]-11-/.test(isoDate ?? '');

// In a year every seat is up, a known district missing from the ballot means the
// district data is wrong, so show them all. Otherwise it can simply mean no race.
function congressFor(ballot, voter) {
  const onBallot = usHouseNumbers(ballot);
  const matched = (voter.us_house ?? []).filter(number => onBallot.includes(number));
  const knownAndAbsent = voter.us_house?.length > 0 && !everyHouseSeatIsUp(ballot.election_date);
  if (matched.length === 0) return { numbers: knownAndAbsent ? [] : onBallot, certain: false };
  return { numbers: matched, certain: matched.length === 1 };
}

function districtMatch(item, voter, congress) {
  const { type, number } = item.district;
  if (type === 'us_house') return { applies: congress.numbers.includes(number), unverified: !congress.certain };
  if (type === 'local_district') return { applies: true, unverified: true };
  const voterNumber = voter[type];
  if (voterNumber == null) return { applies: true, unverified: true };
  return { applies: voterNumber === number, unverified: false };
}

function placeItem(item, voter, congress, sectionUnverified) {
  if (!item.district) return { ...item, unverified: sectionUnverified };
  const { applies, unverified } = districtMatch(item, voter, congress);
  return applies ? { ...item, unverified: unverified || sectionUnverified } : null;
}

function jurisdictionMatch(jurisdiction, voter) {
  if (jurisdiction.type === 'city') {
    if (voter.cities == null) return { applies: true, unverified: true };
    return {
      applies: voter.cities.map(normalizeCity).includes(normalizeCity(jurisdiction.name)),
      unverified: false
    };
  }
  if (jurisdiction.type === 'school') {
    if (voter.school == null) return { applies: true, unverified: true };
    return { applies: normalizeSchool(voter.school) === normalizeSchool(jurisdiction.name), unverified: false };
  }
  return { applies: true, unverified: false };
}

// Narrows the countywide ballot to one address. Anything we can't place stays on
// the page marked unverified: an extra race is harmless, a missing one is not.
export function buildVoterBallot(ballot, voter) {
  const congress = congressFor(ballot, voter);
  const sections = [];
  const special = [];
  for (const section of ballot.sections) {
    if (section.jurisdiction.type === 'special') {
      special.push(section);
      continue;
    }
    const { applies, unverified } = jurisdictionMatch(section.jurisdiction, voter);
    if (!applies) continue;
    const items = section.items.map(item => placeItem(item, voter, congress, unverified)).filter(Boolean);
    if (items.length > 0) sections.push({ ...section, items });
  }
  return { sections, special };
}
