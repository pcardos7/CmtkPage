import { useEffect, useState } from "react";
import "../styles/Template.css";
import HeaderComponent from "../components/Header";
import ListComponent from "../components/List";
import Navbar from "../components/Navbar";
import "../styles/style.css";
import "../BackEndData";
import { API_ENDPOINTS } from "../BackEndData";

const SAMPLING_TIME = import.meta.env.VITE_SAMPLING_TIME;

let errorIntervalID;
let healthIntervalID;

function HomePage() {
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
					<HeaderComponent label={"Home"} showAlarmIcon={false} />
					<div style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
						<div className="d-flex justify-content-end me-5 mt-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="25"
								height="25"
								fill="currentColor"
								className="bi bi-arrow-clockwise"
								viewBox="0 0 16 16"
								onClick={() => {
									RechargeCmtks();
								}}
								style={{ cursor: "pointer" }}
							>
								<title>Recargar conexiones</title>
								<path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
								<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
							</svg>
						</div>

						<div className="d-flex ms-4 mb-3 flex-wrap">
							{Object.entries(cmtkStates).length > 0 && (
								<div
									className="d-flex flex-wrap justify-content-start"
									style={{
										maxWidth: "90%",
										margin: "0 auto",
										gap: "1rem",
										fontSize: "0.5rem",
									}}
								>
									{Object.entries(cmtkStates).map(([key, value]) => (
										<div
											key={key}
											className="border rounded p-2"
											style={{
												width: 180,
												flex: "0 0 auto",
												boxSizing: "border-box",
												backgroundColor: "#fff",
											}}
										>
											<h4 className="mb-2" style={{ fontSize: "0.7rem" }}>
												{key}
											</h4>
											<div className="d-flex flex-nowrap flex-row">
												{Object.entries(value).map(([cmtkName, state]) => (
													<a
														key={cmtkName}
														href={`./ChartPage/${key}/${cmtkName}`}
														title={cmtkName}
														aria-label={`View details for ${cmtkName}`}
														className="d-inline-block"
														style={{
															width: 20,
															height: 20,
															backgroundColor: state.failureState
																? "#AD343E"
																: state.warningState
																? "#E28413"
																: state.failureState == undefined || state.warningState == undefined
																? "#DBDBDB"
																: "#2B9720",
															marginRight: 6,
														}}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
							<div className="card p-1" style={{ maxWidth: "600px", width: "100%" }}>
								<h3 className="text-center">Historial de Fallas</h3>
								{errorsHistory.length ? <ListComponent listData={errorsHistory} /> : <p>No hay fallas por mostrar.</p>}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default HomePage;
