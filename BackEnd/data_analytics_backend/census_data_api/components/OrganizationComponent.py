import requests

NYC_ORG_URL = "https://data.cityofnewyork.us/resource/i4kb-6ab6.json"
APP_TOKEN_ = "rldrJG5WYd9xQ3fpzBT1JQr9q"
QUEENS_ZIPS = [
    "11004","11005",
    "11101","11102","11103","11104","11105","11106","11109",
    "11351","11354","11355","11356","11357","11358","11359","11360",
    "11361","11362","11363","11364","11365","11366","11367","11368",
    "11369","11370","11371","11372","11373","11374","11375","11377",
    "11378","11379","11385",
    "11411","11412","11413","11414","11415","11416","11417","11418",
    "11419","11420","11421","11422","11423","11426","11427","11428",
    "11429","11432","11433","11434","11435","11436",
    "11691","11692","11693","11694","11697"
]

class OrganizationComponent:

    @staticmethod
    def get_org_data():
        url = NYC_ORG_URL
        headers = {"X-App-Token": APP_TOKEN_}
        params = {
            "$limit": 5000,
            "$select": "latitude,longitude,organization_name,website,postcode,mission,"
                       "volunteer_program_description,street_address",
            "$where": "latitude IS NOT NULL AND longitude IS NOT NULL",
        }
        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            try:
                data = response.json()
            except ValueError:
                print("Error: response is not JSON; response text:\n", response.text[:500])
                return []

            orgs = []
            for item in data:
                lat = item.get("latitude")
                lon = item.get("longitude")
                try:
                    latf = float(lat)
                    lonf = float(lon)
                except (TypeError, ValueError):
                    continue

                if item.get("postcode") in QUEENS_ZIPS:
                    orgs.append({
                        "latitude": latf,
                        "longitude": lonf,
                        "name": item.get("organization_name"),
                        "website": item.get("website"),
                        "postcode": item.get("postcode"),
                        "mission": item.get("mission"),
                        "volunteer_program_description": item.get("volunteer_program_description"),
                        "street_address": item.get("street_address")
                    })

            return orgs

        except requests.RequestException as e:
            print(f"Error fetching NYC data: {e}")
            return []
