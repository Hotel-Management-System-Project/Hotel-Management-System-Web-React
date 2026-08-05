import { useMemo } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useThemeMode } from "../context/useThemeMode";

export default function StayFlowTheme({ children }) {
  const { mode } = useThemeMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#DC2626" },
          secondary: { main: "#7F56D9" },
          background:
            mode === "dark"
              ? { default: "#0B0F17", paper: "#151B26" }
              : { default: "#F5F7FB", paper: "#FFFFFF" },
          text:
            mode === "dark"
              ? { primary: "#F8FAFC", secondary: "#A8B1C1" }
              : { primary: "#101828", secondary: "#667085" },
          success: { main: "#12B76A" },
          warning: { main: "#F79009" },
          error: { main: "#F04438" },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "Inter,system-ui,-apple-system,sans-serif",
          h4: { fontWeight: 750 },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 700 },
          button: { textTransform: "none", fontWeight: 650 },
        },
        components: {
          MuiButton: {
            styleOverrides: { root: { borderRadius: 9, boxShadow: "none" } },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                border: `1px solid ${mode === "dark" ? "#293142" : "#EAECF0"}`,
                boxShadow:
                  mode === "dark"
                    ? "0 1px 3px rgba(0,0,0,.25)"
                    : "0 1px 3px rgba(16,24,40,.06)",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
