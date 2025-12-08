import { useEffect, useRef, useState } from "react";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import api from "../api/census";
import type { ExpressionSpecification } from "maplibre-gl";
import {
	Box,
	Button,
	ButtonGroup,
	Grid,
	LinearProgress,
	Stack,
} from "@mui/material";
import Charts from "./Charts";
import SearchEngine from "./utils/SearchEngine";

const KEY = "5JiIWH7dkgRJBJPU662Z";

export interface ArtData {
	title: string[];
	name: [
		{
			first_name: string;
			last_name: string;
			middle_name: string;
		}
	];
	date_created: string;
	art_work_type: string[];
	keywords: string;
	inscriptions: string;
	managing_agency: string;
	location: {
		address: string;
		city: string;
		zip_code: string;
		latitude: string;
		longitude: string;
		name: string;
	};
}

interface censusData {
	geometry: GeoJSON.Geometry;
	pop_est: null | number;
	census_data: Record<string, any>;
}

type HeatMapVariable = "Age" | "PopulationDensity" | "Income";

const Map = () => {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);

	const popupRef = useRef<maplibregl.Popup | null>(null);

	const [selectedAttributeForHeatMap, setSelectedAttributeForHeatMap] =
		useState<HeatMapVariable>("PopulationDensity");
	const [loading, setLoadingState] = useState<boolean>(true);
	const [geoObject, setGeoObject] = useState<GeoJSON.FeatureCollection | null>(
		null
	);
	const [artData, setArtData] = useState<GeoJSON.FeatureCollection<
		GeoJSON.Point,
		ArtData
	> | null>(null);
	const [selectedArtId, setSelectedArtId] = useState<string | number | null>(
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

	const fetchMuralDataForQueens = async () => {
		try {
			const response = await api.get("census/art_data");
			console.log(response.data?.ArtList);

			const mural_data: [ArtData] = response?.data?.ArtList;

			const features = mural_data.map(
				(current) =>
					({
						type: "Feature",
						id: current?.title[0],
						geometry: {
							type: "Point",
							coordinates: [
								Number(current?.location?.longitude),
								Number(current?.location?.latitude),
							],
						},
						properties: {
							id: current?.title[0],
							title: current?.title,
							name: current?.name,
							date_created: current?.date_created,
							art_work_type: current?.art_work_type,
							keywords: current?.keywords,
							inscriptions: current?.inscriptions,
							managing_agency: current?.managing_agency,
							location: current?.location,
						},
					} as GeoJSON.Feature<GeoJSON.Point, ArtData>)
			);

			const featureCollection: GeoJSON.FeatureCollection<
				GeoJSON.Point,
				ArtData
			> = {
				type: "FeatureCollection",
				features,
			};

			setArtData(featureCollection);
		} catch (error) {
			alert(`Issue with fetching mural data ${error}`);
		}
	};

	const reorderLayers = (map: maplibregl.Map) => {
		const order = [
			"zip-fill",
			"zip-highlight",
			"murals-circle",
			"murals-highlight",
		];

		order.forEach((layerId) => {
			if (map.getLayer(layerId)) {
				map.moveLayer(layerId);
			}
		});
	};

	useEffect(() => {
		if (!mapContainerRef.current) return;

		if (!mapRef.current) {
			mapRef.current = new maplibregl.Map({
				container: mapContainerRef.current,
				style: `https://api.maptiler.com/maps/darkmatter/style.json?key=${KEY}`,
				center: [-73.885, 40.75],
				zoom: 10,
				minZoom: 10,
				maxZoom: 12,
			});

			mapRef.current.addControl(
				new maplibregl.NavigationControl(),
				"top-right"
			);
		}

		popupRef.current = new maplibregl.Popup({
			closeButton: false,
			closeOnClick: false,
		});

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!mapRef.current || !artData) return;
		const map = mapRef.current;

		if (artData && map.getSource("murals")) {
			(map.getSource("murals") as GeoJSONSource).setData(artData);
		} else {
			map.addSource("murals", {
				type: "geojson",
				data: artData,
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

			map.addLayer({
				id: "murals-highlight",
				type: "circle",
				source: "murals",
				paint: {
					"circle-radius": 9,
					"circle-color": "#ffff00",
					"circle-stroke-color": "#000000",
					"circle-stroke-width": 2,
				},
				filter: ["==", "id", ""],
			});
		}

		if (map.getLayer("murals-circle")) {
			map.moveLayer("murals-circle");
		}
		if (map.getLayer("murals-highlight")) {
			map.moveLayer("murals-highlight");
		}
		reorderLayers(map);
	}, [artData]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;
		if (!map.getLayer("murals-highlight")) return;

		if (selectedArtId == null) {
			map.setFilter("murals-highlight", ["==", "id", ""]);
		} else {
			map.setFilter("murals-highlight", ["==", "id", selectedArtId]);
		}
		reorderLayers(map);
	}, [selectedArtId]);

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

		if (!map.getLayer("zip-highlight")) {
			map.addLayer({
				id: "zip-highlight",
				type: "line",
				source: "queenszip",
				paint: {
					"line-color": "#ffff00",
					"line-width": 4,
				},
				filter: ["==", "zip_code", ""],
			});
		}

		if (map.getLayer("murals-circle")) {
			map.moveLayer("murals-circle");
		}

		map.on("mousemove", "zip-fill", (e) => {
			const props = e.features?.[0]?.properties;
			if (!props || !popupRef.current) return;

			const html = `
				<div style = "font-size: 14px;">
					<strong>ZIP: </strong>${props.zip_code}<br/>
                    <strong>Income: </strong>${
											props.median_household_income ?? "N/A"
										}<br/>
                    <strong>Age: </strong>${props.median_age ?? "N/A"}<br/>
                    <strong>Population: </strong>${
											props.total_population ?? "N/A"
										}
				</div>
			`;

			popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map);
		});

		map.on("mouseleave", "zip-fill", () => {
			if (popupRef.current) {
				popupRef.current.remove();
			}
		});

		map.on("click", "zip-fill", (element) => {
			const props = element.features?.[0]?.properties;
			setSelectedAreaProp(props);
			if (props?.zip_code) {
				map.setFilter("zip-highlight", ["==", "zip_code", props.zip_code]);
			}
		});
		reorderLayers(map);
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

	const LEGENDS: Record<
		HeatMapVariable,
		Array<{ color: string; label: string }>
	> = {
		Income: [
			{ color: "#f5f9faff", label: "30k" },
			{ color: "#8ec7d6ff", label: "60k" },
			{ color: "#337385ff", label: "90k" },
			{ color: "#083e4dff", label: "120k" },
		],
		Age: [
			{ color: "#edf8fb", label: "20" },
			{ color: "#b2e2e2", label: "35" },
			{ color: "#66c2a4", label: "50" },
			{ color: "#238b45", label: "65" },
		],
		PopulationDensity: [
			{ color: "#ffffcc", label: "5k" },
			{ color: "#a1dab4", label: "15k" },
			{ color: "#41b6c4", label: "30k" },
			{ color: "#225ea8", label: "60k" },
		],
	};

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
					"#f5f9faff",
					60000,
					"#8ec7d6ff",
					90000,
					"#337385ff",
					120000,
					"#083e4dff",
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

	const Legend = ({ variable }: { variable: HeatMapVariable }) => {
		const items = LEGENDS[variable];

		return (
			<div
				style={{
					position: "absolute",
					bottom: "10px",
					left: "10px",
					backgroundColor: "rgba(255,255,255,0.9)",
					padding: "10px",
					borderRadius: "8px",
					fontSize: "12px",
					boxShadow: "0px 0px 6px rgba(0,0,0,0.2)",
					zIndex: 999,
				}}
			>
				<strong>{variable}</strong>
				{items.map((item, index) => (
					<div
						key={index}
						style={{ display: "flex", alignItems: "center", marginTop: "4px" }}
					>
						<div
							style={{
								width: "16px",
								height: "16px",
								backgroundColor: item.color,
								marginRight: "6px",
							}}
						/>
						<span>{item.label}</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<Box alignItems="center">
			<Stack>
				<Grid container padding={2}>
					<Grid size={{ xs: 12 }}>
						<ButtonGroup>
							<Button
								onClick={() => setSelectedAttributeForHeatMap("Age")}
								color={
									selectedAttributeForHeatMap === "Age" ? "error" : "primary"
								}
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
								onClick={() =>
									setSelectedAttributeForHeatMap("PopulationDensity")
								}
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
					<Grid size={{ xs: 8 }}>
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

							<Legend variable={selectedAttributeForHeatMap} />

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
					<Grid size={{ xs: 4 }}>
						<SearchEngine
							artData={artData}
							onSelectMural={(feature) => {
								const map = mapRef.current;
								if (!map) return;

								if (feature.id != null) {
									setSelectedArtId(feature.id);
								}

								if (feature.geometry.type === "Point") {
									const coords = feature.geometry.coordinates as [
										number,
										number
									];
									map.flyTo({
										center: coords,
										zoom: 14,
										essential: true,
									});
								}
							}}
						/>
					</Grid>
				</Grid>

				<Charts selectedArea={selectedAreaProp} />
			</Stack>
		</Box>
	);
};

export default Map;
