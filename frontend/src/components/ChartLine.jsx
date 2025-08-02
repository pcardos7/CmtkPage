import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { API_ENDPOINTS } from "../BackEndData";

function ChartLine({ x, y, datasetLabel, chartTitle, cmtk, port, width, height, showAxis }) {
	const [maxVib, setMaxVib] = useState(0);
	const [maxTemp, setMaxTemp] = useState(0);
	const [warningVib, setWarningVib] = useState(0);
	const [warningTemp, setWarningTemp] = useState(0);

	useEffect(() => {
		async function fetchFormData() {
			try {
				// Makes the GET request to get the threshold values
				const response = await fetch(API_ENDPOINTS.getThresholdSensors(cmtk, port));

				// Handle error
				if (!response.ok) {
					throw new Error(`Failed to fetch data: ${response.status}`);
				}
				const jsonData = await response.json();

				// Set values
				setMaxTemp(jsonData.data.tempValueFailure);
				setMaxVib(jsonData.data.vibValueFailure);
				setWarningTemp(jsonData.data.tempWarning);
				setWarningVib(jsonData.data.vibWarning);
			} catch (err) {
				console.error(err);
			}
		}

		fetchFormData();
	}, [cmtk]);

	return (
		<div
			style={{
				maxWidth: width || 700,
				width: "100%",
				height: height || 500,
				justifyContent: "center",
				margin: "auto",
			}}
			key={`container-${cmtk}`}
		>
			<Plot
				data={[
					{
						x,
						y,
						type: "scatter",
						mode: "lines",
						marker: { color: "green" },
					},
				]}
				layout={{
					title: { text: chartTitle },
					margin: { t: 50, r: 20, b: 50, l: 50 },
					autosize: true,
					xaxis: {
						showticklabels: typeof showAxis === "boolean" ? showAxis : false,
					},
					shapes: [
						{
							type: "line",
							xref: "paper", // 'paper' means relative to the plotting area: 0 (left) to 1 (right)
							x0: 0, // start at left side
							x1: 1, // end at right side
							yref: "y", // y axis coords
							y0: chartTitle === "Historial Contact Temperature Contact Temperature [°C]" ? warningTemp : warningVib,
							y1: chartTitle === "Historial Contact Temperature Contact Temperature [°C]" ? warningTemp : warningVib,
							line: {
								color: "yellow",
								width: 2,
								dash: "dashdot",
							},
						},
						{
							type: "line",
							xref: "paper",
							x0: 0,
							x1: 1,
							yref: "y",
							y0: chartTitle === "Historial Contact Temperature Contact Temperature [°C]" ? maxTemp : maxVib,
							y1: chartTitle === "Historial Contact Temperature Contact Temperature [°C]" ? maxTemp : maxVib,
							line: {
								color: "red",
								width: 2,
								dash: "dashdot",
							},
						},
					],
				}}
				useResizeHandler={true}
				style={{ width: "100%", height: "100%" }}
			/>
		</div>
	);
}

export default ChartLine;
