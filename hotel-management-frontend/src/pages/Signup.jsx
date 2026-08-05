import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, TextField, Typography } from "@mui/material";
import { ApartmentRounded } from "@mui/icons-material";
import { endpoints } from "../services/api";

export default function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await endpoints.signup({
        ...form,
        role: "HOTEL_OWNER",
      });
      navigate("/login");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <Box>
          <Typography variant="h5">StayFlow</Typography>
        </Box>
        <Box sx={{ maxWidth: 580, zIndex: 1 }}>
          <Typography variant="h2" fontWeight={800}>
            Hospitality starts with clarity.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 18, opacity: 0.82 }}>
            Create your hotel-owner workspace and bring properties, rooms,
            bookings, and performance under one roof.
          </Typography>
        </Box>
        <span>Secure hotel-owner onboarding</span>
      </section>

      <section className="auth-form">
        <Paper
          elevation={0}
          sx={{ width: "100%", maxWidth: 480, bgcolor: "transparent" }}
        >
          <Chip
            icon={<ApartmentRounded />}
            label="HOTEL OWNER ACCOUNT"
            color="primary"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="h4">Register as a hotel owner</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Create your owner profile. You can register properties after signing in.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              required
              label="Owner full name"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
            />
            <TextField
              required
              type="email"
              label="Business email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <TextField
              required
              label="Phone number"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
            <TextField
              required
              type="password"
              label="Password"
              inputProps={{ minLength: 6 }}
              helperText="Use at least 6 characters"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />

            <Button
              size="large"
              variant="contained"
              type="submit"
              disabled={busy}
            >
              {busy ? "Creating owner account…" : "Create hotel-owner account"}
            </Button>
          </Box>

          <Typography
            textAlign="center"
            sx={{ mt: 3 }}
            color="text.secondary"
          >
            Already registered? <Link to="/login">Sign in</Link>
          </Typography>
        </Paper>
      </section>
    </div>
  );
}
