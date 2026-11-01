// Turns the county's generic sample ballot PDF into structured contests.
// The PDF is three bilingual columns; we keep the English and drop the Spanish.
import { execFileSync } from 'node:child_process';

const COLUMN_GAP = 6;
const FOOTER_HEIGHT = 14;
const LINE_TOLERANCE = 3.2;
const OVAL = /^[⬬⬭⬮⬯]/u;
const PARTY = /^(REP|DEM|LIB|GRN|IND)$/;
const VOTE_FOR = /^vote for\b/i;
const ELECTION_HEADING = /^(.*?)\s*[-–—]\s+((?:[\w,]+ )*Election)$/;
const TIER_HEADINGS = new Map([
  ['FEDERAL', { type: 'federal', name: 'Federal' }],
  ['STATE', { type: 'state', name: 'State' }],
  ['COUNTY', { type: 'county', name: 'County' }]
]);

const decodeEntities = text =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export function readPdfPages(pdfPath) {
  const xml = execFileSync('pdftotext', ['-bbox', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  return xml
    .split('<page ')
    .slice(1)
    .map(chunk => ({ words: parseWords(chunk) }));
}

function parseWords(chunk) {
  const pattern = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)<\/word>/g;
  return [...chunk.matchAll(pattern)].map(([, x0, y0, x1, y1, text]) => ({
    x0: Number(x0),
    y0: Number(y0),
    x1: Number(x1),
    y1: Number(y1),
    text: decodeEntities(text)
  }));
}

// Columns come from the empty vertical gutters. The title block that spans page
// one is removed before this runs.
export function splitColumns(words) {
  const bottom = Math.max(...words.map(word => word.y1));
  const body = words.filter(word => word.y1 < bottom - FOOTER_HEIGHT);
  const edges = findColumnEdges(body);
  const columns = edges.map(() => []);
  for (const word of body) {
    const index = edges.findIndex(edge => (word.x0 + word.x1) / 2 < edge);
    columns[index].push(word);
  }
  return columns;
}

function findColumnEdges(words) {
  const sorted = [...words].sort((a, b) => a.x0 - b.x0);
  const edges = [];
  let right = -Infinity;
  for (const word of sorted) {
    if (right !== -Infinity && word.x0 > right + COLUMN_GAP) edges.push((right + word.x0) / 2);
    right = Math.max(right, word.x1);
  }
  edges.push(Infinity);
  return edges;
}

// Oval glyphs sit lower than the text beside them, so rows match on word centers.
const centerY = word => (word.y0 + word.y1) / 2;

export function toLines(words) {
  const sorted = [...words].sort((a, b) => centerY(a) - centerY(b) || a.x0 - b.x0);
  const rows = [];
  for (const word of sorted) {
    const row = rows.at(-1);
    if (row && Math.abs(centerY(word) - row.y) <= LINE_TOLERANCE) {
      row.words.push(word);
    } else {
      rows.push({ y: centerY(word), words: [word] });
    }
  }
  return rows.map(row =>
    row.words
      .sort((a, b) => a.x0 - b.x0)
      .map(word => word.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

const parenBalance = line => (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;

const quoteMarks = line => (line.match(/["\u201C\u201D]/g) || []).length;

// Removes parenthesized Spanish, which can wrap over several lines. A line inside
// an open English quote is measure wording, even if it starts with "(20) years".
export function dropSpanish(lines) {
  const kept = [];
  let depth = 0;
  let inQuote = false;
  for (const line of lines) {
    if (depth > 0 || (line.startsWith('(') && !inQuote)) {
      depth = Math.max(0, depth + parenBalance(line));
      continue;
    }
    if (quoteMarks(line) % 2 === 1) inQuote = !inQuote;
    kept.push(line);
  }
  return kept;
}

const isChoice = line => OVAL.test(line);
const stripSpanishSuffix = text => text.replace(/\s*\((?:[^()]*)\)\s*$/, '').trim();

function parseChoice(line) {
  const raw = line.replace(OVAL, '').trim();
  if (/^_+/.test(raw) || raw === '') return { writeIn: true };
  const words = raw.split(' ');
  const last = words.at(-1);
  if (PARTY.test(last)) {
    return { name: words.slice(0, -1).join(' '), party: last };
  }
  return { name: stripSpanishSuffix(raw), party: null };
}

function normalizeOption(name) {
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

const slug = text =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const DISTRICT_RULES = [
  [/^(?:For )?United States Representative,? District (?:No\. )?(\d+)/i, 'us_house'],
  [/^(?:For )?State Senator,? District (?:No\. )?(\d+)/i, 'state_senate'],
  [/^(?:For )?State Representative,? District (?:No\. )?(\d+)/i, 'state_house'],
  [/^(?:For )?Member,? State Board of Education,? District (?:No\. )?(\d+)/i, 'sboe'],
  [/^(?:For )?County Commissioner,? (?:Precinct|Pct\.?) (?:No\. )?(\d+)/i, 'commissioner'],
  [/^(?:For )?Justice of the Peace,? (?:Precinct|Pct\.?) (?:No\. )?(\d+)/i, 'jp'],
  [/^(?:For )?Constable,? (?:Precinct|Pct\.?) (?:No\. )?(\d+)/i, 'constable'],
  // Any other numbered district can't be checked against an address.
  [/\b(?:District|Precinct|Pct\.?) (?:No\. )?(\d+)/i, 'local_district']
];

export function officeDistrict(office) {
  for (const [pattern, type] of DISTRICT_RULES) {
    const match = office.match(pattern);
    if (match) return { type, number: Number(match[1]) };
  }
  return null;
}

// Decides who sees a section. Anything we cannot place is marked "special"
// and is shown as "only if you live in it", never silently dropped.
export function classifyJurisdiction(name) {
  const city = name.match(/^(?:City|Town|Village) of (.+)$/i);
  if (city) return { type: 'city', name: city[1].trim() };
  if (/independent school district|\bISD\b/i.test(name)) return { type: 'school', name };
  if (/^Bexar County$/i.test(name)) return { type: 'county', name };
  if (/^bexar (?:central )?appraisal district/i.test(name)) return { type: 'county', name };
  return { type: 'special', name };
}

function readHeading(lines, start) {
  if (isChoice(lines[start]) || VOTE_FOR.test(lines[start])) return null;
  const single = lines[start].match(ELECTION_HEADING);
  if (single) return { name: single[1], consumed: 1 };
  const joined = `${lines[start]} ${lines[start + 1] ?? ''}`.trim();
  const double = joined.match(ELECTION_HEADING);
  if (double && !isChoice(lines[start + 1] ?? '')) return { name: double[1], consumed: 2 };
  const triple = `${joined} ${lines[start + 2] ?? ''}`.trim().match(ELECTION_HEADING);
  if (triple && !isChoice(lines[start + 2] ?? '')) return { name: triple[1], consumed: 3 };
  return null;
}

function readRace(lines, start, office) {
  const candidates = [];
  let writeIn = false;
  let index = start;
  while (index < lines.length && !VOTE_FOR.test(lines[index]) && !isChoice(lines[index])) index += 1;
  const voteFor = VOTE_FOR.test(lines[index] ?? '') ? lines[index] : 'Vote for none or one';
  if (VOTE_FOR.test(lines[index] ?? '')) index += 1;
  while (index < lines.length) {
    const line = lines[index];
    if (isChoice(line)) {
      const choice = parseChoice(line);
      if (choice.writeIn) writeIn = true;
      else candidates.push(choice);
      index += 1;
    } else if (/^write-in/i.test(line) || /^_{3,}/.test(line)) {
      writeIn = true;
      index += 1;
    } else if (PARTY.test(line) && candidates.length > 0 && !candidates.at(-1).party) {
      candidates.at(-1).party = line;
      index += 1;
    } else {
      break;
    }
  }
  return {
    item: {
      kind: 'race',
      id: slug(office),
      office,
      vote_for: voteFor,
      district: officeDistrict(office),
      candidates,
      write_in: writeIn
    },
    next: index
  };
}

// Measure wording is quoted. Anything after the closing quote is an unparenthesized
// Spanish heading, not part of the measure.
function measureText(body) {
  const text = body.join(' ').replace(/\s+/g, ' ').trim();
  const close = Math.max(text.lastIndexOf('"'), text.lastIndexOf('\u201D'));
  return /^["\u201C]/.test(text) && close > 0 ? text.slice(0, close + 1) : text;
}

function readQuestion(titleLines, lines, start) {
  const body = [];
  let index = start;
  while (index < lines.length && !isChoice(lines[index])) {
    body.push(lines[index]);
    index += 1;
  }
  const options = [];
  while (index < lines.length && isChoice(lines[index])) {
    options.push(normalizeOption(parseChoice(lines[index]).name ?? ''));
    index += 1;
  }
  const title = titleLines.join(' ').replace(/\s+/g, ' ').trim();
  return {
    item: { kind: 'question', id: slug(title), title, text: measureText(body), options },
    next: index
  };
}

const startsQuotedText = line => /^["“]/.test(line);
const looksLikeHeadingEnd = (lines, index) => Boolean(readHeading(lines, index));

// A contest title runs until "Vote for", a quoted proposition, or a choice.
function readTitle(lines, start) {
  const title = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (VOTE_FOR.test(line) || isChoice(line) || startsQuotedText(line)) break;
    if (index > start && looksLikeHeadingEnd(lines, index)) break;
    title.push(line);
    index += 1;
  }
  return { title, next: index };
}

function newSection(title, jurisdiction) {
  return { title, jurisdiction, items: [] };
}

function parseContestAt(lines, index) {
  const { title, next } = readTitle(lines, index);
  const line = lines[next] ?? '';
  if (VOTE_FOR.test(line)) return readRace(lines, next, title.join(' '));
  if (isChoice(line) && title.length > 0) {
    const looksLikeMeasure = /^(for|against|yes|no)\b/i.test(line.replace(OVAL, '').trim());
    return looksLikeMeasure ? readQuestion(title, lines, next) : readRace(lines, next, title.join(' '));
  }
  return readQuestion(title, lines, next);
}

// Parties are read from a legend at the top of page one; it is not a contest.
function skipPreamble(lines) {
  const first = lines.findIndex(line => TIER_HEADINGS.has(line));
  return first === -1 ? lines : lines.slice(first);
}

export function parseLines(rawLines) {
  const lines = skipPreamble(rawLines);
  const sections = [];
  let current = null;
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (TIER_HEADINGS.has(line)) {
      const tier = TIER_HEADINGS.get(line);
      current = newSection(tier.name, tier);
      sections.push(current);
      index += 1;
      continue;
    }
    const heading = readHeading(lines, index);
    if (heading) {
      current = newSection(heading.name, classifyJurisdiction(heading.name));
      sections.push(current);
      index += heading.consumed;
      continue;
    }
    const { item, next } = parseContestAt(lines, index);
    if (current) current.items.push(item);
    index = Math.max(next, index + 1);
  }
  return finalizeSections(sections);
}

// A city or district can have several elections on one ballot. Voters see one
// section per jurisdiction, with ids that stay stable between runs.
function finalizeSections(sections) {
  const merged = new Map();
  for (const section of sections) {
    const existing = merged.get(section.title);
    if (existing) existing.items.push(...section.items);
    else merged.set(section.title, section);
  }
  return [...merged.values()]
    .filter(section => section.items.length > 0)
    .map(section => ({ ...section, id: slug(section.title), items: withUniqueIds(section) }));
}

function withUniqueIds(section) {
  const seen = new Map();
  return section.items.map(item => {
    const count = (seen.get(item.id) ?? 0) + 1;
    seen.set(item.id, count);
    const base = `${slug(section.title)}__${item.id}`;
    return { ...item, id: count === 1 ? base : `${base}_${count}` };
  });
}

const ELECTION_DATE = /\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})\b/;

export function readHeader(pages) {
  const lines = toLines(pages[0].words.filter(word => word.y0 < 90));
  const dateLine = lines.find(line => ELECTION_DATE.test(line)) ?? '';
  const [, month, day, year] = dateLine.match(ELECTION_DATE) ?? [];
  const name = dropSpanish(lines).find(line => /election/i.test(line)) ?? '';
  const iso = month ? new Date(`${month} ${day}, ${year} 12:00 UTC`).toISOString().slice(0, 10) : null;
  return { election_name: stripSpanishSuffix(name), election_date: iso };
}

// Page one opens with a title and instructions spanning the page. Contests begin
// at the party legend.
function dropTitleBlock(words) {
  const legend = words.find(word => word.text === 'Legend');
  return legend ? words.filter(word => word.y0 >= legend.y0 - 1) : words;
}

export function countOvals(pages) {
  return pages.reduce(
    (total, page, index) =>
      total + (index === 0 ? dropTitleBlock(page.words) : page.words).filter(word => OVAL.test(word.text)).length,
    0
  );
}

export function parseBallotPdf(pdfPath) {
  const pages = readPdfPages(pdfPath);
  const lines = pages.flatMap((page, index) =>
    splitColumns(index === 0 ? dropTitleBlock(page.words) : page.words).flatMap(column =>
      dropSpanish(toLines(column))
    )
  );
  return { ...readHeader(pages), sections: parseLines(lines), oval_count: countOvals(pages) };
}
