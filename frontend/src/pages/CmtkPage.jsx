import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import Album from "../components/Album";
import HeaderComponent from "../components/Header";
import { API_ENDPOINTS } from "../BackEndData";

function CmtkPage() {
    const { location } = useParams();
    const [cmtksLabels, setCmtksLabels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [descriptions, setDescriptions] = useState([]);

    useEffect(() => {
        async function fetchCmtksLocation() {
            try {
                // Makes the GET request to get all cmtks locations and stores them
                const response = await fetch(
                    API_ENDPOINTS.getCmtksInArea(location)
                );
                const jsonData = await response.json();
                setCmtksLabels(jsonData.data);
            } catch (err) {
                // Show error
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCmtksLocation();
    }, [location]);

    useEffect(() => {
        async function fetchCmtksLocation() {
            try {
                // Makes the GET request to get all cmtks descriptions and stores them
                const response = await fetch(
                    API_ENDPOINTS.getDescriptions(location)
                );
                const jsonData = await response.json();
                setDescriptions(jsonData.data);
            } catch (err) {
                // Show error
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCmtksLocation();
    }, [location]);

    return (
        <div className="container-fluid d-flex vw-100 vh-100">
            <Navbar />
            <div className="d-flex flex-column w-100">
                <HeaderComponent label={location} />

                <div className="d-flex justify-content-center align-items-center">
                    {loading && <p>Loading data...</p>}
                    {error && <p>Error: {error}</p>}
                    {!loading && !error && (
                        <Album
                            elements={cmtksLabels || []}
                            descriptions={descriptions}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default CmtkPage;
