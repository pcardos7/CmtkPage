import { useState, useRef, useEffect } from "react";
import { API_ENDPOINTS } from "../BackEndData";
import { useNavigate } from "react-router-dom";

const SAMPLING_TIME = import.meta.env.VITE_SAMPLING_TIME;

function HeaderComponent({ label, showAlarmIcon = true }) {
	const navigate = useNavigate();

	// State to control menu open/close
	const [menuOpen, setMenuOpen] = useState(false);

	// Ref to detect clicks outside the alarm icon/menu
	const alarmRef = useRef(null);

	// State to track the count of alarms fetched so far; start at null to indicate not loaded
	const [alarmsLength, setAlarmsLength] = useState(null);

	// State to store the list of new alarms to show in the menu
	const [lastAlarms, setLastAlarms] = useState([]);

	// Toggle the visibility of the alarm menu
	const toggleMenu = () => setMenuOpen(!menuOpen);

	useEffect(() => {
		let intervalId;

		// Fetch alarms history and update states accordingly
		async function fetchAndUpdateAlarms() {
			try {
				const response = await fetch(API_ENDPOINTS.errorsHistory);
				const jsonData = await response.json();

				setAlarmsLength((prevAlarmsLength) => {
					// On first fetch, prevAlarmsLength is null, so just update it without detecting new alarms
					if (prevAlarmsLength === null) {
						return jsonData.data.length;
					}

					// If new alarms arrived (jsonData length is greater than previous length)
					if (jsonData.data.length > prevAlarmsLength) {
						// Slice new alarms from the array based on the previous length
						const newAlarms = jsonData.data.slice(prevAlarmsLength);
						// Add new alarms to existing list to show in the menu
						setLastAlarms((prev) => [...prev, ...newAlarms]);
						console.log("New alarms detected:", newAlarms);
					}

					// Update alarms length state to current length for next comparison
					return jsonData.data.length;
				});
			} catch (e) {
				console.error("Error fetching errors history:", e);
			}
		}

		// Perform initial fetch to get starting alarms count
		fetchAndUpdateAlarms().then(() => {
			// After initial fetch, start interval to poll every SAMPLING_TIME milliseconds
			intervalId = setInterval(fetchAndUpdateAlarms, SAMPLING_TIME);
		});

		// Clear interval on component unmount
		return () => clearInterval(intervalId);
	}, []);

	// Close the alarm menu if clicking outside of the menu or icon
	useEffect(() => {
		function handleClickOutside(event) {
			if (alarmRef.current && !alarmRef.current.contains(event.target)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Remove an alarm from the list when clicked
	const handleClickAlarm = (alarm) => {
		setLastAlarms((prevAlarms) => prevAlarms.filter((currentAlarm) => currentAlarm.date !== alarm.date));
		navigate(`ChartPage/${encodeURIComponent(alarm.area)}/${alarm.cmtk}`);
	};

	return (
		<div
			className="d-flex"
			style={{
				backgroundColor: "#202528",
				color: "white",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "12px 16px",
				position: "relative",
			}}
		>
			<h2 className="m-0" style={{ color: "white" }}>
				{label}
			</h2>
			{showAlarmIcon && (
				<div ref={alarmRef} style={{ position: "relative" }}>
					{/* Alarm bell icon */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						fill="currentColor"
						className="bi bi-bell me-5"
						viewBox="0 0 16 16"
						style={{ cursor: "pointer" }}
						onClick={toggleMenu}
					>
						<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
					</svg>

					{/* Dropdown menu with list of new alarms */}
					{menuOpen && (
						<ul
							style={{
								position: "absolute",
								top: "30px", // place below the icon
								right: 0,
								backgroundColor: "#32383e",
								color: "white",
								listStyle: "none",
								padding: "10px",
								margin: 0,
								borderRadius: "4px",
								boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
								zIndex: 1000,
								minWidth: "200px",
								maxHeight: "300px",
								overflowY: "auto", // scroll if too many alarms
							}}
						>
							{/* Show message if no new alarms */}
							{lastAlarms.length === 0 && <li style={{ padding: "6px 8px", fontStyle: "italic", color: "#999" }}>No new alarms</li>}

							{/* Map over alarms and make each item clickable to remove */}
							{lastAlarms.map((alarm) => (
								<li
									key={alarm.id}
									style={{
										padding: "6px 8px",
										borderBottom: "1px solid #444",
										cursor: "pointer",
									}}
									onClick={() => handleClickAlarm(alarm)}
									title="Click to dismiss this alarm"
								>
									{`${alarm.area}/${alarm.cmtk}/${alarm.port}: ${alarm.failure}`}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

export default HeaderComponent;
