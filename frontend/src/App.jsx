import { useState, useEffect, useRef } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import HomePage from "./pages/HomePage";
import LineChart from "./pages/ChartPage";
import SettingsPage from "./pages/SettingsPage";
import CmtkPage from "./pages/CmtkPage";
import CmtkSettingsPage from "./pages/CmtkSettingsPage";
import SensorSettingsPage from "./pages/SensorSettingsPage";
import ChartPage from "./pages/ChartPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />}></Route>
                <Route
                    path="/ChartPage/:location/:cmtk"
                    element={<ChartPage />}
                ></Route>
                <Route
                    path="/ChartPage/:location"
                    element={<CmtkPage />}
                ></Route>
                <Route path="/Settings" element={<SettingsPage />}></Route>
                <Route
                    path="/:cmtk/settings"
                    element={<CmtkSettingsPage />}
                ></Route>
                <Route
                    path="/ChartPage/:cmtk/:location/:port"
                    element={<SensorSettingsPage />}
                ></Route>
            </Routes>
        </Router>
    );
}

export default App;
