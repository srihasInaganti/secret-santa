import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import HomePage from "./pages/HomePage.jsx";
import YourGoodDeed from "./pages/YourGoodDeed.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gooddeed" element={<YourGoodDeed />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
