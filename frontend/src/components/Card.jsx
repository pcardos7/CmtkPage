import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ChartLine from "./ChartLine";
import { API_ENDPOINTS } from "../BackEndData";

/**
 *  This component displays a card with a title, description and an image.
 *
 * @param {string} title - Card's title.
 * @param {string} description - Card's description.
 * @returns {JSX.Element} The Card component JSX.
 */
function Card({ title, description, selected }) {
	const { location } = useParams();
	const navigate = useNavigate();
	const [port, setPort] = useState("");
	const cmtk = title;
	const time = "1h"; // Duration back in time that the chart will show
	const [velocityX, setVelocityX] = useState([]);
	const [timesList, setTimesList] = useState([]);

	// Fetch the first available port in the cmtk
	useEffect(() => {
		async function fetchPorts() {
			if (!location) return;

			try {
				// Makes the GET request to get all active ports
				const response = await fetch(API_ENDPOINTS.getCmtkPorts(cmtk));

				// Error handler
				if (!response.ok) {
					throw new Error(`Failed to fetch ports: ${response.status}`);
				}

				// Stores the first port
				const jsonData = await response.json();
				if (Array.isArray(jsonData.data)) {
					setPort(jsonData.data[0]);
				} else {
					setPort("");
				}
			} catch (err) {
				console.error(err);
				setPort("");
			}
		}

		fetchPorts();
	}, [cmtk]);

	// Fetch cmtk's data
	useEffect(() => {
		async function fetchCmtkData() {
			if (!cmtk || !location || !port) return;

			try {
				// Makes the get request to get the data read by the port
				const response = await fetch(API_ENDPOINTS.getReadData(cmtk, time, port));

				// Error handler
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				// Gets the data
				const jsonData = await response.json();

				// Gets all timestamp
				const tData = jsonData.data.map((item) => item["time"]);

				// Get the X velocity
				const selectedData = jsonData.data.map((item) => item["Vibration Velocity RMS v-RMS X [mm/s]"]);

				// Store values
				setTimesList(tData);
				setVelocityX(selectedData);
			} catch (e) {
				console.error(e.message);
			}
		}

		fetchCmtkData();
	}, [cmtk, location, port]);

	return (
		<div className="card shadow-sm d-flex flex-column" style={{ maxWidth: "500px" }}>
			<div
				className=" m-0 p-0"
				style={{
					position: "relative",
					height: "200px",
					width: "300px",
					overflow: "hidden",
					margin: "0 auto",
				}}
			>
				{port && cmtk && <ChartLine x={timesList} y={velocityX} datasetLabel={""} chartTitle={``} cmtk={cmtk} port={port} height={200} width={300} showAxis={false} />}

				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 10,
						backgroundColor: "transparent",
						userSelect: "none",
						cursor: "default",
						height: "225px",
					}}
				/>
			</div>
			<div className="card-body">
				<h4>{title}</h4>
				<p>{description}</p>
				<div className="d-flex justify-content-between align-items-center">
					<div className="btn-group">
						<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`./${selected}`)}>
							View
						</button>
						<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/${selected}/settings`)}>
							Edit
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Card;
