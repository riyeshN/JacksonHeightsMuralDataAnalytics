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

	const popupRef = useRef<maplibregl.Popup | null>(null);

	const [selectedAttributeForHeatMap, setSelectedAttributeForHeatMap] =
		useState<HeatMapVariable>("PopulationDensity");
	const [loading, setLoadingState] = useState<boolean>(true);
	const [geoObject, setGeoObject] = useState<GeoJSON.FeatureCollection | null>(
		null
	);
	const [muralData, setMuralData] = useState<GeoJSON.FeatureCollection | null>(
		null
	);
	const [selectedMuralId, setSelectedMuralId] = useState<
		string | number | null
	>(null);
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
			const response = await api.get("census/mural_data");

			const mural_data: [Record<string, any>] = response?.data;

			const features = mural_data.map(
				(current, id) =>
					({
						type: "Feature",
						id: current["id"] ?? id,
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
							zipcode: current["zip_code"],
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

				filter: ["==", ["id"], -1],
			});
		}

		if (map.getLayer("murals-circle")) {
			map.moveLayer("murals-circle");
		}
		if (map.getLayer("murals-highlight")) {
			map.moveLayer("murals-highlight");
		}
	}, [muralData]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.getLayer("murals-highlight")) return;

		if (selectedMuralId == null) {
			map.setFilter("murals-highlight", ["==", ["id"], -1]); // match nothing
		} else {
			map.setFilter("murals-highlight", ["==", ["id"], selectedMuralId]);
		}
	}, [selectedMuralId]);

	useEffect(() => {
		console.log(geoObject);
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
					"line-color": "#ffeb3b",
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

	const handleSelectMural = (feature: GeoJSON.Feature) => {
		if (!mapRef.current) return;
		if (feature.geometry?.type !== "Point") return;

		const [lng, lat] = feature.geometry.coordinates as [number, number];

		mapRef.current.flyTo({
			center: [lng, lat],
			zoom: 15, // tweak as you like
			speed: 1.2, // lower = slower, higher = faster
			curve: 1.6,
			essential: true, // respect prefers-reduced-motion = false
		});
	};

	const LEGENDS: Record<
		HeatMapVariable,
		Array<{ color: string; label: string }>
	> = {
		Income: [
			{ color: "#fee5d9", label: "30k" },
			{ color: "#fcae91", label: "60k" },
			{ color: "#fb6a4a", label: "90k" },
			{ color: "#cb181d", label: "120k" },
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
							muralData={muralData}
							onSelectMural={(feature) => {
								const map = mapRef.current;
								if (!map) return;

								// 1) Set highlight
								if (feature.id != null) {
									setSelectedMuralId(feature.id);
								}

								// 2) Optionally set right panel info
								setSelectedAreaProp(feature.properties as any);

								// 3) Fly to that point
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
