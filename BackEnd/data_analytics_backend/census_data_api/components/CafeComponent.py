import requests


'''
LLM's were used to help get an idea of how to retrieve the NYC Open data, then some suggestions helped in implementing 
'''

NYC_CAFE_URL = "https://data.cityofnewyork.us/api/v3/views/ptd9-4c6m/query.json"
APP_TOKEN_ = "rldrJG5WYd9xQ3fpzBT1JQr9q"

class CafeComponent:

    @staticmethod
    def fetch_nyc_geom():
        url = NYC_CAFE_URL
        try:
            response = requests.get(url, headers={"X-App-Token": APP_TOKEN_})
            response.raise_for_status()
            data = response.json()

            #response.json() can be a dict with a "data" key or a list of rows.
            rows = []
            if isinstance(data, dict)
                rows = data.get("data", [])
            elif isinstance(data, list):
                rows = data

            geom_list = []
            for row in rows:
                if isinstance(row, (list, tuple)) and len(row) > 0:
                    geom_list.append(row[0])
                else:
                    #if row is a dict or other structure, append it directly
                    geom_list.append(row)

            return geom_list

        except requests.RequestException as e:
            print(f"Error fetching NYC data: {e}")
            return []

    @staticmethod
    def get_cafe_coords():
        raw = CafeComponent.fetch_nyc_geom()
        shapes = []
        for item in raw:
            try:
                if not item:
                    continue

                # Expect item to be a dict row with 'the_geom' containing MultiLineString/LineString
                if isinstance(item, dict):
                    geom = item.get("the_geom") or item.get("geometry") or item.get("the_geom_geojson")
                    if isinstance(geom, dict) and "coordinates" in geom:
                        coords = geom.get("coordinates")
                        typ = (geom.get("type") or "").lower()

                        # MultiLineString -> list of lines
                        if typ.endswith("multilinestring") and isinstance(coords, list):
                            flat = []
                            for line in coords:
                                if isinstance(line, list):
                                    for pair in line:
                                        if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                                            # dataset provides [lon, lat]; convert to [lat, lon]
                                            try:
                                                lon_val = float(pair[0])
                                                lat_val = float(pair[1])
                                                flat.append([lat_val, lon_val])
                                            except Exception:
                                                continue
                            if len(flat) >= 3:
                                shapes.append(flat)
                                continue

                        # LineString -> single line
                        if typ.endswith("linestring") and isinstance(coords, list):
                            flat = []
                            for pair in coords:
                                if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                                    try:
                                        lon_val = float(pair[0])
                                        lat_val = float(pair[1])
                                        flat.append([lat_val, lon_val])
                                    except Exception:
                                        continue
                            if len(flat) >= 3:
                                shapes.append(flat)
                                continue

                # If nothing matched, skip
            except Exception:
                continue

        return shapes
