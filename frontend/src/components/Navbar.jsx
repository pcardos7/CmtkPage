import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import fordLogo from "../assets/images/ford-logo.png";
import "../BackEndData";
import { API_ENDPOINTS } from "../BackEndData";

const Navbar = () => {
	const navigate = useNavigate();
	const [cmtks, setCmtks] = useState([]);
	const [isCmtkActive, setIsCmtkActive] = useState(false);

	useEffect(() => {
		async function fetchCmtksLocation() {
			try {
				// Makes the GET request to get all cmtk locations (areas)
				const response = await fetch(API_ENDPOINTS.getCmtkLocations);
				// Waits for the answer and stores it
				const jsonData = await response.json();
				setCmtks(jsonData.data);

				setIsCmtkActive(cmtks.some((value) => location.pathname === `/ChartPage/${value}`));
			} catch (err) {
				console.error(err);
			}
		}
		fetchCmtksLocation();
	}, []);

	/**
	 * Function to handle a click in settings button
	 * @param {Object} e    -   Error data
	 */
	const handleSettingsClick = (e) => {
		e.preventDefault();
		navigate("/Settings");
	};

	/**
	 * Function to handle a click in home button
	 * @param {Object} e    -   Error data
	 */
	const handleHomeClick = (e) => {
		e.preventDefault();
		navigate("/");
	};

	return (
		<div className="d-flex vh-100">
			<nav className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark" style={{ width: "200px" }} aria-label="Sidebar">
				<NavLink to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
					<img src={fordLogo} alt="ford logo" width="50px" />
					<span className="fs-4 ms-2">CMTK</span>
				</NavLink>
				<hr />
				<ul className="nav nav-pills flex-column mb-auto list-unstyled ps-0">
					<li className="nav-item">
						<button
							className="btn btn-dark w-100 text-start"
							onClick={handleHomeClick}
							style={{
								color: location.pathname === "/" ? "#0094C6" : undefined,
							}}
						>
							Home
						</button>
					</li>
					<li className="nav-item dropdown">
						<button
							className="btn btn-dark dropdown-toggle w-100 text-start"
							data-bs-toggle="dropdown"
							aria-expanded="false"
							style={{
								color: isCmtkActive ? "#0094C6" : undefined,
							}}
						>
							Cmtk
						</button>
						<ul className="dropdown-menu dropdown-menu-dark" style={{ maxHeight: "60vh", overflowY: "auto" }}>
							{cmtks.length > 0 ? (
								cmtks.map((cmtkLabel, index) => (
									<li key={index}>
										<NavLink className="dropdown-item" to={`/ChartPage/${cmtkLabel}`}>
											{cmtkLabel}
										</NavLink>
									</li>
								))
							) : (
								<li className="dropdown-item text-muted">No locations available</li>
							)}
						</ul>
					</li>
					<li>
						<button
							className="btn btn-dark w-100 text-start"
							onClick={handleSettingsClick}
							style={{
								color: location.pathname === "/Settings" ? "#0094C6" : undefined,
							}}
						>
							Ajustes
						</button>
					</li>
				</ul>
			</nav>
			{/* Main content area could go here */}
		</div>
	);
};

export default Navbar;
