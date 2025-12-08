import requests
from django.http import JsonResponse

NYC_MTA_URL = "https://data.cityofnewyork.us/resource/4y8i-pbvd.json"
APP_TOKEN_ = "la7t3lkbJjMEfLj9F9axKNXc8"

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

class MTAComponent:

    @staticmethod
    def get_mta_data():
        response_MTA = requests.get(
            NYC_MTA_URL,
            headers={"X-App-Token": APP_TOKEN_}
        )
        data_MTA = response_MTA.json()
        
        mta_data = [item for item in data_MTA
                    if item.get("zip_code") in QUEENS_ZIPS
                    ]

        return mta_data