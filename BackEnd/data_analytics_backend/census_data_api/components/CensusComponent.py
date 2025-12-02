from census_data_api.components.api.CensusAPI import CensusAPI
import pandas as pd
import requests

API_KEY = "23af37b06f2e13ebcd77671f57e1da080b1e59c1"
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

class CensusComponent:

    @staticmethod
    def get_census_data_for_queens_with_geo_polygon():
        census_data_frame = CensusComponent.get_census_data_for_queens_county()
        census_dict = census_data_frame.to_dict(orient="index")
        geo_dictionary = CensusComponent.get_data_for_zip()

        mapped_dictionary_census_polygon = {}

        for key, value in geo_dictionary.items():
            geometry = value['geometry']
            pop_est = value['pop_est']

            if key in census_dict:
                current_zipcode_census_value = census_dict[key]
                mapped_dictionary_census_polygon[key] = {
                    'geometry': geometry,
                    'pop_est': pop_est,
                    'census_data': current_zipcode_census_value
                }
        return mapped_dictionary_census_polygon

    @staticmethod
    def get_census_data_for_queens_county():
        acs_vars = {
            "total_population": "B01001_001E",  # Total: all ages, both sexes
            "male_population": "B01001_002E",  # Total: Male
            "female_population": "B01001_026E",  # Total: Female
            "median_age": "B01002_001E",  # Median age (both sexes)
            "median_household_income": "B19013_001E",  # Median household income (inflation-adjusted)
            "race_total": "B02001_001E",  # Total population (same as total_population conceptually)
            "white": "B02001_002E",
            "black": "B02001_003E",
            "american_indian_alaska_native": "B02001_004E",
            "asian": "B02001_005E",
            "native_hawaiian_pacific": "B02001_006E",
            "some_other_race": "B02001_007E",
            "two_or_more_races": "B02001_008E",
            "hispanic_any_race": "B03003_003E",  # Hispanic or Latino (of any race)
            "employed_16plus_total": "C24010_001E",  # Civilian employed population 16+ (both sexes)
            "occ_mgmt_male": "C24010_002E",  # Management, business, science, arts (Male)
            "occ_service_male": "C24010_003E",  # Service occupations (Male)
            "occ_sales_office_male": "C24010_004E",  # Sales and office (Male)
            "occ_natres_const_maint_male": "C24010_005E",  # Nat. resources, construction, maintenance (Male)
            "occ_prod_transp_mat_male": "C24010_006E",  # Production, transportation, material moving (Male)
            "occ_total_female": "C24010_007E",  # Female: total employed
            "occ_mgmt_female": "C24010_008E",  # Management, business, science, arts (Female)
            "occ_service_female": "C24010_009E",  # Service occupations (Female)
            "occ_sales_office_female": "C24010_010E",  # Sales and office (Female)
            "occ_natres_const_maint_female": "C24010_011E",  # Nat. resources, construction, maintenance (Female)
            "occ_prod_transp_mat_female": "C24010_012E",  # Production, transportation, material moving (Female),
        }
        census_api = CensusAPI(acs_vars = acs_vars, api_key=API_KEY, zip_code=QUEENS_ZIPS)
        return census_api.get_dataframe_census()

    @staticmethod
    def get_data_for_zip():
        url = "https://data.cityofnewyork.us/api/geospatial/pri4-ifjk?method=export&format=GeoJSON"
        response = requests.get(url)
        response.raise_for_status()
        geojson = response.json()

        queens_data = {}

        for features in geojson['features']:
            property = features.get('properties')
            modzcta = property['modzcta']

            if modzcta not in QUEENS_ZIPS:
                continue

            queens_data[modzcta] = {
                'pop_est': property.get("pop_est"),
                'geometry': features.get("geometry")
            }

        return queens_data


   