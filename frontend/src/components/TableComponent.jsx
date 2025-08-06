import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../BackEndData";

// Styles for the table and cells
const tableStyle = {
	borderCollapse: "collapse", // Merge borders for cleaner look
};

const cellStyle = {
	border: "1px solid black", // Solid border for cells
	padding: "8px",
	textAlign: "left",
	fontSize: "0.8rem",
};

function LocationsTable() {
	// State to store the array of CMTK labels fetched from backend
	const [cmtkLabels, setCmtksLabels] = useState([]);

	// State to store the URL of the fetched image blob
	const [imgSrcs, setImgSrcs] = useState([]);

	// Effect to fetch CMTK labels once component mounts
	useEffect(() => {
		async function fetchCmtksLabels() {
			try {
				// Make GET request to fetch CMTK labels
				const response = await fetch(API_ENDPOINTS.getAllCmtksLabels);
				const jsonData = await response.json();
				// Store fetched labels in state
				setCmtksLabels(jsonData.data);
			} catch (e) {
				console.error("Error fetching CMTKs labels:", e);
			}
		}

		fetchCmtksLabels();
	}, []);

	// Effect to fetch image once component mounts
	useEffect(() => {
		async function fetchImage() {
			try {
				const urls = [];

				for (let i = 1; i < 4; i++) {
					// Fetch image from server
					const response = await fetch(API_ENDPOINTS.getLocationsImages(`${i}`));
					if (!response.ok) throw new Error("Network response was not ok");
					// Convert response to Blob for image data
					const blob = await response.blob();
					// Create a local URL for the blob object
					const url = URL.createObjectURL(blob);
					// Save the URL in state to use as img src
					urls.push(url);
				}

				setImgSrcs(urls);
			} catch (error) {
				console.error("Error fetching image:", error);
			}
		}

		fetchImage();
	}, []);

	return (
		<table style={tableStyle}>
			<tbody>
				<tr>
					<td style={cellStyle}>
						{/* Display image if loaded, otherwise show loading message */}
						{imgSrcs[0] ? <img src={imgSrcs[0]} alt="Piso 1" style={{ maxWidth: "8rem", height: "auto" }} /> : "Loading image..."}
					</td>
					{/* Second column with list spanning 3 rows */}
					<td style={cellStyle} rowSpan={3}>
						<ol>
							{/* Map over cmtkLabels to display each label as a list item */}
							{cmtkLabels.map((label, index) => (
								<li key={index}>{label}</li>
							))}
						</ol>
					</td>
				</tr>
				<tr>
					<td style={cellStyle}>
						{/* Display image if loaded, otherwise show loading message */}
						{imgSrcs[1] ? <img src={imgSrcs[1]} alt="Piso 2" style={{ maxWidth: "8rem", height: "auto" }} /> : "Loading image..."}
					</td>
				</tr>
				<tr>
					<td style={cellStyle}>
						{/* Display image if loaded, otherwise show loading message */}
						{imgSrcs[2] ? <img src={imgSrcs[2]} alt="Piso 3" style={{ maxWidth: "8rem", height: "auto" }} /> : "Loading image..."}
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default LocationsTable;
