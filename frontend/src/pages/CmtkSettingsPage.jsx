import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import HeaderComponent from "../components/Header";
import { Alert, Form, Button } from "react-bootstrap";
import { API_ENDPOINTS } from "../BackEndData";

function CmtkSettingsPage() {
    const { cmtk } = useParams();
    const [cmtkLocation, setCmtkLocation] = useState("");
    const [formData, setFormData] = useState({
        description: "",
        name: "",
        location: "",
        cmtk: cmtk,
        port: "",
        ip: "",
    });
    const [ports, setPorts] = useState([]); // Array to store all ports
    const [successMessage, setSuccessMessage] = useState(""); // Variable to store success message
    const [failMessage, setFailMessage] = useState(""); // Variable to store fail message

    useEffect(() => {
        async function fetchCmtksLocation() {
            try {
                // Makes the GET request to get the cmtk location
                const response = await fetch(API_ENDPOINTS.getLocation(cmtk));
                const jsonData = await response.json();
                setCmtkLocation(jsonData.data);

                // Save the location data into formData
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    ["location"]: jsonData.data,
                }));
            } catch (err) {
                console.error(err.message);
            }
        }

        async function fetchCmtkPorts() {
            try {
                // Makes the GET request to get the available ports
                const response = await fetch(API_ENDPOINTS.getCmtkPorts(cmtk));
                const jsonData = await response.json();
                setPorts(jsonData.data);

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    port: jsonData.data[0],
                }));
            } catch (err) {
                console.error(err.message);
            }
        }

        async function fetchCmtkIp() {
            try {
                // Makes the GET request to get the available ports
                const response = await fetch(API_ENDPOINTS.getCmtkIp(cmtk));
                const jsonData = await response.json();

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    ip: jsonData.data,
                }));
            } catch (err) {
                console.error(err.message);
            }
        }

        fetchCmtksLocation();
        fetchCmtkPorts();
        fetchCmtkIp();
    }, []);

    useEffect(() => {
        async function fetchCmtksDescription() {
            try {
                // End the taskt if cmtkLocation is empty
                if (cmtkLocation == "") {
                    return;
                }

                // Gets the GET request to get cmtk description
                const response = await fetch(
                    API_ENDPOINTS.getCmtkDescription(cmtk)
                );
                const jsonData = await response.json();

                // Stores the value inside formData
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    description: jsonData.data,
                }));
            } catch (e) {
                console.error(e.message);
            }
        }

        fetchCmtksDescription();
    }, [cmtkLocation]);

    useEffect(() => {
        async function fetchCmtksPortName() {
            try {
                // If port is empty end task
                if (formData.port == "") {
                    return;
                }

                // Makes the GET request to get the port name
                const response = await fetch(
                    API_ENDPOINTS.getPortName(cmtk, formData.port)
                );
                const jsonData = await response.json();

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    ["name"]: jsonData.data,
                }));
            } catch (err) {
                console.error(err.message);
            }
        }

        fetchCmtksPortName();
    }, [formData.port]);

    /**
     * Change the correspondent value of form data with the new one
     *
     * @param {Object} key  -   Object with all form data
     * @returns
     */
    const handleChange = (key) => (e) => {
        setFormData({
            ...formData,
            [key]: e.target.value,
        });
    };

    /**
     * Send the inserted data to the backend
     *
     * @param {Object} e    -   Object with all the error data
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Sets the cmtk location
        setFormData({
            ...formData,
            ["location"]: cmtkLocation,
        });

        // Makes the POST request to set the new cmtk's values
        fetch(API_ENDPOINTS.setCmtkLabels, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                value: formData,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        "Network response was not ok " + response.statusText
                    );
                }
                return response.json();
            })
            .then((data) => {
                // Display success message
                console.log("Success:", data);
                setSuccessMessage("Guardado exitosamente!");
                setTimeout(() => setSuccessMessage(""), 3000);
            })
            .catch((error) => {
                // Display error message
                console.error("Error:", error);
                setFailMessage("Error al guardar.");
                setTimeout(() => setFailMessage(""), 3000);
            });
    };

    return (
        <div className="container-fluid d-flex vw-100 vh-100">
            <Navbar />
            <div className="d-flex flex-column vw-100">
                <HeaderComponent label={"Ajustes: " + cmtk} />

                <div className="d-flex h-75 justify-content-center align-items-center">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group
                            className="mt-2"
                            controlId="formDescription"
                        >
                            <Form.Label>Descripcion:</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese Descripcion"
                                value={formData.description}
                                onChange={handleChange("description")}
                            />
                            <Form.Text className="text-muted">
                                Descripcion del CMTK.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="formPort">
                            <Form.Label>Puerto:</Form.Label>
                            <Form.Select
                                value={formData.port}
                                onChange={handleChange("port")}
                            >
                                <option value="">Seleccione un puerto</option>
                                {ports.map((port) => (
                                    <option key={port} value={port}>
                                        {port}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mt-2" controlId="formPortName">
                            <Form.Label>Nombre Puerto:</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese Nombre"
                                value={formData.name}
                                onChange={handleChange("name")}
                            />
                            <Form.Text className="text-muted">
                                Nuevo nombre para el puerto.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mt-2" controlId="formIP">
                            <Form.Label>IP:</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese IP"
                                value={formData.ip}
                                onChange={handleChange("ip")}
                            />
                            <Form.Text className="text-muted">
                                Nueva IP del CMTK.
                            </Form.Text>
                        </Form.Group>

                        <Button
                            className="mt-5"
                            variant="success"
                            type="submit"
                        >
                            Aceptar
                        </Button>
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

export default CmtkSettingsPage;
