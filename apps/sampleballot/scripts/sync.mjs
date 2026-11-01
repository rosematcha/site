#!/usr/bin/env node
// Daily sync: refreshes the saved polling data and rebuilds the ballot when the
// county posts a new sample ballot. Exits 1 when a person needs to step in.
// The page refuses to show a ballot for the wrong election, so a failure here
// never puts wrong information in front of a voter.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPhase, readControl, readSites } from '../assets/election.js';
import { parseBallotPdf } from './parse-ballot.mjs';
import { jurisdictionWarnings, placeOffMapJurisdictions, validateBallot } from './validate-ballot.mjs';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCGIS = 'https://maps.bexar.org/arcgis/rest/services';
const BALLOT_PDF = 'https://elections.bexar.gov/GenSampleBallot';
const DAY_MS = 86_400_000;
const BALLOT_DEADLINE_DAYS = 7;
const HUMAN_FIELDS = ['plain_language', 'arguments_for', 'arguments_against'];

const readJson = name => JSON.parse(readFileSync(join(APP_DIR, name), 'utf8'));
const writeJson = (name, value) => writeFileSync(join(APP_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
const isSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function queryLayer(path, params = {}) {
  const query = new URLSearchParams({ where: '1=1', outFields: '*', returnGeometry: 'false', f: 'json', ...params });
  const response = await fetch(`${ARCGIS}/${path}/query?${query}`, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const data = await response.json();
  if (data.error || !Array.isArray(data.features)) throw new Error(`${path} returned an error`);
  return data.features;
}

const querySites = path => queryLayer(path, { returnGeometry: 'true', outSR: '4326' }).then(readSites);

async function downloadBallot() {
  const response = await fetch(BALLOT_PDF, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Sample ballot returned ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const path = join(mkdtempSync(join(tmpdir(), 'ballot-')), 'ballot.pdf');
  writeFileSync(path, bytes);
  return { path, url: response.url, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function keepHumanSummaries(ballot, previous) {
  if (previous?.election_date !== ballot.election_date) return ballot;
  const saved = new Map(previous.sections.flatMap(section => section.items).map(item => [item.id, item]));
  const sections = ballot.sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      const old = saved.get(item.id) ?? {};
      const kept = Object.fromEntries(HUMAN_FIELDS.filter(key => old[key]).map(key => [key, old[key]]));
      return { ...item, ...kept };
    })
  }));
  return { ...ballot, sections };
}

async function syncLocations(control) {
  const saved = readJson('voting_locations.json');
  const [early, electionDay] = await Promise.all([
    querySites('EL/PollingLocationsEarly/MapServer/0'),
    querySites('EL/PollingLocationsElectionDay/MapServer/0')
  ]);
  const next = { control, early, election_day: electionDay };
  if (!isSame(saved, next)) {
    writeJson('voting_locations.json', next);
    return ['Updated saved voting locations and dates.'];
  }
  return [];
}

function isPastBallotDeadline(control, now) {
  return ['before-early', 'early', 'before-election-day', 'election-day'].includes(getPhase(control, now))
    && now > control.early_begin - BALLOT_DEADLINE_DAYS * DAY_MS;
}

async function buildBallot(control) {
  const pdf = await downloadBallot();
  const parsed = parseBallotPdf(pdf.path);
  const errors = validateBallot(parsed, { crosswalk: readJson('congress_by_precinct.json') });
  if (parsed.election_date && parsed.election_date !== control.date) return { waiting: parsed.election_date };
  if (errors.length > 0) return { errors };
  const [cities, schools] = await Promise.all([
    queryLayer('LocalJurisdictions/MapServer/0', { outFields: 'JURIS' }),
    queryLayer('SchoolDistricts/MapServer/0', { outFields: 'NAME' })
  ]);
  const placed = placeOffMapJurisdictions(parsed, {
    cities: cities.map(feature => feature.attributes.JURIS),
    schools: schools.map(feature => feature.attributes.NAME)
  });
  const { oval_count: _ovals, ...ballot } = placed;
  return { ballot: { ...ballot, source: { url: pdf.url, sha256: pdf.sha256 } }, warnings: jurisdictionWarnings(placed) };
}

function syncBallot(result, control, now) {
  const previous = readJson('ballot_questions.json');
  if (result.errors) return { failures: result.errors, notes: [] };
  if (result.waiting !== undefined) {
    const late = isPastBallotDeadline(control, now) && previous.election_date !== control.date;
    return {
      failures: late ? [`The county's sample ballot is for ${result.waiting}, not the ${control.date} election.`] : [],
      notes: []
    };
  }
  const next = keepHumanSummaries(result.ballot, previous);
  if (isSame(previous, next)) return { failures: [], notes: [] };
  writeJson('ballot_questions.json', next);
  return { failures: [], notes: [`Rebuilt the ballot from ${next.source.url}.`, ...result.warnings] };
}

// Between elections there is nothing to build, and party primaries need a
// separate ballot per party, which the page doesn't support. In both cases the
// page shows no ballot and points to the county.
async function syncBallotIfOpen(control, now) {
  const phase = getPhase(control, now);
  if (phase === 'none' || phase === 'over' || control.primary) return { failures: [], notes: [] };
  return syncBallot(await buildBallot(control), control, now);
}

async function main() {
  const now = Date.now();
  const [feature] = await queryLayer('EL/ElectionControl/MapServer/0');
  const control = readControl(feature?.attributes);
  if (!control) throw new Error('The county returned no election.');
  const locationNotes = await syncLocations(control);
  const { failures, notes } = await syncBallotIfOpen(control, now);
  const summary = [...locationNotes, ...notes];
  summary.forEach(line => console.log(line));
  failures.forEach(line => console.error(line));
  if (process.env.SYNC_SUMMARY) appendFileSync(process.env.SYNC_SUMMARY, summary.map(line => `- ${line}\n`).join(''));
  if (failures.length > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
