import Grid from "@mui/material/Grid";
import Charts from "./Charts";
import Map from "./Map";
import { useEffect, useState } from "react";
import api from "../api/census";

const FrontPage = () => {
	const [loadingState, setLoadingState] = useState<boolean>(false);

	useEffect(() => {
		console.log("calling api...");
		fetchCensusDataForQueens();
	}, []);

	const fetchCensusDataForQueens = async () => {
		try {
			const response = await api.get("census/queens_data");
			console.log(response);
			setLoadingState(true);
		} catch (error) {
			alert(`Issue with fetching census data ${error}`);
		}
	};

	return (
		<Grid container padding={2}>
			<Grid size={{ xs: 8 }}>
				<Map />
			</Grid>
			<Grid size={{ xs: 4 }}>
				<Charts />
			</Grid>
		</Grid>
	);
};

export default FrontPage;
