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
	const [orgData, setOrgData] = useState<GeoJSON.FeatureCollection<
		GeoJSON.Point,
		any
	> | null>(null);
	const [cafePolygons, setCafePolygons] = useState<GeoJSON.FeatureCollection<
		GeoJSON.Polygon,
		any
	> | null>(null);
	const [cafePoints, setCafePoints] = useState<GeoJSON.FeatureCollection<
		GeoJSON.Point,
		any
	> | null>(null);
	const [selectedArtId, setSelectedArtId] = useState<string | number | null>(
		null
	);
	const [selectedAreaProp, setSelectedAreaProp] = useState<
		{ [name: string]: any } | undefined
	>(undefined);

	// User-supplied Queens polygon (ordered as [lon, lat] pairs)
	const queensPolygon: Array<[number, number]> = [
		[-73.95, 40.78], // NW
		[-73.7, 40.78], // NE
		[-73.7, 40.66], // SE
		[-73.85, 40.63], // SW
	];

	// Ray-casting point-in-polygon for [lon, lat]
	const pointInPolygon = (
		point: [number, number],
		polygon: Array<[number, number]>
	): boolean => {
		const x = point[0];
		const y = point[1];
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i][0],
				yi = polygon[i][1];
			const xj = polygon[j][0],
				yj = polygon[j][1];
			const intersect =
				yi > y !== yj > y &&
				x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	};

	useEffect(() => {
		console.log("calling api...");
		fetchCensusDataForQueens();
		fetchMuralDataForQueens();
		fetchOrganizationData();
		fetchCafeData();
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

	const fetchOrganizationData = async () => {
		try {
			const response = await api.get("census/org_data");
			// backend returns a list of [lat, lon] tuples
			const org_list: Array<[number, number]> = response?.data ?? [];

			const features = org_list
				.map((item, idx) => {
					const lat = Number(item?.[0]);
					const lon = Number(item?.[1]);
					if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
					return {
						type: "Feature",
						id: `org-${idx}`,
						geometry: {
							type: "Point",
							coordinates: [lon, lat],
						},
						properties: {},
					} as GeoJSON.Feature<GeoJSON.Point, any>;
				})
				.filter(Boolean) as GeoJSON.Feature<GeoJSON.Point, any>[];

			// filter by queens polygon using centroid (point is [lon, lat])
			const filtered = features.filter((f) => {
				const coords = f.geometry.coordinates as [number, number];
				return pointInPolygon(coords, queensPolygon);
			});

			const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Point, any> = {
				type: "FeatureCollection",
				features: filtered,
			};

			setOrgData(featureCollection);
		} catch (error) {
			console.error("Issue with fetching organization data", error);
		}
	};

	const fetchCafeData = async () => {
		try {
			const response = await api.get("census/cafe_data");
			const cafe_list: any[] = response?.data ?? [];

			const polyFeatures: GeoJSON.Feature<GeoJSON.Polygon, any>[] = [];
			const pointFeatures: GeoJSON.Feature<GeoJSON.Point, any>[] = [];

			cafe_list.forEach((item, idx) => {
				// item expected to be an array of coordinate pairs: [[lat, lon], [lat, lon], ...]
				if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
					const ring: Array<[number, number]> = item
						.map((p: any) => {
							const lat = Number(p?.[0]);
							const lon = Number(p?.[1]);
							if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
							return [lon, lat] as [number, number];
						})
						.filter(Boolean) as [number, number][];

					if (ring.length >= 3) {
						// ensure ring closed
						const first = ring[0];
						const last = ring[ring.length - 1];
						if (first[0] !== last[0] || first[1] !== last[1]) {
							ring.push(first);
						}

						// compute centroid and only include if centroid is in queens polygon
						const sums = ring.reduce(
							(acc, c) => [acc[0] + c[0], acc[1] + c[1]],
							[0, 0]
						);
						const centroid: [number, number] = [
							sums[0] / ring.length,
							sums[1] / ring.length,
						];
						if (!pointInPolygon(centroid, queensPolygon)) return;

						polyFeatures.push({
							type: "Feature",
							id: `cafe-poly-${idx}`,
							geometry: {
								type: "Polygon",
								coordinates: [ring],
							},
							properties: {},
						});
					}
				}
			});

			// Also handle any shapes that ended up being a single coordinate (not a polygon)
			// The backend returns shapes (arrays of [lat, lon] pairs). If a shape has <3 points,
			// treat it as a point marker using its first coordinate.
			cafe_list.forEach((item: any, idx2: number) => {
				if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
					const ring = item
						.map((p: any) => {
							const lat = Number(p?.[1]) || Number(p?.[0]);
							const lon = Number(p?.[0]) || Number(p?.[1]);
							return [lon, lat] as [number, number];
						})
						.filter(Boolean as any) as [number, number][];

					if (ring.length < 3 && ring.length > 0) {
						// only include point if inside queens polygon
						if (pointInPolygon(ring[0], queensPolygon)) {
							pointFeatures.push({
								type: "Feature",
								id: `cafe-point-${idx2}`,
								geometry: { type: "Point", coordinates: ring[0] },
								properties: {},
							});
						}
					}
				}
			});

			setCafePolygons({ type: "FeatureCollection", features: polyFeatures });
			setCafePoints({ type: "FeatureCollection", features: pointFeatures });
		} catch (error) {
			console.error("Issue with fetching cafe data", error);
		}
	};

	const reorderLayers = (map: maplibregl.Map) => {
		// Move cafe layers earlier so murals and organization markers sit on top
		const order = [
			"zip-fill",
			"zip-highlight",
			"cafes-fill",
			"cafes-outline",
			"cafes-points",
			"cafes-highlight",
			"murals-circle",
			"murals-highlight",
			"orgs-pin",
			"orgs-highlight",
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
		if (!mapRef.current || !orgData) return;
		const map = mapRef.current;

		const applyOrgData = () => {
			if (orgData && map.getSource && map.getSource("orgs")) {
				(map.getSource("orgs") as GeoJSONSource).setData(orgData);
				return;
			}

			if (orgData) {
				map.addSource("orgs", {
					type: "geojson",
					data: orgData,
				});

				const addSymbolLayer = () => {
					if (map.getLayer("orgs-pin")) return;

					const addLayerNow = () => {
						if (!map.getLayer("orgs-pin")) {
							map.addLayer({
								id: "orgs-pin",
								type: "symbol",
								source: "orgs",
								layout: {
									"text-field": "▼",
									"text-size": 12,
									"text-allow-overlap": true,
									"text-ignore-placement": true,
									"text-anchor": "bottom",
								},
								paint: {
									"text-color": "#FFD400",
									"text-halo-color": "#444444",
									"text-halo-width": 1.2,
								},
							});
						}

						if (!map.getLayer("orgs-highlight")) {
							map.addLayer({
								id: "orgs-highlight",
								type: "circle",
								source: "orgs",
								paint: {
									"circle-radius": 12,
									"circle-color": "#ffff00",
									"circle-stroke-color": "#444444",
									"circle-stroke-width": 2,
								},
								filter: ["==", "id", ""],
							});
						}

						if (map.getLayer("orgs-pin")) map.moveLayer("orgs-pin");
						if (map.getLayer("orgs-highlight")) map.moveLayer("orgs-highlight");
						reorderLayers(map);
					};

					addLayerNow();
				};

				addSymbolLayer();
			}

			reorderLayers(map);
		};

		if (typeof map.isStyleLoaded === "function") {
			if (!map.isStyleLoaded()) {
				map.once("load", applyOrgData);
			} else {
				applyOrgData();
			}
		} else {
			map.once("load", applyOrgData);
		}
	}, [orgData]);

	useEffect(() => {
		if (!mapRef.current || (!cafePolygons && !cafePoints)) return;
		const map = mapRef.current;

		const applyCafeData = () => {
			if (cafePolygons && map.getSource && map.getSource("cafes")) {
				(map.getSource("cafes") as GeoJSONSource).setData(cafePolygons);
			} else if (cafePolygons) {
				map.addSource("cafes", {
					type: "geojson",
					data: cafePolygons,
				});
			}

			if (cafePoints && map.getSource && map.getSource("cafes-points")) {
				(map.getSource("cafes-points") as GeoJSONSource).setData(cafePoints);
			} else if (cafePoints) {
				map.addSource("cafes-points", {
					type: "geojson",
					data: cafePoints,
				});
			}

			if (cafePolygons) {
				if (!map.getLayer("cafes-fill")) {
					map.addLayer({
						id: "cafes-fill",
						type: "fill",
						source: "cafes",
						paint: {
							"fill-color": "#00FFFF",
							"fill-opacity": 0.45,
							"fill-outline-color": "#FFFFFF",
						},
					});
				}

				if (!map.getLayer("cafes-outline")) {
					map.addLayer({
						id: "cafes-outline",
						type: "line",
						source: "cafes",
						paint: {
							"line-color": "#FFFFFF",
							"line-width": 1,
						},
					});
				}
			}

			if (cafePoints) {
				if (!map.getLayer("cafes-points")) {
					map.addLayer({
						id: "cafes-points",
						type: "circle",
						source: "cafes-points",
						paint: {
							"circle-radius": 4,
							"circle-color": "rgba(0,255,255,0.45)",
							"circle-stroke-color": "#FFFFFF",
							"circle-stroke-width": 1,
						},
					});
				}

				if (!map.getLayer("cafes-highlight")) {
					map.addLayer({
						id: "cafes-highlight",
						type: "circle",
						source: "cafes-points",
						paint: {
							"circle-radius": 12,
							"circle-color": "rgba(0,255,255,0.45)",
							"circle-stroke-color": "#FFFFFF",
							"circle-stroke-width": 1,
						},
						filter: ["==", "id", ""],
					});
				}
			}

			if (map.getLayer("cafes-fill")) map.moveLayer("cafes-fill");
			if (map.getLayer("cafes-outline")) map.moveLayer("cafes-outline");
			if (map.getLayer("cafes-pin")) map.moveLayer("cafes-pin");
			if (map.getLayer("cafes-highlight")) map.moveLayer("cafes-highlight");
			reorderLayers(map);
		};

		if (typeof map.isStyleLoaded === "function") {
			if (!map.isStyleLoaded()) {
				map.once("load", applyCafeData);
			} else {
				applyCafeData();
			}
		} else {
			map.once("load", applyCafeData);
		}
	}, [cafePolygons, cafePoints]);

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

							<SymbolLegend />
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

function SymbolLegend() {
	return (
		<div
			style={{
				position: "absolute",
				bottom: "160px",
				left: "10px",
				backgroundColor: "rgba(255,255,255,0.95)",
				padding: "8px",
				borderRadius: "8px",
				fontSize: "12px",
				boxShadow: "0px 0px 6px rgba(0,0,0,0.15)",
				zIndex: 1100,
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: 6 }}>Legend</div>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<div
					style={{
						width: 14,
						height: 14,
						backgroundColor: "rgba(0,255,255,0.45)",
						border: "1px solid #FFFFFF",
					}}
				/>
				<div>Cafes</div>
			</div>
			<div style={{ height: 8 }} />
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<div
					style={{
						width: 0,
						height: 0,
						borderLeft: "7px solid transparent",
						borderRight: "7px solid transparent",
						borderTop: "12px solid #FFD400",
						filter: "drop-shadow(0 0 1px rgba(0,0,0,0.4))",
					}}
				/>
				<div>Organizations</div>
			</div>
		</div>
	);
}

export default Map;
