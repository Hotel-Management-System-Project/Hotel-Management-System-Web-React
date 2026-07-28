import { Component } from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

/*
  Protected page imports are commented because
  these files are not created yet.

  Uncomment them after creating the files.
*/

// import Dashboard from "./pages/Dashboard";
// import Hotels from "./pages/Hotels";
// import Rooms from "./pages/Rooms";
// import Bookings from "./pages/Bookings";
// import Users from "./pages/Users";
// import Settings from "./pages/Settings";

/* ==================================================
   ERROR BOUNDARY
================================================== */

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error(
      "StayFlow page error:",
      error,
      info
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          px: 2,
          py: 4,
          background:
            "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 560,
            p: {
              xs: 3,
              sm: 5,
            },
            textAlign: "center",
            borderRadius: 5,
            border: "1px solid",
            borderColor: "divider",
            boxShadow:
              "0 24px 70px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Box
            sx={{
              width: 76,
              height: 76,
              mx: "auto",
              mb: 3,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "error.light",
              color: "error.main",
            }}
          >
            <ErrorOutlineRoundedIcon
              sx={{ fontSize: 46 }}
            />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
          >
            Something went wrong
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1.5,
              mb: 3,
              lineHeight: 1.7,
            }}
          >
            StayFlow could not display this page.
            Reload the page or return to the home page.
          </Typography>

          <Alert
            severity="error"
            sx={{
              mb: 3,
              textAlign: "left",
              borderRadius: 2,
            }}
          >
            {this.state.error?.message ||
              "Unexpected frontend error"}
          </Alert>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: 1.5,
            }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={this.handleReload}
            >
              Reload page
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={this.handleHome}
            >
              Return to home
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}

/* ==================================================
   PROTECTED ROUTE
================================================== */

function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Layout />;
}

/* ==================================================
   PUBLIC ROUTE
================================================== */

function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

/* ==================================================
   TEMPORARY DASHBOARD

   This component is used because Dashboard.jsx
   is not created yet.
================================================== */

function TemporaryDashboard() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        fontWeight={800}
      >
        Dashboard
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        Dashboard page file is not created yet.
      </Typography>
    </Box>
  );
}

/* ==================================================
   MAIN APP
================================================== */

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        {/* Home page */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* Login page */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Signup page */}

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes */}

        <Route element={<ProtectedRoute />}>
          {/* Temporary dashboard route */}

          <Route
            path="/dashboard"
            element={<TemporaryDashboard />}
          />

          {/*
            These routes are commented because
            their page files are not created yet.

            Uncomment each route after creating
            its related page file.
          */}

          {/*
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/hotels"
            element={<Hotels />}
          />

          <Route
            path="/rooms"
            element={<Rooms />}
          />

          <Route
            path="/bookings"
            element={<Bookings />}
          />

          <Route
            path="/users"
            element={<Users />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
          */}
        </Route>

        {/* Invalid route redirects to Home */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </AppErrorBoundary>
  );
}