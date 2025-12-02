import censusdata
import pandas as pd

class CensusAPI:
    def __init__(self, acs_vars, api_key, zip_code):
        self.acs_vars = acs_vars
        self.api_key = api_key
        self.zip_code = zip_code

    def get_dataframe_census(self):
        zipcode_data = []

        for zipcode in self.zip_code:
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

