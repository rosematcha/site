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
  usCongress: `${PRECINCT_BASE_URL}/USCongressDistricts/MapServer/0/query`,
  stateBoe: `${PRECINCT_BASE_URL}/TX_SBOE_Districts/MapServer/0/query`,
  schoolDistrict: `${PRECINCT_BASE_URL}/SchoolDistricts/MapServer/0/query`
};

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
let ballotViewMode = 'plain-arguments';

// Voting hours information
const VOTING_HOURS = {
  early_voting: [
    {
      dates: "Monday, October 20 - Friday, October 24",
      dates_es: "lunes, 20 de octubre a viernes, 24 de octubre",
      hours: "8:00 AM to 6:00 PM"
    },
    {
      dates: "Saturday, October 25",
      dates_es: "sábado, 25 de octubre",
      hours: "7:00 AM to 7:00 PM"
    },
    {
      dates: "Sunday, October 26",
      dates_es: "domingo, 26 de octubre",
      hours: "12:00 PM to 6:00 PM"
    },
    {
      dates: "Monday, October 27 - Friday, October 31",
      dates_es: "lunes, 27 de octubre a viernes, 31 de octubre",
      hours: "7:00 AM to 7:00 PM"
    }
  ],
  election_day: {
    date: "Tuesday, November 4, 2025",
    hours: "7:00 AM to 7:00 PM"
  }
};

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
    this.votingLocationsPromise = null;
    this.ballotQuestionsPromise = null;
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
      outSR: '2278',
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

  async queryDistrict(url, x, y, outFields = '*') {
    const params = {
      geometry: `${x},${y}`,
      geometryType: 'esriGeometryPoint',
      inSR: '2278',
      spatialRel: 'esriSpatialRelIntersects',
      outFields,
      returnGeometry: 'false'
    };

    const data = await this.fetchJson(url, params);
    if (data.features && data.features.length > 0) {
      return data.features[0].attributes || null;
    }
    return null;
  }

  async findAllDistricts(address) {
    const geocode = await this.geocodeAddress(address, 1);
    if (!geocode || geocode.x == null || geocode.y == null) {
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
      usCongress,
      stateBoe,
      schoolDistrict
    ] = await Promise.all([
      this.queryDistrict(ENDPOINTS.voterPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.commissionerPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.jpPrecinct, x, y),
      this.queryDistrict(ENDPOINTS.cityCouncil, x, y),
      this.queryDistrict(ENDPOINTS.stateHouse, x, y),
      this.queryDistrict(ENDPOINTS.stateSenate, x, y),
      this.queryDistrict(ENDPOINTS.usCongress, x, y),
      this.queryDistrict(ENDPOINTS.stateBoe, x, y),
      this.queryDistrict(ENDPOINTS.schoolDistrict, x, y)
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
        us_congress_district: usCongress || null,
        state_boe_district: stateBoe || null,
        school_district: schoolDistrict || null
      }
    };
  }

  async loadVotingLocations() {
    if (!this.votingLocationsPromise) {
      this.votingLocationsPromise = fetch('./voting_locations.json')
        .then(res => {
          if (!res.ok) {
            throw new Error('Unable to load voting locations');
          }
          return res.json();
        })
        .catch(err => {
          console.error(err);
          return [];
        });
    }
    return this.votingLocationsPromise;
  }

  async loadBallotQuestions() {
    if (!this.ballotQuestionsPromise) {
      this.ballotQuestionsPromise = fetch('./ballot_questions.json')
        .then(res => {
          if (!res.ok) {
            throw new Error('Unable to load ballot questions');
          }
          return res.json();
        })
        .catch(err => {
          console.error(err);
          return {};
        });
    }
    return this.ballotQuestionsPromise;
  }

  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  async findNearestVotingLocations(x, y, limit = 4) {
    const locations = await this.loadVotingLocations();
    if (!Array.isArray(locations) || locations.length === 0) {
      return [];
    }

    const enriched = locations
      .map(loc => {
        if (!loc.coordinates) return null;
        const distanceFeet = this.calculateDistance(x, y, loc.coordinates.x, loc.coordinates.y);
        return {
          ...loc,
          distance_feet: distanceFeet,
          distance_miles: distanceFeet / 5280
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance_feet - b.distance_feet);

    return enriched.slice(0, limit);
  }

  normalizeSchoolName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(' isd', '')
      .replace('independent school district', '')
      .replace('northeast', 'north east')
      .replace('northside', 'north side')
      .replace(/[^a-z\s]/g, '')
      .trim();
  }

  async getBallotQuestionsForLookup(lookup) {
    const ballotData = await this.loadBallotQuestions();
    const categories = Array.isArray(ballotData.categories) ? ballotData.categories : [];
    const city = lookup?.geocode?.city;
    const schoolDistrictName = lookup?.districts?.school_district?.NAME;

    const result = {
      election_name: ballotData.election_name,
      election_date: ballotData.election_date,
      city,
      school_district: schoolDistrictName,
      categories: []
    };

    categories.forEach(category => {
      if (category.scope === 'statewide' || category.scope === 'countywide') {
        result.categories.push(category);
      }
    });

    if (city) {
      const cityWords = city.toLowerCase().split(/\s+/);
      categories
        .filter(cat => cat.scope === 'municipal' && Array.isArray(cat.jurisdictions))
        .forEach(cat => {
          cat.jurisdictions.forEach(jurisdiction => {
            const jurisdictionWords = jurisdiction.name.toLowerCase().split(/\s+/);
            if (cityWords.some(word => jurisdictionWords.includes(word))) {
              result.categories.push({
                category: `${jurisdiction.name} - ${jurisdiction.type}`,
                scope: 'municipal',
                data: jurisdiction
              });
            }
          });
        });
    }

    if (schoolDistrictName) {
      const normalizedSchool = this.normalizeSchoolName(schoolDistrictName);
      categories
        .filter(cat => cat.scope === 'school_district' && Array.isArray(cat.jurisdictions))
        .forEach(cat => {
          cat.jurisdictions.forEach(jurisdiction => {
            const normalizedJurisdiction = this.normalizeSchoolName(jurisdiction.name);
            const schoolWords = normalizedSchool.split(' ').filter(w => w.length > 3);
            const jurisdictionWords = new Set(normalizedJurisdiction.split(' ').filter(w => w.length > 3));

            if (
              normalizedSchool === normalizedJurisdiction ||
              (schoolWords.length > 0 && schoolWords.every(word => jurisdictionWords.has(word)))
            ) {
              result.categories.push({
                category: `${jurisdiction.name} - ${jurisdiction.type}`,
                scope: 'school_district',
                data: jurisdiction
              });
            }
          });
        });
    }

    return result;
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
    resultsEl.setAttribute('aria-hidden', currentLookup ? 'false' : 'true');
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

    updateLoadingMessage('Loading ballot questions…');
    const ballotInfoPromise = finder.getBallotQuestionsForLookup(lookup);

    updateLoadingMessage('Finding nearest voting locations…');
    const nearestLocationsPromise = finder.findNearestVotingLocations(lookup.coordinates.x, lookup.coordinates.y, 4);

    const [ballotInfo, nearestLocations] = await Promise.all([
      ballotInfoPromise,
      nearestLocationsPromise
    ]);

    updateLoadingMessage('Preparing your results…');
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for UI update

    currentLookup = {
      address,
      lookup,
      ballotInfo,
      nearestLocations
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
    enableMockBallot();
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

function renderResults(state) {
  const { address, lookup, ballotInfo, nearestLocations } = state;
  const districts = lookup.districts;
  const precinct = districts.voter_precinct || 'Unknown';
  const cityCouncil = districts.city_council_district;

  const repsCallout = '';
  const repsSection = '';

  return `
    <article class="panel sample-ballot stack-lg">
      <header class="stack-sm">
        <h2>Your voter precinct</h2>
        <div class="ballot-info">
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Voter precinct:</strong> ${precinct}</p>
          ${districts.school_district ? `<p><strong>School district:</strong> ${districts.school_district.NAME}</p>` : ''}
          ${cityCouncil ? `<p><strong>City council district:</strong> ${cityCouncil.Dscption}</p>` : ''}
        </div>
      </header>
      ${renderBallot(ballotInfo)}
      ${renderLocations(address, nearestLocations)}
      ${repsCallout}
      ${repsSection}
      <footer class="disclaimer">
        <p><strong>Note:</strong> This tool is informational only. For official ballot materials and polling locations, visit <a href="https://www.bexar.org/elections" target="_blank" rel="noopener">Bexar County Elections</a>.</p>
      </footer>
    </article>
  `;
}

function renderBallot(ballotInfo) {
  if (!ballotInfo || !Array.isArray(ballotInfo.categories) || ballotInfo.categories.length === 0) {
    return '<section class="stack-sm"><h3>No ballot questions available for this address.</h3></section>';
  }

  const header = `
    <section class="ballot-header">
      <h2>Your ballot &ndash; ${ballotInfo.election_date || 'Upcoming election'}</h2>
      <p class="ballot-subtitle">Review the contests and questions that will appear on your ballot.</p>
      <div class="ballot-view-source-notice stack-xs">
        <small>
          <strong>Note:</strong> Plain-language summaries and pros/cons are sourced from the <a href="https://lwvsa.org/" target="_blank" rel="noopener">League of Women Voters</a>.
        </small>
      </div>
    </section>
  `;

  const viewToggle = `
    <div class="ballot-view-toggle" role="group" aria-label="Choose how ballot wording is displayed">
      <button type="button" class="ballot-view-toggle__button" data-view="plain-arguments" aria-pressed="false">Summary with pros &amp; cons</button>
      <button type="button" class="ballot-view-toggle__button" data-view="plain" aria-pressed="false">Plain-language summary</button>
      <button type="button" class="ballot-view-toggle__button" data-view="official" aria-pressed="false">Official wording</button>
    </div>
  `;

  const categoriesMarkup = ballotInfo.categories
    .map(category => renderBallotCategory(category))
    .join('');

  const actions = `
    <div id="ballot-actions" class="actions-bar">
      <button class="button" type="button" data-action="print-ballot">Print selections</button>
      <button class="button button--ghost" type="button" data-action="save-ballot">Save selections as image</button>
    </div>
  `;

  const viewAttr = escapeAttribute(ballotViewMode || 'official');

  return `${header}${viewToggle}<div class="stack-lg ballot-sections" id="ballot-sections" data-ballot-view="${viewAttr}">${categoriesMarkup}</div>${actions}`;
}

function renderBallotCategory(category) {
  const sectionTitle = category?.category || 'Ballot items';
  const sectionAttr = escapeAttribute(sectionTitle);

  if (category.questions) {
    return `
      <section class="stack-md ballot-section" data-section-title="${sectionAttr}">
        <h3>${sectionTitle}</h3>
        ${category.questions.map(renderQuestion).join('')}
      </section>
    `;
  }

  if (category.data) {
    const data = category.data;
    const racesHtml = Array.isArray(data.races)
      ? data.races
          .map(race => `
            <div class="ballot-card">
              <h4>${race.office}</h4>
              <ul>
                <li><strong>Vote for:</strong> ${race.vote_for}</li>
                ${Array.isArray(race.candidates) ? `<li><strong>Candidates:</strong><div class="choice-group">${race.candidates.map(c => `<span class="pill">${c}</span>`).join('')}</div></li>` : ''}
              </ul>
            </div>
          `)
          .join('')
      : '';

    const questionsHtml = Array.isArray(data.questions)
      ? data.questions.map(renderQuestion).join('')
      : '';

    return `
      <section class="stack-md ballot-section" data-section-title="${sectionAttr}">
        <h3>${sectionTitle}</h3>
        ${racesHtml}
        ${questionsHtml}
      </section>
    `;
  }

  return '';
}

function renderQuestion(question) {
  const options = Array.isArray(question.options) ? question.options.join(' / ') : '';
  const questionName = question.number ? `Proposition ${question.number}` : (question.title || 'Ballot question');
  const questionAttr = escapeAttribute(questionName);
  const optionsAttr = escapeAttribute(options);
  const officialContent = question.text
    ? `<p>${escapeHtml(question.text)}</p>`
    : '<p class="ballot-question__empty">Official ballot language not available.</p>';

  const plainSummaryContent = question.plain_language
    ? `<p>${escapeHtml(question.plain_language)}</p>`
    : '';
  const plainSummaryFallback = '<p class="ballot-question__empty">Plain-language summary not available.</p>';
  const plainSummaryView = plainSummaryContent || plainSummaryFallback;

  const argumentsFor = Array.isArray(question.arguments_for) ? question.arguments_for.filter(Boolean) : [];
  const argumentsAgainst = Array.isArray(question.arguments_against) ? question.arguments_against.filter(Boolean) : [];

  const argumentsForMarkup = argumentsFor.length
    ? `<div class="ballot-question__arguments"><h5>Why supporters say yes</h5><ul>${argumentsFor.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
    : '';

  const argumentsAgainstMarkup = argumentsAgainst.length
    ? `<div class="ballot-question__arguments"><h5>Why opponents say no</h5><ul>${argumentsAgainst.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
    : '';

  const hasArguments = Boolean(argumentsFor.length || argumentsAgainst.length);

  const plainWithArgumentsPieces = [];
  plainWithArgumentsPieces.push(plainSummaryContent || plainSummaryFallback);
  if (argumentsForMarkup) {
    plainWithArgumentsPieces.push(argumentsForMarkup);
  }
  if (argumentsAgainstMarkup) {
    plainWithArgumentsPieces.push(argumentsAgainstMarkup);
  }
  if (!hasArguments) {
    plainWithArgumentsPieces.push('<p class="ballot-question__empty">No pros or cons have been provided.</p>');
  }
  const plainWithArgumentsView = plainWithArgumentsPieces.join('');

  const labelMarkup = question.number
    ? `<span class="ballot-question__label">${escapeHtml(`Proposition ${question.number}`)}</span>`
    : '';
  const heading = question.title ? question.title : questionName;
  const safeHeading = escapeHtml(heading);
  const safeOptions = escapeHtml(options);
  const choiceMarkup = safeOptions
    ? `<ul class="ballot-question__choices" aria-label="Available choices"><li><strong>Your Vote:</strong> ${safeOptions}</li></ul>`
    : '';

  return `
    <article class="ballot-question" data-question-label="${questionAttr}" data-options="${optionsAttr}">
      <header class="ballot-question__header stack-xs">
        <div class="ballot-question__meta">
          ${labelMarkup}
        </div>
        <h4 class="ballot-question__title">${safeHeading}</h4>
      </header>
      <div class="ballot-question__body stack-sm">
        <div class="ballot-question__view" data-view-section="official">${officialContent}</div>
        <div class="ballot-question__view" data-view-section="plain">${plainSummaryView}</div>
        <div class="ballot-question__view" data-view-section="plain-arguments">${plainWithArgumentsView}</div>
        ${choiceMarkup}
      </div>
    </article>
  `;
}

function renderVotingHours() {
  const earlyVotingPeriods = VOTING_HOURS.early_voting
    .map(period => `
      <div class="voting-period">
        <div class="voting-period__dates">
          <div class="voting-period__dates-primary">${escapeHtml(period.dates)}</div>
        </div>
        <div class="voting-period__hours">${escapeHtml(period.hours)}</div>
      </div>
    `)
    .join('');

  return `
    <div class="voting-hours stack-sm">
      <div class="voting-hours__group">
        <h4>Early voting</h4>
        <div class="voting-periods">
          ${earlyVotingPeriods}
        </div>
      </div>

      <div class="voting-hours__group">
        <h4>Election day</h4>
        <div class="voting-periods">
          <div class="voting-period voting-period--election-day">
            <div class="voting-period__dates">
              <div class="voting-period__dates-primary">${escapeHtml(VOTING_HOURS.election_day.date)}</div>
            </div>
            <div class="voting-period__hours">${escapeHtml(VOTING_HOURS.election_day.hours)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLocations(address, locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return '';
  }

  const items = locations
    .map((loc, index) => {
      const origin = encodeURIComponent(address);
      const destination = encodeURIComponent(loc.full_address);
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      const milesValue = Number.isFinite(loc.distance_miles) ? loc.distance_miles : 0;
      const milesText = milesValue.toFixed(2);
      const feetText = Math.round(loc.distance_feet).toString();
      const distanceText = milesValue < 0.1 ? `${milesText} miles (${feetText} feet)` : `${milesText} miles`;
      const isPrimary = index === 0;
      const cardClass = isPrimary ? 'location-card location-card--primary' : 'location-card location-card--secondary';
      const buttonClass = isPrimary ? 'button location-card__cta' : 'button button--ghost location-card__cta';
      const badgeMarkup = isPrimary ? '<span class="location-card__badge">Closest match</span>' : '';
      const rankLabel = `#${index + 1}`;
      const safeName = escapeHtml(loc.name || `Location ${index + 1}`);
      const safeAddress = escapeHtml(loc.full_address || 'Address unavailable');
      const safeDistance = escapeHtml(distanceText);

      return `
        <article class="${cardClass}" data-rank="${rankLabel}">
          <header class="location-card__header">
            <div class="location-card__title">
              <span class="location-card__rank" aria-hidden="true">${rankLabel}</span>
              ${badgeMarkup}
              <h4>${safeName}</h4>
            </div>
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="${buttonClass}">Open directions</a>
          </header>
          <ul class="location-card__meta">
            <li><strong>Address:</strong> ${safeAddress}</li>
            <li><strong>Distance:</strong> ${safeDistance}</li>
          </ul>
        </article>
      `;
    })
    .join('');

  const primaryLocation = locations.length > 0 ? locations[0] : null;
  const secondaryLocations = locations.slice(1);

  const primaryMarkup = primaryLocation ? renderSingleLocation(primaryLocation, 0, address, true) : '';
  const secondaryMarkup = secondaryLocations.map((loc, idx) => renderSingleLocation(loc, idx + 1, address, false)).join('');

  const locationsSection = `
    <section class="stack-md location-section">
      <h3>Nearest voting locations</h3>
      ${primaryMarkup}
      ${secondaryLocations.length > 0 ? `<div class="location-list-secondary">${secondaryMarkup}</div>` : ''}
    </section>
  `;

  const hoursSection = `
    <section class="stack-md voting-hours-section">
      <h3>Voting hours</h3>
      ${renderVotingHours()}
    </section>
  `;

  return locationsSection + hoursSection;
}

function renderSingleLocation(loc, index, address, isPrimary) {
  const origin = encodeURIComponent(address);
  const destination = encodeURIComponent(loc.full_address);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  const milesValue = Number.isFinite(loc.distance_miles) ? loc.distance_miles : 0;
  const milesText = milesValue.toFixed(2);
  const feetText = Math.round(loc.distance_feet).toString();
  const distanceText = milesValue < 0.1 ? `${milesText} miles (${feetText} feet)` : `${milesText} miles`;
  const cardClass = isPrimary ? 'location-card location-card--primary' : 'location-card location-card--secondary';
  const buttonClass = isPrimary ? 'button location-card__cta' : 'button button--ghost location-card__cta';
  const badgeMarkup = isPrimary ? '<span class="location-card__badge">Closest match</span>' : '';
  const rankLabel = `#${index + 1}`;
  const safeName = escapeHtml(loc.name || `Location ${index + 1}`);

  // Extract just the street address (before the first comma)
  const fullAddress = loc.full_address || 'Address unavailable';
  const streetAddress = fullAddress.split(',')[0].trim();
  const safeAddress = escapeHtml(streetAddress);
  const safeDistance = escapeHtml(distanceText);

  return `
    <article class="${cardClass}" data-rank="${rankLabel}">
      <header class="location-card__header">
        <div class="location-card__title">
          <span class="location-card__rank" aria-hidden="true">${rankLabel}</span>
          ${badgeMarkup}
          <h4>${safeName}</h4>
        </div>
        <a href="${mapsUrl}" target="_blank" rel="noopener" class="${buttonClass}">Open directions</a>
      </header>
      <ul class="location-card__meta">
        <li><strong>Address:</strong> ${safeAddress}</li>
        <li><strong>Distance:</strong> ${safeDistance}</li>
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

function enableMockBallot() {
  document.querySelectorAll('.ballot-question').forEach(card => {
    const voteLi = Array.from(card.querySelectorAll('li')).find(li => /Your Vote:/i.test(li.textContent));
    if (!voteLi) return;

    const text = voteLi.textContent.replace(/Your Vote:/i, '').trim();
    if (!text.includes('/')) return;

    const options = text.split('/').map(opt => opt.trim()).filter(Boolean);
    if (options.length === 0) return;

    const inputName = `mock_${Math.random().toString(36).slice(2)}`;
    const inputs = options
      .map(option => `
        <label class="choice-option">
          <input type="radio" name="${inputName}" value="${option}">
          <span>${option}</span>
        </label>
      `)
      .join('');

    voteLi.innerHTML = `<strong>Your Vote:</strong> <div class="choice-group">${inputs}</div>`;

    card.dataset.vote = card.dataset.vote || '';

    const radioInputs = voteLi.querySelectorAll('input[type="radio"]');
    const savedVote = card.dataset.vote;

    radioInputs.forEach(input => {
      if (savedVote && input.value === savedVote) {
        input.checked = true;
      }

      if (!input.dataset.bound) {
        input.addEventListener('change', () => {
          card.dataset.vote = input.value;
        });
        input.dataset.bound = 'true';
      }
    });
  });
}

function getVoteFromCard(card) {
  if (!card) return '';

  const stored = (card.dataset.vote || '').trim();
  if (stored) {
    return stored;
  }

  const checked = card.querySelector('input[type="radio"]:checked');
  if (checked) {
    const labelEl = checked.closest('label');
    if (labelEl) {
      return labelEl.textContent.trim();
    }
    return checked.value.trim();
  }

  return '';
}

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
          if (/\bfor\b.*\bagainst\b/i.test(vote) || /\bagainst\b.*\bfor\b/i.test(vote)) {
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
    vote.style.flex = '0 0 80px';
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
    .print-vote { font-weight: 600; color: #1f2937; flex: 0 0 80px; text-align: right; }
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
