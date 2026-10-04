import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import App from "./App";

// Apply saved theme before render to avoid flash
if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
