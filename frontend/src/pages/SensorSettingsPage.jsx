import React from "react";
import Navbar from "../components/Navbar";
import HeaderComponent from "../components/Header";
import { Alert, Form, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS } from "../BackEndData";

function SensorSettingsPage() {
    const { location, port } = useParams();
    const [formData, setFormData] = useState({
        cmtk: location,
        port: port,
        vibMax: 0,
        tempMax: 0,
        vibWarning: 0,
        tempWarning: 0,
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [failMessage, setFailMessage] = useState("");

    /**
     *
     * @param {Object} key  -   Object with all form data
     * @returns
     */
    const handleChange = (key) => (e) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [key]: Number(e.target.value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Makes the post request to set the new setpoints
        fetch(API_ENDPOINTS.setSensorSetpoints, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                value: formData,
            }),
        })
            .then((response) => {
                // Handle error
                if (!response.ok) {
                    throw new Error(
                        "Network response was not ok " + response.statusText
                    );
                }
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    // Show success message
                    console.log("Success:", data);
                    setSuccessMessage("Guardado exitosamente!");
                    setTimeout(() => setSuccessMessage(""), 3000);
                } else {
                    //Show error message
                    setFailMessage(data.message || "Error desconocido.");
                    setSuccessMessage("");
                    setTimeout(() => setFailMessage(""), 3000);
                }
            })
            .catch((error) => {
                // Show error message
                console.error("Error:", error);
                setFailMessage("Error al guardar.");
                setTimeout(() => setFailMessage(""), 3000);
            });
    };

    useEffect(() => {
        async function fetchFormData() {
            try {
                // Makes the GET request to get the port's warning and failure setpoints
                const response = await fetch(
                    API_ENDPOINTS.getSensorData(location, port)
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
                }
                const jsonData = await response.json();

                // Store data into fotmData
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    vibMax: jsonData.data.vibMax,
                    vibWarning: jsonData.data.vibWarning,
                    tempMax: jsonData.data.tempMax,
                    tempWarning: jsonData.data.tempWarning,
                }));
            } catch (err) {
                console.error(err);
            }
        }

        fetchFormData();
    }, []);

    return (
        <div className="container-fluid d-flex vw-100">
            <Navbar></Navbar>
            {/* Page content */}
            <div className="w-100">
                <HeaderComponent label={"Ajustes Sensor"} />
                <div className="d-flex w-100 justify-content-center">
                    <p>
                        Ajustes del sensor. Estos cambios son independientes
                        para cada uno de los sensores.
                    </p>
                </div>
                <div className="d-flex h-75 justify-content-center align-items-center">
                    <Form onSubmit={handleSubmit}>
                        <div className="d-inline-flex">
                            <div className="me-5">
                                <Form.Group
                                    className="mt-2"
                                    controlId="formVibrationMax"
                                >
                                    <Form.Label>
                                        Vibracion Maxima Permitida:
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Ingrese Vibracion"
                                        max={15}
                                        min={0}
                                        value={formData.vibMax}
                                        onChange={handleChange("vibMax")}
                                    />
                                    <Form.Text className="text-muted">
                                        Ingrese vibracion en [mm/s].
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group
                                    className="mt-2"
                                    controlId="formVibrationWarning"
                                >
                                    <Form.Label>
                                        Vibracion de Warning:
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Ingrese Vibracion"
                                        max={15}
                                        min={0}
                                        value={formData.vibWarning}
                                        onChange={handleChange("vibWarning")}
                                    />
                                    <div className="d-block">
                                        <Form.Text className="d-block text-muted">
                                            Ingrese vibracion en [mm/s].
                                        </Form.Text>
                                        {formData.vibWarning !== "" &&
                                            formData.vibMax !== "" &&
                                            Number(formData.vibWarning) >=
                                                Number(formData.vibMax) && (
                                                <Form.Text className="d-block text-danger">
                                                    Vibración de Warning debe
                                                    ser menor que la Maxima
                                                    Permitida.
                                                </Form.Text>
                                            )}
                                    </div>
                                </Form.Group>

                                <Form.Group
                                    className="mt-2"
                                    controlId="formTemperature"
                                >
                                    <Form.Label>
                                        Temperatura Maxima Permitida:
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Ingrese Temperatura"
                                        max={100}
                                        min={0}
                                        value={formData.tempMax}
                                        onChange={handleChange("tempMax")}
                                    />
                                    <Form.Text className="text-muted">
                                        Ingrese temperatura en °C.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group
                                    className="mt-2"
                                    controlId="formTemperature"
                                >
                                    <Form.Label>
                                        Temperatura de Warning:
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Ingrese Temperatura"
                                        max={100}
                                        min={0}
                                        value={formData.tempWarning}
                                        onChange={handleChange("tempWarning")}
                                    />
                                    <div className="d-block">
                                        <Form.Text className="d-block text-muted">
                                            Ingrese temperatura en °C.
                                        </Form.Text>
                                        {formData.tempWarning !== "" &&
                                            formData.tempMax !== "" &&
                                            Number(formData.tempWarning) >=
                                                Number(formData.tempMax) && (
                                                <Form.Text className="d-block text-danger">
                                                    Temperatura de Warning debe
                                                    ser menor que la Maxima
                                                    Permitida.
                                                </Form.Text>
                                            )}
                                    </div>
                                </Form.Group>

                                <Button
                                    className="mt-5"
                                    variant="success"
                                    type="submit"
                                >
                                    Aceptar
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>

                <div className="d-flex flex-row-reverse">
                    {(successMessage || failMessage) && (
                        <Alert
                            variant={
                                successMessage
                                    ? "success"
                                    : failMessage
                                    ? "danger"
                                    : null
                            }
                            className="w mt-3 me-2 "
                        >
                            {successMessage || failMessage}
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SensorSettingsPage;
