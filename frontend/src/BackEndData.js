/**
 * BackendData.js
 *
 * This module centralizes backend configuration information.
 *
 * It includes the backend IP address and a set of API endpoint
 * functions and constants for constructing URLs used by the frontend
 * to communicate with the backend services.
 */

/**
 * Base URL of the backend server
 * @constant {string}
 */
const BACKEND_IP = import.meta.env.VITE_BACKEND_IP;

/**
 * API endpoint URL constructors and constants
 * @namespace API_ENDPOINTS
 */
const API_ENDPOINTS = {
	/**
	 * Endpoint to get warning and failure state of all cmtks
	 * @constant {string}
	 */
	getHealthAll: `${BACKEND_IP}/api/get-health-all`,

	/**
	 * Endpoint to get all cmtks locations
	 * @constant {string}
	 */
	getCmtkLocations: `${BACKEND_IP}/api/cmtk-locations`,

	/**
	 * Endpoint to get general settings
	 * @constant {string}
	 */
	getGeneralSettings: `${BACKEND_IP}/api/get-general-settings`,

	/**
	 * Endpoint to get all cmtks labels
	 * @constant {string}
	 */
	getAllCmtksLabels: `${BACKEND_IP}/api/get-all-cmtks`,

	/**
	 * Returns the URL to get data for a given location and cmtk
	 * @param {string} location - The location name
	 * @param {string} cmtk - The cmtk identifier
	 * @returns {string} Complete URL to fetch data
	 */
	getData: (location, cmtk) => `${BACKEND_IP}/api/get-data/${location}/${cmtk}`,

	/**
	 * Returns the URL to get sensor data for a given location and port
	 * @param {string} location - The location name
	 * @param {string} port - The port identifier
	 * @returns {string} Complete URL to fetch sensor data
	 */
	getSensorData: (location, port) => `${BACKEND_IP}/api/get-sensor-data/${location}/${port}`,

	/**
	 * Returns the URL to get all cmtks descriptions
	 * @param {string} location
	 * @returns {string} Complete URL to fetch sensor data
	 */
	getDescriptions: (location) => `${BACKEND_IP}/api/descriptions/${location}`,

	/**
	 * Returns the URL to get the port's name
	 *
	 * @param {string} cmtk
	 * @param {string} port
	 * @returns
	 */
	getPortName: (cmtk, port) => `${BACKEND_IP}/api/port-name/${cmtk}/${port}`,

	/**
	 * Returns the URL to get all the active ports of the cmtk.
	 * @param {string} cmtk
	 */
	getCmtkPorts: (cmtk) => `${BACKEND_IP}/api/get-ports/${cmtk}`,

	/**
	 * Returns the URL to get the location of the cmtk
	 * @param {string} cmtk
	 */
	getLocation: (cmtk) => `${BACKEND_IP}/api/get-location/${cmtk}`,

	/**
	 * Returns the URL the get all the read data of the cmtk port, since
	 * the specified time
	 * @param {string} cmtk
	 * @param {string} time
	 * @param {string} port
	 * @returns
	 */
	getReadData: (cmtk, time, port) => `${BACKEND_IP}/api/get-data/${cmtk}?time=${time}&port=${encodeURIComponent(port)}`,

	/**
	 * Returns the URL to get the cmtk's description
	 *
	 * @param {string} cmtk
	 */
	getCmtkDescription: (cmtk) => `${BACKEND_IP}/api/description/${cmtk}`,

	/**
	 * Returns the URL to get the specified port's health
	 * @param {string} cmtk
	 * @param {string} port
	 */
	getPortHealth: (cmtk, port) => `${BACKEND_IP}/api/get-health/${cmtk}?port=${encodeURIComponent(port)}`,

	/**
	 * Returns the URL to get the port's thresholds
	 * @param {string} cmtk
	 * @param {string} port
	 */
	getThresholdSensors: (cmtk, port) => `${BACKEND_IP}/api/get-threshold-sensors/${cmtk}/${port}`,

	/**
	 * Endpoint to get the cmtk's ip
	 * @param {string} cmtk - The cmtk identifier
	 * @returns {string} Complete URL to fetch the cmtk's IP address
	 */
	getCmtkIp: (cmtk) => `${BACKEND_IP}/api/ip/${cmtk}`,

	/**
	 * Endpoint to get all the cmtks in a area
	 * @param {string} area - The area name
	 * @returns {string} Complete URL to fetch cmtks in the specified area
	 */
	getCmtksInArea: (area) => `${BACKEND_IP}/api/get-cmtks/${area}`,

	/**
	 * Returns the URL to get an image by its name
	 * @param {string} floor - The floor name (e.g., "1", "2")
	 * @returns {string} Complete URL to fetch the image
	 */
	getLocationsImages: (floor) => `${BACKEND_IP}/api/locationImages/${floor}`,

	/**
	 * Endpoint for retrieving error history
	 * @constant {string}
	 */
	errorsHistory: `${BACKEND_IP}/api/errors-history`,

	/**
	 * Endpoint to delete errors history data
	 * @constant {string}
	 */
	deleteHistory: `${BACKEND_IP}/api/delete-history`,

	/**
	 * Endpoint for setting sensor setpoints
	 * @constant {string}
	 */
	setSensorSetpoints: `${BACKEND_IP}/api/set-sensor-setpoints`,

	/**
	 * Endpoint for setting cmtk labels (port's name and cmtk's description)
	 * @constant {string}
	 */
	setCmtkLabels: `${BACKEND_IP}/api/set-cmtk-form-values`,

	/**
	 * Endpoint for adding a new CMTK
	 * @constant {string}
	 */
	addCmtk: `${BACKEND_IP}/api/add-cmtk`,

	/**
	 * Endpoint for connecting to all CMTKs
	 */
	connect2Cmtks: `${BACKEND_IP}/api/try-to-connect-cmtks`,
};

export { BACKEND_IP, API_ENDPOINTS };
