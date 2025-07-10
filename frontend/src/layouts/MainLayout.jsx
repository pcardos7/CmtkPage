import React from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";

const MainLayout = () => {
    return (
        <div>
            <header>/* Your header/nav can go here */</header>

            {/* This is where child routes render */}
            <Outlet />

            <footer>/* Your footer can go here */</footer>
        </div>
    );
};

export default MainLayout;
