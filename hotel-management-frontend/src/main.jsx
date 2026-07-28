import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

import "./styles.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#155EEF",
    },
    secondary: {
      main: "#7F56D9",
    },
    background: {
      default: "#F5F7FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#101828",
      secondary: "#667085",
    },
    success: {
      main: "#12B76A",
    },
    warning: {
      main: "#F79009",
    },
    error: {
      main: "#F04438",
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, sans-serif",

    h4: {
      fontWeight: 750,
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 650,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          boxShadow: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #EAECF0",
          boxShadow:
            "0 1px 3px rgba(16,24,40,.06)",
        },
      },
    },
  },
});

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);