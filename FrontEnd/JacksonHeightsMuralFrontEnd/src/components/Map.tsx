import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const KEY = "5JiIWH7dkgRJBJPU662Z";

const Map = () => {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);

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

	return (
		<div
			ref={mapContainerRef}
			style={{ width: "100%", height: "80vh", borderRadius: 8 }}
		/>
	);
};

export default Map;
