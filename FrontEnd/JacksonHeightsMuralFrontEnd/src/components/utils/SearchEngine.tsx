import { useEffect, useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Stack,
	TextField,
	Typography,
	Button,
} from "@mui/material";
import type { Feature, Point } from "geojson";

interface MuralProperties {
	address?: string | null;
	alternate_title?: string | null;
	artwork_type1?: string | null;
	artwork_type2?: string | null;
	city?: string | null;
	created_at?: string | null;
	date_dedicated?: string | null;
	inscription?: string | null;
	managing_city_agency?: string | null;
	title?: string | null;
	zipcode?: string | null;
}

type MuralFeature = Feature<Point, MuralProperties>;

interface SearchEngineProps {
	muralData: GeoJSON.FeatureCollection | null;
	onSelectMural?: (feature: MuralFeature) => void;
}

const SearchEngine = ({ muralData, onSelectMural }: SearchEngineProps) => {
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		setPage(1);
	}, [query]);

	const murals: MuralFeature[] = useMemo(
		() => (muralData?.features as MuralFeature[]) ?? [],
		[muralData]
	);

	// Filter murals based on title / address / city / agency
	const filteredMurals = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return murals;

		return murals.filter((feature) => {
			const props = feature.properties || {};
			const haystack = [
				props.title,
				props.alternate_title,
				props.address,
				props.city,
				props.managing_city_agency,
				props.artwork_type1,
				props.artwork_type2,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return haystack.includes(q);
		});
	}, [query, murals]);

	const totalPages = Math.ceil(filteredMurals.length / pageSize) || 1;

	const pagedMurals = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredMurals.slice(start, start + pageSize);
	}, [filteredMurals, page]);

	return (
		<Stack spacing={2} padding={2} sx={{ height: "100%" }}>
			<TextField
				id="mural-search"
				label="Search piece"
				variant="outlined"
				fullWidth
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>

			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					maxHeight: "60vh",
				}}
			>
				{pagedMurals.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						{query ? `No murals found for “${query}”.` : "No murals loaded."}
					</Typography>
				) : (
					pagedMurals.map((feature, idx) => {
						const props = feature.properties || {};
						return (
							<Card
								key={idx}
								sx={{ mb: 1, cursor: onSelectMural ? "pointer" : "default" }}
								onClick={() => onSelectMural?.(feature)}
							>
								<CardContent>
									<Typography variant="h6">
										{props.title || "Untitled mural"}
									</Typography>

									{props.alternate_title &&
										props.alternate_title !== "NULL" && (
											<Typography variant="subtitle2" color="text.secondary">
												{props.alternate_title}
											</Typography>
										)}

									<Typography variant="body2">
										{props.address || "No address listed"}
									</Typography>

									<Typography variant="body2" color="text.secondary">
										{[props.city, props.zipcode].filter(Boolean).join(", ")}
									</Typography>

									{props.managing_city_agency && (
										<Typography variant="caption" color="text.secondary">
											Agency: {props.managing_city_agency}
										</Typography>
									)}

									{props.date_dedicated && (
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block" }}
										>
											Dedicated: {props.date_dedicated}
										</Typography>
									)}
								</CardContent>
							</Card>
						);
					})
				)}
			</Box>

			<Stack direction="row" justifyContent="space-between" mt={1}>
				<Typography variant="caption">
					Page {page} of {totalPages}
				</Typography>

				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="outlined"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						Prev
					</Button>
					<Button
						size="small"
						variant="outlined"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						Next
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default SearchEngine;
