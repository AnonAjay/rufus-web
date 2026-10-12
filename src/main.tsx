import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import CapsuleApp from "./CapsuleApp";

const isCapsuleView =
  window.location.search.includes("view=capsule") ||
  window.location.hash.includes("capsule");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isCapsuleView ? <CapsuleApp /> : <App />}
  </React.StrictMode>,
);
