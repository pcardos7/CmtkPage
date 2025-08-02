/**
 * @file ApiSensors.js
 * @description Sensor class for handling MQTT communication and data processing.
 * It manages sensor data, detects engine failures, warnings, and healthy states,
 * and provides methods to set thresholds and clear states.
 * * @module Sensor
 * @requires MQTT
 */
import MQTT from "./ApiMQTT.js";
import Queue from "./queue.js";

const zScoreWarning = 2; // Z-score threshold for warning
const zScoreFailure = 3; // Z-score threshold for failure

export default class Sensor {
	static countToBeFail = 10; // Count to be in failure state
	static countToBeHealth = 20; // Count to be in healthy state
	vibValueFailure = 4; // Max value of the velocity
	tempValueFailure = 20; // Max value of the temperature
	vibValueWarning = 2; // Max value of the velocity
	tempValueWarning = 10; // Max value of the temperature
	name; // Name of the sensor
	ip; // IP address of the sensor
	cmtkPort; // Cmtk port that is connected to the sensor
	mqttInstance; // MQTT instance for communication
	lastReadValues; // Last read values from the sensor
	tempErrorCount = 0; // Count of temperature errors
	tempWarningCount = 0; // Count of temperature warnings
	vibErrorCount = 0; // Count of vibration errors
	vibWarningCount = 0; // Count of vibration warnings
	tempHealthyCount = 0; // Count of healthy temperature readings
	vibHealthyCount = 0; // Count of healthy vibration readings
	tempNoFailureCount; // Count of non-failure temperature readings
	vibNoFailureCount; // Count of non-failure vibration readings
	tempWarning = false; // Temperature warning state
	vibWarning = false; // Vibration warning state
	tempFailure = false; // Temperature failure state
	vibFailure = false; // Vibration failure state
	error = null; // Error information
	statusBits = {
		velocityPreAlarm: false, // Warning state
		velocityMainAlaram: false, // Failure
		tempPreAlarm: false, // Warning state
		tempMainAlaram: false, // Failure
	}; // Status bits for the sensor
	historyValues = []; // History of values read from the sensor
	speedsHistoryQueue = new Queue(); // Queue for storing speed history values
	temperatureHistoryQueue = new Queue(); // Queue for storing temperature history values

	constructor({ ip, name, cmtkPort, port, topic, user, password, cmtk, description }) {
		this.ip = ip; // Cmtk's ip
		this.name = name; // Name of the sensor
		this.cmtkPort = cmtkPort; // Cmtk port that is connected to the sensor
		this.lastReadValues = []; // Last read values from the sensor
		this.mqttInstance = new MQTT({
			ip: ip, // Cmtk's ip
			port: port, // Port of the MQTT broker
			topic: topic, // Topic to subscribe to
			client_id: `client-mqtt-${name}`, // Unique client ID for MQTT
			username: "user" || user, // MQTT username
			password: "Balluff#1" || password, // MQTT password
		});
		this.error = {
			port: name, // Port name for error tracking
			cmtk: cmtk, // Cmtk identifier for error tracking
			failure: null, // Error message
			date: null, // Timestamp of the error
		};
		this.description = description;
	}

	/**
	 *  This returns the current timestamp.
	 *
	 * @returns {string} Current timestamp.
	 */
	#getDate() {
		// Get the current date and time
		const now = new Date();

		// Format the date and time components
		// YYYY-MM-DD HH:MM:SS format
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0"); // months 01-12
		const day = String(now.getDate()).padStart(2, "0"); // day 01-31
		const hours = String(now.getHours()).padStart(2, "0"); // 00-23
		const minutes = String(now.getMinutes()).padStart(2, "0"); // 00-59
		const seconds = String(now.getSeconds()).padStart(2, "0"); // 00-59

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	/**
	 * Checks if there is a new temperature or vibration warning based
	 * on sensor values.
	 *
	 * @returns {boolean} True if any warning is detected; otherwise, false.
	 */
	DetectEngineFailure() {
		// Get the current temperature and vibration values
		const temp = this.lastReadValues["Contact Temperature Contact Temperature"];
		const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
		const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
		const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

		// Check if vibration velocity and temperature are greater than permissible
		const vibError = (velX >= this.vibValueFailure) | (velY >= this.vibValueFailure) | (velZ >= this.vibValueFailure);
		const tempError = temp >= this.tempValueFailure;

		this.vibErrorCount = (this.vibErrorCount + 1) * vibError;
		this.tempErrorCount = (this.tempErrorCount + 1) * tempError;

		// If count is upper than this.countToBeFail, active the warning
		if (this.vibErrorCount >= Sensor.countToBeFail && this.vibFailure === false) {
			this.vibFailure = true;

			// Storing failure info
			this.error.failure = "Vibration Error";
			this.error.date = this.#getDate();

			return true;
		}

		// If count is upper than this.countToBeFail, active the warning
		if (this.tempErrorCount >= Sensor.countToBeFail && this.tempFailure === false) {
			this.tempFailure = true;

			this.error.failure = "Temperature Error";
			this.error.date = this.#getDate();

			return true;
		}

		return false;
	}

	/**
	 * Checks if there is a new temperature or vibration warning based
	 * on sensor values.
	 *
	 * @returns {boolean} True if any warning is detected; otherwise, false.
	 */
	DetectEngineWarning() {
		const temp = this.lastReadValues["Contact Temperature Contact Temperature"];
		const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
		const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
		const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

		// Check if vibration velocity and temperature are greater than permissible
		const vibWarning = (velX >= this.vibValueWarning) | (velY >= this.vibValueWarning) | (velZ >= this.vibValueWarning);
		const tempWarning = temp >= this.tempValueWarning;

		this.vibWarningCount = (this.vibWarningCount + 1) * vibWarning;
		this.tempWarningCount = (this.tempWarningCount + 1) * tempWarning;

		// If count is upper than this.countToBeFail, active the warning
		if (this.vibWarningCount >= Sensor.countToBeFail / 2 && this.vibWarning === false) {
			this.vibWarning = true;
			// this.vibFailure = false;

			// Storing failure info
			this.error.failure = "Vibration Warning";
			this.error.date = this.#getDate();

			return true;
		}

		// If count is upper than this.countToBeFail, active the warning
		if (this.tempWarningCount >= Sensor.countToBeFail / 2 && this.tempWarning === false) {
			this.tempWarning = true;
			// this.tempFailure = false;

			this.error.failure = "Temperature Warning";
			this.error.date = this.#getDate();

			return true;
		}

		return false;
	}

	/**
	 * Checks if there healthy values of temperature or vibration.
	 *
	 * @returns {boolean} True if good values were detected; otherwise, false.
	 */
	DetectEngineOk() {
		const temp = this.lastReadValues["Contact Temperature Contact Temperature"];
		const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
		const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
		const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

		// Check if vibration velocities are below warning and max thresholds
		const vibHealthy = velX < this.vibValueWarning && velY < this.vibValueWarning && velZ < this.vibValueWarning;
		const vibNoFailure = velX < this.vibValueFailure && velY < this.vibValueFailure && velZ < this.vibValueFailure;

		// Check if temperature below warning and max
		const tempHealthy = temp < this.tempValueWarning;
		const tempNoFailure = temp < this.tempValueFailure;

		// Helper function to update counts and reset flags/errors if count meets threshold
		const updateStatus = (countProp, flagProp, countThreshold) => {
			this[countProp] = (this[countProp] + 1) * this[flagProp];
			if (this[countProp] >= countThreshold && this[flagProp]) {
				this[flagProp] = false;
				this.error.failure = null;
				this.error.date = null;
				return true;
			}
			return false;
		};

		// Update counts based on current measurements
		this.vibHealthyCount = (this.vibHealthyCount + 1) * +vibHealthy;
		this.tempHealthyCount = (this.tempHealthyCount + 1) * +tempHealthy;
		this.vibNoFailureCount = (this.vibNoFailureCount + 1) * +vibNoFailure;
		this.tempNoFailureCount = (this.tempNoFailureCount + 1) * +tempNoFailure;

		// Check and reset all flags, return true if any reset happened
		if (updateStatus("vibHealthyCount", "vibWarning", Sensor.countToBeHealth)) return true;
		if (updateStatus("tempHealthyCount", "tempWarning", Sensor.countToBeHealth)) return true;
		if (updateStatus("vibNoFailureCount", "vibFailure", Sensor.countToBeHealth)) return true;
		if (updateStatus("tempNoFailureCount", "tempFailure", Sensor.countToBeHealth)) return true;

		// The last if in original code seems redundant—vibNoFailureCount check again with vibWarning flag, omitted here

		return false;
	}

	/**
	 * Sets a new name.
	 * @param {string} newName
	 * @returns {string}
	 */
	SetName(newName) {
		this.name = newName;
		return this.name;
	}

	/**
	 * Sets the maximum acceptable vibration value.
	 * This value is shared across all Sensor instances (static property).
	 *
	 * @param {number} newVib - The new maximum vibration threshold.
	 */
	SetVibValueFailure(newVib) {
		this.vibValueFailure = Number(newVib);
		return this.vibValueFailure;
	}

	/**
	 * Sets the maximum acceptable temperature value.
	 * This value is shared across all Sensor instances (static property).
	 *
	 * @param {number} newTemp - The new maximum temperature threshold.
	 */
	SetTempValueFailure(newTemp) {
		this.tempValueFailure = Number(newTemp);
		return this.tempValueFailure;
	}

	/**
	 * Sets the counter brakpoint to be in fail.
	 *
	 * @param {number} secondsToFail - Elaps of time (seconds).
	 */
	static SetCountToFail(secondsToFail) {
		Sensor.countToBeFail = Number(secondsToFail);
		return Sensor.countToBeFail;
	}

	/**
	 * Sets the counter brakpoint to be in healthy mode.
	 *
	 * @param {number} secondsToHealth - Elaps of time (seconds).
	 */
	static SetCountToHealth(secondsToHealth) {
		Sensor.countToBeHealth = Number(secondsToHealth);
		return Sensor.countToBeHealth;
	}

	/**
	 * Sets the warning breakpoint vibration value.
	 * This value is shared across all Sensor instances (static property).
	 *
	 * @param {number} newVibWarning - The new warning vibration threshold.
	 */
	SetVibValueWarning(newVibWarning) {
		this.vibValueWarning = Number(newVibWarning);
		return this.vibValueWarning;
	}

	/**
	 * Sets the warning breakpoint temperature value.
	 * This value is shared across all Sensor instances (static property).
	 *
	 * @param {number} newTemp - The new warning temperature threshold.
	 */
	SetTempValueWarning(newTempWarning) {
		this.tempValueWarning = Number(newTempWarning);
		return this.tempValueWarning;
	}

	/**
	 * Clears the current failure state by resetting warnings.
	 * Sets both vibration and temperature warnings to false.
	 */
	ClearFailure() {
		this.vibWarning = false;
		this.tempWarning = false;
	}

	/**
	 * Clears the current warning state by resetting failures.
	 */
	SaveValuesToHistory() {
		// Save the last read values to the history queue
		this.temperatureHistoryQueue.Queue_Write(this.lastReadValues["Contact Temperature Contact Temperature"]);
		this.speedsHistoryQueue.Queue_Write(
			Math.sqrt(
				Math.pow(this.lastReadValues["Vibration Velocity RMS v-RMS X"], 2) +
					Math.pow(this.lastReadValues["Vibration Velocity RMS v-RMS Y"], 2) +
					Math.pow(this.lastReadValues["Vibration Velocity RMS v-RMS Z"], 2)
			)
		);
	}

	/**
	 * Calculates the original value from a Z-score.
	 * @param {number} zScore - The Z-score to convert.
	 * @param {number} mean - The mean of the dataset.
	 * @param {number} stdDev - The standard deviation of the dataset.
	 * @returns {number} - The original value.
	 */
	CalculateFromZScore(zScore, mean, stdDev) {
		return mean + zScore * stdDev;
	}

	/**
	 * Calculates the thresholds for vibration and temperature.
	 * @returns {void}
	 */
	CalculateThresholds() {
		// Calculate the mean and standard deviation of history values
		if (this.temperatureHistoryQueue.isFull === true) {
			const tempMean = this.temperatureHistoryQueue.queue.reduce((sum, val) => sum + val, 0) / this.temperatureHistoryQueue.queue.length;
			const tempStdDev = Math.sqrt(this.temperatureHistoryQueue.queue.reduce((sum, val) => sum + Math.pow(val - tempMean, 2), 0) / this.temperatureHistoryQueue.queue.length);

			// Calculate warning and failure thresholds based on Z-scores
			this.tempValueWarning = this.CalculateFromZScore(zScoreWarning, tempMean, tempStdDev);
			this.tempValueFailure = this.CalculateFromZScore(zScoreFailure, tempMean, tempStdDev);

			this.temperatureHistoryQueue.Queue_Clear();
		}

		if (this.speedsHistoryQueue.isFull === true) {
			const vibMean = this.speedsHistoryQueue.queue.reduce((sum, val) => sum + val, 0) / this.speedsHistoryQueue.queue.length;
			const vibStdDev = Math.sqrt(this.speedsHistoryQueue.queue.reduce((sum, val) => sum + Math.pow(val - vibMean, 2), 0) / this.speedsHistoryQueue.queue.length);

			// Calculate warning and failure thresholds based on Z-scores
			this.vibValueWarning = this.CalculateFromZScore(zScoreWarning, vibMean, vibStdDev);
			this.vibValueFailure = this.CalculateFromZScore(zScoreFailure, vibMean, vibStdDev);

			this.speedsHistoryQueue.Queue_Clear();
		}
	}
}
