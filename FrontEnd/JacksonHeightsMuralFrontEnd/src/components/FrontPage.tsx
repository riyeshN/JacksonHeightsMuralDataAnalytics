import Grid from "@mui/material/Grid";
import Charts from "./Charts";
import Map from "./Map";
import { useEffect, useState } from "react";
import api from "../api/census";
import React from "react";
import { Box, CircularProgress } from "@mui/material";

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
