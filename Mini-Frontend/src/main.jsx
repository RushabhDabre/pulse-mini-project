import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App.jsx";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6C63FF" },
    background: { default: "#0F0F0F", paper: "#1A1A1A" },
  },
  shape: { borderRadius: 12 },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);