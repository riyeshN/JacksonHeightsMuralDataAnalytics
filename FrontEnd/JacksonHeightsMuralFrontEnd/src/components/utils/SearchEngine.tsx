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
import type { ArtData } from "../Map";

type ArtFeature = GeoJSON.Feature<GeoJSON.Point, ArtData>;

interface SearchEngineProps {
	artData: GeoJSON.FeatureCollection<GeoJSON.Point, ArtData> | null;
	onSelectMural?: (feature: ArtFeature) => void;
}

//Riyesh Nath: This is a class that allows us to render the search engine.
//I had to add GeoJSON.FeatureCollection<GeoJSON.Point, ArtData> in Map.tsx since using that allowed me to use it here
//having types makes it easier to code and not put in new bugs.
const SearchEngine = ({ artData, onSelectMural }: SearchEngineProps) => {
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	useEffect(() => {
		setPage(1);
	}, [query]);

	//Riyesh Nath: useMemo allows caching for queries.

	const filteredMurals = useMemo(() => {
		if (!artData || !artData.features) {
			return [];
		}

		const lowerCaseQuery = query.toLowerCase().trim();

		return (artData.features as ArtFeature[]).filter((feature) => {
			const props = feature.properties;
			if (!props) return false;

			const artists_names = props.name
				?.map((curr) => {
					const artist_name_list = [
						curr.first_name,
						curr.middle_name,
						curr.last_name,
					];
					return artist_name_list
						.filter((name) => name && name !== "NULL" && name.trim().length > 0)
						.join(" ")
						.trim();
				})
				.filter((curr) => curr.length > 0);

			const artistName =
				artists_names.length > 0 ? artists_names.join(", ") : "";

			const searchableFields = [
				props.title?.join(" ") || "",
				artistName,
				props.keywords || "",
				props.managing_agency || "",
				props.location?.name || "",
			]
				.join(" ")
				.toLowerCase();

			return searchableFields.includes(lowerCaseQuery);
		});
	}, [artData, query]);

	const totalPages = useMemo(() => {
		return Math.ceil(filteredMurals.length / pageSize);
	}, [filteredMurals]);

	//Riyesh Nath: Pagination is used to not show all art piece in one go.
	const pagedMurals = useMemo(() => {
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		return filteredMurals.slice(start, end);
	}, [filteredMurals, page, pageSize]);

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
				{artData && filteredMurals.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						{query
							? `No murals found for “${query}”.`
							: "No murals matched the filter."}
					</Typography>
				) : (
					pagedMurals.map((feature, idx) => {
						const props: ArtData = feature.properties;

						const title = props.title?.[0] || "Untitled mural";
						const artists_names = props.name
							?.map((curr) => {
								const artist_name_list = [
									curr.first_name,
									curr.middle_name,
									curr.last_name,
								];
								return artist_name_list
									.filter(
										(name) => name && name !== "NULL" && name.trim().length > 0
									)
									.join(" ")
									.trim();
							})
							.filter((curr) => curr.length > 0);

						const artistName =
							artists_names.length > 0 ? artists_names.join(", ") : "";

						const address =
							props.location.address && props.location.address !== "NULL"
								? props.location?.address
								: props.location?.name.trim();

						return (
							<Card
								key={feature.id || idx}
								sx={{ mb: 1, cursor: onSelectMural ? "pointer" : "default" }}
								onClick={() => onSelectMural?.(feature)}
							>
								<CardContent>
									<Typography variant="h6">{title}</Typography>

									{artistName && (
										<Typography variant="subtitle2" color="text.primary">
											Artist: {artistName}
										</Typography>
									)}

									{address && (
										<Typography variant="body2">Location: {address}</Typography>
									)}

									<Typography variant="body2" color="text.secondary">
										{[props.location?.city, props.location?.zip_code]
											.filter(Boolean)
											.join(", ")}
									</Typography>

									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ display: "block" }}
									>
										Agency: {props.managing_agency || "N/A"}
									</Typography>

									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ display: "block" }}
									>
										Date Created: {props.date_created || "N/A"}
									</Typography>
								</CardContent>
							</Card>
						);
					})
				)}
			</Box>

			{filteredMurals.length > 0 && (
				<Stack direction="row" justifyContent="space-between" mt={1}>
					<Typography variant="caption">
						Showing {pagedMurals.length} of {filteredMurals.length} results.
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
			)}
		</Stack>
	);
};

export default SearchEngine;
