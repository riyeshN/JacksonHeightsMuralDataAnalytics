import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

interface ChartsProps {
	selectedArea?: { [name: string]: any };
}

const Charts = ({ selectedArea }: ChartsProps) => {
	console.log("from chart", selectedArea);
	return !selectedArea ? (
		<Grid>NOTHING Selected</Grid>
	) : (
		<Grid
			alignItems="center"
			justifyContent="center"
			style={{ height: "100%" }}
		>
			<Grid size={{ xs: 12 }}>
				{Object.entries(selectedArea).map(([key, value]) => (
					<Typography>{`${key} : ${value}`}</Typography>
				))}
			</Grid>
		</Grid>
	);
};

export default Charts;
