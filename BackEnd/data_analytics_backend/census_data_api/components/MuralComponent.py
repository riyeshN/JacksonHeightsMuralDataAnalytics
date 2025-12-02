import requests

APP_TOKEN = "NCNgs3lND8q1eIbXqtmwUIR1J"
NYC_MURAL_URL = "https://data.cityofnewyork.us/api/v3/views/2pg3-gcaa/query.json"
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

class MuralComponent:

    @staticmethod
    def get_mural_locations():
        response = requests.get(
            NYC_MURAL_URL,
            headers={"X-App-Token": APP_TOKEN}
        )
        data = response.json()
        return_data = []
        for data_curr in data:
            if data_curr["zip_code"] in QUEENS_ZIPS:
                return_data.append(data_curr)
        return return_data
