import { Box, Stack, Typography } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface PieProps {
	dataDict: Record<string, number>;
	heading: string;
}

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#AA336A",
	"#1cc221ff",
];

const PieChartComp = ({ dataDict, heading }: PieProps) => {
	const data = Object.entries(dataDict).map(([key, value]) => ({
		name: key,
		value: value,
	}));

	return (
		<Stack alignItems="center" padding={2} spacing={2}>
			<Typography>{heading}</Typography>

			<PieChart
				width={400}
				height={350}
				margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
			>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					outerRadius={110}
					label
				>
					{data.map((_, index) => (
						<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
					))}
				</Pie>

				<Tooltip />
				<Legend />
			</PieChart>
		</Stack>
	);
};

export default PieChartComp;
