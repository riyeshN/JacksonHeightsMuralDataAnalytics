import requests

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

            # the_geom is in the FIRST column → index 0
            geom_list = [row[0] for row in data.get("data", [])]

            return geom_list

        except requests.RequestException as e:
            print(f"Error fetching NYC data: {e}")
            return []
