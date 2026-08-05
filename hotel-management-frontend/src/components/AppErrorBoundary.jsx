/**
 * Catches unexpected React rendering errors so the application can show a
 * helpful recovery screen instead of leaving the user with a blank page.
 */
import { Component } from "react";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";

// React error boundaries prevent one broken page from crashing the whole app.
export default class AppErrorBoundary extends Component {
  // A non-null error switches render() from the page to the recovery screen.
  state = { error: null };

  static getDerivedStateFromError(error) {
    // React calls this lifecycle method after a descendant throws an error.
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep technical details in the console for debugging without exposing them.
    console.error("StayFlow page error:", error, errorInfo);
  }

  render() {
    // Normal operation returns children unchanged; only failures show fallback UI.
    if (!this.state.error) return this.props.children;

    return (
      <Box className="error-page">
        <Paper className="error-card" elevation={0}>
          <Box className="error-icon">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 46 }} />
          </Box>

          <Typography variant="h4" fontWeight={800}>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
            Reload the page or return to the dashboard.
          </Typography>

          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            {this.state.error.message || "Unexpected frontend error"}
          </Alert>

          <Box className="error-actions">
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            <Button
              variant="contained"
              onClick={() => window.location.assign("/dashboard")}
            >
              Return to dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}
