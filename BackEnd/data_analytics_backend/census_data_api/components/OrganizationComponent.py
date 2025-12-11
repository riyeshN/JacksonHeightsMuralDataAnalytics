import requests

NYC_ORG_URL = "https://data.cityofnewyork.us/resource/i4kb-6ab6.json"
APP_TOKEN_ = "rldrJG5WYd9xQ3fpzBT1JQr9q"

class OrganizationComponent:

    @staticmethod
    def get_org_data():
        url = NYC_ORG_URL
        headers = {"X-App-Token": APP_TOKEN_}
        params = {
            "$limit": 5000,
            "$select": "latitude,longitude,organization_name,website",
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

                orgs.append({
                    "latitude": latf,
                    "longitude": lonf,
                    "name": item.get("organization_name"),
                    "website": item.get("website")
                })

            return orgs

        except requests.RequestException as e:
            print(f"Error fetching NYC data: {e}")
            return []
