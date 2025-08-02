/**
 * @file ApiMQTT.js
 * @description This file contains the MQTT class that handles the connection to an MQTT broker,
 * subscribes to a topic, and allows sending and receiving messages.
 * It also provides a method to format messages according to a specific schema.
 * @module ApiMQTT
 * @requires mqtt@5.13.1
 */

import mqtt from "mqtt";

export default class MQTT {
	#client; // MQTT client instance
	#onMessageCallback; // Callback function to handle incoming messages

	// Constructor for the MQTT class
	constructor({ ip, port, topic, client_id, username, password }) {
		this.ip = ip; // IP address of the MQTT broker
		this.port = port; // Port of the MQTT broker
		this.topic = topic; // Topic to subscribe to
		this.client_id = client_id; // Client ID for the MQTT connection
		this.username = username; // Username for MQTT authentication
		this.password = password; // Password for MQTT authentication
		this.#client = null; // Initialize the MQTT client to null
		this.#onMessageCallback = null; // Initialize the message callback to null
	}

	/**
	 * Initializes the MQTT connection and starts receiving data.
	 *
	 * This function sets up the connection to the MQTT broker and subscribes
	 * the client to the configured topic to receive messages.
	 */
	InitMQTT() {
		return new Promise((resolve, reject) => {
			const options = {
				clientId: this.client_id,
				username: this.username,
				password: this.password,
			};
			// Create a new MQTT client instance with the provided options
			this.#client = mqtt.connect(`mqtt://${this.ip}:${this.port}`, options);

			// Set up event listeners for the MQTT client
			this.#client.on("connect", () => {
				this.#client.subscribe(this.topic, (err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});

			// Handle incoming messages
			this.#client.on("message", (topic, message) => {
				// If callback is set, call it giving it the message
				if (this.#onMessageCallback) {
					this.#onMessageCallback(topic, message.toString());
				}
			});

			// Handle connection errors
			this.#client.on("error", (err) => {
				reject(err);
			});
		});
	}

	/**
	 * Function to send a messagge to mqtt broker.
	 *
	 * @param {String} payload - Message to send.
	 */
	SendMQTT(payload) {
		return new Promise((resolve, reject) => {
			if (this.#client && this.#client.connected) {
				this.#client.publish(this.topic, payload, (err) => {
					if (err) {
						console.error("Error sending MQTT message:", err);
						reject(err);
					} else {
						resolve(); // Success
					}
				});
			} else {
				const errMsg = "MQTT client is not connected. Message can't be sent.";
				console.warn(errMsg);
				reject(new Error(errMsg));
			}
		});
	}

	/**
	 * Function to set the callback function and
	 * get the read message.
	 *
	 * @param {Object} callback
	 */
	ReadMQTT(callback) {
		this.#onMessageCallback = callback;
	}

	/**
	 * Function to give the needded format to the MQTT message.
	 *
	 * @param {Number | String} contactTemp
	 * @param {Number | String} velocityX
	 * @param {Number | String} velocityY
	 * @param {Number | String} velocityZ
	 * @param {String} location
	 * @returns
	 */
	FormatMsg(time, contactTemp, velocityX, velocityY, velocityZ, location, port) {
		let jsonFormatted = {
			Header: {
				Area: "P",
				Department: "CLS",
				Line: "3",
				Cell: "0",
				Machine: "0",
				Station: "0",
				Workstation: "0",
				EquipmentID: "4F_330",
				MessageType: "SensorData",
				SchemaVersion: "5.000",
				Plant: "AP24A",
				SubType: "Indicator",
				DataSource: location.toString(),
				MessageTimeStamp: time,
			},
			Indicator: {
				Sensor: [
					{
						Label: port,
						ID: "901465646",
						Feature: [
							{
								Label: "CONTACT_TEMPERATURE",
								Type: "Other",
								Statistic: "Other",
								ResultValue: contactTemp,
								Units: "A",
							},
							{
								Label: "VIBRATION_X",
								Type: "Other",
								Statistic: "Other",
								ResultValue: velocityX,
								Units: "A",
							},
							{
								Label: "VIBRATION_Y",
								Type: "Other",
								Statistic: "Other",
								ResultValue: velocityY,
								Units: "A",
							},
							{
								Label: "VIBRATION_Z",
								Type: "Other",
								Statistic: "Other",
								ResultValue: velocityZ,
								Units: "A",
							},
						],
					},
				],
				TransCounter: 4072,
				CycleID: "2025-02-12T01:31:34.452Z",
			},
		};

		return JSON.stringify(jsonFormatted);
	}
}
