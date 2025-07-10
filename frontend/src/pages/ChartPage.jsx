import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChartLine from "../components/ChartLine";
import Navbar from "../components/Navbar";
import { API_ENDPOINTS } from "../BackEndData";

const dataFields = [
    "Contact Temperature Contact Temperature [°C]",
    "Vibration Velocity RMS v-RMS X [mm/s]",
    "Vibration Velocity RMS v-RMS Y [mm/s]",
    "Vibration Velocity RMS v-RMS Z [mm/s]",
];

const timeOptions = [
    { label: "30min", value: "30m" },
    { label: "1h", value: "1h" },
    { label: "8h", value: "8h" },
    { label: "12h", value: "12h" },
    { label: "1d", value: "24h" },
];

function ChartPage() {
    const { location, cmtk } = useParams();
    const navigate = useNavigate();

    // State for dropdown selections
    const [selectedField, setSelectedField] = useState(dataFields[0]);
    const [selectedTime, setSelectedTime] = useState(timeOptions[1].value); // default 1h

    // New states for ports dropdown
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState("port1");
    const [names, setNames] = useState([]);
    const [selectedName, setSelectedName] = useState({});
    const [namePort, setNamePort] = useState({});

    // Data states
    const [cmtkDataT, setCmtkTData] = useState([]);
    const [cmtkDataSelected, setCmtkDataSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Warning state
    const [tempWarning, setTempWarning] = useState("");
    const [vibWarning, setVibWarning] = useState("");

    // Fetch available ports when `cmtk` changes
    useEffect(() => {
        async function fetchPorts() {
            if (!location) return;

            try {
                const response = await fetch(API_ENDPOINTS.getCmtkPorts(cmtk));
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch ports: ${response.status}`
                    );
                }
                const jsonData = await response.json();

                // Chek if data is correct
                if (Array.isArray(jsonData.data)) {
                    setPorts(jsonData.data);
                    // Set initial selected port to first port if available
                    if (jsonData.data.length > 0) {
                        setSelectedPort(jsonData.data[0]);
                    }
                } else {
                    setPorts([]);
                    setSelectedPort("");
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
                setPorts([]);
                setSelectedPort("");
            }
        }

        fetchPorts();
    }, [location]);

    // Fetch ports names
    useEffect(() => {
        async function fetchPorts() {
            if (ports.length === 0) return;

            let temporal_names = []; // Var to store port's names

            try {
                // Getting the name of each port
                for (let port of ports) {
                    const response = await fetch(
                        API_ENDPOINTS.getPortName(cmtk, port)
                    );

                    const jsonData = await response.json();

                    temporal_names.push(jsonData.data);
                    setNamePort(jsonData.data);

                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch ports: ${response.status}`
                        );
                    }
                }

                setSelectedName(temporal_names[0]);
                setNames(temporal_names);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setSelectedName("");
            }
        }

        fetchPorts();
    }, [ports]);

    // Fetch data whenever cmtk, selectedField, selectedTime, or selectedPort change
    useEffect(() => {
        async function fetchCmtkData() {
            if (
                !cmtk ||
                !location ||
                !selectedField ||
                !selectedTime ||
                !selectedPort
            )
                return;

            setLoading(true);
            setError(null);
            try {
                // Makes the GET request to get the read data
                const response = await fetch(
                    API_ENDPOINTS.getReadData(cmtk, selectedTime, selectedPort)
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const jsonData = await response.json();

                const tData = jsonData.data.map((item) => item["time"]);

                // Store data
                const selectedData = jsonData.data.map(
                    (item) => item[selectedField] ?? null
                );

                setCmtkTData(tData);
                setCmtkDataSelected(selectedData);
            } catch (err) {
                setError(err.message);
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCmtkData();
    }, [cmtk, location, selectedField, selectedTime, selectedPort]);

    // Fetch warning state
    useEffect(() => {
        async function GetWarningState() {
            try {
                // Makes the GET request to get port's health
                const response = await fetch(
                    API_ENDPOINTS.getPortHealth(cmtk, selectedPort)
                );

                // Handle error
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Gets the response
                const jsonData = await response.json();

                // Visual indicator of warning
                if (
                    jsonData.data.tempWarning === true ||
                    jsonData.data.tempFailure === true
                ) {
                    setTempWarning("🌡️");
                } else {
                    setTempWarning("");
                }

                if (
                    jsonData.data.vibWarning === true ||
                    jsonData.data.vibFailure === true
                ) {
                    setVibWarning("📳");
                } else {
                    setVibWarning("");
                }
            } catch (error) {
                // Show error
                console.error(error.message);
            }
        }

        GetWarningState();
    }, [vibWarning, tempWarning, selectedPort, location]);

    const handleChange = (key) => (e) => {
        setSelectedPort(namePort[key]);
    };

    return (
        <div className="container-fluid d-flex vw-100 vh-100">
            <Navbar />
            <div className="d-flex flex-column w-100">
                <div
                    className="d-block ps-4 pt-3 "
                    style={{ backgroundColor: "#202528" }}
                >
                    {/* Header */}
                    <header className="d-flex">
                        <h2 className="me-3" style={{ color: "white" }}>
                            {cmtk}
                        </h2>
                        <h3 title="Falla Temperatura">{tempWarning}</h3>
                        <h3 title="Falla Vibracion">{vibWarning}</h3>
                    </header>
                </div>

                <div className="d-flex mx-5 justify-content-center flex-column">
                    {/* Field Selection */}
                    <div className="d-flex w-100 mt-1 justify-content-evenly">
                        <div className="">
                            <label
                                htmlFor="fieldSelect"
                                className="form-label fw-bold"
                            >
                                Seleccione la Variable:
                            </label>
                            <select
                                id="fieldSelect"
                                className="form-select"
                                value={selectedField}
                                onChange={(e) => {
                                    e.preventDefault();
                                    setSelectedField(e.target.value);
                                }}
                            >
                                {dataFields.map((field) => (
                                    <option key={field} value={field}>
                                        {field}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Time Range Selection */}
                        <div className="">
                            <label
                                htmlFor="timeSelect"
                                className="form-label fw-bold"
                            >
                                Seleccione Rango de Tiempo:
                            </label>
                            <select
                                id="timeSelect"
                                className="form-select"
                                value={selectedTime}
                                onChange={(e) =>
                                    setSelectedTime(e.target.value)
                                }
                            >
                                {timeOptions.map(({ label, value }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Port Selection */}
                        <div className="">
                            <label
                                htmlFor="portSelect"
                                className="form-label fw-bold"
                            >
                                Seleccione Port:
                            </label>
                            <select
                                id="portSelect"
                                className="form-select"
                                value={selectedName}
                                onChange={(e) => {
                                    setSelectedName(e.target.value);
                                    handleChange(e.target.value)(e);
                                }}
                            >
                                {names.length > 0 ? (
                                    names.map((port) => (
                                        <option key={port} value={port}>
                                            {port}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>
                                        No hay puertos disponibles
                                    </option>
                                )}
                            </select>
                        </div>
                        {/* Config section */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            fill="currentColor"
                            className="bi bi-gear-wide mt-2"
                            viewBox="0 0 16 16"
                            onClick={() => navigate(`${selectedPort}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <title>Configuracion</title>
                            <path d="M8.932.727c-.243-.97-1.62-.97-1.864 0l-.071.286a.96.96 0 0 1-1.622.434l-.205-.211c-.695-.719-1.888-.03-1.613.931l.08.284a.96.96 0 0 1-1.186 1.187l-.284-.081c-.96-.275-1.65.918-.931 1.613l.211.205a.96.96 0 0 1-.434 1.622l-.286.071c-.97.243-.97 1.62 0 1.864l.286.071a.96.96 0 0 1 .434 1.622l-.211.205c-.719.695-.03 1.888.931 1.613l.284-.08a.96.96 0 0 1 1.187 1.187l-.081.283c-.275.96.918 1.65 1.613.931l.205-.211a.96.96 0 0 1 1.622.434l.071.286c.243.97 1.62.97 1.864 0l.071-.286a.96.96 0 0 1 1.622-.434l.205.211c.695.719 1.888.03 1.613-.931l-.08-.284a.96.96 0 0 1 1.187-1.187l.283.081c.96.275 1.65-.918.931-1.613l-.211-.205a.96.96 0 0 1 .434-1.622l.286-.071c.97-.243.97-1.62 0-1.864l-.286-.071a.96.96 0 0 1-.434-1.622l.211-.205c.719-.695.03-1.888-.931-1.613l-.284.08a.96.96 0 0 1-1.187-1.186l.081-.284c.275-.96-.918-1.65-1.613-.931l-.205.211a.96.96 0 0 1-1.622-.434zM8 12.997a4.998 4.998 0 1 1 0-9.995 4.998 4.998 0 0 1 0 9.996z" />
                        </svg>
                    </div>

                    {/* Chart Section */}
                    <div className="d-flex w-100 justify-content-center align-items-center">
                        <div
                            className="mt-5"
                            style={{ maxWidth: "700px", width: "100%" }}
                        >
                            {loading ? (
                                <div>Loading...</div>
                            ) : error ? (
                                <div className="text-danger">
                                    Error: {error}
                                </div>
                            ) : (
                                <ChartLine
                                    x={cmtkDataT}
                                    y={cmtkDataSelected}
                                    datasetLabel={selectedField}
                                    chartTitle={`Historial ${selectedField}`}
                                    cmtk={cmtk}
                                    port={selectedPort}
                                    showAxis={true}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div></div>
        </div>
    );
}

export default ChartPage;
