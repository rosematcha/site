import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, test } from 'node:test';
import { classifyJurisdiction, dropSpanish, officeDistrict, parseBallotPdf, parseLines } from '../scripts/parse-ballot.mjs';
import { jurisdictionWarnings, placeOffMapJurisdictions, validateBallot } from '../scripts/validate-ballot.mjs';

const fixture = new URL('../scripts/fixtures/2026-11-03-generic.pdf', import.meta.url).pathname;
const crosswalk = JSON.parse(readFileSync(new URL('../congress_by_precinct.json', import.meta.url)));
let ballot;
let items;
const find = id => items.find(item => item.id === id);

before(() => {
  ballot = parseBallotPdf(fixture);
  items = ballot.sections.flatMap(section => section.items);
});

test('reads the election from the title block', () => {
  assert.equal(ballot.election_date, '2026-11-03');
  assert.equal(ballot.election_name, 'Joint General, Special, Charter and Bond Election');
});

test('every oval in the PDF lands on a parsed choice', () => {
  assert.equal(ballot.oval_count, 253);
  assert.deepEqual(validateBallot(ballot, { expectedDate: '2026-11-03', crosswalk }), []);
});

test('keeps candidates and parties together across columns', () => {
  assert.deepEqual(find('federal__united_states_senator').candidates, [
    { name: 'Ken Paxton', party: 'REP' },
    { name: 'James Talarico', party: 'DEM' },
    { name: 'Ted Brown', party: 'LIB' }
  ]);
  assert.equal(find('federal__united_states_senator').write_in, true);
  assert.deepEqual(find('state__state_representative_district_125').candidates, [
    { name: 'Ricardo "Rick" Martinez', party: 'REP' },
    { name: 'Adrian Reyna', party: 'DEM' }
  ]);
  assert.equal(find('state__state_representative_district_124').write_in, true);
});

test('measures have English text, no Spanish, and plain choices', () => {
  const measure = find('city_of_live_oak__city_of_live_oak_proposition_e');
  assert.match(measure.text, /^"Shall the City Charter of the City of Live Oak be amended to remove/);
  assert.deepEqual(measure.options, ['For', 'Against']);
  for (const item of items.filter(entry => entry.kind === 'question')) {
    assert.doesNotMatch(item.text, /Deber[ií]a|impuesto|\(A FAVOR\)/i, item.id);
  }
});

test('a jurisdiction with several elections becomes one section', () => {
  const titles = ballot.sections.map(section => section.title);
  assert.equal(new Set(titles).size, titles.length);
  const converse = ballot.sections.find(section => section.title === 'City of Converse');
  assert.equal(converse.items.length, 5);
  assert.equal(new Set(converse.items.map(item => item.id)).size, 5);
});

test('districts and jurisdictions are classified', () => {
  assert.deepEqual(officeDistrict('United States Representative, District 35'), { type: 'us_house', number: 35 });
  assert.deepEqual(officeDistrict('County Commissioner Precinct 4'), { type: 'commissioner', number: 4 });
  assert.deepEqual(officeDistrict('For Trustee, Single Member District 7'), { type: 'local_district', number: 7 });
  assert.equal(officeDistrict('Governor'), null);
  assert.deepEqual(classifyJurisdiction('Town of Hollywood Park'), { type: 'city', name: 'Hollywood Park' });
  assert.equal(classifyJurisdiction('Comal Independent School District').type, 'school');
  assert.equal(classifyJurisdiction('Bexar Central Appraisal District').type, 'county');
  assert.equal(classifyJurisdiction('Edwards Aquifer Authority District 1').type, 'special');
});

test('wrapped Spanish lines are dropped whole', () => {
  assert.deepEqual(dropSpanish(['Judge', '(Juez, Corte', 'Lugar 4)', 'Vote for none or one']), ['Judge', 'Vote for none or one']);
});

test('validation blocks a wrong election or a dropped choice', () => {
  assert.match(validateBallot(ballot, { expectedDate: '2028-11-07' }).join(), /current election is 2028-11-07/);
  assert.match(validateBallot({ ...ballot, oval_count: 254 }, {}).join(), /254 ovals/);
});

test('validation catches a congressional map that no longer fits the ballot', () => {
  const oldMap = { plan: 'OLD', precincts: { 1: [20], 2: [28] } };
  assert.match(validateBallot(ballot, { crosswalk: oldMap }).join(), /congressional map may have changed/);
});

test('names missing from the county map move to special districts', () => {
  const placed = placeOffMapJurisdictions(ballot, { cities: ['San Antonio'], schools: [] });
  const type = title => placed.sections.find(section => section.title === title).jurisdiction.type;
  assert.equal(type('City of Converse'), 'special');
  assert.equal(type('City of San Antonio'), 'city');
  assert.equal(type('Comal Independent School District'), 'special');
  assert.ok(jurisdictionWarnings(placed).includes('Shown only as "if you live there": City of Converse'));
});

test('measure text stops at the closing quote', () => {
  for (const item of items.filter(entry => entry.kind === 'question')) {
    assert.doesNotMatch(item.text, /PROPOSICI|PROPUESTA/, item.id);
  }
});

test('wording that starts a line with a parenthesis is kept', () => {
  const measure = find('city_of_san_antonio__city_of_san_antonio_proposition_a_pre_k_4_sa_sales_use_tax_20_year_reauthorization');
  assert.match(measure.text, /period of twenty \(20\) years following the expiration/);
});

test('headings with several words before Election start a new section', () => {
  const sections = parseLines([
    'COUNTY',
    'County Judge',
    'Vote for none or one',
    '\u2B2D Ana Ruiz DEM',
    'City of Alamo Heights - Special Bond Election',
    'For Mayor',
    'Vote for none or one',
    '\u2B2D Lee Park'
  ]);
  assert.deepEqual(sections.map(section => section.title), ['County', 'City of Alamo Heights']);
  assert.equal(sections[1].jurisdiction.type, 'city');
});

test('a parenthesized line inside English wording is not read as Spanish', () => {
  assert.deepEqual(dropSpanish(['"For', '(i) parks and', '(ii) trails"', '("Para parques")']), ['"For', '(i) parks and', '(ii) trails"']);
});

test('office wording variants still find the district', () => {
  assert.deepEqual(officeDistrict('State Representative District 120'), { type: 'state_house', number: 120 });
  assert.deepEqual(officeDistrict('County Commissioner Pct. 2'), { type: 'commissioner', number: 2 });
  assert.deepEqual(officeDistrict('For Council Member, District 5'), { type: 'local_district', number: 5 });
  assert.equal(officeDistrict('District Judge, 45th Judicial District'), null);
  assert.equal(officeDistrict('Chief Justice, 4th Court of Appeals District'), null);
});

test('other jurisdiction spellings are placed', () => {
  assert.equal(classifyJurisdiction('North East ISD').type, 'school');
  assert.equal(classifyJurisdiction('Bexar County').type, 'county');
  assert.equal(classifyJurisdiction('Bexar County Municipal Utility District No. 1').type, 'special');
});

test('a May ballot with only some House seats still publishes', () => {
  const one = { ...ballot, election_date: '2027-05-01', sections: ballot.sections.map(section => ({
    ...section,
    items: section.items.filter(item => item.district?.type !== 'us_house' || item.district.number === 20)
  })) };
  assert.doesNotMatch(validateBallot(one, { crosswalk }).join(), /congressional map/);
});
