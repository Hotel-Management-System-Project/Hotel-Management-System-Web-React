/**
 * Collects user credentials, calls the shared authentication function, displays
 * validation/API errors, and redirects a successful login to the dashboard.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  EmailRounded,
  LockRounded,
  LoginRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { useAuth } from "../context/useAuth";
import AuthShowcase from "../components/AuthShowcase";
import { Notice } from "../components/Common";

export default function Login({ portal = "owner" }) {
  // Form, visibility, loading, and error states change independently.
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const isAdminPortal = portal === "admin";
  const portalTitle = isAdminPortal
    ? "Administrator sign in"
    : "Sign in to StayFlow";
  const portalDescription = isAdminPortal
    ? "Access the StayFlow administration portal."
    : "Access your hotel-owner workspace.";

  // Show signup completion and login failures as temporary toast messages.
  useEffect(() => {
    const savedSignupMessage = sessionStorage.getItem(
      "stayflow_signup_success",
    );
    let nextNotice = null;

    if (!isAdminPortal && (savedSignupMessage || params.get("registered") === "true")) {
      nextNotice = {
        type: "success",
        message:
          savedSignupMessage ||
          "Signup successful! Your account was created. You can now sign in.",
      };
      sessionStorage.removeItem("stayflow_signup_success");
    } else if (params.get("reason") === "session-expired") {
      nextNotice = {
        type: "error",
        message: "Your session is invalid or expired. Please sign in again.",
      };
    }

    if (!nextNotice) return undefined;
    const timer = window.setTimeout(() => setNotice(nextNotice), 0);
    return () => window.clearTimeout(timer);
  }, [isAdminPortal, params]);

  // Prevent browser submission, authenticate, then enter the private workspace.
  const submit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      setNotice({
        type: "error",
        message: "Please enter both email address and password.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      await login(
        {
          email,
          password: form.password,
        },
        isAdminPortal ? "ADMIN" : "HOTEL_OWNER",
      );
      navigate("/dashboard");
    } catch (requestError) {
      const backendMessage = requestError?.message;
      setNotice({
        type: "error",
        message:
          backendMessage && backendMessage !== "Request failed with status code 500"
            ? backendMessage
            : "Incorrect email address or password.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthShowcase />
      <section className="auth-panel">
        <Button
          component={Link}
          to="/"
          color="inherit"
          startIcon={<ArrowBackRounded />}
          className="auth-back"
        >
          Back to home
        </Button>

        <Paper className="auth-card" elevation={0}>
          <Box className="auth-mobile-brand">
            <Box className="auth-brand-mark">S</Box>
            <Typography fontWeight={850}>StayFlow</Typography>
          </Box>

          <Typography className="auth-kicker">
            {isAdminPortal ? "ADMINISTRATION" : "WELCOME BACK"}
          </Typography>
          <Typography variant="h4">{portalTitle}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {portalDescription}
          </Typography>

          {params.get("registered") === "true" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Signup successful! Your account was created. You can now sign in.
            </Alert>
          )}
          <Box component="form" onSubmit={submit} noValidate>
            <Stack spacing={2}>
              <TextField
                fullWidth
                autoFocus
                type="email"
                label="Email address"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRounded color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRounded color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((current) => !current)}
                          edge="end"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Keep me signed in on this device"
              sx={{ my: 1.25 }}
            />

            <Button
              fullWidth
              size="large"
              variant="contained"
              type="submit"
              disabled={busy || !form.email || !form.password}
              startIcon={<LoginRounded />}
              sx={{ minHeight: 50 }}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </Box>

          {!isAdminPortal && (
            <>
              <Divider sx={{ my: 3 }}>NEW PROPERTY OWNER?</Divider>
              <Button
                component={Link}
                to="/signup"
                fullWidth
                size="large"
                variant="outlined"
                sx={{ minHeight: 48 }}
              >
                Register your property business
              </Button>
            </>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
            sx={{ mt: 2 }}
          >
            {isAdminPortal ? "Administrator access only" : "Hotel-owner access only"}
          </Typography>
        </Paper>
      </section>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </main>
  );
}
