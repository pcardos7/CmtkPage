import { useEffect, useState } from "react";
import "../styles/Template.css";
import HeaderComponent from "../components/Header";
import ListComponent from "../components/List";
import Navbar from "../components/Navbar";
import "../styles/style.css";
import "../BackEndData";
import { API_ENDPOINTS } from "../BackEndData";

const SAMPLING_TIME = 5000; // 5 seconds

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

	return (
		<>
			<div className="container-fluid d-flex vw-100 vh-100">
				<Navbar />
				<div className="w-100">
					<HeaderComponent label={"Home"} />
					<div className="d-block">
						<div className="d-flex ms-4 h-25 mb-3">
							{Object.entries(cmtkStates).length > 0 && (
								<div
									className="d-flex flex-wrap justify-content-start"
									style={{
										maxWidth: "90%", // overall container max width
										margin: "0 auto",
										gap: "1rem", // gap between groups
										fontSize: "0.5rem",
									}}
								>
									{Object.entries(cmtkStates).map(([key, value]) => (
										<div
											key={key}
											className="border rounded p-2"
											style={{
												width: 180,
												flex: "0 0 auto", // don't shrink, don't grow, maintain width
												boxSizing: "border-box",
												backgroundColor: "#fff",
											}}
										>
											<h4
												className="mb-2"
												style={{
													fontSize: "0.7rem",
												}}
											>
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
																? "#AD343E" // Fail state
																: state.warningState
																? "#E28413" // Warning state
																: state.failureState == undefined || state.warningState == undefined
																? "#DBDBDB" // No connection state
																: "#2B9720", // Ok
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
						<div className="d-flex h-75 justify-content-center align-items-center">
							<div className="card p-1" style={{ maxWidth: "600px", width: "100%" }}>
								<h3 className="text-center">Historial de Fallas</h3>
								{errorsHistory.length ? <ListComponent listData={errorsHistory} /> : <p>No hay fallas por mostras.</p>}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default HomePage;
