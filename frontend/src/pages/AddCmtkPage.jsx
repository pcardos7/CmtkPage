import React from "react";
import Navbar from "../components/Navbar";
import HeaderComponent from "../components/Header";
import { Alert, Form, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../BackEndData";

function AddCmtkPage() {
    const [formData, setFormData] = useState({
        // Object to store all form data
        cpf: undefined,
        cps: undefined,
        samplingTime: undefined,
    });
    const [successMessage, setSuccessMessage] = useState(""); // Variable to store success message
    const [failMessage, setFailMessage] = useState(""); // Variable to store fail message

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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Do the POST request
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

    return (
        <div className="container-fluid d-flex vw-100">
            <Navbar></Navbar>
            {/* Page content */}
            <div className="w-100">
                <HeaderComponent label={"Ajustes Generales"} />
                <div className="d-flex">
                    <div className="d-flex ms-5 w-100 justify-content-center">
                        <p className="">
                            Ajustes generales, estos serán aplicados a todos los
                            sensores.
                        </p>
                    </div>
                    <div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            fill="currentColor"
                            class="bi bi-plus-circle"
                            viewBox="0 0 16 16"
                            className="me-5"
                            style={{ cursor: "pointer" }}
                        >
                            <title>Agregar CMTK</title>
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                        </svg>
                    </div>
                </div>

                <div className="d-flex h-75 justify-content-center align-items-center">
                    <Form onSubmit={handleSubmit}>
                        <div className="d-inline-flex ">
                            <div>
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
                                        CPF*(Tiempo de muestreo) = Tiempo total
                                        para detectar falla (ms).
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
                                        CPS*(Tiempo de muestreo) = Tiempo total
                                        para considerar saludable (ms).
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group
                                    className="mt-2"
                                    controlId="formSampling"
                                >
                                    <Form.Label>Tiempo de Muestreo:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Ingrese en [ms]"
                                        max={100000}
                                        min={0}
                                        value={formData.samplingTime}
                                        onChange={handleChange("samplingTime")}
                                    />
                                    <Form.Text className="text-muted">
                                        Intervalos de tiempo en los que se
                                        revisara si hay falla (ms).
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

export default AddCmtkPage;
