import { useEffect, useRef, useState } from "react";
import maplibregl, { GeoJSONFeature, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import api from "../api/census";
import type { ExpressionSpecification } from "maplibre-gl";
import { Box, Button, ButtonGroup, Grid, LinearProgress } from "@mui/material";
import Charts from "./Charts";

const KEY = "5JiIWH7dkgRJBJPU662Z";

interface censusData {
	geometry: GeoJSON.Geometry;
	pop_est: null | number;
	census_data: Record<string, any>;
}

interface HeatMapConfig {
	label: string;
	property: string;
	range: Record<number, string>;
}

type HeatMapVariable = "Age" | "PopulationDensity" | "Income";

const Map = () => {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);

	const [selectedAttributeForHeatMap, setSelectedAttributeForHeatMap] =
		useState<HeatMapVariable>("PopulationDensity");
	const [loading, setLoadingState] = useState<boolean>(true);
	const [geoObject, setGeoObject] = useState<GeoJSON.FeatureCollection | null>(
		null
	);
	const [muralData, setMuralData] = useState<GeoJSON.FeatureCollection | null>(
		null
	);
	const [selectedAreaProp, setSelectedAreaProp] = useState<
		{ [name: string]: any } | undefined
	>(undefined);

	useEffect(() => {
		console.log("calling api...");
		fetchCensusDataForQueens();
		fetchMuralDataForQueens();
	}, []);

	const fetchMuralDataForQueens = async () => {
		try {
			const response = await api.get("census/mural_data");

			const mural_data: [Record<string, any>] = response?.data;

			const features = mural_data.map(
				(current) =>
					({
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [
								Number(current["longitude"]),
								Number(current["latitude"]),
							],
						},
						properties: {
							city: current["city"],
							inscription: current["inscription"],
							managing_city_agency: current["managing_city_agency"],
							title: current["title"],
							address: current["address"],
							created_at: current["created_at"],
							alternate_title: current["alternate_title"],
							artwork_type1: current["artwork_type1"],
							artwork_type2: current["artwork_type2"],
							date_dedicated: current["date_dedicated"],
						},
					} as GeoJSON.Feature)
			);

			const featureCollection: GeoJSON.FeatureCollection = {
				type: "FeatureCollection",
				features,
			};

			console.log("test", featureCollection);

			setMuralData(featureCollection);
		} catch (error) {
			alert(`Issue with fetching mural data ${error}`);
		}
	};

	const fetchCensusDataForQueens = async () => {
		try {
			const response = await api.get("census/census_geo_data");

			const census_data: Record<string, censusData> = response.data;
			if (Object.keys(census_data).length > 0) {
				const features = Object.entries(census_data).map(([key, value]) => {
					const { geometry, pop_est, census_data } = value;
					return {
						type: "Feature",
						geometry,
						properties: {
							zip_code: key,
							pop_est,
							...census_data,
						},
					} as GeoJSON.Feature;
				});

				const featureCollection: GeoJSON.FeatureCollection = {
					type: "FeatureCollection",
					features,
				};
				setGeoObject(featureCollection);
			}
			setLoadingState(false);
		} catch (error) {
			alert(`Issue with fetching census data ${error}`);
		}
	};

	useEffect(() => {
		if (!mapContainerRef.current) return;

		if (!mapRef.current) {
			mapRef.current = new maplibregl.Map({
				container: mapContainerRef.current,
				style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${KEY}`,
				center: [-73.885, 40.75],
				zoom: 11,
			});

			mapRef.current.addControl(
				new maplibregl.NavigationControl(),
				"top-right"
			);
		}

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!mapRef.current || !muralData) return;
		const map = mapRef.current;

		console.log("muraldata", muralData);

		if (muralData && map.getSource("murals")) {
			(map.getSource("murals") as GeoJSONSource).setData(muralData);
		} else if (muralData) {
			map.addSource("murals", {
				type: "geojson",
				data: muralData,
			});

			map.addLayer({
				id: "murals-circle",
				type: "circle",
				source: "murals",
				paint: {
					"circle-radius": 5,
					"circle-color": "#c10f0fff",
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 1,
				},
			});
		}
		if (map.getLayer("murals-circle")) {
			map.moveLayer("murals-circle");
		}
	}, [muralData]);

	useEffect(() => {
		if (!mapRef.current || !geoObject) return;
		const map = mapRef.current;

		if (map.getSource("queenszip")) {
			(mapRef.current.getSource("queenszip") as GeoJSONSource).setData(
				geoObject
			);
		} else {
			map.addSource("queenszip", {
				type: "geojson",
				data: geoObject,
			});
		}

		if (!map.getLayer("zip-fill")) {
			map.addLayer({
				id: "zip-fill",
				type: "fill",
				source: "queenszip",
				paint: {
					"fill-outline-color": "white",
					"fill-color": getFillColorExpression(selectedAttributeForHeatMap),
				},
			});
		}

		map.on("click", "zip-fill", (element) => {
			const props = element.features?.[0]?.properties;
			setSelectedAreaProp(props);
		});
	}, [geoObject]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.getLayer("zip-fill")) return;

		map.setPaintProperty(
			"zip-fill",
			"fill-color",
			getFillColorExpression(selectedAttributeForHeatMap)
		);
	}, [selectedAttributeForHeatMap]);

	function getFillColorExpression(
		selected: HeatMapVariable
	): ExpressionSpecification {
		switch (selected) {
			case "Income":
				return [
					"interpolate",
					["linear"],
					["get", "median_household_income"],
					30000,
					"#fee5d9",
					60000,
					"#fcae91",
					90000,
					"#fb6a4a",
					120000,
					"#cb181d",
				];

			case "Age":
				return [
					"interpolate",
					["linear"],
					["get", "median_age"],
					20,
					"#edf8fb",
					35,
					"#b2e2e2",
					50,
					"#66c2a4",
					65,
					"#238b45",
				];

			case "PopulationDensity":
				return [
					"interpolate",
					["linear"],
					["get", "total_population"],
					5000,
					"#ffffcc",
					15000,
					"#a1dab4",
					30000,
					"#41b6c4",
					60000,
					"#225ea8",
				];
		}
	}

	return (
		<Grid container padding={2}>
			<Grid size={{ xs: 12 }}>
				<ButtonGroup>
					<Button
						onClick={() => setSelectedAttributeForHeatMap("Age")}
						color={selectedAttributeForHeatMap === "Age" ? "error" : "primary"}
					>
						Age
					</Button>
					<Button
						onClick={() => setSelectedAttributeForHeatMap("Income")}
						color={
							selectedAttributeForHeatMap === "Income" ? "error" : "primary"
						}
					>
						Income
					</Button>
					<Button
						onClick={() => setSelectedAttributeForHeatMap("PopulationDensity")}
						color={
							selectedAttributeForHeatMap === "PopulationDensity"
								? "error"
								: "primary"
						}
					>
						Population
					</Button>
				</ButtonGroup>
			</Grid>
			<Grid size={{ xs: 6 }}>
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "80vh",
					}}
				>
					<div
						ref={mapContainerRef}
						style={{ width: "100%", height: "80vh" }}
					/>
					{loading ? (
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								display: "flex",
								justifyContent: "center",
								alignItems: "flex-end",
								paddingBottom: "40px",
								zIndex: 10,
							}}
						>
							<LinearProgress color="secondary" sx={{ width: "60%" }} />
						</Box>
					) : (
						<></>
					)}
				</div>
			</Grid>
			<Grid>
				<Charts selectedArea={selectedAreaProp} />
			</Grid>
		</Grid>
	);
};

export default Map;
