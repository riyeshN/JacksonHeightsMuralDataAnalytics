import requests


class OrganizationComponent:

    
    @staticmethod
    def get_org_data():
        org_data = {"test": "test"}
        return org_data


@staticmethod
def fetch_nyc_geom():
    url = "https://data.cityofnewyork.us/api/v3/views/ptd9-4c6m/query.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # Extract the_geom from each row (geospatial coordinate data
        geom_list = [row[-1] for row in data.get("data", [])]  
        return geom_list

    except requests.RequestException as e:
        print(f"Error fetching NYC data: {e}")
        return []
