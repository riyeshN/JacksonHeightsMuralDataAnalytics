# JacksonHeightsMuralDataAnalytics

# HOSTED IN: http://35.222.176.221/
# BACKEND

We are using django as the backend API.
tutorial used to start this: https://docs.djangoproject.com/en/5.2/intro/tutorial01/

1. Clone the project:
2. Create venv and activate it
3. pip install -r requirement.txt
4. python manage.py makemigrations
5. python manage.py runserver

test

# FRONTEND

make sure that you run the command below on directory where we have package.json

1. npm install
2. npm run dev

We are using react as frontend library
Also will utilize MUI unless someone wants to do design using css. But I do not want to spend my time there haha

# Reading the UI

1. we have a map with overlay of red dots for public arts, yellow triangles for organizations and blue line of cafe data.
2. we have a text box (right next to or below - based on screen size). engaging with the textbox allows you to filter artdata. you can also click on the artdata to fly to that area in the map. Here the red dots for public art turns to yellow.
3. the yellow triangle turns to purple when you hover around it. WHen clicked you get organization's info. You can be redirect to their direct link using the dialog box.
4. Cafe data is static.
5. you will also have heat map created from census data. you can toggle between them using buttons on top of the map. Legend inside the map has that relevant info.
6. when you click on a given zipcode, its census data shows appear as pie chart below the map.

# Data (Public Art):

For the list of public art in Queens NY, we utilize data provided by Department of Transportation (DOT) and Public Design Commission (PDC). Their data is available on NYC Open Data.

**Department of Transportation (DOT):** This dataset records temporary art installations on NYC DOT property, including the name, artist, coordinates, zip code, site, art type, installation date, and removal date. Since we focus on Queens, after calling NYC Open Data Api, we filter to only have Queens zip code.

**Public Design Commission (PDC):** This dataset records inventory of City owned public monument, memorials, artworks and markers installed outside on City-owned property. The key attribute we care for are primary artist, secondary artist, title, secondary title, coordinates, date created, artwork type, location, address, and zip code. Since we focus on Queens, after calling NYC Open Data Api, we filter to only have Queens zip code.

# Data (Organization):

For list of organization and cafe, we utilize NYC Community Based Organizations and café data. Their data is available on NYC Open Data.

# Data (Geolocation divide using zip code and census data):

We divided our Queens region by zip codes. We got polygon data for different Queens zip code from data.cityofnewyork.  
For census data, we used census library from python. We had to use census’s website to get key value for attributes we wanted to use.

# DATA SOURCES:

1. Organization Info: https://data.cityofnewyork.us/Social-Services/NYC-Community-Based-Organizations/i4kb-6ab6/data_preview
2. Outdoor Commissioned Public Art: https://data.cityofnewyork.us/Housing-Development/Public-Design-Commission-Outdoor-Public-Art-Invent/2pg3-gcaa/about_data
3. DOT Temporary Art: https://data.cityofnewyork.us/Transportation/Temporary-Art-Program/3r2x-bnmj/data_preview
4. Census-Mapping: https://api.census.gov/data/2023/acs/acs5/variables.html#:~:text=Estimate!!Total:!!Europe:!!Europe%2C%20n.e.c.%2C%20PLACE%20OF%20BIRTH%20FOR%20THE,THE%20UNITED%20STATES%2C%20not%20required%2C%20B05006_046EA%2C%20B05006_046M
5. Café Data: https://data.cityofnewyork.us/City-Government/nysidewalkcafe/ptd9-4c6m/about_data
6. Queens zipcode polygon: https://data.cityofnewyork.us/api/geospatial/pri4-ifjk?method=export&format=GeoJSON
