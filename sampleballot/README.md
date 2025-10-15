# Bexar County Voter Precinct Finder

A fast tool to find your voter precinct and elected representatives in Bexar County, Texas. This project reverse-engineers the Bexar County Precinct Finder using their official ArcGIS REST services.

## Features

- **Fast Precinct Lookup**: Quick initial load shows your voter precinct number (only 2 API calls)
- **Nearest Voting Locations**: Shows the 5 closest voting locations with distances
- **Google Maps Directions**: One-click button to get driving directions to any voting location
- **Address Autocomplete**: Real-time address suggestions as you type using Bexar County's geocoding service
- **Optional Representative Information**: View your elected representatives on demand including:
  - U.S. Congressional District
  - Texas State Senate District
  - Texas State House District
  - State Board of Education District
  - Bexar County Commissioner Precinct
  - Justice of the Peace Precinct
  - City Council District (if within city limits)
- **Performance Optimized**: Initial load only queries voter precinct, representatives loaded on request
- **Multiple Interfaces**: Command-line scripts and web interface with modern UX

## Installation

1. Make sure you have Python 3.7+ installed

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Command Line Tools

#### Basic Precinct Finder
Find precinct and district information for an address:

```bash
python bexar_precinct_finder.py
```

This will run example lookups and display the results.

#### Ballot Builder
Generate a sample ballot for an address:

```bash
python ballot_builder.py "100 Dolorosa St, San Antonio, TX 78205"
```

The command prints a formatted summary to the terminal. Add optional flags to export the data:

```bash
python ballot_builder.py "100 Dolorosa St, San Antonio, TX 78205" --json output/sample_ballot.json --html output/sample_ballot.html
```

Both `--json` and `--html` accept any file path; parent directories are created automatically. Use `--quiet` to suppress the text summary when you only need the exported files.

### Web Application

The voter-facing website is now a static single-page app that runs without a Python backend. You can:

- **Local preview:** open `index.html` directly in your browser or run a static file server (for example, `python -m http.server` from the project root) and visit `http://localhost:8000`.
- **Netlify deployment:** the repository includes a `netlify.toml` that publishes the project root. Connect the repo to Netlify, accept the default build command (`echo No build step`), and deploy. Netlify will serve `index.html` and all supporting assets.

The web interface provides a user-friendly form where voters can:
1. Start typing their address and get real-time autocomplete suggestions from Bexar County's database
2. Navigate suggestions with keyboard arrows or click to select
3. **Instantly view their voter precinct** (fast initial load)
4. **See their personalized ballot for November 4, 2025** with:
   - All 17 state constitutional amendment propositions
   - Bexar County propositions (A & B)
   - City-specific elections and propositions (if applicable)
   - School district elections and bond propositions (based on address)
   - Tax increase indicators clearly marked
5. **See the 5 nearest voting locations** with distances in miles and feet
6. **Click "Get Directions"** to open Google Maps with turn-by-turn directions from your address
7. **Optionally click to view their elected representatives** at federal, state, county, and municipal levels
8. Access links to more information about each representative/district

**Autocomplete Features:**
- Suggestions appear after typing 2+ characters
- Best results when you include house number + street name (e.g., "5106 Timb")
- Combines two geocoding strategies for comprehensive results
- Debounced for performance (300ms delay)
- Keyboard navigation with arrow keys
- Press Enter to select, Escape to close
- Click anywhere outside to dismiss suggestions
- Shows helpful tips when limited results are found

## How It Works

The tool uses Bexar County's official ArcGIS REST services:

1. **Address Suggest Service**: `https://maps.bexar.org/arcgis/rest/services/Locators/BeCoMultiRole/GeocodeServer/suggest`
   - Provides real-time address autocomplete suggestions
   - Returns up to 20 matching addresses as user types
   - Works best with house number + partial street name

2. **Geocoding Service**: `https://maps.bexar.org/arcgis/rest/services/Locators/BeCoMultiRole/GeocodeServer/findAddressCandidates`
   - Used for fuzzy matching with longer queries (4+ characters)
   - Provides additional candidates with match scores
   - Converts addresses to geographic coordinates

3. **Voter Precincts Layer**: `https://maps.bexar.org/arcgis/rest/services/EL/VoterPrecincts/MapServer/0`
   - Returns voter precinct number

4. **District Layers**: Various MapServer endpoints for:
   - Commissioner Precincts
   - Justice of the Peace Precincts
   - City Council Districts
   - State House Districts
   - State Senate Districts
   - U.S. Congressional Districts
   - State Board of Education Districts

## API Usage

### Python API

```python
from bexar_precinct_finder import BexarPrecinctFinder

finder = BexarPrecinctFinder()

# Get all district information
result = finder.find_all_districts("100 Dolorosa St, San Antonio, TX 78205")

print(f"Voter Precinct: {result['districts']['voter_precinct']}")
print(f"Commissioner: {result['districts']['commissioner_name']}")

# Find nearest voting locations
nearest = finder.find_nearest_voting_locations(
    address="100 Dolorosa St, San Antonio, TX 78205",
    limit=5
)

for loc in nearest:
    print(f"{loc['name']}: {loc['distance_miles']:.2f} miles")

# Or use coordinates directly
nearest = finder.find_nearest_voting_locations(x=2129697, y=13701775, limit=3)
```

### Generate Sample Ballot

```python
from ballot_builder import BallotBuilder

builder = BallotBuilder()

# Generate ballot
ballot = builder.generate_sample_ballot("Your Address Here")

# Get formatted text
text_output = builder.format_ballot_text(ballot)
print(text_output)

# Get HTML
html_output = builder.format_ballot_html(ballot)
```

## File Structure

- `bexar_precinct_finder.py` - Core functionality for address geocoding and district lookup
- `ballot_builder.py` - Sample ballot generation and formatting
- `tests/` - Lightweight data integrity checks
- `voting_locations.json` - Geocoded voting locations (49 locations)
- `locations.md` - Original markdown table of voting locations
- `parse_locations.py` - Script to parse and geocode locations.md
- `ballot_questions.json` - Structured ballot questions for November 4, 2025 election
- `questions.md` - Original OCR'd ballot questions
- `parse_questions.py` - Script to parse and structure ballot questions
- `requirements.txt` - Python dependencies
- `README.md` - This file

## Voting Locations Data

The `voting_locations.json` file contains 49 voting locations throughout Bexar County, each with:
- Name of the location
- Full address (street, city, state, ZIP)
- Geocoded coordinates in EPSG:2278 (Texas State Plane South Central)

To update the voting locations:
1. Edit `locations.md` with the new locations in markdown table format
2. Run `python parse_locations.py` to regenerate `voting_locations.json`
3. The script geocodes all addresses using Bexar County's official geocoding service

## Ballot Questions Data

The `ballot_questions.json` file contains all ballot measures for the November 4, 2025 election, organized by scope:

**Statewide (all voters):**
- 17 Texas Constitutional Amendment Propositions

**Countywide (all Bexar County voters):**
- 2 Bexar County Propositions (Coliseum/Arena funding)

**Jurisdiction-specific:**
- City Elections (Converse, Schertz, Windcrest)
- School District Elections (Boerne ISD, East Central ISD, Judson ISD, NEISD, SCUC ISD)
- Emergency Services District Elections (ESD No. 9)

Each question includes:
- Unique ID
- Proposition number
- Short title
- Full text
- Tax increase flag (if applicable)
- Voting options

To update ballot questions:
1. Edit `questions.md` with new ballot text
2. Update `parse_questions.py` with the structure
3. Run `python parse_questions.py` to regenerate `ballot_questions.json`

## Data Sources

All data is sourced from official Bexar County ArcGIS services:
- Bexar County Elections (Voter Precincts - 2013)
- Bexar County GIS Services
- Texas legislative district boundaries

## Limitations

- Addresses must be within Bexar County, Texas
- Geocoding accuracy depends on address formatting
- District information reflects official boundaries but may not reflect current vacancies or special elections
- This tool provides informational sample ballots only - official ballots may vary

## Disclaimer

This is an informational tool only. For official ballot information, voting locations, and election details, please visit:
- [Bexar County Elections Official Website](https://www.bexar.org/elections)
- [Texas Secretary of State](https://www.sos.texas.gov/)

## License

This project is for informational and civic engagement purposes. All data is sourced from public Bexar County government services.

## Contributing

To add features or fix issues:
1. The ArcGIS REST services are documented at: https://maps.bexar.org/arcgis/rest/services
2. Additional district layers can be added by following the pattern in `bexar_precinct_finder.py`
3. Ballot formatting can be customized in `ballot_builder.py`

## Technical Notes

### Coordinate System
Bexar County uses EPSG:2278 (Texas State Plane South Central, US Feet) for all spatial data.

### Geocoding
The BeCoMultiRole geocoder supports:
- Single line addresses
- Batch geocoding (up to 1000 addresses)
- Minimum match score: 75
- Multiple candidate returns

### REST API
All queries use standard ArcGIS REST API formats:
- Geometry queries for point-in-polygon operations
- JSON/GeoJSON output formats
- Support for attribute filtering and field selection
