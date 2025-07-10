import mqtt from "mqtt";

export default class MQTT {
    #client;
    #onMessageCallback;

    constructor({ ip, port, topic, client_id, username, password }) {
        this.ip = ip;
        this.port = port;
        this.topic = topic;
        this.client_id = client_id;
        this.username = username;
        this.password = password;
        this.#client = null;
        this.#onMessageCallback = null;
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

            this.#client = mqtt.connect(
                `mqtt://${this.ip}:${this.port}`,
                options
            );

            this.#client.on("connect", () => {
                this.#client.subscribe(this.topic, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            this.#client.on("message", (topic, message) => {
                // If callback is set, call it giving it the message
                if (this.#onMessageCallback) {
                    this.#onMessageCallback(topic, message.toString());
                }
            });

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
                const errMsg =
                    "MQTT client is not connected. Message can't be sent.";
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
    FormatMsg(
        time,
        contactTemp,
        velocityX,
        velocityY,
        velocityZ,
        location,
        port
    ) {
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
