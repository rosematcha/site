import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildVoterBallot,
  dateKey,
  getPhase,
  locationKind,
  maxVotes,
  nearestSites,
  normalizeSchool,
  readControl,
  readSites,
  resolveElection
} from '../assets/election.js';

const at = iso => Date.parse(iso);

const control = readControl({
  Description: 'General Election',
  Active: 'Yes',
  EarlyVoteBegin: at('2026-10-19T08:00:00-05:00'),
  EarlyVoteEnd: at('2026-10-30T19:00:00-05:00'),
  ElectionDateBegin: at('2026-11-03T07:00:00-06:00'),
  ElectionDateEnd: at('2026-11-03T19:00:00-06:00')
});
const race = (id, district) => ({ kind: 'race', id, office: id, vote_for: 'Vote for none or one', district, candidates: [{ name: 'A', party: null }] });
const tier = (type, items) => ({ id: type, title: type, jurisdiction: { type, name: type }, items });
const place = (type, name, items) => ({ id: name, title: name, jurisdiction: { type, name }, items });

const ballot = {
  election_date: '2026-11-03',
  sections: [
    tier('federal', [
      race('senate', null),
      race('house20', { type: 'us_house', number: 20 }),
      race('house21', { type: 'us_house', number: 21 }),
      race('house23', { type: 'us_house', number: 23 })
    ]),
    tier('county', [
      race('judge', null),
      race('comm2', { type: 'commissioner', number: 2 }),
      race('comm4', { type: 'commissioner', number: 4 })
    ]),
    place('city', 'Live Oak', [race('council', null)]),
    place('city', 'San Antonio', [race('prop', null)]),
    place('school', 'North East Independent School District', [race('trustee', null)]),
    place('school', 'Somerset Independent School District', [race('smd3', { type: 'local_district', number: 3 })]),
    place('special', 'Bexar County MUD 1', [race('mud', null)])
  ]
};
const voter = { us_house: [20], commissioner: 2, cities: ['San Antonio'], school: 'Northeast ISD' };
const shownIds = result => result.sections.flatMap(section => section.items.map(item => item.id));
const shown = (result, id) => result.sections.flatMap(section => section.items).find(item => item.id === id);

test('county feed times read in San Antonio time', () => {
  assert.equal(control.date, '2026-11-03');
  assert.equal(dateKey(at('2026-11-04T05:59:00Z')), '2026-11-03');
  assert.equal(dateKey(at('2026-11-04T06:00:00Z')), '2026-11-04');
});

test('phase changes exactly at the county times', () => {
  const cases = [
    ['2026-10-19T07:59:59-05:00', 'before-early'],
    ['2026-10-19T08:00:00-05:00', 'early'],
    ['2026-10-30T19:00:00-05:00', 'early'],
    ['2026-10-30T19:00:01-05:00', 'before-election-day'],
    ['2026-11-03T06:59:59-06:00', 'before-election-day'],
    ['2026-11-03T07:00:00-06:00', 'election-day'],
    ['2026-11-03T19:00:00-06:00', 'election-day'],
    ['2026-11-03T19:00:01-06:00', 'over']
  ];
  for (const [now, phase] of cases) assert.equal(getPhase(control, at(now)), phase, now);
});

test('voters are never sent to early sites once early voting ends', () => {
  assert.equal(locationKind('before-early'), null);
  assert.equal(locationKind('early'), 'early');
  assert.equal(locationKind('before-election-day'), 'election_day');
  assert.equal(locationKind('election-day'), 'election_day');
  assert.equal(locationKind('over'), null);
});

test('an election with a missing date shows nothing rather than a wrong phase', () => {
  assert.equal(getPhase({ ...control, day_end: null }, at('2026-11-01T12:00:00Z')), 'none');
  assert.equal(getPhase({ ...control, early_begin: null }, at('2026-10-01T12:00:00Z')), 'none');
});

test('primaries are detected', () => {
  assert.equal(readControl({ PrimaryFlag: 'Y', ElectionDateBegin: 0 }).primary, true);
  assert.equal(readControl({ PrimaryFlag: 'N', ElectionDateBegin: 0 }).primary, false);
});

test('inactive or missing elections show nothing', () => {
  assert.equal(getPhase(null, 0), 'none');
  assert.equal(getPhase({ ...control, active: false }, at('2026-11-01T12:00:00Z')), 'none');
});

test('a ballot for another election is never shown', () => {
  const now = at('2026-11-01T12:00:00Z');
  const stale = { ...ballot, election_date: '2025-11-04' };
  assert.equal(resolveElection({ liveControl: control, ballot: stale, now }).showBallot, false);
  assert.equal(resolveElection({ liveControl: control, ballot, now }).showBallot, true);
  assert.equal(resolveElection({ liveControl: control, ballot: null, now }).showBallot, false);
});

test('a past ballot stays hidden when the county is unreachable', () => {
  const now = at('2027-02-01T12:00:00Z');
  const result = resolveElection({ liveControl: null, savedControl: control, ballot, now });
  assert.equal(result.phase, 'over');
  assert.equal(result.showBallot, false);
});

test('saved dates keep the ballot up during an outage, flagged as unconfirmed', () => {
  const now = at('2026-11-02T12:00:00Z');
  const result = resolveElection({ liveControl: null, savedControl: control, ballot, now });
  assert.equal(result.showBallot, true);
  assert.equal(result.verified, false);
});

test('nothing saved and nothing live shows no ballot', () => {
  const result = resolveElection({ liveControl: null, savedControl: undefined, ballot, now: 0 });
  assert.equal(result.phase, 'none');
  assert.equal(result.showBallot, false);
});

test('an address sees its own races and no one else\'s', () => {
  const ids = shownIds(buildVoterBallot(ballot, voter));
  assert.deepEqual(ids, ['senate', 'house20', 'judge', 'comm2', 'prop', 'trustee']);
});

test('a mailing city does not stand in for a real city', () => {
  const ids = shownIds(buildVoterBallot(ballot, { ...voter, cities: [] }));
  assert.ok(!ids.includes('prop') && !ids.includes('council'));
});

test('school names match across county spellings', () => {
  assert.equal(normalizeSchool('Northeast ISD'), normalizeSchool('North East Independent School District'));
  assert.equal(normalizeSchool('Edgewood ISD (Bexar)'), normalizeSchool('Edgewood Independent School District'));
  assert.equal(
    normalizeSchool('Schertz-Cibolo-Universal City ISD'),
    normalizeSchool('Schertz Cibolo Universal City Independent School District')
  );
});

test('a failed lookup keeps the races and flags them', () => {
  const result = buildVoterBallot(ballot, { ...voter, commissioner: null, cities: null, school: null });
  assert.equal(shown(result, 'comm2').unverified, true);
  assert.equal(shown(result, 'comm4').unverified, true);
  assert.equal(shown(result, 'council').unverified, true);
  assert.equal(shown(result, 'smd3').unverified, true);
  assert.equal(shown(result, 'judge').unverified, false);
});

test('a precinct split between House districts shows both, flagged', () => {
  const result = buildVoterBallot(ballot, { ...voter, us_house: [20, 23] });
  assert.equal(shown(result, 'house20').unverified, true);
  assert.equal(shown(result, 'house23').unverified, true);
  assert.equal(shown(result, 'house21'), undefined);
});

test('a House district missing from the ballot shows every House race, flagged', () => {
  for (const us_house of [[28], null]) {
    const result = buildVoterBallot(ballot, { ...voter, us_house });
    for (const id of ['house20', 'house21', 'house23']) assert.equal(shown(result, id).unverified, true);
  }
});

test('outside a full House year, a district with no race simply has none', () => {
  const may = { ...ballot, election_date: '2027-05-01' };
  const result = buildVoterBallot(may, { ...voter, us_house: [35] });
  assert.equal(shown(result, 'house20'), undefined);
  const unknown = buildVoterBallot(may, { ...voter, us_house: null });
  assert.equal(shown(unknown, 'house20').unverified, true);
});

test('special districts stay separate from the matched ballot', () => {
  const result = buildVoterBallot(ballot, voter);
  assert.deepEqual(result.special.map(section => section.title), ['Bexar County MUD 1']);
  assert.ok(!shownIds(result).includes('mud'));
});

test('multi-seat races allow more than one vote', () => {
  assert.equal(maxVotes('Vote for none or one'), 1);
  assert.equal(maxVotes('Vote for none, one, or two'), 2);
  assert.equal(maxVotes('Vote for 2'), 2);
  assert.equal(maxVotes('Vote for eight'), 8);
  assert.equal(maxVotes(undefined), 1);
});

test('sites skip inactive entries and sort by distance', () => {
  const sites = readSites([
    { attributes: { ACTIVE: 'Yes', NAME: 'Far', ADDRESS: 'x', DETAILS: 'No additional information' }, geometry: { x: -98.0, y: 29.9 } },
    { attributes: { ACTIVE: 'No', NAME: 'Closed', ADDRESS: 'x' }, geometry: { x: -98.49, y: 29.42 } },
    { attributes: { ACTIVE: 'Yes', NAME: 'Near', ADDRESS: 'x', DETAILS: 'Open 7am-7pm' }, geometry: { x: -98.5, y: 29.42 } },
    { attributes: { ACTIVE: 'Yes', NAME: 'No location', ADDRESS: 'x' } }
  ]);
  const nearest = nearestSites(sites, { lat: 29.42, lng: -98.5 }, 4);
  assert.deepEqual(nearest.map(site => site.name), ['Near', 'Far']);
  assert.equal(nearest[0].details, 'Open 7am-7pm');
  assert.equal(nearest[1].details, '');
  const [cleaned] = readSites([{ attributes: { ACTIVE: 'Yes', NAME: 'Victory Center, Room 117 ***', ADDRESS: 'x' }, geometry: { x: 0, y: 0 } }]);
  assert.equal(cleaned.name, 'Victory Center, Room 117');
  assert.ok(nearest[1].distance_miles > 30 && nearest[1].distance_miles < 60);
});
