import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { SimpleAuthProvider } from "./contexts/SimpleAuthContext";
import { Auth0Provider } from "./contexts/Auth0Context";
import { startGoogleSheetsAutoSync } from "./utils/googleSheetsSync";

document.title = "Goods Recycling Portal";
startGoogleSheetsAutoSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider>
        <SimpleAuthProvider>
          <App />
        </SimpleAuthProvider>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
);
