import censusdata
import pandas as pd

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

class CensusAPI:
    def __init__(self, acs_vars, api_key):
        self.acs_vars = acs_vars
        self.api_key = api_key

    def get_dataframe_census(self):
        zipcode_data = []

        # queens_bg = censusdata.download(
        #     'acs5',
        #     2023,
        #     censusdata.censusgeo([('state', '36'), ('county', '081'), ('block group', '*')]),
        #     list(self.acs_vars.values()),
        #     key=self.api_key
        # )
        #
        # queens_bg.columns = self.acs_vars.keys()

        for zipcode in QUEENS_ZIPS:
            try:
                census_dataframe = censusdata.download(
                    'acs5',
                    2023,
                    censusdata.censusgeo([('zip code tabulation area', zipcode)]),
                    list(self.acs_vars.values()),
                    key=self.api_key,
                )
                census_dataframe["zipcode"] = zipcode
                zipcode_data.append(census_dataframe)
            except Exception as ex:
                print(f"Skipping: {zipcode} {ex}")
                continue

        result = pd.concat(zipcode_data)
        result.columns = list(self.acs_vars.keys()) + ["zipcode"]
        result = result.reset_index(drop=True)
        result = result.set_index("zipcode")
        return result

