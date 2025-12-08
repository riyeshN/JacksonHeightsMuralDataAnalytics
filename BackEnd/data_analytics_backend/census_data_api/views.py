import json
from django.core.cache import cache
from django.http import HttpResponse, HttpRequest, JsonResponse
from census_data_api.components.CensusComponent import CensusComponent
from census_data_api.components.ArtDataComponent import ArtDataComponent
from census_data_api.components.MTAComponent import MTAComponent
from census_data_api.components.OrganizationComponent import OrganizationComponent

CACHE_KEY_GEO_CENSUS = "GEO_CENSUS_DATA"
CACHE_KEY_MURAL = "MURAL_DATA"
CACHE_KEY_MTA = "MTA_DATA"
CACHE_KEY_ORG = "ORG_DATA"
CACHE_TIME = 60 * 60 * 24

# Create your views here.
def get_art_data(request):
    if request.method == "GET":
        cached_data = cache.get(CACHE_KEY_MURAL)
        if cached_data is not None:
            return JsonResponse(cached_data,safe=False, status=200)
        data_for_mural = ArtDataComponent.get_all_art()
        cache.set(CACHE_KEY_MURAL, data_for_mural, CACHE_TIME)
        return JsonResponse(data_for_mural,safe=False, status=200)
    else:
        return HttpResponse("Fail", status=400)

def get_mta_data(request):
    if request.method == "GET":
        cache_data = cache.get(CACHE_KEY_MTA)
        if cache_data is not None:
            return JsonResponse(cache_data, safe=False, status=200)
        mta_data = MTAComponent.get_mta_data()
        cache.set(CACHE_KEY_MTA,mta_data, CACHE_TIME)
        return JsonResponse(mta_data, safe=False, status=200)
    else:
        return HttpResponse("Fail", status=400)

def get_organization_data(request):
    if request.method == "GET":
        cache_data = cache.get(CACHE_KEY_ORG)
        if cache_data is not None:
            return JsonResponse(cache_data, status=200)
        org_data = OrganizationComponent.get_org_data()
        cache.set(CACHE_KEY_ORG,org_data, CACHE_TIME)
        return JsonResponse(org_data, status=200)
    else:
        return HttpResponse("Fail", status=400)

def get_queens_census_data_with_geo_polygon(request):
    if request.method == "GET":
        cached_data = cache.get(CACHE_KEY_GEO_CENSUS)
        if cached_data is not None:
            return JsonResponse(cached_data, status=200)
        census_and_geoploygon_data_frame = CensusComponent.get_census_data_for_queens_with_geo_polygon()
        cache.set(CACHE_KEY_GEO_CENSUS, census_and_geoploygon_data_frame, CACHE_TIME)
        return JsonResponse(census_and_geoploygon_data_frame, status=200)
    else:
        return HttpResponse("Fail", status=400)

def get_queens_census_data(request):
    if request.method == "GET":
        census_data_frame = CensusComponent.get_census_data_for_queens_county()
        data = json.loads(census_data_frame.to_json(orient="index"))
        return JsonResponse(data, status=200)
    else:
        return HttpResponse("Fail", status=400)
    

 # For Zip views   
def get_geojson_data(request):
    if request.method == "GET":
        queens_zip = CensusComponent.get_data_for_zip()
        return JsonResponse(json.loads(queens_zip.to_json()), status=200)
    else:
        return HttpResponse("Fail", status=400)
