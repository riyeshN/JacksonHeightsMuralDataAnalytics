import requests


NYC_ORG_URL = "https://data.cityofnewyork.us/Social-Services/NYC-Community-Based-Organizations/i4kb-6ab6/data_preview"
APP_TOKEN_ = "rldrJG5WYd9xQ3fpzBT1JQr9q"

class OrganizationComponent:

    
    @staticmethod
    def get_org_data():
        url = NYC_ORG_URL
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            columns = data["meta"]["view"]["columns"]
            rows = data.get("data", [])

            # Find index of Latitude and Longitude columns
            lat_idx = None
            lon_idx = None

            for i, col in enumerate(columns):
                if col.get("name") == "Latitude":
                    lat_idx = i
                if col.get("name") == "Longitude":
                    lon_idx = i

            if lat_idx is None or lon_idx is None:
                print("Could not find Latitude/Longitude columns in dataset.")
                return []

            # Extract coordinates
            coords = []
            for row in rows:
                lat = row[lat_idx]
                lon = row[lon_idx]
                if lat is not None and lon is not None:
                    coords.append((lat, lon))

            return coords

        except requests.RequestException as e:
            print(f"Error fetching NYC data: {e}")
            return []
