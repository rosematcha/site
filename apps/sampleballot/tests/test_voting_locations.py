"""Verification of the ``voting_locations.json`` dataset."""

from __future__ import annotations

import json
from pathlib import Path

DATA_ROOT = Path(__file__).resolve().parents[1]
LOCATIONS_PATH = DATA_ROOT / "voting_locations.json"


def _load_locations() -> list[dict]:
    with LOCATIONS_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_locations_have_required_fields() -> None:
    locations = _load_locations()
    assert locations, "Voting locations dataset should not be empty"

    for location in locations:
        assert location.get("name"), "Each location needs a display name"
        assert location.get("street_address"), "Each location needs a street address"
        assert location.get("city"), "Each location needs a city"
        assert location.get("state"), "Each location needs a state"
        assert location.get("zip"), "Each location needs a ZIP code"
        assert location.get("full_address"), "Each location needs a fully formatted address"

        coordinates = location.get("coordinates")
        assert isinstance(coordinates, dict), "Coordinates must be provided for routing"
        assert "x" in coordinates and "y" in coordinates, "Coordinates must include x and y values"
        assert isinstance(coordinates["x"], (int, float)), "Coordinate x must be numeric"
        assert isinstance(coordinates["y"], (int, float)), "Coordinate y must be numeric"


def test_full_addresses_are_unique() -> None:
    locations = _load_locations()
    addresses = [location["full_address"].lower() for location in locations]
    assert len(addresses) == len(set(addresses)), "Voting locations should not contain duplicate addresses"
