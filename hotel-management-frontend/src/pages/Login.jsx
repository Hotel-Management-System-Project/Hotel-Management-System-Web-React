import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  HotelRounded,
  CheckCircleRounded,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await login(form);
      nav("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left Section */}
      <section className="auth-hero">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <HotelRounded />
          <Typography variant="h6">StayFlow</Typography>
        </Box>

        <Box
          sx={{
            maxWidth: 570,
            zIndex: 1,
          }}
        >
          <Typography
            variant="h2"
            fontWeight={800}
            lineHeight={1.08}
          >
            Run every stay with confidence.
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              opacity: 0.82,
              fontSize: 18,
            }}
          >
            One polished workspace for properties, rooms,
            bookings, guests, and approvals.
          </Typography>

          <Box
            sx={{
              mt: 5,
              display: "grid",
              gap: 1.5,
            }}
          >
            {[
              "Real-time property visibility",
              "Role-based access and secure JWT login",
              "Responsive on desktop, tablet, and mobile",
            ].map((item) => (
              <Box
                key={item}
                sx={{
                  display: "flex",
                  gap: 1.2,
                }}
              >
                <CheckCircleRounded fontSize="small" />
                <span>{item}</span>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{ opacity: 0.65 }}
        >
          © 2026 StayFlow. Built for modern hospitality.
        </Typography>
      </section>

      {/* Right Section */}
      <section className="auth-form">
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            p: 1,
            bgcolor: "transparent",
          }}
        >
          <Typography variant="h4">
            Welcome back
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              mb: 4,
            }}
          >
            Enter your credentials to access your workspace.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={submit}>
            <TextField
              fullWidth
              required
              type="email"
              label="Email address"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              type={show ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShow(!show)}
                    >
                      {show ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Remember me"
              sx={{ my: 1.5 }}
            />

            <Button
              fullWidth
              size="large"
              variant="contained"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </Box>

          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            New to StayFlow?{" "}
            <Link to="/signup">
              Create an account
            </Link>
          </Typography>
        </Paper>
      </section>
    </div>
  );
}
