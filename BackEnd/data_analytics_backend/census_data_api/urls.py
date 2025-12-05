from . import views
from django.urls import path, include

urlpatterns =  [
    path("queens_data", views.get_queens_census_data, name="get_queens_census_data"),
    path("geojson_zipcode", views.get_geojson_data, name="get_geojson_data"),
    path("mural_data", views.get_mural_data, name="get_mural_data"),
    path("mta_data", views.get_mta_data, name="get_mta_data"),
    path("census_geo_data", views.get_queens_census_data_with_geo_polygon, name="get_queens_census_data_with_geo_polygon")
]