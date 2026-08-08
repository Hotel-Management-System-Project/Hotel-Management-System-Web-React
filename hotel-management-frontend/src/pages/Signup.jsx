/**
 * Registers a hotel-owner account using a fixed owner role, validates the form,
 * reports backend errors, and redirects the new user to Login.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ApartmentRounded,
  ArrowBackRounded,
  EmailRounded,
  LockRounded,
  PersonRounded,
  PhoneRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { endpoints } from "../services/api";
import AuthShowcase from "../components/AuthShowcase";
import { Notice } from "../components/Common";

export default function Signup() {
  // The role is intentionally not selectable because this form creates owners.
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const redirectTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  // Mirror form feedback in a temporary toast for immediate user attention.
  useEffect(() => {
    if (error) setNotice({ type: "error", message: error });
  }, [error]);

  useEffect(() => {
    if (success) setNotice({ type: "success", message: success });
  }, [success]);

  // Send a six-digit code to the email currently entered in the form.
  const sendOtp = async () => {
    setError("");
    setSuccess("");
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Enter a valid email address first.");
      return;
    }

    setOtpBusy(true);
    try {
      await endpoints.sendSignupOtp(form.email.trim().toLowerCase());
      setOtpSent(true);
      setOtpVerified(false);
      setVerificationToken("");
      setSuccess("Verification code sent. Check your email inbox.");
    } catch (requestError) {
      setError(requestError.message || "Verification code could not be sent.");
    } finally {
      setOtpBusy(false);
    }
  };

  // Verify the OTP and keep the secure one-time token required by signup.
  const verifyOtp = async () => {
    setError("");
    setSuccess("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    setOtpBusy(true);
    try {
      const result = await endpoints.verifySignupOtp(
        form.email.trim().toLowerCase(),
        otp,
      );
      setVerificationToken(result.verificationToken);
      setOtpVerified(true);
      setSuccess("Email verified. You can now create your owner account.");
    } catch (requestError) {
      setError(requestError.message || "Incorrect verification code.");
    } finally {
      setOtpBusy(false);
    }
  };

  // Validate and send registration data, then return the new owner to Login.
  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await endpoints.signup({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: "HOTEL_OWNER",
        emailVerificationToken: verificationToken,
      });

      // Redirect only when the backend confirms the saved account email.
      if (!result?.email) {
        throw new Error(
          result?.message || "The backend did not confirm account creation.",
        );
      }

      const message =
        "Signup successful! Your account was created. Redirecting to login...";

      // Display confirmation before leaving Signup and persist it for Login.
      setSuccess(message);
      setNotice({ type: "success", message });
      sessionStorage.setItem("stayflow_signup_success", message);

      redirectTimer.current = setTimeout(() => {
        navigate("/login?registered=true", { replace: true });
      }, 1800);
    } catch (requestError) {
      setError(requestError.message || "Account could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const passwordMismatch =
    Boolean(form.confirmPassword) && form.password !== form.confirmPassword;

  return (
    <main className="auth-page">
      <AuthShowcase signup />
      <section className="auth-panel auth-panel-scroll">
        <Button
          component={Link}
          to="/"
          color="inherit"
          startIcon={<ArrowBackRounded />}
          className="auth-back"
        >
          Back to home
        </Button>

        <Paper className="auth-card auth-card-wide" elevation={0}>
          <Box className="auth-mobile-brand">
            <Box className="auth-brand-mark">S</Box>
            <Typography fontWeight={850}>StayFlow</Typography>
          </Box>

          <Chip
            icon={<ApartmentRounded />}
            label="HOTEL OWNER ACCOUNT"
            color="primary"
            variant="outlined"
            sx={{ mb: 2, fontWeight: 750 }}
          />
          <Typography variant="h4">Create your owner account</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            No role selection is required. This form always creates a hotel
            owner account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={submit}>
            <Box className="auth-signup-grid">
              <TextField
                required
                label="Owner full name"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRounded color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                required
                type="email"
                label="Business email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                disabled={otpSent}
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
              <Button
                type="button"
                variant="outlined"
                disabled={otpBusy}
                onClick={
                  otpSent
                    ? () => {
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtp("");
                        setVerificationToken("");
                        setSuccess("");
                      }
                    : sendOtp
                }
                sx={{ minHeight: 56 }}
              >
                {otpSent
                  ? "Change email"
                  : otpBusy
                    ? "Sending..."
                    : "Send OTP"}
              </Button>

              {otpSent && !otpVerified && (
                <>
                  <TextField
                    required
                    label="Email verification code"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputProps={{ inputMode: "numeric", maxLength: 6 }}
                    helperText="Enter the six-digit code sent to your email."
                  />
                  <Button
                    type="button"
                    variant="contained"
                    onClick={verifyOtp}
                    disabled={otpBusy || otp.length !== 6}
                    sx={{ minHeight: 56 }}
                  >
                    {otpBusy ? "Verifying..." : "Verify OTP"}
                  </Button>
                </>
              )}
              <TextField
                required
                label="Phone number"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                slotProps={{
                  htmlInput: { inputMode: "tel" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRounded color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                required
                type={showPassword ? "text" : "password"}
                label="Password"
                autoComplete="new-password"
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
                  },
                }}
              />
              <TextField
                required
                type={showPassword ? "text" : "password"}
                label="Confirm password"
                autoComplete="new-password"
                error={passwordMismatch}
                helperText={
                  passwordMismatch
                    ? "Passwords do not match."
                    : "Use at least 6 characters."
                }
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
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
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
            </Box>

            {otpVerified && (
              <Button
                fullWidth
                size="large"
                variant="contained"
                type="submit"
                disabled={
                  busy ||
                  !form.fullName ||
                  !form.email ||
                  !form.phone ||
                  !form.password ||
                  !form.confirmPassword
                }
                sx={{ minHeight: 50, mt: 2 }}
              >
                {busy ? "Creating account..." : "Sign up"}
              </Button>
            )}
          </Box>

          <Typography textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </Typography>
        </Paper>
      </section>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </main>
  );
}
