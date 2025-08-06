import { useEffect, useState } from "react";
import "../styles/Template.css";
import HeaderComponent from "../components/Header";
import ListComponent from "../components/List";
import Navbar from "../components/Navbar";
import "../styles/style.css";
import "../BackEndData";
import { API_ENDPOINTS } from "../BackEndData";
import LocationsTable from "../components/TableComponent";

const SAMPLING_TIME = import.meta.env.VITE_SAMPLING_TIME;

let errorIntervalID;
let healthIntervalID;

function LocationsPage() {
	const [errorsHistory, setErrorsHistory] = useState([]); // Variable to store the errors history
	const [cmtkStates, setCmtkStates] = useState({});

	useEffect(() => {
		async function fetchErrorsHistory() {
			try {
				// Do the GET request to get all errors history and stores it
				const response = await fetch(API_ENDPOINTS.errorsHistory);
				const jsonData = await response.json();
				setErrorsHistory(jsonData.data);
			} catch (e) {
				console.error("Error fetching errors history:", e);
			}
		}

		fetchErrorsHistory();

		errorIntervalID = setInterval(fetchErrorsHistory, SAMPLING_TIME); // Fetch errors history every 5 seconds

		return () => clearInterval(errorIntervalID); // Clear the interval on component unmount
	}, []);

	useEffect(() => {
		async function fetchErrorsHealth() {
			try {
				// Do the GET request to get states of all cmtk
				const response = await fetch(API_ENDPOINTS.getHealthAll);
				const jsonData = await response.json();
				setCmtkStates(jsonData.data);
			} catch (e) {
				console.error("Error fetching health:", e);
			}
		}

		fetchErrorsHealth();

		healthIntervalID = setInterval(fetchErrorsHealth, SAMPLING_TIME); // Fetch health every 5 seconds

		return () => clearInterval(healthIntervalID); // Clear the interval on component unmount
	}, []);

	const RechargeCmtks = () => {
		async function Connect2Cmtks() {
			try {
				// Makes the GET request to connect to all cmtk
				const response = await fetch(API_ENDPOINTS.connect2Cmtks);

				// Handle error
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (err) {
				console.error(err.message);
			}
		}

		Connect2Cmtks();
	};

	return (
		<>
			<div className="container-fluid d-flex vw-100 vh-100" style={{ overflow: "hidden" }}>
				<Navbar />
				<div className="d-flex flex-column w-100" style={{ height: "100vh" }}>
					<HeaderComponent label={"Ubicaciones"} />
					<div className="d-flex justify-content-center align-items-center" style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
						<LocationsTable />
					</div>
				</div>
			</div>
		</>
	);
}

export default LocationsPage;
