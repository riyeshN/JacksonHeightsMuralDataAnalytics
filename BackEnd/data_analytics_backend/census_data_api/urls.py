from . import views
from django.urls import path, include

urlpatterns =  [
    path("queens_data", views.get_queens_census_data, name="get_queens_census_data"),
]