#!/usr/bin/env python3
"""Rebuilds congress_by_precinct.json from a Texas congressional plan.

The county's USCongressDistricts layer can lag behind redistricting, so voter
precincts are matched against the enacted plan instead. The sync fails when the
result stops matching the House races on the ballot; run this when that happens.

Download a plan shapefile from https://data.capitol.texas.gov, then:
  pip install -r requirements.txt
  python build_congress_crosswalk.py PLANC2333 path/to/PLANC2333.shp path/to/PLANC2333.prj
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import shapefile
from pyproj import Transformer
from shapely import transform
from shapely.geometry import box, shape
from shapely.ops import unary_union

PRECINCTS_URL = "https://maps.bexar.org/arcgis/rest/services/EL/VoterPrecincts/MapServer/0/query"
PAGE_SIZE = 200
FEET_CRS = "EPSG:2278"
# Below this share, overlap is a mapping sliver between two datasets. Above it, a
# voter could really be in either district, so the page shows both races.
SPLIT_THRESHOLD = 0.01


def fetch_precincts():
    features, offset = [], 0
    while True:
        query = urllib.parse.urlencode(
            dict(where="1=1", outFields="NAME", returnGeometry="true", outSR=2278, f="geojson",
                 resultOffset=offset, resultRecordCount=PAGE_SIZE)
        )
        with urllib.request.urlopen(f"{PRECINCTS_URL}?{query}", timeout=90) as response:
            page = json.load(response)["features"]
        features += page
        offset += len(page)
        if len(page) < PAGE_SIZE:
            return [(f["properties"]["NAME"], shape(f["geometry"]).buffer(0)) for f in features]


def load_districts(shp_path, prj_path, bounds):
    to_feet = Transformer.from_crs(Path(prj_path).read_text(), FEET_CRS, always_xy=True)
    area = box(*bounds)
    districts = {}
    for record in shapefile.Reader(shp_path).shapeRecords():
        geometry = shape(record.shape.__geo_interface__)
        geometry = transform(geometry, lambda xy: list(zip(*to_feet.transform(xy[:, 0], xy[:, 1])))).buffer(0)
        if geometry.intersects(area):
            districts[int(record.record["District"])] = geometry
    return districts


def districts_for(precinct, districts):
    shares = {n: precinct.intersection(g).area / precinct.area for n, g in districts.items() if precinct.intersects(g)}
    return sorted(n for n, share in shares.items() if share >= SPLIT_THRESHOLD)


def main(plan, shp_path, prj_path):
    precincts = fetch_precincts()
    bounds = unary_union([geometry for _, geometry in precincts]).bounds
    districts = load_districts(shp_path, prj_path, bounds)
    output = {
        "plan": plan,
        "precincts": {name: districts_for(g, districts) for name, g in sorted(precincts, key=lambda p: p[0])},
    }
    target = Path(__file__).resolve().parent.parent / "congress_by_precinct.json"
    target.write_text(json.dumps(output, separators=(",", ":")) + "\n")
    print(f"Wrote {len(precincts)} precincts for {plan}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
