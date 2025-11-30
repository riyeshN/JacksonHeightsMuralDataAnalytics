from census_data_api.components.api.CensusAPI import CensusAPI

API_KEY = "23af37b06f2e13ebcd77671f57e1da080b1e59c1"

class CensusComponent:

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
        census_api = CensusAPI(acs_vars = acs_vars, api_key=API_KEY)
        return census_api.get_dataframe_census()


