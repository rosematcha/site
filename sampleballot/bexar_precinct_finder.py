"""
Bexar County Precinct and District Finder
Reverse-engineered from https://maps.bexar.org/PrecinctFinder/

This script uses Bexar County's ArcGIS REST services to:
1. Geocode an address
2. Find the voter precinct
3. Find all relevant districts (Commissioner, JP, State House, State Senate, US Congress, etc.)
"""

import requests
import json
import math
import os
from typing import Dict, Optional, Tuple, List
from urllib.parse import urlencode


class BexarPrecinctFinder:
    """Find precinct and district information for Bexar County addresses."""

    BASE_URL = "https://maps.bexar.org/arcgis/rest/services"

    # Service endpoints
    GEOCODER_URL = f"{BASE_URL}/Locators/BeCoMultiRole/GeocodeServer/findAddressCandidates"
    VOTER_PRECINCTS_URL = f"{BASE_URL}/EL/VoterPrecincts/MapServer/0/query"
    COMMISSIONER_PRECINCTS_URL = f"{BASE_URL}/CommissionerPrecincts/MapServer/0/query"
    JP_PRECINCTS_URL = f"{BASE_URL}/JusticeofthePeace/MapServer/1/query"
    CITY_COUNCIL_URL = f"{BASE_URL}/CityCouncilDistricts/MapServer/0/query"
    STATE_HOUSE_URL = f"{BASE_URL}/TXHouseRepDistricts/MapServer/0/query"
    STATE_SENATE_URL = f"{BASE_URL}/TXSenateDistrictsBexar/MapServer/0/query"
    US_CONGRESS_URL = f"{BASE_URL}/USCongressDistricts/MapServer/0/query"
    STATE_BOE_URL = f"{BASE_URL}/TX_SBOE_Districts/MapServer/0/query"
    SCHOOL_DISTRICTS_URL = f"{BASE_URL}/SchoolDistricts/MapServer/0/query"

    def __init__(self):
        self.session = requests.Session()
        self._voting_locations = None
        self._ballot_questions = None

    def _load_voting_locations(self) -> List[Dict]:
        """Load voting locations from JSON file (lazy loading)."""
        if self._voting_locations is None:
            locations_file = os.path.join(
                os.path.dirname(__file__),
                'voting_locations.json'
            )
            try:
                with open(locations_file, 'r', encoding='utf-8') as f:
                    self._voting_locations = json.load(f)
            except FileNotFoundError:
                print(f"Warning: {locations_file} not found")
                self._voting_locations = []
        return self._voting_locations

    @staticmethod
    def calculate_distance(x1: float, y1: float, x2: float, y2: float) -> float:
        """
        Calculate Euclidean distance between two points in feet.

        Since we're using EPSG:2278 (Texas State Plane South Central),
        coordinates are in US Survey Feet, so distance is also in feet.

        Args:
            x1, y1: Coordinates of first point
            x2, y2: Coordinates of second point

        Returns:
            Distance in feet
        """
        return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

    def find_nearest_voting_locations(
        self,
        address: Optional[str] = None,
        x: Optional[float] = None,
        y: Optional[float] = None,
        limit: int = 5
    ) -> List[Dict]:
        """
        Find the nearest voting locations to a given address or coordinates.

        Args:
            address: Address to search from (will be geocoded)
            x, y: Coordinates in EPSG:2278 (alternative to address)
            limit: Maximum number of locations to return

        Returns:
            List of voting locations sorted by distance, each containing:
            - All location info (name, address, etc.)
            - distance_feet: Distance in feet
            - distance_miles: Distance in miles

        Examples:
            # By address
            finder.find_nearest_voting_locations("100 Dolorosa St, San Antonio, TX")

            # By coordinates
            finder.find_nearest_voting_locations(x=2129697, y=13701775)
        """
        # Get coordinates
        if x is None or y is None:
            if not address:
                raise ValueError("Must provide either address or (x, y) coordinates")
            coords = self.geocode_address(address)
            if not coords:
                return []
            x, y = coords

        # Load voting locations
        locations = self._load_voting_locations()
        if not locations:
            return []

        # Calculate distances
        results = []
        for loc in locations:
            if 'coordinates' not in loc:
                continue

            loc_x = loc['coordinates']['x']
            loc_y = loc['coordinates']['y']

            distance_feet = self.calculate_distance(x, y, loc_x, loc_y)
            distance_miles = distance_feet / 5280  # Convert feet to miles

            result = loc.copy()
            result['distance_feet'] = distance_feet
            result['distance_miles'] = distance_miles

            results.append(result)

        # Sort by distance
        results.sort(key=lambda r: r['distance_feet'])

        # Return limited results
        return results[:limit]

    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address using Bexar County's geocoding service.

        Args:
            address: Full address string (e.g., "100 Dolorosa St, San Antonio, TX 78205")

        Returns:
            Tuple of (x, y) coordinates in the local coordinate system (EPSG:2278)
            Returns None if geocoding fails
        """
        params = {
            'SingleLine': address,
            'f': 'json',
            'outSR': '2278',  # Bexar County uses EPSG:2278 (Texas State Plane South Central)
            'maxLocations': 1
        }

        try:
            response = self.session.get(self.GEOCODER_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get('candidates') and len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                location = candidate.get('location')
                if location:
                    return (location['x'], location['y'])

            return None
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None

    def query_district(self, url: str, x: float, y: float,
                      out_fields: str = "*") -> Optional[Dict]:
        """
        Query a district layer using coordinates.

        Args:
            url: ArcGIS REST service URL
            x: X coordinate (in EPSG:2278)
            y: Y coordinate (in EPSG:2278)
            out_fields: Fields to return (default: all fields)

        Returns:
            Dictionary with district information, or None if not found
        """
        params = {
            'geometry': f'{x},{y}',
            'geometryType': 'esriGeometryPoint',
            'inSR': '2278',
            'spatialRel': 'esriSpatialRelIntersects',
            'outFields': out_fields,
            'returnGeometry': 'false',
            'f': 'json'
        }

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get('features') and len(data['features']) > 0:
                return data['features'][0].get('attributes', {})

            return None
        except Exception as e:
            print(f"District query error for {url}: {e}")
            return None

    def find_all_districts(self, address: str) -> Optional[Dict]:
        """
        Find all district information for a given address.

        Args:
            address: Full address string

        Returns:
            Dictionary containing all district information and coordinates
        """
        # Step 1: Geocode the address
        coords = self.geocode_address(address)
        if not coords:
            return None

        x, y = coords

        # Step 2: Query all district layers
        result = {
            'address': address,
            'coordinates': {'x': x, 'y': y},
            'districts': {}
        }

        # Voter Precinct
        voter_precinct = self.query_district(self.VOTER_PRECINCTS_URL, x, y)
        if voter_precinct:
            result['districts']['voter_precinct'] = voter_precinct.get('NAME')

        # Commissioner Precinct
        commissioner = self.query_district(self.COMMISSIONER_PRECINCTS_URL, x, y)
        if commissioner:
            result['districts']['commissioner_precinct'] = commissioner.get('Comm')
            result['districts']['commissioner_name'] = commissioner.get('ComName')
            result['districts']['commissioner_website'] = commissioner.get('Website')

        # Justice of the Peace Precinct
        jp = self.query_district(self.JP_PRECINCTS_URL, x, y)
        if jp:
            result['districts']['jp_precinct'] = jp.get('Precinct')
            result['districts']['jp_judges'] = jp.get('Judges')
            result['districts']['jp_website'] = jp.get('WEBSITE')

        # City Council District (may be None if outside city limits)
        city_council = self.query_district(self.CITY_COUNCIL_URL, x, y)
        if city_council:
            result['districts']['city_council_district'] = city_council

        # State House District
        state_house = self.query_district(self.STATE_HOUSE_URL, x, y)
        if state_house:
            result['districts']['state_house_district'] = state_house

        # State Senate District
        state_senate = self.query_district(self.STATE_SENATE_URL, x, y)
        if state_senate:
            result['districts']['state_senate_district'] = state_senate

        # US Congress District
        us_congress = self.query_district(self.US_CONGRESS_URL, x, y)
        if us_congress:
            result['districts']['us_congress_district'] = us_congress

        # State Board of Education District
        state_boe = self.query_district(self.STATE_BOE_URL, x, y)
        if state_boe:
            result['districts']['state_boe_district'] = state_boe

        # School District
        school_district = self.query_district(self.SCHOOL_DISTRICTS_URL, x, y)
        if school_district:
            result['districts']['school_district'] = school_district

        return result

    def _load_ballot_questions(self) -> Dict:
        """Load ballot questions from JSON file (lazy loading)."""
        if self._ballot_questions is None:
            questions_file = os.path.join(
                os.path.dirname(__file__),
                'ballot_questions.json'
            )
            try:
                with open(questions_file, 'r', encoding='utf-8') as f:
                    self._ballot_questions = json.load(f)
            except FileNotFoundError:
                print(f"Warning: {questions_file} not found")
                self._ballot_questions = {}
        return self._ballot_questions

    def get_ballot_questions_for_address(
        self,
        address: Optional[str] = None,
        x: Optional[float] = None,
        y: Optional[float] = None
    ) -> Dict:
        """
        Get applicable ballot questions for a given address.

        Rules:
        - Everyone votes on State and County propositions
        - City questions match by city name in address
        - School district questions match by school district boundary
        - ESD questions require manual geolocation lookup (not yet implemented)

        Args:
            address: Address to look up
            x, y: Coordinates (alternative to address)

        Returns:
            Dictionary containing:
            - address: The address
            - coordinates: {x, y}
            - city: City name from geocoding
            - school_district: School district name
            - categories: List of applicable question categories
        """
        # Get coordinates
        if x is None or y is None:
            if not address:
                raise ValueError("Must provide either address or (x, y) coordinates")
            coords = self.geocode_address(address)
            if not coords:
                return {'error': 'Could not geocode address'}
            x, y = coords
        else:
            address = address or f"({x:.2f}, {y:.2f})"

        # Get city name from geocoding result
        city = None
        geocode_result = self._get_geocode_full_result(address)
        if geocode_result and 'candidates' in geocode_result and geocode_result['candidates']:
            candidate = geocode_result['candidates'][0]
            addr_string = candidate.get('address', '')
            # Format is usually: "123 Street Name, City Name, TX, ZIP"
            addr_parts = [p.strip() for p in addr_string.split(',')]
            if len(addr_parts) >= 2:
                city = addr_parts[1]

        # Get school district
        school_district_data = self.query_district(self.SCHOOL_DISTRICTS_URL, x, y)
        school_district = school_district_data.get('NAME') if school_district_data else None

        # Load ballot questions
        ballot_data = self._load_ballot_questions()

        result = {
            'address': address,
            'coordinates': {'x': x, 'y': y},
            'city': city,
            'school_district': school_district,
            'categories': []
        }

        # Everyone gets state and county questions
        for category in ballot_data.get('categories', []):
            if category['scope'] in ['statewide', 'countywide']:
                result['categories'].append(category)

        # Add city-specific questions if city matches
        if city:
            for category in ballot_data.get('categories', []):
                if category['scope'] == 'municipal' and 'jurisdictions' in category:
                    for jurisdiction in category['jurisdictions']:
                        jurisdiction_name = jurisdiction['name']
                        # Check if city name appears in jurisdiction name
                        # e.g., "Converse" in "City of Converse"
                        city_words = city.lower().split()
                        jurisdiction_words = jurisdiction_name.lower().split()
                        if any(word in jurisdiction_words for word in city_words):
                            result['categories'].append({
                                'category': f"{jurisdiction_name} - {jurisdiction['type']}",
                                'scope': 'municipal',
                                'data': jurisdiction
                            })

        # Add school district questions if district matches
        if school_district:
            # Normalize school district name for matching
            normalized_school = school_district.lower() \
                .replace(' isd', '') \
                .replace('northeast', 'north east') \
                .replace('northside', 'north side') \
                .strip()

            for category in ballot_data.get('categories', []):
                if category['scope'] == 'school_district' and 'jurisdictions' in category:
                    for jurisdiction in category['jurisdictions']:
                        jurisdiction_name = jurisdiction['name']
                        # Normalize jurisdiction name
                        normalized_jurisdiction = jurisdiction_name.lower() \
                            .replace(' isd', '') \
                            .replace('independent school district', '') \
                            .replace('northeast', 'north east') \
                            .replace('northside', 'north side') \
                            .strip()

                        # Check for exact match of normalized names
                        if normalized_school == normalized_jurisdiction:
                            result['categories'].append({
                                'category': f"{jurisdiction_name} - {jurisdiction['type']}",
                                'scope': 'school_district',
                                'data': jurisdiction
                            })
                            continue

                        # For multi-word districts, check if all significant words match
                        school_words = [w for w in normalized_school.split() if len(w) > 3]
                        jurisdiction_words = set(w for w in normalized_jurisdiction.split() if len(w) > 3)

                        # Match only if ALL significant school words are in jurisdiction
                        if school_words and all(word in jurisdiction_words for word in school_words):
                            result['categories'].append({
                                'category': f"{jurisdiction_name} - {jurisdiction['type']}",
                                'scope': 'school_district',
                                'data': jurisdiction
                            })

        # TODO: Add ESD matching when boundary data is available

        return result

    def _get_geocode_full_result(self, address: str) -> Optional[Dict]:
        """Get full geocoding result including address components."""
        params = {
            'SingleLine': address,
            'f': 'json',
            'outSR': '2278',
            'maxLocations': 1
        }

        try:
            response = self.session.get(self.GEOCODER_URL, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None


def main():
    """Example usage of the BexarPrecinctFinder."""
    finder = BexarPrecinctFinder()

    # Example addresses
    test_addresses = [
        "100 Dolorosa St, San Antonio, TX 78205",  # County Courthouse
        "1901 S Alamo St, San Antonio, TX 78204",  # Blue Star Arts Complex
    ]

    for address in test_addresses:
        print(f"\n{'='*80}")
        print(f"Looking up: {address}")
        print('='*80)

        result = finder.find_all_districts(address)

        if result:
            print(f"\nCoordinates: ({result['coordinates']['x']:.2f}, {result['coordinates']['y']:.2f})")
            print(f"\nDistricts:")
            print(f"  Voter Precinct: {result['districts'].get('voter_precinct', 'N/A')}")
            print(f"  Commissioner Precinct: {result['districts'].get('commissioner_precinct', 'N/A')}")
            print(f"    Commissioner: {result['districts'].get('commissioner_name', 'N/A')}")
            print(f"  JP Precinct: {result['districts'].get('jp_precinct', 'N/A')}")
            print(f"    Judges: {result['districts'].get('jp_judges', 'N/A')}")
            print(f"  City Council District: {result['districts'].get('city_council_district', 'N/A')}")
            print(f"  State House District: {result['districts'].get('state_house_district', 'N/A')}")
            print(f"  State Senate District: {result['districts'].get('state_senate_district', 'N/A')}")
            print(f"  US Congress District: {result['districts'].get('us_congress_district', 'N/A')}")
            print(f"  State BOE District: {result['districts'].get('state_boe_district', 'N/A')}")

            # Find nearest voting locations
            print(f"\n{'='*80}")
            print("Nearest Voting Locations:")
            print('='*80)
            nearest = finder.find_nearest_voting_locations(address=address, limit=3)
            for i, loc in enumerate(nearest, 1):
                print(f"\n{i}. {loc['name']}")
                print(f"   {loc['full_address']}")
                print(f"   Distance: {loc['distance_miles']:.2f} miles ({loc['distance_feet']:.0f} feet)")
        else:
            print("Failed to find district information for this address.")


if __name__ == "__main__":
    main()
