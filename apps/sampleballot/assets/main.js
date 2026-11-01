import {
  TIME_ZONE,
  buildVoterBallot,
  firstNumber,
  locationKind,
  maxVotes,
  nearestSites,
  readControl,
  readSites,
  resolveElection
} from './election.js?v=2026-11-01';

const SUGGEST_URL = "https://maps.bexar.org/arcgis/rest/services/Locators/BeCoMultiRole/GeocodeServer/suggest";
const GEOCODE_URL = "https://maps.bexar.org/arcgis/rest/services/Locators/BeCoMultiRole/GeocodeServer/findAddressCandidates";
const PRECINCT_BASE_URL = "https://maps.bexar.org/arcgis/rest/services";
const ENDPOINTS = {
  voterPrecinct: `${PRECINCT_BASE_URL}/EL/VoterPrecincts/MapServer/0/query`,
  commissionerPrecinct: `${PRECINCT_BASE_URL}/CommissionerPrecincts/MapServer/0/query`,
  jpPrecinct: `${PRECINCT_BASE_URL}/JusticeofthePeace/MapServer/1/query`,
  cityCouncil: `${PRECINCT_BASE_URL}/CityCouncilDistricts/MapServer/0/query`,
  stateHouse: `${PRECINCT_BASE_URL}/TXHouseRepDistricts/MapServer/0/query`,
  stateSenate: `${PRECINCT_BASE_URL}/TXSenateDistrictsBexar/MapServer/0/query`,
  constable: `${PRECINCT_BASE_URL}/Constables/MapServer/1/query`,
  localJurisdiction: `${PRECINCT_BASE_URL}/LocalJurisdictions/MapServer/0/query`,
  stateBoe: `${PRECINCT_BASE_URL}/TX_SBOE_Districts/MapServer/0/query`,
  schoolDistrict: `${PRECINCT_BASE_URL}/SchoolDistricts/MapServer/0/query`,
  electionControl: `${PRECINCT_BASE_URL}/EL/ElectionControl/MapServer/0/query`,
  earlySites: `${PRECINCT_BASE_URL}/EL/PollingLocationsEarly/MapServer/0/query`,
  electionDaySites: `${PRECINCT_BASE_URL}/EL/PollingLocationsElectionDay/MapServer/0/query`
};
const COUNTY_ELECTION_INFO_URL = 'https://elections.bexar.gov/163/Election-Information';
const COUNTY_BALLOT_LOOKUP_URL = 'https://elections.bexar.gov/183/Voter-Registration-Check-Polling-Locatio';
const COORDINATE_SYSTEM = '4326';

const addressInput = document.getElementById('address');
const dropdown = document.getElementById('autocomplete-dropdown');
const form = document.getElementById('addressForm');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');

let debounceTimer = null;
let suggestions = [];
let selectedIndex = -1;
let currentLookup = null;
let ballotViewMode = 'official';

function setDropdownVisibility(visible) {
  dropdown.classList.toggle('active', Boolean(visible));
  dropdown.setAttribute('aria-hidden', visible ? 'false' : 'true');
  addressInput.setAttribute('aria-expanded', visible ? 'true' : 'false');
  if (!visible) {
    addressInput.removeAttribute('aria-activedescendant');
    selectedIndex = -1;
  }
}

function escapeAttribute(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class BexarPrecinctFinder {
  constructor() {
    this.savedLocationsPromise = null;
    this.ballotQuestionsPromise = null;
    this.congressPromise = null;
    this.sitesByKind = new Map();
  }

  async fetchJson(url, params, options = {}) {
    const searchParams = new URLSearchParams({ ...params, f: 'json' });
    const requestUrl = `${url}?${searchParams.toString()}`;

    const response = await fetch(requestUrl, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async geocodeAddress(address, maxLocations = 1) {
    const params = {
      SingleLine: address,
      maxLocations,
      outSR: COORDINATE_SYSTEM,
      outFields: 'Match_addr,Addr_type,City,Subregion,Region,Postal',
      returnOutFields: 'true'
    };

    const data = await this.fetchJson(GEOCODE_URL, params);
    if (!data.candidates || data.candidates.length === 0) {
      return null;
    }

    const candidate = data.candidates[0];
    const location = candidate.location || {};
    const attributes = candidate.attributes || {};

    return {
      x: location.x,
      y: location.y,
      score: candidate.score,
      address: candidate.address,
      city: attributes.City || this.extractCity(candidate.address),
      postal: attributes.Postal,
      candidate
    };
  }

  extractCity(addressText) {
    if (!addressText) return null;
    const parts = addressText.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return parts[1];
    }
    return null;
  }

  // Returns null when the address is in no district, undefined when the layer
  // couldn't answer. Callers treat those differently.
  async queryDistrict(url, x, y, outFields = '*') {
    const params = {
      geometry: `${x},${y}`,
      geometryType: 'esriGeometryPoint',
      inSR: COORDINATE_SYSTEM,
      spatialRel: 'esriSpatialRelIntersects',
      outFields,
      returnGeometry: 'false'
    };

    try {
      const data = await this.fetchJson(url, params);
      if (data.error || !Array.isArray(data.features)) return undefined;
      return data.features[0]?.attributes ?? null;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async findAllDistricts(address) {
    const geocode = await this.geocodeAddress(address, 1);
    // A match with no house number is a whole street, not this voter's address.
    if (!geocode || geocode.x == null || geocode.y == null || !/^\d/.test(geocode.address ?? '')) {
      return null;
    }

    const x = geocode.x;
    const y = geocode.y;

    const [
      voterPrecinct,
      commissioner,
      jp,
      cityCouncil,
      stateHouse,
      stateSenate,
      stateBoe,
      schoolDistrict,
      constable,
      localJurisdiction
    ] = await Promise.all([
      this.queryDistrict(ENDPOINTS.voterPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.commissionerPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.jpPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.cityCouncil, x, y),
      this.queryDistrict(ENDPOINTS.stateHouse, x, y),
      this.queryDistrict(ENDPOINTS.stateSenate, x, y),
      this.queryDistrict(ENDPOINTS.stateBoe, x, y),
      this.queryDistrict(ENDPOINTS.schoolDistrict, x, y),
      this.queryDistrict(ENDPOINTS.constable, x, y),
      this.queryDistrict(ENDPOINTS.localJurisdiction, x, y)
    ]);

    return {
      address,
      geocode,
      coordinates: { x, y },
      districts: {
        voter_precinct: voterPrecinct ? voterPrecinct.NAME : null,
        commissioner_precinct: commissioner ? commissioner.Comm : null,
        commissioner_name: commissioner ? commissioner.ComName : null,
        commissioner_website: commissioner ? commissioner.Website : null,
        jp_precinct: jp ? jp.Precinct : null,
        jp_judges: jp ? jp.Judges : null,
        jp_website: jp ? jp.WEBSITE : null,
        city_council_district: cityCouncil || null,
        state_house_district: stateHouse || null,
        state_senate_district: stateSenate || null,
        state_boe_district: stateBoe || null,
        school_district: schoolDistrict || null,
        constable_precinct: constable ? constable.Precinct : null,
        // undefined means the lookup failed; an empty list means unincorporated.
        cities: localJurisdiction === undefined ? null : [localJurisdiction?.JURIS].filter(Boolean)
      }
    };
  }

  loadStaticJson(name, fallback) {
    return fetch(`./${name}`)
      .then(res => {
        if (!res.ok) throw new Error(`Unable to load ${name}`);
        return res.json();
      })
      .catch(err => {
        console.error(err);
        return fallback;
      });
  }

  loadSavedLocations() {
    this.savedLocationsPromise ??= this.loadStaticJson('voting_locations.json', {});
    return this.savedLocationsPromise;
  }

  loadBallotQuestions() {
    this.ballotQuestionsPromise ??= this.loadStaticJson('ballot_questions.json', null);
    return this.ballotQuestionsPromise;
  }

  loadCongressPrecincts() {
    this.congressPromise ??= this.loadStaticJson('congress_by_precinct.json', { precincts: {} });
    return this.congressPromise;
  }

  async fetchLiveControl() {
    try {
      const data = await this.fetchJson(ENDPOINTS.electionControl, { where: '1=1', outFields: '*', returnGeometry: 'false' });
      return readControl(data.features?.[0]?.attributes);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async fetchLiveSites(kind) {
    const url = kind === 'early' ? ENDPOINTS.earlySites : ENDPOINTS.electionDaySites;
    try {
      const data = await this.fetchJson(url, { where: '1=1', outFields: '*', returnGeometry: 'true', outSR: COORDINATE_SYSTEM });
      return readSites(data.features ?? []);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Saved sites only count when they were saved for this same election.
  async loadSites(kind, control) {
    if (!this.sitesByKind.has(kind)) {
      this.sitesByKind.set(kind, this.fetchLiveSites(kind));
    }
    const live = await this.sitesByKind.get(kind);
    if (live.length > 0) return live;
    const saved = await this.loadSavedLocations();
    return saved.control?.date === control.date ? (saved[kind] ?? []) : [];
  }

  async loadElection() {
    const [liveControl, saved, ballot] = await Promise.all([
      this.fetchLiveControl(),
      this.loadSavedLocations(),
      this.loadBallotQuestions()
    ]);
    return { ...resolveElection({ liveControl, savedControl: saved.control, ballot, now: Date.now() }), ballot };
  }

  async buildVoter(lookup) {
    const { districts } = lookup;
    const crosswalk = await this.loadCongressPrecincts();
    return {
      us_house: crosswalk.precincts[districts.voter_precinct] ?? null,
      state_senate: firstNumber(districts.state_senate_district?.District),
      state_house: firstNumber(districts.state_house_district?.District),
      sboe: firstNumber(districts.state_boe_district?.District),
      commissioner: firstNumber(districts.commissioner_precinct),
      jp: firstNumber(districts.jp_precinct),
      constable: firstNumber(districts.constable_precinct),
      cities: districts.cities,
      school: districts.school_district?.NAME ?? null
    };
  }
}

const finder = new BexarPrecinctFinder();

let loadingMessageInterval = null;

function updateLoadingMessage(message) {
  const messageEl = loadingEl.querySelector('p');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingEl.classList.add('active');
    loadingEl.setAttribute('aria-hidden', 'false');
    loadingEl.setAttribute('aria-busy', 'true');
    resultsEl.classList.remove('active');
    resultsEl.setAttribute('aria-busy', 'true');
    resultsEl.setAttribute('aria-hidden', 'true');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    toggleBallotActions(false);
    updateLoadingMessage('Locating your address…');
  } else {
    if (loadingMessageInterval) {
      clearInterval(loadingMessageInterval);
      loadingMessageInterval = null;
    }
    loadingEl.classList.remove('active');
    loadingEl.setAttribute('aria-hidden', 'true');
    loadingEl.setAttribute('aria-busy', 'false');
    resultsEl.setAttribute('aria-busy', 'false');
    resultsEl.setAttribute('aria-hidden', resultsEl.classList.contains('active') ? 'false' : 'true');
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
  }
}

function resetResults() {
  resultsEl.innerHTML = '';
  resultsEl.classList.remove('active');
  resultsEl.setAttribute('aria-busy', 'false');
  resultsEl.setAttribute('aria-hidden', 'true');
  toggleBallotActions(false);
  currentLookup = null;
}

async function handleLookup(event) {
  event.preventDefault();
  const address = addressInput.value.trim();
  if (!address) return;

  resetResults();
  setLoading(true);

  try {
    updateLoadingMessage('Locating your address…');
    const lookup = await finder.findAllDistricts(address);
    if (!lookup) {
      showError('Address Not Found', 'We could not find that address. Please verify and try again.');
      return;
    }

    updateLoadingMessage('Finding your voter precinct and districts…');
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for UI update

    updateLoadingMessage('Loading your ballot…');
    const election = await finder.loadElection();
    const voterBallot = election.showBallot
      ? buildVoterBallot(election.ballot, await finder.buildVoter(lookup))
      : null;

    updateLoadingMessage('Finding nearest voting locations…');
    const kind = locationKind(election.phase);
    const sites = kind ? await finder.loadSites(kind, election.control) : [];
    const origin = { lat: lookup.coordinates.y, lng: lookup.coordinates.x };

    updateLoadingMessage('Preparing your results…');
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for UI update

    currentLookup = {
      address,
      lookup,
      election,
      voterBallot,
      kind,
      nearestLocations: nearestSites(sites, origin, 4)
    };

    const html = renderResults(currentLookup);
    resultsEl.innerHTML = html;
    resultsEl.classList.add('active');
    resultsEl.setAttribute('aria-busy', 'false');
  resultsEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      resultsEl.focus();
    });
    toggleBallotActions(true);
    attachBallotActions();
    attachBallotViewToggle();
    attachVoteTracking();
  } catch (error) {
    console.error(error);
    showError('Lookup Error', 'An unexpected error occurred. Please try again later.');
  } finally {
    setLoading(false);
  }
}

function showError(title, message) {
  resultsEl.innerHTML = `
    <div class="error">
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
  resultsEl.classList.add('active');
  resultsEl.setAttribute('aria-busy', 'false');
  resultsEl.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    resultsEl.focus();
  });
  toggleBallotActions(false);
}

const formatDate = ms =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, dateStyle: 'full' }).format(ms);
const formatShortDate = ms =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric' }).format(ms);
const formatTime = ms =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(ms);
const longDate = ms =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, dateStyle: 'long' }).format(ms);

function renderResults(state) {
  const { address, lookup, election, voterBallot, kind, nearestLocations } = state;
  const districts = lookup.districts;
  const precinct = districts.voter_precinct || 'Unknown';
  const cityCouncil = districts.city_council_district;

  return `
    <article class="panel sample-ballot stack-lg">
      <header class="stack-sm">
        <h2>Your voter precinct</h2>
        <div class="ballot-info">
          <p><strong>Address:</strong> ${escapeHtml(lookup.geocode.address)}</p>
          <p><strong>Voter precinct:</strong> ${escapeHtml(precinct)}</p>
          ${districts.school_district ? `<p><strong>School district:</strong> ${escapeHtml(districts.school_district.NAME)}</p>` : ''}
          ${cityCouncil ? `<p><strong>City council district:</strong> ${escapeHtml(cityCouncil.Dscption)}</p>` : ''}
        </div>
      </header>
      ${renderBallot(election, voterBallot)}
      ${renderLocations(address, kind, nearestLocations)}
      ${renderVotingHours(election)}
      <footer class="disclaimer">
        <p><strong>Note:</strong> This tool is informational only. For official ballot materials and polling locations, visit <a href="${COUNTY_ELECTION_INFO_URL}" target="_blank" rel="noopener">Bexar County Elections</a>.</p>
      </footer>
    </article>
  `;
}

function renderNoBallot(election) {
  const { phase, control } = election;
  if (phase === 'over') {
    return `<section class="stack-sm"><h3>The ${escapeHtml(longDate(control.day_begin))} election is over.</h3></section>`;
  }
  if (phase === 'none') {
    return '<section class="stack-sm"><h3>No upcoming election is listed.</h3></section>';
  }
  return `
    <section class="stack-sm">
      <h3>This ballot isn't here yet.</h3>
      <p><a class="link" href="${COUNTY_ELECTION_INFO_URL}" target="_blank" rel="noopener">See the county's sample ballot</a></p>
    </section>
  `;
}

const hasSummaries = voterBallot =>
  [...voterBallot.sections, ...voterBallot.special].some(section =>
    section.items.some(item => item.plain_language)
  );

function renderBallot(election, voterBallot) {
  if (!election.showBallot) return renderNoBallot(election);

  const summaries = hasSummaries(voterBallot);
  ballotViewMode = summaries ? 'plain-arguments' : 'official';
  const unverifiedNotice = election.verified
    ? ''
    : '<p class="ballot-subtitle">We couldn\'t reach the county to confirm this election is current.</p>';

  const header = `
    <section class="ballot-header">
      <h2>Your ballot &ndash; ${escapeHtml(longDate(election.control.day_begin))}</h2>
      <p class="ballot-subtitle">Matched to your address. <a class="link" href="${COUNTY_BALLOT_LOOKUP_URL}" target="_blank" rel="noopener">Get your official sample ballot</a> to confirm.</p>
      ${unverifiedNotice}
      ${summaries ? `<div class="ballot-view-source-notice stack-xs"><small><strong>Note:</strong> Plain-language summaries and pros/cons are sourced from the <a href="https://lwvsa.org/" target="_blank" rel="noopener">League of Women Voters</a>.</small></div>` : ''}
    </section>
  `;

  const viewToggle = summaries
    ? `
    <div class="ballot-view-toggle" role="group" aria-label="Choose how ballot wording is displayed">
      <button type="button" class="ballot-view-toggle__button" data-view="plain-arguments" aria-pressed="false">Summary with pros &amp; cons</button>
      <button type="button" class="ballot-view-toggle__button" data-view="plain" aria-pressed="false">Plain-language summary</button>
      <button type="button" class="ballot-view-toggle__button" data-view="official" aria-pressed="false">Official wording</button>
    </div>
  `
    : '';

  const specialMarkup = voterBallot.special.length
    ? `<details class="ballot-special stack-md"><summary>Special districts, if you live in one</summary>${voterBallot.special.map(renderBallotSection).join('')}<p><a class="link" href="${COUNTY_ELECTION_INFO_URL}" target="_blank" rel="noopener">More special district ballots</a></p></details>`
    : '';

  const actions = `
    <div id="ballot-actions" class="actions-bar">
      <button class="button" type="button" data-action="print-ballot">Print selections</button>
      <button class="button button--ghost" type="button" data-action="save-ballot">Save selections as image</button>
    </div>
  `;

  const viewAttr = escapeAttribute(ballotViewMode);
  const sectionsMarkup = voterBallot.sections.map(renderBallotSection).join('');

  return `${header}${viewToggle}<div class="stack-lg ballot-sections" id="ballot-sections" data-ballot-view="${viewAttr}">${sectionsMarkup}${specialMarkup}</div>${actions}`;
}

function renderBallotSection(section) {
  return `
    <section class="stack-md ballot-section" data-section-title="${escapeAttribute(section.title)}">
      <h3>${escapeHtml(section.title)}</h3>
      ${section.items.map(item => (item.kind === 'race' ? renderRace(item) : renderQuestion(item))).join('')}
    </section>
  `;
}

function renderChoices(item, options, inputType) {
  const inputs = options
    .map(
      option => `
        <label class="choice-option">
          <input type="${inputType}" name="vote_${escapeAttribute(item.id)}" value="${escapeAttribute(option.value)}">
          <span>${escapeHtml(option.label)}</span>
        </label>
      `
    )
    .join('');
  return `<ul class="ballot-question__choices" aria-label="Available choices"><li><strong>Your vote:</strong> <div class="choice-group">${inputs}</div></li></ul>`;
}

const unverifiedNote = item =>
  item.unverified ? '<p class="ballot-question__unverified">This may not be on your ballot.</p>' : '';

function renderRace(race) {
  const options = race.candidates.map(({ name, party }) => {
    const label = party ? `${name} (${party})` : name;
    return { label, value: label };
  });
  if (race.write_in) options.push({ label: 'Write-in', value: 'Write-in' });
  const inputType = maxVotes(race.vote_for) > 1 ? 'checkbox' : 'radio';

  return `
    <article class="ballot-question" data-question-label="${escapeAttribute(race.office)}">
      <header class="ballot-question__header stack-xs">
        <h4 class="ballot-question__title">${escapeHtml(race.office)}</h4>
      </header>
      <div class="ballot-question__body stack-sm">
        ${unverifiedNote(race)}
        <p>${escapeHtml(race.vote_for)}</p>
        ${renderChoices(race, options, inputType)}
      </div>
    </article>
  `;
}

function renderQuestion(question) {
  const officialContent = `<p>${escapeHtml(question.text)}</p>`;
  const plainSummaryContent = question.plain_language
    ? `<p>${escapeHtml(question.plain_language)}</p>`
    : '<p class="ballot-question__empty">Plain-language summary not available.</p>';

  const argumentList = (heading, items) =>
    items?.length
      ? `<div class="ballot-question__arguments"><h5>${heading}</h5><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
      : '';
  const argumentsMarkup =
    argumentList('Why supporters say yes', question.arguments_for) +
    argumentList('Why opponents say no', question.arguments_against);
  const options = question.options.map(option => ({ label: option, value: option }));

  return `
    <article class="ballot-question" data-question-label="${escapeAttribute(question.title)}">
      <header class="ballot-question__header stack-xs">
        <h4 class="ballot-question__title">${escapeHtml(question.title)}</h4>
      </header>
      <div class="ballot-question__body stack-sm">
        ${unverifiedNote(question)}
        <div class="ballot-question__view" data-view-section="official">${officialContent}</div>
        <div class="ballot-question__view" data-view-section="plain">${plainSummaryContent}</div>
        <div class="ballot-question__view" data-view-section="plain-arguments">${plainSummaryContent}${argumentsMarkup}</div>
        ${renderChoices(question, options, 'radio')}
      </div>
    </article>
  `;
}

function renderHoursRow(dates, hours) {
  return `
    <div class="voting-period">
      <div class="voting-period__dates">
        <div class="voting-period__dates-primary">${escapeHtml(dates)}</div>
      </div>
      <div class="voting-period__hours">${hours}</div>
    </div>
  `;
}

function renderVotingHours({ phase, control }) {
  if (phase === 'none' || phase === 'over') return '';

  const earlyStillOpen = phase === 'early' || phase === 'before-early';
  const earlyGroup = earlyStillOpen
    ? `
      <div class="voting-hours__group">
        <h4>Early voting</h4>
        <div class="voting-periods">
          ${renderHoursRow(
            `${formatShortDate(control.early_begin)} to ${formatShortDate(control.early_end)}`,
            `<a class="link" href="${COUNTY_ELECTION_INFO_URL}" target="_blank" rel="noopener">Hours by day</a>`
          )}
        </div>
      </div>
    `
    : '';

  return `
    <section class="stack-md voting-hours-section">
      <h3>Voting hours</h3>
      <div class="voting-hours stack-sm">
        ${earlyGroup}
        <div class="voting-hours__group">
          <h4>Election day</h4>
          <div class="voting-periods">
            ${renderHoursRow(formatDate(control.day_begin), escapeHtml(`${formatTime(control.day_begin)} to ${formatTime(control.day_end)}`))}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderLocations(address, kind, locations) {
  if (!kind) return '';
  const heading = kind === 'early' ? 'Nearest early voting sites' : 'Nearest Election Day vote centers';

  if (locations.length === 0) {
    return `
      <section class="stack-sm location-section">
        <h3>${heading}</h3>
        <p>Couldn't load voting locations. <a class="link" href="${COUNTY_ELECTION_INFO_URL}" target="_blank" rel="noopener">See the county's list</a></p>
      </section>
    `;
  }

  const [primary, ...secondary] = locations;
  return `
    <section class="stack-md location-section">
      <h3>${heading}</h3>
      ${renderSingleLocation(primary, 0, address, true)}
      ${secondary.length > 0 ? `<div class="location-list-secondary">${secondary.map((loc, idx) => renderSingleLocation(loc, idx + 1, address, false)).join('')}</div>` : ''}
    </section>
  `;
}

function renderSingleLocation(loc, index, address, isPrimary) {
  const origin = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${loc.lat},${loc.lng}`;
  const milesText = loc.distance_miles.toFixed(2);
  const distanceText =
    loc.distance_miles < 0.1 ? `${milesText} miles (${Math.round(loc.distance_miles * 5280)} feet)` : `${milesText} miles`;
  const cardClass = isPrimary ? 'location-card location-card--primary' : 'location-card location-card--secondary';
  const buttonClass = isPrimary ? 'button location-card__cta' : 'button button--ghost location-card__cta';
  const badgeMarkup = isPrimary ? '<span class="location-card__badge">Closest match</span>' : '';
  const rankLabel = `#${index + 1}`;

  return `
    <article class="${cardClass}" data-rank="${rankLabel}">
      <header class="location-card__header">
        <div class="location-card__title">
          <span class="location-card__rank" aria-hidden="true">${rankLabel}</span>
          ${badgeMarkup}
          <h4>${escapeHtml(loc.name)}</h4>
        </div>
        <a href="${mapsUrl}" target="_blank" rel="noopener" class="${buttonClass}">Open directions</a>
      </header>
      <ul class="location-card__meta">
        <li><strong>Address:</strong> ${escapeHtml(loc.address)}</li>
        <li><strong>Distance:</strong> ${escapeHtml(distanceText)}</li>
        ${loc.details ? `<li><strong>Hours:</strong> ${escapeHtml(loc.details)}</li>` : ''}
      </ul>
    </article>
  `;
}

function toggleBallotActions(visible) {
  const actions = document.getElementById('ballot-actions');
  if (!actions) return;
  const isVisible = Boolean(visible);
  actions.classList.toggle('active', isVisible);
  actions.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function attachBallotActions() {
  const actions = document.getElementById('ballot-actions');
  if (!actions) return;

  const saveBtn = actions.querySelector('[data-action="save-ballot"]');
  const printBtn = actions.querySelector('[data-action="print-ballot"]');

  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.addEventListener('click', saveBallotAsImage);
    saveBtn.dataset.bound = 'true';
  }

  if (printBtn && !printBtn.dataset.bound) {
    printBtn.addEventListener('click', printBallot);
    printBtn.dataset.bound = 'true';
  }
}

function updateBallotViewUI() {
  const container = document.getElementById('ballot-sections');
  if (container) {
    container.setAttribute('data-ballot-view', ballotViewMode);
  }

  document.querySelectorAll('.ballot-view-toggle__button[data-view]').forEach(button => {
    const isActive = button.dataset.view === ballotViewMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setBallotView(view) {
  if (!view) return;
  ballotViewMode = view;
  updateBallotViewUI();
}

function attachBallotViewToggle() {
  const toggleGroup = document.querySelector('.ballot-view-toggle');
  if (!toggleGroup) return;

  toggleGroup.querySelectorAll('.ballot-view-toggle__button[data-view]').forEach(button => {
    if (!button.dataset.bound) {
      button.addEventListener('click', () => {
        if (button.dataset.view) {
          setBallotView(button.dataset.view);
        }
      });
      button.dataset.bound = 'true';
    }
  });

  updateBallotViewUI();
}

// Votes live on the card so they survive a change of ballot view.
function attachVoteTracking() {
  document.querySelectorAll('.ballot-question').forEach(card => {
    card.addEventListener('change', () => {
      const checked = card.querySelectorAll('input:checked');
      card.dataset.vote = Array.from(checked, input => input.value).join(', ');
    });
  });
}

const getVoteFromCard = card => (card.dataset.vote || '').trim();

function buildCondensedSections(ballotDiv) {
  const sections = Array.from(ballotDiv.querySelectorAll('.ballot-section'));

  return sections
    .map(section => {
      const headingEl = section.querySelector('h3');
      const sectionTitle = headingEl ? headingEl.textContent.trim() : '';
      if (!sectionTitle) {
        return null;
      }

      const questions = Array.from(section.querySelectorAll('.ballot-question'));
      if (questions.length === 0) {
        return null;
      }

      const entries = questions
        .map(card => {
          const cardHeading = card.querySelector('h4');
          const fallbackLabel = cardHeading ? cardHeading.textContent.trim() : '';
          const label = card.getAttribute('data-question-label') || fallbackLabel;
          const vote = getVoteFromCard(card);
          if (!label || !vote) {
            return null;
          }
          return {
            label,
            vote
          };
        })
        .filter(Boolean);

      if (entries.length === 0) {
        return null;
      }

      const items = entries
        .map(entry => `<li><span class="print-label">${escapeHtml(entry.label)}</span><span class="print-vote">${escapeHtml(entry.vote)}</span></li>`)
        .join('');

      return `<section><h3>${escapeHtml(sectionTitle)}</h3><ul>${items}</ul></section>`;
    })
    .filter(Boolean)
    .join('');
}

function renderCondensedBallot(ballotDiv) {
  const sectionsMarkup = buildCondensedSections(ballotDiv);
  // Address and precinct intentionally omitted for print/image
  return `
    <article class="print-ballot">
      <h1>Ballot selections</h1>
      ${sectionsMarkup || '<p>No ballot selections recorded.</p>'}
    </article>
  `;
}

async function saveBallotAsImage() {
  const ballotDiv = document.querySelector('.sample-ballot');
  if (!ballotDiv) return;

  // Show warning modal about phone restrictions at polling places
  const userConfirmed = await showPhoneWarningModal();

  if (!userConfirmed) {
    return;
  }

  // Create a temporary condensed ballot for image export
  const condensedMarkup = renderCondensedBallot(ballotDiv);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = condensedMarkup;
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '800px';
  tempDiv.style.background = '#fff';
  tempDiv.style.padding = '32px';
  tempDiv.style.zIndex = '9999';
  tempDiv.style.boxShadow = '0 0 24px 0 rgba(0,0,0,0.08)';
  tempDiv.style.borderRadius = '12px';
  tempDiv.querySelectorAll('section').forEach(section => {
    section.style.marginTop = '18px';
    section.style.marginBottom = '0';
  });
  tempDiv.querySelectorAll('h3').forEach(h3 => {
    h3.style.fontSize = '1.05rem';
    h3.style.margin = '0 0 6px';
    h3.style.color = '#1f2937';
  });
  tempDiv.querySelectorAll('ul').forEach(ul => {
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
  });
  tempDiv.querySelectorAll('li').forEach(li => {
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'baseline';
    li.style.padding = '6px 0';
    li.style.borderBottom = '1px solid #e5e7eb';
    li.style.fontSize = '0.95rem';
  });
  tempDiv.querySelectorAll('li:last-child').forEach(li => {
    li.style.borderBottom = 'none';
  });
  tempDiv.querySelectorAll('.print-label').forEach(label => {
    label.style.fontWeight = '500';
    label.style.color = '#111827';
    label.style.flex = '1 1 auto';
    label.style.textAlign = 'left';
    label.style.marginRight = '24px';
  });
  tempDiv.querySelectorAll('.print-vote').forEach(vote => {
    vote.style.fontWeight = '600';
    vote.style.color = '#1f2937';
    vote.style.flex = '0 0 auto';
    vote.style.textAlign = 'right';
  });
  document.body.appendChild(tempDiv);

  await ensureHtml2Canvas();
  if (!window.html2canvas) {
    alert('Image saving requires html2canvas.');
    tempDiv.remove();
    return;
  }

  const canvas = await window.html2canvas(tempDiv, {
    backgroundColor: '#fff',
    scale: 2,
    useCORS: true
  });
  tempDiv.remove();
  const link = document.createElement('a');
  link.download = 'sample_ballot.png';
  link.href = canvas.toDataURL();
  link.click();
}

async function printBallot() {
  const ballotDiv = document.querySelector('.sample-ballot');
  if (!ballotDiv) return;

  const condensedMarkup = renderCondensedBallot(ballotDiv);

  const win = window.open('', '', 'width=900,height=700');
  if (!win) return;

  const styles = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; margin: 24px; color: #111827; line-height: 1.4; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    .print-summary { margin-bottom: 16px; font-size: 0.95rem; color: #374151; }
    .print-summary p { margin: 4px 0; }
    section { margin-top: 18px; }
    section:first-of-type { margin-top: 0; }
    h3 { font-size: 1.05rem; margin: 0 0 6px; color: #1f2937; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 0.95rem; }
    li:last-child { border-bottom: none; }
    .print-label { font-weight: 500; color: #111827; flex: 1 1 auto; text-align: left; margin-right: 24px; }
    .print-vote { font-weight: 600; color: #1f2937; flex: 0 0 auto; text-align: right; }
  `;

  win.document.write(`<!DOCTYPE html><html><head><title>Print Ballot</title><style>${styles}</style></head><body>${condensedMarkup}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}

async function ensureHtml2Canvas() {
  if (window.html2canvas) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  }).catch(() => {
    console.warn('Failed to load html2canvas');
  });
}

function setupAutocomplete() {
  addressInput.addEventListener('input', event => {
    const query = event.target.value.trim();
    clearTimeout(debounceTimer);
    if (query.length < 2) {
      setDropdownVisibility(false);
      return;
    }

    debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
  });

  addressInput.addEventListener('keydown', event => {
    if (!dropdown.classList.contains('active')) return;

    const items = dropdown.querySelectorAll('.autocomplete-item:not(.loading)');
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection(items);
    } else if (event.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        event.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      }
    } else if (event.key === 'Escape') {
      setDropdownVisibility(false);
    }
  });

  document.addEventListener('click', event => {
    if (!addressInput.contains(event.target) && !dropdown.contains(event.target)) {
      setDropdownVisibility(false);
    }
  });
}

async function fetchSuggestions(query) {
  try {
    dropdown.innerHTML = '<div class="autocomplete-item loading" role="status">Loading suggestions...</div>';
    setDropdownVisibility(true);
    selectedIndex = -1;

    const [suggestData, geocodeData] = await Promise.all([
      finder.fetchJson(SUGGEST_URL, {
        text: query,
        maxSuggestions: 20
      }).catch(() => ({ suggestions: [] })),
      query.length >= 4
        ? finder.fetchJson(GEOCODE_URL, {
            SingleLine: query,
            maxLocations: 20,
            outFields: 'Match_addr,Score'
          }).catch(() => ({ candidates: [] }))
        : Promise.resolve({ candidates: [] })
    ]);

    const combined = [];
    const seen = new Set();

    if (Array.isArray(suggestData.suggestions)) {
      suggestData.suggestions.forEach(item => {
        if (item.text && !seen.has(item.text)) {
          combined.push(item.text);
          seen.add(item.text);
        }
      });
    }

    if (Array.isArray(geocodeData.candidates)) {
      geocodeData.candidates.forEach(candidate => {
        const addr = candidate.address;
        if (addr && candidate.score >= 60 && !seen.has(addr)) {
          combined.push(addr);
          seen.add(addr);
        }
      });
    }

    if (combined.length < 3 && query.length < 6) {
      combined.unshift('Tip: Type more of your address for better results');
    }

    suggestions = combined.slice(0, 15);
    renderSuggestions();
  } catch (error) {
    console.error('Autocomplete error', error);
    setDropdownVisibility(false);
  }
}

function renderSuggestions() {
  dropdown.innerHTML = '';

  suggestions.forEach((item, index) => {
    const div = document.createElement('div');
    if (item.toLowerCase().startsWith('tip:')) {
      div.className = 'autocomplete-item loading';
      div.textContent = item;
      div.setAttribute('role', 'note');
      div.setAttribute('aria-disabled', 'true');
    } else {
      div.className = 'autocomplete-item';
      div.textContent = item;
      div.dataset.index = index.toString();
      div.id = `address-suggestion-${index}`;
      div.setAttribute('role', 'option');
      div.setAttribute('aria-selected', 'false');
      div.addEventListener('click', () => selectSuggestion(item));
    }
    dropdown.appendChild(div);
  });

  setDropdownVisibility(suggestions.length > 0);
}

function selectSuggestion(text) {
  addressInput.value = text;
  setDropdownVisibility(false);
}

function updateSelection(items) {
  let activeId = '';
  items.forEach((item, index) => {
    const isActive = index === selectedIndex;
    item.classList.toggle('selected', isActive);
    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
    if (isActive) {
      activeId = item.id;
      item.scrollIntoView({ block: 'nearest' });
    }
  });

  if (activeId) {
    addressInput.setAttribute('aria-activedescendant', activeId);
  } else {
    addressInput.removeAttribute('aria-activedescendant');
  }
}

function loadRepresentatives() {
  if (!currentLookup) return;

  const repsBtn = document.getElementById('repsBtn');
  const section = document.getElementById('representatives-section');
  if (!section || !repsBtn) return;

  repsBtn.disabled = true;
  repsBtn.textContent = 'Loading...';
  section.innerHTML = '<div class="panel panel--muted" aria-live="polite">Loading representative information…</div>';

  setTimeout(() => {
    section.innerHTML = renderRepresentatives(currentLookup.lookup.districts);
    repsBtn.parentElement.style.display = 'none';
  }, 200);
}

function renderRepresentatives(districts) {
  const parts = [];

  const congress = districts.us_congress_district;
  if (congress) {
    parts.push(`
      <h3>Federal representatives</h3>
      <div class="ballot-card">
        <h4>U.S. representative</h4>
        <ul>
          <li><strong>District:</strong> District ${parseInt(congress.District, 10)}</li>
          ${congress.WEBSITE ? `<li><strong>More info:</strong> <a class="link" href="${congress.WEBSITE}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  const stateSections = [];
  const senate = districts.state_senate_district;
  if (senate) {
    stateSections.push(`
      <div class="ballot-card">
        <h4>Texas State Senator</h4>
        <ul>
          <li><strong>District:</strong> District ${parseInt(senate.District, 10)}</li>
          ${senate.WEBSITE ? `<li><strong>More info:</strong> <a class="link" href="${senate.WEBSITE}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  const house = districts.state_house_district;
  if (house) {
    stateSections.push(`
      <div class="ballot-card">
        <h4>Texas State Representative</h4>
        <ul>
          <li><strong>District:</strong> District ${parseInt(house.District, 10)}</li>
          ${house.WEBSITE ? `<li><strong>More info:</strong> <a class="link" href="${house.WEBSITE}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  const boe = districts.state_boe_district;
  if (boe) {
    stateSections.push(`
      <div class="ballot-card">
        <h4>State Board of Education</h4>
        <ul>
          <li><strong>District:</strong> District ${boe.District || 'Unknown'}</li>
          <li><strong>More info:</strong> <a class="link" href="https://tea.texas.gov/about-tea/leadership/state-board-of-education" target="_blank" rel="noopener">Visit website</a></li>
        </ul>
      </div>
    `);
  }

  if (stateSections.length > 0) {
    parts.push('<h3>State representatives</h3>');
    parts.push(stateSections.join(''));
  }

  const countySections = [];
  if (districts.commissioner_precinct) {
    countySections.push(`
      <div class="ballot-card">
        <h4>Bexar County Commissioner</h4>
        <ul>
          <li><strong>Precinct:</strong> Precinct ${districts.commissioner_precinct}</li>
          ${districts.commissioner_name ? `<li><strong>Current holder:</strong> ${districts.commissioner_name}</li>` : ''}
          ${districts.commissioner_website ? `<li><strong>More info:</strong> <a class="link" href="${districts.commissioner_website}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  if (districts.jp_precinct) {
    countySections.push(`
      <div class="ballot-card">
        <h4>Justice of the Peace</h4>
        <ul>
          <li><strong>Precinct:</strong> Precinct ${districts.jp_precinct}</li>
          ${districts.jp_judges ? `<li><strong>Current holder:</strong> ${districts.jp_judges}</li>` : ''}
          ${districts.jp_website ? `<li><strong>More info:</strong> <a class="link" href="${districts.jp_website}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  if (countySections.length > 0) {
    parts.push('<h3>County representatives</h3>');
    parts.push(countySections.join(''));
  }

  const council = districts.city_council_district;
  if (council) {
    parts.push(`
      <h3>Municipal representatives</h3>
      <div class="ballot-card">
        <h4>${council.City || 'City'} council member</h4>
        <ul>
          <li><strong>District:</strong> ${council.Dscption || 'Unknown'}</li>
          ${council.Name ? `<li><strong>Current holder:</strong> ${council.Name}</li>` : ''}
          ${council.Term ? `<li><strong>Term:</strong> ${council.Term}</li>` : ''}
          ${council.Phone ? `<li><strong>Phone:</strong> ${council.Phone}</li>` : ''}
          ${council.Website ? `<li><strong>More info:</strong> <a class="link" href="${council.Website}" target="_blank" rel="noopener">Visit website</a></li>` : ''}
        </ul>
      </div>
    `);
  }

  if (parts.length === 0) {
    return '<div class="panel panel--muted"><p>No representative information available.</p></div>';
  }

  return `<section class="stack-md"><h2>Your elected representatives</h2>${parts.join('')}</section>`;
}

// Ballot progress bar tracking
function initBallotProgress() {
  const progressBar = document.getElementById('ballotProgress');
  if (!progressBar) return;

  const progressFill = progressBar.querySelector('.ballot-progress__bar');
  let isTracking = false;

  function updateProgress() {
    const questions = document.querySelectorAll('.ballot-question');

    if (questions.length === 0) {
      progressBar.classList.remove('active');
      isTracking = false;
      return;
    }

    const firstQuestion = questions[0];
    const lastQuestion = questions[questions.length - 1];

    const firstRect = firstQuestion.getBoundingClientRect();
    const lastRect = lastQuestion.getBoundingClientRect();

    // Show progress bar when first question reaches viewport
    if (firstRect.top <= window.innerHeight) {
      if (!isTracking) {
        isTracking = true;
        progressBar.classList.add('active');
      }
    } else {
      // Hide if scrolled above first question
      progressBar.classList.remove('active');
      isTracking = false;
      return;
    }

    // Hide progress bar when scrolled past last question
    if (lastRect.bottom < 0) {
      progressBar.classList.remove('active');
      isTracking = false;
      return;
    }

    // Calculate progress based on scroll position through questions
    const scrollY = window.scrollY;

    // Get absolute positions from top of document
    const getAbsoluteTop = (el) => {
      let top = 0;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      return top;
    };

    const startY = getAbsoluteTop(firstQuestion);
    const endY = getAbsoluteTop(lastQuestion) + lastQuestion.offsetHeight;

    // Progress based on center of viewport
    const viewportCenter = scrollY + (window.innerHeight / 2);
    const totalDistance = endY - startY;
    const scrolledDistance = viewportCenter - startY;

    const progress = Math.max(0, Math.min(100, (scrolledDistance / totalDistance) * 100));
    progressFill.style.width = `${progress}%`;
  }

  let scrollTimeout;
  function handleScroll() {
    if (scrollTimeout) {
      cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = requestAnimationFrame(updateProgress);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });

  // Check on initial load and when results are rendered
  const observer = new MutationObserver(() => {
    updateProgress();
  });

  observer.observe(resultsEl, { childList: true, subtree: true });
}

form.addEventListener('submit', handleLookup);
setupAutocomplete();
ensureHtml2Canvas();
initBallotProgress();

// Handle callout dismiss
const dismissBtn = document.getElementById('dismissCallout');
const statusCallout = document.getElementById('statusCallout');
const pageHeader = document.querySelector('.page-header');
if (dismissBtn && statusCallout) {
  dismissBtn.addEventListener('click', () => {
    statusCallout.style.display = 'none';
    // Reduce bottom padding when callout is dismissed
    if (pageHeader) {
      pageHeader.style.paddingBottom = '16px';
    }
  });
}

// Phone warning modal
function showPhoneWarningModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById('phoneWarningModal');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    const overlay = modal.querySelector('.modal__overlay');

    if (!modal || !confirmBtn || !cancelBtn) {
      resolve(true);
      return;
    }

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    console.log('[Modal] Calculated scrollbar width:', scrollbarWidth, 'px');
    console.log('[Modal] window.innerWidth:', window.innerWidth);
    console.log('[Modal] document.documentElement.clientWidth:', document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    console.log('[Modal] Set CSS variable --scrollbar-width to:', scrollbarWidth, 'px');

    const closeModal = (confirmed) => {
      // Blur focused element to prevent accessibility warning
      if (document.activeElement) {
        document.activeElement.blur();
      }

      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      resolve(confirmed);
    };

    const handleConfirm = () => {
      closeModal(true);
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlay);
      document.removeEventListener('keydown', handleEscape);
    };

    const handleCancel = () => {
      closeModal(false);
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlay);
      document.removeEventListener('keydown', handleEscape);
    };

    const handleOverlay = () => {
      handleCancel();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlay);
    document.addEventListener('keydown', handleEscape);

    console.log('[Modal] Opening modal');
    console.log('[Modal] Body classes before open:', document.body.className);

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    console.log('[Modal] Modal classes after open:', modal.className);
    console.log('[Modal] Body classes after open:', document.body.className);

    cancelBtn.focus();
  });
}
