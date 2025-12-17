from datetime import datetime, date
import requests

#RIYESH NATH: This component just get art data. filters by zipcode of queens and converts
#different endpoint data into singular Class ArtInfo. This is just used so as more endpoints
#are added, we have come contract for how JSON should look like.
APP_TOKEN = "NCNgs3lND8q1eIbXqtmwUIR1J"
NYC_PUBLIC_MONUMENT_LOCATIONS_URL = "https://data.cityofnewyork.us/api/v3/views/2pg3-gcaa/query.json"
NYC_DOT_ART = "https://data.cityofnewyork.us/api/v3/views/3r2x-bnmj/query.json"
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
class Name:
    def __init__(self, first_name:str, last_name:str, middle_name:str):
        self.first_name = first_name
        self.last_name = last_name
        self.middle_name = middle_name

    def serialize(self):
        return {
            "first_name": self.first_name,
            "last_name": self.last_name,
            "middle_name": self.middle_name
        }

class Location:
    def __init__(self,name: str, address: str, city: str, zip_code:str, latitude, longitude):
        self.address = address
        self.city = city
        self.zip_code = zip_code
        self.latitude = latitude
        self.longitude = longitude
        self.name = name

    def serialize(self):
        return{
            "address": self.address,
            "city": self.city,
            "zip_code": self.zip_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "name": self.name
        }

class ArtInfo:
    def __init__(self, title_list: list[str], artist_names: list[Name], date_created: str,
                 art_work_type: list[str], keywords: str, inscription: str, managing_agency: str, location: Location):
        self.title = title_list
        self.name = artist_names
        self.date_created = date_created
        self.art_work_type = art_work_type
        self.keywords = keywords
        self.inscription = inscription
        self.managing_agency = managing_agency
        self.location = location

    def serialize(self):
        try:
            return {
                "title": self.title,
                "name": [curr_name.serialize() for curr_name in self.name],
                "date_created": self.date_created,
                "art_work_type": self.art_work_type,
                "keywords": self.keywords,
                "inscriptions": self.inscription,
                "managing_agency": self.managing_agency,
                "location": self.location.serialize()
            }
        except Exception as e:
            print(f"test {e}")


class ArtDataComponent:

    @staticmethod
    def get_public_monument_locations() -> list[ArtInfo]:
        response = requests.get(
            NYC_PUBLIC_MONUMENT_LOCATIONS_URL,
            headers={"X-App-Token": APP_TOKEN},
            params = {"$limit": 50000}
        )
        data = response.json()
        return_data: list[ArtInfo] = []
        for data_curr in data:

            if data_curr["zip_code"] in QUEENS_ZIPS:
                zip_code = data_curr.get("zip_code", "")
                titles: list[str] = []
                names: list[Name] = []
                art_work_type: list[str] = []
                location = Location(
                    data_curr.get("park_prop_name", ""),
                    data_curr.get("location_name", ""),
                    data_curr.get("borough", ""),
                    zip_code,
                    data_curr.get("latitude", ""),
                    data_curr.get("longitude", "")
                )
                if data_curr.get("title"):
                    titles.append(data_curr.get("title"))
                if data_curr.get("alternate_title"):
                    titles.append(data_curr.get("alternate_title"))

                names.append(Name(
                    data_curr.get("primary_artist_first", ""),
                    data_curr.get("primary_artist_last", ""),
                    data_curr.get("primary_artist_middle", ""),
                ))
                names.append(Name(
                    data_curr.get("secondary_artist_first", ""),
                    data_curr.get("secondary_artist_last", ""),
                    data_curr.get("secondary_artist_middle", ""),
                ))
                art_work_type.append(data_curr["artwork_type1"])
                art_work_type.append(data_curr["artwork_type2"])

                art_info = ArtInfo(titles, names, data_curr.get("date_created"), art_work_type,
                                   data_curr.get("subject_keyword"),
                                   data_curr.get("inscription"), data_curr.get("managing_city_agency"), location)

                return_data.append(art_info)
        return return_data

    @staticmethod
    def _parse_date(date_str):
        if not date_str:
            return None
        try:
            clean_date_str = date_str.split("T")[0]
            return datetime.strptime(clean_date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    @staticmethod
    def get_dep_of_transportation_art() -> list[ArtInfo] :
        response = requests.get(
            NYC_DOT_ART,
            headers={"X-App-Token": APP_TOKEN},
            params = {"$limit": 50000}
        )
        data = response.json()
        today = date.today()
        return_data: list[ArtInfo] = []
        for data_curr in data:
            install_date = ArtDataComponent._parse_date(data_curr.get("installation"))
            removal_date = ArtDataComponent._parse_date(data_curr.get("removal"))
            longitude = data_curr.get("longitude", "")
            latitude = data_curr.get("latitude", "")
            if not install_date or install_date > today:
                continue
            if removal_date and removal_date < today:
                continue
            if not longitude or not latitude:
                continue
            if str(data_curr.get("borough", "")).strip() != "Queens":
                continue

            art_work_type: list[str] = []
            name = Name(data_curr.get("artist"),"","")
            if data_curr.get("site_type"):
                art_work_type.append(data_curr.get("site_type"))
            if data_curr.get("project_type"):
                art_work_type.append(data_curr.get("project_type"))

            location = Location(data_curr.get("site_location", ""), "", "" , "", latitude, longitude)

            art_info = ArtInfo([data_curr.get("title", "")], [name], str(install_date), art_work_type,
                               data_curr.get("partner", ""), "", "DOT", location)
            return_data.append(art_info)
        return return_data


    @staticmethod
    def get_all_art():
        public_monuments : list[ArtInfo] = ArtDataComponent.get_public_monument_locations()
        dep_of_transportation_art : list[ArtInfo]= ArtDataComponent.get_dep_of_transportation_art()
        total_result: list[ArtInfo] = public_monuments + dep_of_transportation_art
        total_result_serialized = [curr.serialize() for curr in total_result]
        return {"ArtList" : total_result_serialized}
