import Grid from "@mui/material/Grid";
import Map from "./Map";

const FrontPage = () => {
	return (
		<Grid container padding={2}>
			<Grid size={{ xs: 12 }}>
				<Map />
			</Grid>
		</Grid>
	);
};

export default FrontPage;
