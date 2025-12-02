import { Box, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import PieChartComp from "./utils/PieChart";

interface ChartsProps {
	selectedArea?: { [name: string]: any };
}

const Charts = ({ selectedArea }: ChartsProps) => {
	console.log("chart", selectedArea);
	const dictionary_race = {
		"American Indian or Alaska Native":
			selectedArea?.["american_indian_alaska_native"],
		Asian: selectedArea?.["asian"],
		Black: selectedArea?.["black"],
		White: selectedArea?.["white"],
		"Two or more races": selectedArea?.["two_or_more_races"],
		Other: selectedArea?.["some_other_race"],
	};

	const population_by_gender = {
		female: selectedArea?.["female_population"],
		male: selectedArea?.["male_population"],
	};

	const occupationTotals = {
		Management:
			(selectedArea?.["occ_mgmt_male"] ?? 0) +
			(selectedArea?.["occ_mgmt_female"] ?? 0),

		Service:
			(selectedArea?.["occ_service_male"] ?? 0) +
			(selectedArea?.["occ_service_female"] ?? 0),

		"Sales & Office":
			(selectedArea?.["occ_sales_office_male"] ?? 0) +
			(selectedArea?.["occ_sales_office_female"] ?? 0),

		"Construction & Maintenance":
			(selectedArea?.["occ_natres_const_maint_male"] ?? 0) +
			(selectedArea?.["occ_natres_const_maint_female"] ?? 0),

		"Production & Transportation":
			(selectedArea?.["occ_prod_transp_mat_male"] ?? 0) +
			(selectedArea?.["occ_prod_transp_mat_female"] ?? 0),
	};

	return !selectedArea ? (
		<Grid>NOTHING Selected</Grid>
	) : (
		<Grid
			alignItems="center"
			justifyContent="center"
			style={{ height: "100%" }}
		>
			<Box sx={{ width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
				<Stack direction="row" padding={2}>
					<PieChartComp dataDict={dictionary_race} heading="Race Proportion" />
					<PieChartComp
						dataDict={occupationTotals}
						heading="Occupation Proportion"
					/>
					<PieChartComp
						dataDict={population_by_gender}
						heading="Gender Proportion"
					/>
				</Stack>
			</Box>
		</Grid>
	);
};

export default Charts;
