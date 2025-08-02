/** Express router providing data related routes
 * @module routers/users
 * @requires express
 * @requires cors
 */

import express from "express";
import cors from "cors";
import MQTT from "./ApiMQTT.js";
import InfluxDB_ from "./ApiInfluxDB.js";
import Sensor from "./ApiSensors.js";
import fs from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { clear } from "console";

const LOCAL_SERVER_PORT = 3000; // Local server port
const MQTT_PORT = 1883; // MQTT PORT (CMTK)
const SERVER_PORT = 1883; // MQTT PORT (Plant server)
const INFLUXDB_PORT = 8086; // INFLUXDB PORT (CMTK)
const KEEP_ERRORS = 12; // Amount of hours to keep errors in history
const FRONTEND_DIRECTION = "http://localhost:5173"; // Frontend direction
const PLANT_SERVER_IP = "127.0.0.1"; // Plant server IP (MQTT server)
const CMTKs_PATH = "./CMTKS_DATA.json"; // Path to the CMTKs data file

/* Periodic connection variables */
const CONNECTION_SAMPLING_TIME = 1000; // Time to wait between connection attempts
let connectionIntervalID; // ID of the interval for connection attempts
let noConnectedCmtk = []; // Array to store all the cmtk that weren't connected

/*Periodic sampling variables */
let samplingTime = 1000; // Time per sample (default value)
let samplingID; // ID of the interval for sampling

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Array to hold information about all CMTKs.
 * Each element is the area where the CMTKs are located. Inside it are
 * all the CMTKs; each key represents a CMTK's name and contains data
 * about the CMTK such as IP, MQTT instances, and influx connection.
 */
let CMTKs;

const app = express();

app.use(
	cors({
		origin: [FRONTEND_DIRECTION, "http://192.168.10.14:5173", "http://19.135.121.133:5173"], // allow only frontend
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"], // expected headers
	})
);

app.use(express.json());

/**
 * Array to hold the latest errors.
 * Each element is an object with the following structure:
 * {
 *   location: string,
 *   cmtk: string,
 *   failure: string,
 *   date: string
 * }
 */
const errorsHistory = [
	{
		location: "test",
		cmtk: "testCmtk",
		port: "testPort",
		failure: "testFailure",
		date: "2024-06-04 08:23:07",
	},
];

/* MQTT conection to plant server 
    Change with server's info
*/
const PlantServerMQTT = new MQTT({
	ip: PLANT_SERVER_IP, // Server ip
	port: SERVER_PORT,
	topic: "balluff/cmtk/master1/iolink/devices/port1/data/fromdevice",
	client_id: "client-mqtt-1",
	username: "user",
	password: "Balluff#1",
});

// Init MQTT connection
// await PlantServerMQTT.InitMQTT();

/**
 * Function to create a .json file with the
 * given data.
 *
 * @param {string} title - JSON file's path
 * @param {Object} data - Data to store
 */
function CreateJsonFile(title, data) {
	const jsonData = JSON.stringify(data, null, 2);
	fs.writeFile(title, jsonData, "utf8", (e) => {
		if (e) {
			console.error(`Error writing ${title}`);
		} else {
			console.log(`Data written to ${title}`);
		}
	});
}

/**
 * Function to read a JSON file asynchronously.
 *
 * @param {string} title - JSON file's path
 * @returns {Promise<Object>} The parsed JSON object.
 */
async function ReadJsonFile(title) {
	const data = await readFile(title, "utf8"); // Read file as string
	return JSON.parse(data); // Parse JSON and return
}

/**
 * Gets all CMTK's info
 * This function reads the CMTK data from a JSON file
 */
async function loadCMTKs() {
	try {
		// Read CMTK locations (relative path)
		const cmtksData = await ReadJsonFile(path.join(__dirname, CMTKs_PATH));

		CMTKs = cmtksData;
	} catch (error) {
		console.error("Failed to read JSON files:", error);
	}
}

/**
 * Deletes all errors in errorsHistory older than the internal cutoff date.
 */
function DepureHistory() {
	///// Gets the date KEEP_ERRORS hours ago ///////
	const now = new Date();
	const dateToDelete = new Date(now.getTime() - KEEP_ERRORS * 60 * 60 * 1000); // Timestamp indicating the cutoff time; errors older than this will be deleted

	// Format the date to match the format in errorsHistory
	const year = dateToDelete.getFullYear();
	const month = String(dateToDelete.getMonth() + 1).padStart(2, "0");
	const day = String(dateToDelete.getDate()).padStart(2, "0");
	const hours = String(dateToDelete.getHours()).padStart(2, "0");
	const minutes = String(dateToDelete.getMinutes()).padStart(2, "0");
	const seconds = String(dateToDelete.getSeconds()).padStart(2, "0");

	const formattedDateToDelete = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	/////////////////////////////////////////////////

	for (let index = errorsHistory.length - 1; index >= 0; index--) {
		const element = errorsHistory[index].date;

		if (element < formattedDateToDelete) {
			errorsHistory.splice(index, 1); // Remove one element at index position
		}
	}
}

/**
 *  This fucntions detects the errors and stores them.
 */
function ErrorsHandler() {
	// Loop through all areas
	for (let area of Object.keys(CMTKs)) {
		// Loor through all cmtks of the current area
		for (let cmtkLabel of Object.keys(CMTKs[area])) {
			// If cmtk is not connected pass it
			if (noConnectedCmtk.includes(cmtkLabel) || findCmtk(cmtkLabel) === null) {
				continue;
			}

			// Get the cmtk instance
			const cmtk = CMTKs[area][cmtkLabel];
			const ports = Object.keys(cmtk.ports);

			// At least one port shall be enabled
			if (cmtk.ports.length !== 0) {
				for (let index = 0; index < ports.length; index++) {
					const port = ports[index]; // Current port

					if (cmtk.ports[port].lastReadValues.length === 0) {
						break;
					}

					// Check if there is a warning
					const error = cmtk.ports[port].DetectEngineFailure();
					cmtk.ports[port].DetectEngineWarning();
					cmtk.ports[port].DetectEngineOk();

					if (error == true) {
						const result = { ...cmtk.ports[port].error, area };
						errorsHistory.push(result);
					}
				}
			}
		}
	}
}

/**
 * Connects to the specified CMTK.
 *
 * @param {string} cmtkLabel - The label of the CMTK to connect to.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 */
async function Connect2Cmtk(cmtkLabel) {
	const cmtk = findCmtk(cmtkLabel);

	try {
		if (cmtk) {
			// Create the influx connection to the cmtk
			cmtk.influxConnection = new InfluxDB_({
				host: cmtk.ip, // Cmtk ip
				port: INFLUXDB_PORT,
				protocol: "https",
				database: "balluffCMTKDatabase",
				username: "cmtk",
				password: "Balluff#1",

				options: {
					rejectUnauthorized: false,
				},
			});

			// Initialize the InfluxDB connection
			await cmtk.influxConnection.InitInfluxDB();

			// Await the tables directly using await instead of then
			const tables = await cmtk.influxConnection.GetTables();

			cmtk.enabledPorts = tables; // Save the active ports

			// If no table is read
			if (tables === null) {
				console.error(`No port detected. ${cmtkLabel}: ${cmtk.description}.`);
				return false; // Exit early, return false to indicate failure
			}

			// Loop through all ports of the current cmtk
			for (let port of tables) {
				// Create MQTT instance for the current port
				cmtk.ports[port] = new Sensor({
					ip: cmtk.ip,
					name: port,
					cmtkPort: port,
					port: MQTT_PORT,
					topic: `balluff/cmtk/master1/iolink/devices/${port}/data/fromdevice`,
					user: "user",
					password: "Balluff#1",
					cmtk: cmtkLabel,
				});

				// Inits the MQTT instance, await here too
				await cmtk.ports[port].mqttInstance.InitMQTT();
			}

			return true; // Return true if connection is successful
		} else {
			console.error(`CMTK with label ${cmtkLabel} not found.`);
			return false;
		}
	} catch (error) {
		console.error("Error connecting to CMTK:", error);
		return false; // Return false if connection fails
	}
}

/**
 * Tries to connect to the specified CMTK.
 * This function iterates through the `noConnectedCmtk` array,
 *
 */
async function Try2Connect() {
	// Loop through all CMTKs that are not connected
	for (let cmtkLabel of noConnectedCmtk) {
		// Attempt to connect to the CMTK
		const connected = await Connect2Cmtk(cmtkLabel);

		// If connected, log the success and remove from the noConnectedCmtk array
		if (connected) {
			console.log(`Connected to CMTK: ${cmtkLabel}`);
			// Remove connected CMTK from the list
			noConnectedCmtk = noConnectedCmtk.filter((label) => label !== cmtkLabel);

			if (noConnectedCmtk.length === 0) {
				// Clear the interval if all CMTKs are connected
				clearInterval(connectionIntervalID);
			}
		}
	}
}

/**
 *  Find the cmtk instance.
 * @param {string} cmtkValue
 * @returns {Object} Cmtk's instance.
 */
function findCmtk(cmtkValue) {
	try {
		for (let area of Object.keys(CMTKs)) {
			if (Object.keys(CMTKs[area]).includes(cmtkValue)) {
				return CMTKs[area][cmtkValue]; // The location key itself
			}
		}
	} catch (error) {
		console.error("Error finding CMTK:", error);
	}
	return null; // Not found
}

/**
 * This function receive the cmtk's name and returns
 * it's location.
 * @param {string} cmtkLabel - Cmtk's name
 * @returns {string} - Cmtk's location.
 */
function findLocationByCmtk(cmtkLabel) {
	for (let area of Object.keys(CMTKs)) {
		if (Object.keys(CMTKs[area]).includes(cmtkLabel)) {
			return area;
		}
	}
	return null; // Not found
}

app.use((req, res, next) => {
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Access-Control-Allow-Origin", "*");
	next();
});

/**
 * GET /api/errors-history
 *
 * Responds with the error history object.
 *
 * Response format:
 * {
 *   success: boolean,          // Indicates if the request was successful
 *   data: Object               // The error history object containing error records
 * }
 */
app.get("/api/errors-history", (req, res) => {
	res.json({
		success: true,
		data: errorsHistory,
	});
});

/**
 * GET /api/cmtk-locations
 *
 * Responds with the cmtks of each area.
 *
 * Response format:
 * {
 *   success: boolean,          // Indicates if the request was successful
 *   data: Object               // Cmtk locations
 * }
 */
app.get("/api/cmtk-locations", (req, res) => {
	res.json({
		success: true,
		data: Object.keys(CMTKs),
	});
});

/**
 * GET /api/get-data/:cmtk
 *
 * Fetches all read data for the specified port of the cmtk.
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for
 *
 * Query Parameters:
 *   - time {string}      : A timestamp or time filter to query specific data snapshots.
 *   - port {string}      : Specifies the port or channel to filter data on.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object containing all relevant data for the specified CMTK and filters
 * }
 *
 */
app.get("/api/get-data/:cmtk", (req, res) => {
	const { cmtk } = req.params;
	const time = req.query.time; // Get time
	const consultedPort = req.query.port; // Get port

	try {
		// Validate required parameters
		if (!cmtk || !time || !consultedPort) {
			return res.status(400).json({
				success: false,
				message: "Missing required parameters.",
			});
		}
		// Find the CMTK instance
		const cmtkData = findCmtk(cmtk);

		// If CMTK instance is not found, return an error
		if (!cmtkData) {
			return res.status(404).json({
				success: false,
				message: "CMTK not found.",
			});
		}
		// Initialize the InfluxDB connection
		cmtkData.influxConnection.InitInfluxDB();

		// Getting the last 24h data
		cmtkData.influxConnection
			.GetPreviousSampled(consultedPort, time)
			.then((portData) => {
				if (portData) {
					// Return the index (and maybe other info if you want)
					res.json({
						success: true,
						data: portData,
					});
				} else {
					console.log("No data returned");
				}
			})
			.catch((error) => {
				console.error("Error fetching port data:", error);

				return res.status(500).json({
					success: false,
					message: "Error fetching port data.",
				});
			});
	} catch (e) {
		console.error(`Error at GET request /api/get-data/:cmtk -> ${e.message}`);
		return res.status(500).json({
			success: false,
			data: e.message,
		});
	}
});

/**
 * GET /api/get-location/:cmtkLabel
 *
 * Returns the location of the cmtk.
 *
 * URL Parameters:
 *   - cmtkLabel {string}      : The CMTK identifier to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: string        // Location
 * }
 *
 */
app.get("/api/get-location/:cmtkLabel", (req, res) => {
	try {
		const { cmtkLabel } = req.params;
		const location = findLocationByCmtk(cmtkLabel);

		res.json({
			success: true,
			data: location,
		});
	} catch (error) {
		// Return fail
		res.json({
			success: false,
			message: error.message,
		});
		console.error(`Error getting cmtk's location(${cmtkLabel}): ${error.message}`);
	}
});

/**
 * GET /api/get-ports/:cmtk
 *
 * Returns a list with all ports with data.
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: list        // List with all the ports that have data
 * }
 *
 */
app.get("/api/get-ports/:cmtk", (req, res) => {
	const { cmtk } = req.params;
	const cmtkInstance = findCmtk(cmtk); // Gets the cmtk instance

	try {
		cmtkInstance.influxConnection.InitInfluxDB(); // Init the inflix connection

		// Get all influx tables (ports)
		cmtkInstance.influxConnection.GetTables().then((ports) => {
			res.json({
				success: true,
				data: ports,
			});
		});
	} catch (error) {
		// Return fail
		res.json({
			success: false,
			message: error.message,
		});
		console.error(`Error al conectar con el cmtk(${cmtk}): ${error.message}`);
	}
});

/**
 * GET /api/get-health/:cmtk
 *
 * Returns an object with fail and warning states
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for
 *
 *  * Query Parameters:
 *   - port {string}      : Specifies the port or channel to filter data on.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object with vibration and temperature warning and fail states
 * }
 *
 */
app.get("/api/get-health/:cmtk", (req, res) => {
	const { cmtk } = req.params;

	const cmtkData = findCmtk(cmtk);
	const consultedPort = req.query.port; // Get port

	try {
		const sensor = cmtkData.ports[consultedPort]; // Get sensor data

		res.json({
			success: true,
			data: {
				tempWarning: sensor.tempWarning,
				vibWarning: sensor.vibWarning,
				tempFailure: sensor.tempFailure,
				vibFailure: sensor.vibFailure,
			},
		});
	} catch (e) {
		console.error(`Error GET request /api/get-health/:cmtk ${e.message}`);
	}
});

/**
 * GET /api/description/:cmtkLabel
 *
 * Returns the description of the selected cmtk.
 *
 * URL Parameters:
 *   - cmtkLabel {string}      : The CMTK identifier to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: string        // The cmtk description
 * }
 *
 */
app.get("/api/description/:cmtkLabel", (req, res) => {
	const { cmtkLabel } = req.params;

	const cmtkData = findCmtk(cmtkLabel); // Get cmtk instance

	res.json({
		success: true,
		data: cmtkData.description,
	});
});

/**
 * GET /api/ip/:cmtk
 *
 * Returns the ip of the selected cmtk.
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: string        // The cmtk ip
 * }
 *
 */
app.get("/api/ip/:cmtk", (req, res) => {
	const { cmtk } = req.params;

	const cmtkData = findCmtk(cmtk); // Get cmtk instance

	res.json({
		success: true,
		data: cmtkData.ip,
	});
});

/**
 * GET /api/port-name/:cmtk
 *
 * Returns an object quit fail and warning states
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for
 *   - port {string}      : Specifies the port or channel to filter data on.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: string        // The name of the port (name is what is going to be display at the page)
 * }
 *
 */
app.get("/api/port-name/:cmtk/:port", (req, res) => {
	const { cmtk, port } = req.params;
	const cmtkInstance = findCmtk(cmtk);

	res.json({
		success: true,
		data: cmtkInstance.ports[port].name,
	});
});

/**
 * GET /api/ports-names/:cmtk
 *
 * Returns a list with the names of all ports
 *
 * URL Parameters:
 *   - cmtk {string}      : The CMTK identifier to fetch data for.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: list        // List with all the ports names
 * }
 *
 */
app.get("/api/ports-names/:cmtk", (req, res) => {
	const { cmtk } = req.params;
	const cmtkInstance = findCmtk(cmtk);

	// Gets all the ports
	const keys = Object.keys(cmtkInstance.ports);

	// Mapping through all key
	const names = keys.map((key) => cmtkInstance.ports[key]?.name).filter((name) => name !== undefined); // Remove any undefined values

	res.json({
		success: true,
		data: names,
	});
});

/**
 * GET /api/description/:location
 *
 * Returns a list with all the descrition of each cmtk of the area
 *
 * URL Parameters:
 *   - location {string}      : The area to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: list        // List with all descriptions
 * }
 *
 */
app.get("/api/descriptions/:location", (req, res) => {
	const { location } = req.params;

	const descriptions = Object.entries(CMTKs[location]).map(([cmtkLabel, cmtk]) => {
		const cmtkInstance = findCmtk(cmtkLabel);

		return cmtkInstance != null ? cmtkInstance.description : "Sin descripcion";
	});

	res.json({
		success: true,
		data: descriptions,
	});
});

/**
 * GET /api/get-general-settings
 *
 * Returns the settings that are applied to all sensors
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object with all general settings
 * }
 */
app.get("/api/get-general-settings", (req, res) => {
	try {
		res.json({
			success: true,
			data: {
				cpf: Sensor.countToBeFail,
				cph: Sensor.countToBeHealth,
				samplingTime: samplingTime,
			},
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

/**
 * GET /api/get-cmtks/:area
 *
 * Returns the names of all cmtks in the specified area.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object with all general settings
 * }
 */
app.get("/api/get-cmtks/:area", (req, res) => {
	const { area } = req.params;
	try {
		res.json({
			success: true,
			data: Object.keys(CMTKs[area]),
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

/**
 * POST /api/set-form-values/
 *
 * Sets the values filled in settings page.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object with all the new data
 * }
 *
 */
app.post("/api/set-form-values", (req, res) => {
	try {
		const formValues = req.body.value;

		if (formValues === undefined) {
			return res.status(400).json({
				success: false,
				message: "Vibration not settled, value is nedded.",
			});
		}

		// Set new sampling time
		samplingTime = formValues.samplingTime;
		clearInterval(samplingID);
		samplingID = setInterval(ErrorsHandler, samplingTime);

		res.json({
			success: true,
			data: {
				cpf: Sensor.SetCountToFail(formValues.cpf),
				cph: Sensor.SetCountToHealth(formValues.cph),
				samplingTime: samplingTime,
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

/**
 * POST /api/set-cmtk-form-values/:cmtk
 *
 * This api sets the values filled in the card settings page
 *
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object         // Object with the new description and name
 * }
 *
 */
app.post("/api/set-cmtk-form-values", (req, res) => {
	try {
		const formValues = req.body.value;

		// Return error if formValues is undefined
		if (formValues === undefined) {
			return res.status(400).json({
				success: false,
				message: "Form undefined",
			});
		}

		// Get cmtk instance
		const cmtkData = findCmtk(formValues.cmtk);

		// Set new description
		cmtkData.description = formValues.description;

		// Set new ip
		cmtkData.ip = formValues.ip;

		// If port and name are settled, set the new value
		if (formValues.port.length > 0 && formValues.name.length > 0) {
			cmtkData.ports[formValues.port].SetName(formValues.name);
		}

		res.json({
			success: true,
			data: {
				description: cmtkData.description,
				names: cmtkData.ports.keys,
			},
		});
	} catch (error) {
		// Return fail
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

/**
 * POST /api/set-sensor-setpoints/
 *
 * This api sets a new values for warning and failure of the specified port.
 *
 *  * Query Parameters:
 *   - values {object}      : Object with the cmtk data
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: boolean        // True when success
 * }
 *
 */
app.post("/api/set-sensor-setpoints", (req, res) => {
	try {
		const values = req.body.value;
		const cmtk = findCmtk(values.cmtk);
		const port = cmtk.ports[values.port];
		let vibSettled = false;
		let tempSettled = false;
		let failMessage = "El valor de falla debe ser mayor que el de warning. ";

		if (values === undefined) {
			return res.status(400).json({
				success: false,
				message: "Vibration not settled, value is nedded.",
			});
		}

		if (values.tempValueFailure > values.tempValueWarning) {
			// Set the new temperature values
			port.SetTempValueFailure(values.tempValueFailure);
			port.SetTempValueWarning(values.tempValueWarning);
			tempSettled = true;
		} else {
			failMessage += "Temperatura no guardada. ";
		}

		if (values.vibValueFailure > values.vibWarning) {
			// Set the new vib values
			port.SetVibValueFailure(values.vibValueFailure);
			port.SetVibValueWarning(values.vibValueWarning);
			vibSettled = true;
		} else {
			failMessage += "Vibracion no guardada.";
		}

		// Fail if vib or temp wasn't settled
		if (!tempSettled || !vibSettled) {
			res.json({
				success: false,
				message: failMessage,
			});
		} else {
			res.json({
				success: true,
				data: true,
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			data: false,
			message: "Internal server error",
		});
	}
});

/**
 * POST /api/add-cmtk
 *
 * This api adds a new CMTK.
 *
 *  * Query Parameters:
 *   - values {object}      : Object with the cmtk data
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: boolean        // True when success
 * }
 *
 */
app.post("/api/add-cmtk", (req, res) => {
	try {
		const newCmtk = req.body.value;

		// Adding the cmtk into its area
		CMTKs[newCmtk.area].push(newCmtk.cmtk);

		// Add the new cmtk to cmtks list
		CMTKs.push({
			[newCmtk.cmtk]: {
				ip: newCmtk.ip,
				ports: {},
				influxConnection: null,
				description: newCmtk.description,
				enabledPorts: [],
			},
		});

		// Adding the new cmtk to files
		CreateJsonFile("CMTK_LOCS.json", CMTK_LOCS);
		CreateJsonFile("CMTKs.json", CMTKs);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			data: false,
			message: "Internal server error",
		});
	}
});

/**
 * DELETE /api/delete-history
 *
 * Drop all elements of errorsHistory array.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: boolean        // True on success.
 * }
 *
 */
app.delete("/api/delete-history", (req, res) => {
	try {
		errorsHistory.length = 0;

		res.json({
			success: true,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

/**
 * GET /api/set-count-to-fail
 *
 * Query Parameters:
 *   - value {string}      : Count to be fail
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: number        // Count to fail new value
 * }
 *
 */
app.get("/api/set-count-to-fail", (req, res) => {
	try {
		const value = req.query.value;

		res.json({
			success: true,
			data: Sensor.SetCountToFail(value),
		});
	} catch (e) {
		console.error(`Error GET request /api/set-count-to-fail: ${e.message}`);
		res.json({
			success: false,
			message: e.message,
		});
	}
});

/**
 * GET /api/set-sampling-time
 *
 * Sets the sampling time of the error handler
 *
 *  * Query Parameters:
 *   - value {string}      : Sampling time (ms)
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object with vibration and temperature warning and fail states
 * }
 *
 */
app.get("/api/set-sampling-time", (req, res) => {
	try {
		const value = Number(req.query.value);

		// Validate the input (e.g., ensure it's a positive number)
		if (value <= 0) {
			return res.status(400).json({ message: "Invalid sampling time" });
		}

		samplingTime = value;
		clearInterval(samplingID);
		samplingID = setInterval(ErrorsHandler, samplingTime);

		res.json({
			message: "Sampling time updated",
			data: samplingTime,
		});
	} catch (e) {
		console.error(`Error GET request /api/set-sampling-time: ${e.message}`);
		res.json({
			success: false,
			message: e.message,
		});
	}
});

/**
 * GET /api/get-data/:cmtkLabel/:portLabel
 *
 * Fetches all read data for the specified port of the cmtk.
 *
 * URL Parameters:
 *   - cmtkLabel {string}  : Cmtk to fetch data for
 *   - portLabel {string}      : Port to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object containing all warning and failure values
 * }
 *
 */
app.get("/api/get-sensor-data/:cmtkLabel/:portLabel", (req, res) => {
	const { cmtkLabel, portLabel } = req.params;
	const cmtk = findCmtk(cmtkLabel);
	const sensor = cmtk.ports[portLabel];
	try {
		res.json({
			success: true,
			data: {
				vibValueFailure: sensor.vibValueFailure,
				vibWarning: sensor.vibValueWarning,
				tempValueFailure: sensor.tempValueFailure,
				tempWarning: sensor.tempValueWarning,
			},
		});
	} catch (error) {
		res.json({
			success: false,
			message: error.message,
		});
	}
});

/**
 * GET /api/get-threshold-sensors/:cmtk/:port
 *
 * Returns the warning and failure values for the specified sensor
 *
 * URL Parameters:
 *   - cmtkLabel {string}      : The CMTK identifier to fetch data for
 *   - portLabel {string}      : Port to fetch data for
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object containing all sensor's warning and fail data
 * }
 *
 */
app.get("/api/get-threshold-sensors/:cmtkLabel/:portLabel", (req, res) => {
	const { cmtkLabel, portLabel } = req.params;
	const cmtk = findCmtk(cmtkLabel);
	const port = cmtk.ports[portLabel];
	try {
		res.json({
			success: true,
			data: {
				vibValueFailure: port.vibValueFailure,
				vibWarning: port.vibValueWarning,
				tempValueFailure: port.tempValueFailure,
				tempWarning: port.tempValueWarning,
			},
		});
	} catch (error) {
		res.json({
			success: false,
			message: error.message,
		});
	}
});

/**
 * GET /api/get-health-all/
 *
 * Fetches all warning and fail states of all ctmks.
 *
 * Response format:
 * {
 *   success: boolean,    // Indicates if the request was successful
 *   data: Object        // Object containing all cmtk states
 * }
 *
 */
app.get("/api/get-health-all", (req, res) => {
	try {
		const cmtkStates = {}; // Var were cmtk states will be stored

		for (let area of Object.keys(CMTKs)) {
			cmtkStates[area] = {};
			// Looking for all the cmtks of the corrent area
			for (let cmtkLabel of Object.keys(CMTKs[area])) {
				const cmtk = CMTKs[area][cmtkLabel]; // Get the cmtk instance
				cmtkStates[area][cmtkLabel] = {};

				if (cmtk === null) {
					continue;
				}

				let portsWarning = false; // Will be active if at least one port is in warning state
				let portsFailure = false; // Will bi active if at least one port is in failure state

				for (let port of Object.keys(cmtk.ports)) {
					portsWarning |= cmtk.ports[port].tempWarning || cmtk.ports[port].vibWarning;

					portsFailure |= cmtk.ports[port].tempFailure || cmtk.ports[port].vibFailure;
				}

				// Add the cmtk state to cmtkStates
				cmtkStates[area][cmtkLabel] = {
					warningState: portsWarning,
					failureState: portsFailure,
				};
			}
		}
		res.json({
			success: true,
			data: cmtkStates,
		});
	} catch (error) {
		res.json({
			success: false,
			message: error.message,
		});
	}
});

app.get("/", (req, res) => {
	res.json({ message: "Server is running!" });
});

app.use((req, res) => {
	res.status(404).json({ message: "Endpoint not found" });
});

app.listen(LOCAL_SERVER_PORT, () => {
	console.log(`Express server running on http://localhost:${LOCAL_SERVER_PORT}`);
});

// Reads cmtks info
await loadCMTKs();

// Loop through all the areas
for (let area of Object.keys(CMTKs)) {
	// Loop through all the cmtk in the current area
	for (let cmtkLabel of Object.keys(CMTKs[area])) {
		// Get the cmtkLabel
		const cmtk = CMTKs[area][cmtkLabel];

		await Connect2Cmtk(cmtkLabel); // Connect to the cmtk

		if (cmtk === null) {
			continue;
		}
		// If the cmtk is not connected, add it to the noConnectedCmtk list
		if (cmtk.influxConnection === null) {
			console.log(`Failed to connect to InfluxDB for ${cmtkLabel}`);

			if (noConnectedCmtk.length === 0) {
				connectionIntervalID = setInterval(Try2Connect, CONNECTION_SAMPLING_TIME); // Try to connect every second
			}

			noConnectedCmtk.push(cmtkLabel);
			continue;
		}

		for (let port of Object.keys(cmtk.ports)) {
			// Read the data and send it to plant MQTT broker
			cmtk.ports[port].mqttInstance.ReadMQTT((topic, message) => {
				const readData = JSON.parse(message);

				const time = readData.timestamp;
				const contactTemp = readData.data.items["Contact Temperature Contact Temperature"];
				const velocityX = readData.data.items["Vibration Velocity RMS v-RMS X"];
				const velocityY = readData.data.items["Vibration Velocity RMS v-RMS Y"];
				const velocityZ = readData.data.items["Vibration Velocity RMS v-RMS Z"];

				const statusBits = {
					temperature: readData.data.items["Status Bits Contact Temperature Upper Alarm Status"],
					velocityX: readData.data.items["Status Bits Main-Alarm v-RMS X Status"],
					velocityY: readData.data.items["Status Bits Main-Alarm v-RMS Y Status"],
					velocityZ: readData.data.items["Status Bits Main-Alarm v-RMS Z Status"],

					preVelocityX: readData.data.items["Status Bits Pre-Alarm v-RMS X Status"],
					preVelocityY: readData.data.items["Status Bits Pre-Alarm v-RMS Y Status"],
					preVelocityZ: readData.data.items["Status Bits Pre-Alarm v-RMS Z Status"],
				};

				// Velocity alarm
				cmtk.ports[port].statusBits.velocityMainAlarm = statusBits.velocityX || statusBits.velocityY || statusBits.velocityZ;

				// Velocity pre-alarm
				cmtk.ports[port].statusBits.velocityMainAlarm = statusBits.preVelocityX || statusBits.preVelocityY || statusBits.preVelocityZ;

				// Temperature alarm
				cmtk.ports[port].statusBits.tempMainAlarm = statusBits.temperature;

				// Save the last values read
				cmtk.ports[port].lastReadValues = {
					"Contact Temperature Contact Temperature": contactTemp,
					"Vibration Velocity RMS v-RMS X": velocityX,
					"Vibration Velocity RMS v-RMS Y": velocityY,
					"Vibration Velocity RMS v-RMS Z": velocityZ,
				};

				// Save the last read values into history
				cmtk.ports[port].SaveValuesToHistory();

				// Calculate new thresholds
				cmtk.ports[port].CalculateThresholds();

				const msgMQTT = cmtk.ports[port].mqttInstance.FormatMsg(
					time,
					contactTemp,
					velocityX,
					velocityY,
					velocityZ,
					cmtkLabel, // Location
					port
				);

				// Send MQTT message to plant server
				// PlantServerMQTT.SendMQTT(msgMQTT);
			});
		}
	}
}

samplingID = setInterval(ErrorsHandler, samplingTime);
// setInterval(DepureHistory, 500);
