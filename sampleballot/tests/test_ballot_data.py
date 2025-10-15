"""Data integrity checks for ``ballot_questions.json``."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

DATA_ROOT = Path(__file__).resolve().parents[1]
BALLOT_DATA_PATH = DATA_ROOT / "ballot_questions.json"


@pytest.fixture(scope="session")
def ballot_data() -> dict:
    """Load the ballot questions JSON once for all tests."""
    with BALLOT_DATA_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_ballot_metadata(ballot_data: dict) -> None:
    """Ensure top-level ballot metadata is present."""
    assert ballot_data["election_name"], "Election name must be defined"
    assert ballot_data["election_date"], "Election date must be defined"
    assert ballot_data["county"], "County name must be defined"
    categories = ballot_data.get("categories")
    assert isinstance(categories, list) and categories, "Ballot categories must be a non-empty list"


def test_category_shapes(ballot_data: dict) -> None:
    """Validate the structure of each ballot category and nested objects."""
    categories = ballot_data["categories"]
    for category in categories:
        assert category.get("category"), "Category entries require a human-readable title"
        assert category.get("scope"), "Category entries must declare their scope"

        questions = category.get("questions", []) or []
        for question in questions:
            assert question.get("id"), "Questions must include a stable id"
            assert "number" in question, "Questions must expose a proposition number"
            assert question.get("title"), "Questions require a title"
            assert question.get("text"), "Questions require descriptive text"
            options = question.get("options")
            assert isinstance(options, list) and options, "Questions must define at least one voting option"

        for jurisdiction in category.get("jurisdictions", []) or []:
            assert jurisdiction.get("name"), "Jurisdictions require a name"
            assert jurisdiction.get("type"), "Jurisdictions require an election type"
            has_races = bool(jurisdiction.get("races"))
            has_questions = bool(jurisdiction.get("questions"))
            assert has_races or has_questions, "Jurisdictions must include races or questions"


def test_required_scopes_present(ballot_data: dict) -> None:
    """The statewide and countywide sections should always be present."""
    scopes = {category.get("scope") for category in ballot_data["categories"]}
    assert "statewide" in scopes, "Statewide propositions are required for this election"
    assert "countywide" in scopes, "Countywide propositions are required for this election"
