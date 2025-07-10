import { InfluxDB } from "influx"; // para InfluxDB 1.x

export default class InfluxDB_ {
    #influx;

    constructor({
        host,
        port,
        protocol,
        database,
        username,
        password,
        options,
    }) {
        this.host = host;
        this.port = port;
        this.protocol = protocol;
        this.database = database;
        this.username = username;
        this.password = password;
        this.options = options;
        this.influx = null;
    }

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
     * Function to get the last n elements from a table.
     *
     * @param {number|string} n - Number of elements to get.
     * @param {string} table - Name of the table.
     * @returns {Promise<Array>} - A promise resolving to an array with the elements.
     */
    async GetNElements(n, table) {
        const query = `SELECT * FROM ${table} ORDER BY time DESC LIMIT ${n}`;
        try {
            const results = await this.#influx.query(query);
            // console.log("Results:", results);
            return results; // retorna los resultados al resolver la promesa
        } catch (error) {
            console.error("Query error:", error);
            return null;
        }
    }

    /**
     * Function to get all the element from a table.
     *
     * @param {string} table - Name of the table.
     *
     * @returns {Promise<Array>} - A promise resolving to an array with the elements.
     */
    async GetAll(table) {
        const query = `SELECT * FROM ${table}`;
        try {
            const results = await this.#influx.query(query);
            // console.log("Results:", results);
            return results; // retorna los resultados al resolver la promesa
        } catch (error) {
            console.error("Query error:", error);
            return null;
        }
    }

    /**
     * Retrieves aggregated data sampled at 1-minute intervals for a specified recent time range.
     *
     * @param {string} table - Name of the table (measurement) to query data from.
     * @param {string} previousTime - Time duration string (e.g., "24h", "7d") indicating how far back to retrieve data.
     * @returns {Promise<Array|null>} A promise that resolves to an array of aggregated data points if successful, otherwise null.
     */
    async GetPreviousSampled(table, previousTime) {
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
            const rawResults = await this.#influx.query(query);

            const renamedResults = rawResults.map((item) => ({
                time: item.time,
                "Contact Temperature Contact Temperature [°C]": item.mean,
                "Vibration Velocity RMS v-RMS X [mm/s]": item.mean_1,
                "Vibration Velocity RMS v-RMS Y [mm/s]": item.mean_2,
                "Vibration Velocity RMS v-RMS Z [mm/s]": item.mean_3,
            }));
            return renamedResults;
        } catch (error) {
            console.error("Query error (GetLast24HoursSampled):", error);
            return null;
        }
    }

    async GetTables() {
        try {
            const tablesQuery = await this.#influx.query("SHOW MEASUREMENTS");
            const tables = [];

            for (let i = 0; i < tablesQuery.length; i++) {
                tables.push(tablesQuery[i].name);
            }
            return tables;
        } catch (error) {
            console.log("Error has occured:", error);
            return null;
        }
    }
}
