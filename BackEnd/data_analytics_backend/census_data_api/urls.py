from . import views
from django.urls import path, include

urlpatterns =  [
    path("queens_data", views.get_queens_census_data, name="get_queens_census_data"),
    path("geojson_zipcode", views.get_geojson_data, name="get_geojson_data"),
    path("art_data", views.get_art_data, name="get_art_data"),
    path("mta_data", views.get_mta_data, name="get_mta_data"),
    path("census_geo_data", views.get_queens_census_data_with_geo_polygon, name="get_queens_census_data_with_geo_polygon")
]