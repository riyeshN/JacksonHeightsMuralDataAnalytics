import json
from django.http import HttpResponse, HttpRequest, JsonResponse

from census_data_api.components.CensusComponent import CensusComponent


# Create your views here.
def get_queens_census_data(request):
    if request.method == "GET":
        census_data_frame = CensusComponent.get_census_data_for_queens_county()
        data = json.loads(census_data_frame.to_json(orient="index"))
        return JsonResponse(data, status=200)
    else:
        return HttpResponse("Fail", status=400)