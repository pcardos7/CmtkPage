/**
 * @file ApiInfluxDB.js
 * @description This file contains the InfluxDB_ class that handles interactions with an Influx
 * InfluxDB API Class
 *
 * This class provides methods to interact with an InfluxDB 1.x database,
 * allowing querying of data, retrieving measurements, and performing basic operations.
 * It utilizes the official InfluxDB JavaScript client library for database interactions.
 *
 * @module InfluxDB_
 * @requires influx@5.10.0
 */
import { InfluxDB } from "influx"; // For InfluxDB 1.x

export default class InfluxDB_ {
	#influx; // InfluxDB instance

	constructor({ host, port, protocol, database, username, password, options }) {
		this.host = host; // Host of the InfluxDB server (IP or domain)
		this.port = port; // Port of the InfluxDB server
		this.protocol = protocol; // Protocol used to connect to the InfluxDB server (http or https)
		this.database = database; // Name of the database to use
		this.username = username; // Username for authentication
		this.password = password; // Password for authentication
		this.options = options; // Additional options for the InfluxDB client
		this.influx = null;
	}

	/**
	 * Initializes the InfluxDB client with the provided configuration.
	 *
	 * @description This method sets up the InfluxDB client instance with the specified host, port, protocol, database, username, password, and options.
	 * It should be called before making any queries to ensure the client is properly configured.
	 */
	InitInfluxDB() {
		this.#influx = new InfluxDB({
			host: this.host,
			port: this.port,
			protocol: this.protocol,
			database: this.database,
			username: this.username,
			password: this.password,
			options: this.options,
		});
	}

	/**
	 * Retrieves the last N elements from a specified table in the InfluxDB database.
	 * @description This method executes a query to fetch the last N elements from a given table, ordered by time in descending order.
	 *
	 * @param {number|string} n - Number of elements to get.
	 * @param {string} table - Name of the table.
	 * @returns {Promise<Array>} - A promise resolving to an array with the elements.
	 */
	async GetNElements(n, table) {
		// Query to get the last n elements from a table
		const query = `SELECT * FROM ${table} ORDER BY time DESC LIMIT ${n}`;
		try {
			// Execute the query using the InfluxDB client
			const results = await this.#influx.query(query);

			return results; // returns the results to resolve the promise
		} catch (error) {
			// Log the error if the query fails
			console.error("Query error:", error);

			// Return null to indicate failure
			return null;
		}
	}

	/**
	 * Retrieves all elements from a specified table in the InfluxDB database.
	 * @description This method executes a query to fetch all elements from a given table.
	 *
	 * @param {string} table - Name of the table.
	 *
	 * @returns {Promise<Array>} - A promise resolving to an array with the elements.
	 */
	async GetAll(table) {
		// Query to get all elements from a table
		const query = `SELECT * FROM ${table}`;
		try {
			const results = await this.#influx.query(query);

			return results; // returns the results to resolve the promise
		} catch (error) {
			// Log the error if the query fails
			console.error("Query error:", error);

			// Return null to indicate failure
			return null;
		}
	}

	/**
	 * Retrieves aggregated data sampled at 1-minute intervals for a specified recent time range.
	 * @description This method executes a query to get the mean values of specific fields from a table, grouped by 1-minute intervals.
	 *
	 * @param {string} table - Name of the table (measurement) to query data from.
	 * @param {string} previousTime - Time duration string (e.g., "24h", "7d") indicating how far back to retrieve data.
	 * @returns {Promise<Array|null>} A promise that resolves to an array of aggregated data points if successful, otherwise null.
	 */
	async GetPreviousSampled(table, previousTime) {
		// Query to get aggregated data sampled at 1-minute intervals for the specified time range
		const query = `
    SELECT mean("Contact Temperature Contact Temperature [°C]"), 
           mean("Vibration Velocity RMS v-RMS X [mm/s]"), 
           mean("Vibration Velocity RMS v-RMS Y [mm/s]"), 
           mean("Vibration Velocity RMS v-RMS Z [mm/s]")
    FROM ${table}
    WHERE time > now() - ${previousTime}
    GROUP BY time(1m) fill(none)
  `;
		try {
			// Execute the query using the InfluxDB client
			const rawResults = await this.#influx.query(query);

			// Map the raw results to a more structured format
			const renamedResults = rawResults.map((item) => ({
				time: item.time,
				"Contact Temperature Contact Temperature [°C]": item.mean,
				"Vibration Velocity RMS v-RMS X [mm/s]": item.mean_1,
				"Vibration Velocity RMS v-RMS Y [mm/s]": item.mean_2,
				"Vibration Velocity RMS v-RMS Z [mm/s]": item.mean_3,
			}));

			// Return the structured results
			return renamedResults;
		} catch (error) {
			console.error("Query error (GetLast24HoursSampled):", error);

			// Return null to indicate failure
			return null;
		}
	}

	/**
	 * Retrieves the names of all tables (measurements) in the InfluxDB database.
	 * @description This method queries the InfluxDB to get a list of all measurements (tables) available in the database.
	 * @returns {Promise<Array>} - A promise resolving to an array with the names of the tables.
	 */
	async GetTables() {
		try {
			// Query to get all measurements (tables) in the InfluxDB database
			const tablesQuery = await this.#influx.query("SHOW MEASUREMENTS");
			const tables = [];

			// Extract the names of the tables from the query results
			for (let i = 0; i < tablesQuery.length; i++) {
				tables.push(tablesQuery[i].name);
			}

			// Return the list of table names
			return tables;
		} catch (error) {
			console.log("Error has occured:", error);

			// Return an empty array if an error occurs
			return null;
		}
	}
}
