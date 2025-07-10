import MQTT from "./ApiMQTT.js";

export default class Sensor {
    static countToBeFail = 10;
    static countToBeHealth = 20;
    vibMax = 4; // Max value of the velocity
    tempMax = 20; // Max value of the temperature
    vibValueWarning = 2; // Max value of the velocity
    tempValueWarning = 10; // Max value of the temperature
    name;
    ip;
    cmtkPort; // Cmtk port that is connected to the sensor
    mqttInstance;
    lastReadValues;
    tempErrorCount;
    tempWarningCount;
    vibErrorCount;
    vibWarningCount;
    tempHealthyCount;
    vibHealthyCount;
    tempNoFailureCount;
    vibNoFailureCount;
    tempWarning;
    vibWarning;
    tempFailure;
    vibFailure;
    error;
    statusBits;

    constructor({
        ip,
        name,
        cmtkPort,
        port,
        topic,
        user,
        password,
        cmtk,
        description,
    }) {
        this.ip = ip;
        this.name = name;
        this.cmtkPort = cmtkPort;
        this.lastReadValues = [];
        this.tempErrorCount = 0;
        this.tempWarningCount = 0;
        this.vibErrorCount = 0;
        this.vibWarningCount = 0;
        this.tempHealthyCount = 0;
        this.vibHealthyCount = 0;
        this.tempNoFailureCount = 0;
        this.vibNoFailureCount = 0;
        this.tempWarning = false;
        this.vibWarning = false;
        this.tempFailure = false;
        this.vibFailure = false;
        this.mqttInstance = new MQTT({
            ip: ip, // Cmtk's ip
            port: port,
            topic: topic,
            client_id: `client-mqtt-${name}`,
            username: "user" || user,
            password: "Balluff#1" || password,
        });
        this.error = {
            port: name,
            cmtk: cmtk,
            failure: null,
            date: null,
        };
        this.description = description;
        // State data received from the cmtk
        this.statusBits = {
            velocityPreAlarm: false, // Warning state
            velocityMainAlaram: false, // Failure
            tempPreAlarm: false, // Warning state
            tempMainAlaram: false, // Failure
        };
    }

    /**
     *  This returns the current timestamp.
     *
     * @returns {string} Current timestamp.
     */
    #getDate() {
        const now = new Date();

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
        const temp =
            this.lastReadValues["Contact Temperature Contact Temperature"];
        const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
        const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
        const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

        // Check if vibration velocity and temperature are greater than permissible
        const vibError =
            (velX >= this.vibMax) |
            (velY >= this.vibMax) |
            (velZ >= this.vibMax);
        const tempError = temp >= this.tempMax;

        this.vibErrorCount = (this.vibErrorCount + 1) * vibError;
        this.tempErrorCount = (this.tempErrorCount + 1) * tempError;

        // If count is upper than this.countToBeFail, active the warning
        if (
            this.vibErrorCount >= Sensor.countToBeFail &&
            this.vibFailure === false
        ) {
            this.vibFailure = true;

            // Storing failure info
            this.error.failure = "Vibration Error";
            this.error.date = this.#getDate();

            return true;
        }

        // If count is upper than this.countToBeFail, active the warning
        if (
            this.tempErrorCount >= Sensor.countToBeFail &&
            this.tempFailure === false
        ) {
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
        const temp =
            this.lastReadValues["Contact Temperature Contact Temperature"];
        const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
        const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
        const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

        // Check if vibration velocity and temperature are greater than permissible
        const vibWarning =
            (velX >= this.vibValueWarning) |
            (velY >= this.vibValueWarning) |
            (velZ >= this.vibValueWarning);
        const tempWarning = temp >= this.tempValueWarning;

        this.vibWarningCount = (this.vibWarningCount + 1) * vibWarning;
        this.tempWarningCount = (this.tempWarningCount + 1) * tempWarning;

        // If count is upper than this.countToBeFail, active the warning
        if (
            this.vibWarningCount >= Sensor.countToBeFail &&
            this.vibWarning === false
        ) {
            this.vibWarning = true;
            // this.vibFailure = false;

            // Storing failure info
            this.error.failure = "Vibration Warning";
            this.error.date = this.#getDate();

            return true;
        }

        // If count is upper than this.countToBeFail, active the warning
        if (
            this.tempWarningCount >= Sensor.countToBeFail &&
            this.tempWarning === false
        ) {
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
        const temp =
            this.lastReadValues["Contact Temperature Contact Temperature"];
        const velX = this.lastReadValues["Vibration Velocity RMS v-RMS X"];
        const velY = this.lastReadValues["Vibration Velocity RMS v-RMS Y"];
        const velZ = this.lastReadValues["Vibration Velocity RMS v-RMS Z"];

        // Check if vibration velocities are below warning and max thresholds
        const vibHealthy =
            velX < this.vibValueWarning &&
            velY < this.vibValueWarning &&
            velZ < this.vibValueWarning;
        const vibNoFailure =
            velX < this.vibMax && velY < this.vibMax && velZ < this.vibMax;

        // Check if temperature below warning and max
        const tempHealthy = temp < this.tempValueWarning;
        const tempNoFailure = temp < this.tempMax;

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
        this.tempNoFailureCount =
            (this.tempNoFailureCount + 1) * +tempNoFailure;

        // Check and reset all flags, return true if any reset happened
        if (
            updateStatus(
                "vibHealthyCount",
                "vibWarning",
                Sensor.countToBeHealth
            )
        )
            return true;
        if (
            updateStatus(
                "tempHealthyCount",
                "tempWarning",
                Sensor.countToBeHealth
            )
        )
            return true;
        if (
            updateStatus(
                "vibNoFailureCount",
                "vibFailure",
                Sensor.countToBeHealth
            )
        )
            return true;
        if (
            updateStatus(
                "tempNoFailureCount",
                "tempFailure",
                Sensor.countToBeHealth
            )
        )
            return true;

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
    SetVibMax(newVib) {
        this.vibMax = Number(newVib);
        return this.vibMax;
    }

    /**
     * Sets the maximum acceptable temperature value.
     * This value is shared across all Sensor instances (static property).
     *
     * @param {number} newTemp - The new maximum temperature threshold.
     */
    SetTempMax(newTemp) {
        this.tempMax = Number(newTemp);
        return this.tempMax;
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
    SetVibWarning(newVibWarning) {
        this.vibValueWarning = Number(newVibWarning);
        return this.vibValueWarning;
    }

    /**
     * Sets the warning breakpoint temperature value.
     * This value is shared across all Sensor instances (static property).
     *
     * @param {number} newTemp - The new warning temperature threshold.
     */
    SetTempWarning(newTempWarning) {
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
}
