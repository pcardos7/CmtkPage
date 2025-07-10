import React from "react";
import Navbar from "../components/Navbar";
import HeaderComponent from "../components/Header";
import { Alert, Form, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../BackEndData";

function SettingsPage() {
    const [formData, setFormData] = useState({
        // Object to store all form data
        cpf: undefined,
        cps: undefined,
        samplingTime: undefined,
    });
    const [successMessage, setSuccessMessage] = useState(""); // Variable to store success message
    const [failMessage, setFailMessage] = useState(""); // Variable to store fail message
    const [cmtkLocations, setCmtkLocations] = useState([]); // Variable to store all available all cmtks and its locations
    const [formCmtkData, setFormCmtkData] = useState({
        area: undefined,
        cmtk: undefined,
        ip: undefined,
        description: undefined,
    });
    /**
     * Changes formData with the new values
     * @param {Object} key  -   Object with all form data
     */
    const handleChange = (key) => (e) => {
        setFormData({
            ...formData,
            [key]: Number(e.target.value),
        });
    };

    /**
     * Changes formCmtkData with the new values
     * @param {Object} key  -   Object with all form data
     */
    const handleAddFormChange = (key) => (e) => {
        setFormCmtkData({
            ...formCmtkData,
            [key]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Makes the POST request
        fetch(API_ENDPOINTS.setGeneralSettings, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                value: formData,
            }),
        })
            .then((response) => {
                // Show an error
                if (!response.ok) {
                    throw new Error(
                        "Network response was not ok " + response.statusText
                    );
                }
                return response.json();
            })
            .then((data) => {
                // On success displays a message
                console.log("Success:", data);
                setSuccessMessage("Guardado exitosamente!");
                setTimeout(() => setSuccessMessage(""), 3000);
            })
            .catch((error) => {
                console.error("Error:", error);
                setFailMessage("Error al guardar.");
                setTimeout(() => setFailMessage(""), 3000);
            });
    };

    const handleSubmitAddCmtk = (e) => {
        e.preventDefault();

        if (
            !formCmtkData.cmtk ||
            !formCmtkData.ip ||
            !formCmtkData.description
        ) {
            setFailMessage("Todos los campos debes estar llenos.");
            setTimeout(() => setFailMessage(""), 3000);
            return;
        }

        // Do the POST request
        fetch(API_ENDPOINTS.addCmtk, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                value: formCmtkData,
            }),
        })
            .then((response) => {
                // Show an error
                if (!response.ok) {
                    throw new Error(
                        "Network response was not ok " + response.statusText
                    );
                }
                return response.json();
            })
            .then((data) => {
                // On success displays a message
                console.log("Success:", data);
                setSuccessMessage("Guardado exitosamente!");
                setTimeout(() => setSuccessMessage(""), 3000);
            })
            .catch((error) => {
                console.error("Error:", error);
                setFailMessage("Error al guardar.");
                setTimeout(() => setFailMessage(""), 3000);
            });
    };

    useEffect(() => {
        async function fetchFormData() {
            try {
                // Makes the GET request to get all general settings and stores them
                const response = await fetch(API_ENDPOINTS.getGeneralSettings);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
                }
                const jsonData = await response.json();
                setFormData(jsonData.data);
            } catch (err) {
                console.error(err);
            }
        }

        fetchFormData();
    }, []);

    useEffect(() => {
        async function fetchLocations() {
            try {
                // Makes the GET request to get all locations
                const response = await fetch(API_ENDPOINTS.getCmtkLocations);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
                }
                const jsonData = await response.json();
                setCmtkLocations(jsonData.data);
                setFormCmtkData({
                    ...formCmtkData,
                    // Giving form's area variable the value of the first area
                    ["area"]: jsonData.data[0],
                });
            } catch (err) {
                console.error(err);
            }
        }

        fetchLocations();
    }, []);

    return (
        <div className="container-fluid d-flex vw-100">
            <Navbar></Navbar>
            {/* Page content */}
            <div className="w-100">
                <HeaderComponent label={"Ajustes Generales"} />
                <div
                    className="d-flex settings-card-container justify-content-center align-items-center gap-3"
                    style={{ height: "80vh" }}
                >
                    <div
                        className="setting-card bg-white p-5"
                        style={{
                            minHeight: "60vh",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            width: "50vh",
                        }}
                    >
                        {/* Left card content */}
                        <div className="d-flex w-100 justify-content-center mb-3">
                            <p>
                                Ajustes generales, estos serán aplicados a todos
                                los sensores.
                            </p>
                        </div>
                        <div className="d-flex h-75 justify-content-center align-items-center">
                            <Form onSubmit={handleSubmit}>
                                <div className="d-inline-flex ">
                                    <div>
                                        {/* Your Form Groups for CPF, CPH, SamplingTime */}
                                        <Form.Group
                                            className="mt-2"
                                            controlId="formCPF"
                                        >
                                            <Form.Label>
                                                Conteo para fallo (CPF):
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Ingrese CPF"
                                                max={100}
                                                min={0}
                                                value={formData.cpf}
                                                onChange={handleChange("cpf")}
                                            />
                                            <Form.Text className="text-muted">
                                                CPF*(Tiempo de muestreo) =
                                                Tiempo total para detectar falla
                                                (ms).
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group
                                            className="mt-2"
                                            controlId="formCPH"
                                        >
                                            <Form.Label>
                                                Conteo para saludable (CPS):
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Ingrese CPS"
                                                max={100}
                                                min={0}
                                                value={formData.cph}
                                                onChange={handleChange("cph")}
                                            />
                                            <Form.Text className="text-muted">
                                                CPS*(Tiempo de muestreo) =
                                                Tiempo total para considerar
                                                saludable (ms).
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group
                                            className="mt-2"
                                            controlId="formSampling"
                                        >
                                            <Form.Label>
                                                Tiempo de Muestreo:
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Ingrese en [ms]"
                                                max={100000}
                                                min={0}
                                                value={formData.samplingTime}
                                                onChange={handleChange(
                                                    "samplingTime"
                                                )}
                                            />
                                            <Form.Text className="text-muted">
                                                Intervalos de tiempo en los que
                                                se revisara si hay falla (ms).
                                            </Form.Text>
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
                    </div>

                    <div
                        className="setting-card w-25 bg-white p-5"
                        style={{
                            minHeight: "60vh",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            width: "50vh",
                        }}
                    >
                        {/* Right card content */}
                        <div className="d-flex w-100 justify-content-center mb-3">
                            <p>Agregar CMTK</p>
                        </div>
                        <div className="d-flex h-75 justify-content-center align-items-center">
                            <Form onSubmit={handleSubmitAddCmtk}>
                                <div className="d-inline-flex ">
                                    <div>
                                        {/* Same Form Groups as left card or different ones */}
                                        <Form.Group
                                            className="mt-2"
                                            controlId="formAddArea"
                                        >
                                            <Form.Label>Área:</Form.Label>
                                            <Form.Select
                                                value={formCmtkData.area}
                                                onChange={handleAddFormChange(
                                                    "area"
                                                )}
                                            >
                                                <option value="" disabled>
                                                    Seleccione un área
                                                </option>
                                                {cmtkLocations.map(
                                                    (area, idx) => (
                                                        <option
                                                            key={idx}
                                                            value={area}
                                                        >
                                                            {area}
                                                        </option>
                                                    )
                                                )}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Área en la que se encuentra el
                                                CMTK
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group
                                            className="mt-2"
                                            controlId="formAddName"
                                        >
                                            <Form.Label>
                                                Nombre del CMTK:
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ingrese nombre"
                                                max={100}
                                                min={0}
                                                value={formCmtkData.cmtk}
                                                onChange={handleAddFormChange(
                                                    "cmtk"
                                                )}
                                            />
                                            <Form.Text className="text-muted">
                                                Nombre del gabinete en el que
                                                esta el CMTK.
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group
                                            className="mt-2"
                                            controlId="formAddIp"
                                        >
                                            <Form.Label>IP:</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ingrese ip:"
                                                max={15}
                                                value={formCmtkData.ip}
                                                onChange={handleAddFormChange(
                                                    "ip"
                                                )}
                                            />
                                            <Form.Text className="text-muted">
                                                IP del CMTK.
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group
                                            className="mt-2"
                                            controlId="formAddDescription"
                                        >
                                            <Form.Label>
                                                Descripcion:
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ingrese descripcion:"
                                                max={15}
                                                value={formCmtkData.description}
                                                onChange={handleAddFormChange(
                                                    "description"
                                                )}
                                            />
                                            <Form.Text className="text-muted">
                                                Ingrese la descripcion del CMTK.
                                            </Form.Text>
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
                    </div>
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

export default SettingsPage;
