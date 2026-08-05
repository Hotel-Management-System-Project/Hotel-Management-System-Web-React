/**
 * Provides account settings such as profile information, appearance preference,
 * and password-management actions for the currently authenticated user.
 */
import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  BadgeRounded,
  CloseRounded,
  DarkModeRounded,
  EmailRounded,
  LightModeRounded,
  LockResetRounded,
  SecurityRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useThemeMode } from "../context/useThemeMode";
import { Notice, PageHeader } from "../components/Common";

const emptyPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Settings() {
  // Password dialog state is kept local because no other page needs it.
  const { user } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState(emptyPasswordForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const roleLabel = String(user?.role || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  // Reset sensitive form fields whenever the password dialog closes.
  const closePasswordDialog = () => {
    if (saving) return;
    setPasswordOpen(false);
    setPasswords(emptyPasswordForm);
    setShowPassword(false);
  };

  // Validate matching passwords before calling the protected backend endpoint.
  const updatePassword = async (event) => {
    event.preventDefault();

    if (passwords.newPassword.length < 6) {
      setNotice({
        type: "error",
        message: "The new password must contain at least 6 characters.",
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setNotice({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    if (passwords.oldPassword === passwords.newPassword) {
      setNotice({
        type: "error",
        message:
          "Your new password must be different from the current password.",
      });
      return;
    }

    try {
      setSaving(true);
      await endpoints.changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setSaving(false);
      closePasswordDialog();
      setNotice({
        type: "success",
        message: "Password changed successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Password could not be changed.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="page">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile, security, and StayFlow appearance."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.35fr) minmax(320px, .65fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    fontSize: 30,
                    fontWeight: 800,
                    color: "primary.main",
                    bgcolor: "primary.main",
                    backgroundImage:
                      "linear-gradient(145deg, rgba(220,38,38,.16), rgba(127,86,217,.18))",
                  }}
                >
                  {user?.email?.[0]?.toUpperCase() || "S"}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5">Account profile</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Your authenticated StayFlow account information.
                  </Typography>
                </Box>

                <Chip
                  icon={<BadgeRounded />}
                  label={roleLabel || "User"}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Email address"
                  value={user?.email || ""}
                  disabled
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRounded fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Account role"
                  value={roleLabel}
                  disabled
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeRounded fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(220,38,38,.10)",
                    color: "primary.main",
                  }}
                >
                  <SecurityRounded />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">Security</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Protect your account with a strong password.
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>Password</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Change your password whenever you suspect unusual activity.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<LockResetRounded />}
                  onClick={() => setPasswordOpen(true)}
                  size="large"
                >
                  Change password
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6">Appearance</Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5, mb: 3 }}
            >
              Select how StayFlow looks on this device.
            </Typography>

            <Stack spacing={1.5}>
              {[
                {
                  value: "light",
                  label: "Light theme",
                  description: "Bright and clean workspace",
                  icon: <LightModeRounded />,
                },
                {
                  value: "dark",
                  label: "Dark theme",
                  description: "Comfortable in low light",
                  icon: <DarkModeRounded />,
                },
              ].map((theme) => {
                const selected = mode === theme.value;
                return (
                  <Button
                    key={theme.value}
                    onClick={() => {
                      if (!selected) toggleMode();
                    }}
                    variant={selected ? "contained" : "outlined"}
                    color={selected ? "primary" : "inherit"}
                    sx={{
                      p: 2,
                      justifyContent: "flex-start",
                      textAlign: "left",
                      borderWidth: 1,
                    }}
                  >
                    <Box
                      sx={{ mr: 1.5, display: "grid", placeItems: "center" }}
                    >
                      {theme.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={750}>{theme.label}</Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: selected ? 0.82 : 0.7 }}
                      >
                        {theme.description}
                      </Typography>
                    </Box>
                    {selected && (
                      <Chip label="Active" size="small" color="inherit" />
                    )}
                  </Button>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={passwordOpen}
        onClose={closePasswordDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={updatePassword}>
          <DialogTitle sx={{ pr: 7 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: "primary.main",
                  bgcolor: "rgba(220,38,38,.10)",
                }}
              >
                <LockResetRounded />
              </Box>
              <Box>
                <Typography variant="h6">Change password</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your current and new password.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={closePasswordDialog}
              disabled={saving}
              aria-label="Close"
              sx={{ position: "absolute", right: 14, top: 14 }}
            >
              <CloseRounded />
            </IconButton>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.25}>
              <TextField
                required
                autoFocus
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Current password"
                autoComplete="current-password"
                value={passwords.oldPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    oldPassword: event.target.value,
                  })
                }
              />
              <TextField
                required
                fullWidth
                type={showPassword ? "text" : "password"}
                label="New password"
                helperText="Use at least 6 characters."
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    newPassword: event.target.value,
                  })
                }
              />
              <TextField
                required
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Confirm new password"
                autoComplete="new-password"
                error={
                  Boolean(passwords.confirmPassword) &&
                  passwords.newPassword !== passwords.confirmPassword
                }
                helperText={
                  passwords.confirmPassword &&
                  passwords.newPassword !== passwords.confirmPassword
                    ? "Passwords do not match."
                    : " "
                }
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: event.target.value,
                  })
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((current) => !current)}
                          edge="end"
                          aria-label={
                            showPassword ? "Hide passwords" : "Show passwords"
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
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closePasswordDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                saving ||
                !passwords.oldPassword ||
                !passwords.newPassword ||
                !passwords.confirmPassword
              }
            >
              {saving ? "Updating..." : "Update password"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Box>
  );
}
