/**
 * Contains small reusable UI components such as page headings, loading states,
 * empty states, confirmation dialogs, and status chips used across many pages.
 */
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";

// Page Header
export function PageHeader({ eyebrow, title, subtitle, action }) {
  // Centralized heading markup keeps every management page visually consistent.
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ flex: 1 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}

        <Typography variant="h4">{title}</Typography>

        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action}
    </Box>
  );
}

// Metric Card
export function Metric({ label, value, icon, color = "#DC2626", helper }) {
  // The color and icon are configurable so one card supports every statistic.
  return (
    <Card className="metric-card">
      <CardContent
        sx={{
          display: "flex",
          gap: 2.2,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: `${color}14`,
            color,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>

          <Typography variant="h5">{value}</Typography>

          {helper && (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Status Chip
export function Status({ value }) {
  // Convert backend status strings into consistent user-facing colors.
  const v = String(value || "UNKNOWN").toUpperCase();

  const map = {
    APPROVED: "success",
    CONFIRMED: "success",
    BOOKED: "success",
    COMPLETED: "success",
    AVAILABLE: "success",
    ACTIVE: "success",
    DRAFT: "info",
    PENDING: "warning",
    REJECTED: "error",
    CANCELLED: "error",
    UNAVAILABLE: "default",
  };

  return (
    <Chip
      size="small"
      label={v.replace("_", " ")}
      color={map[v] || "default"}
      variant={map[v] ? "filled" : "outlined"}
      sx={{
        fontWeight: 700,
        fontSize: 11,
      }}
    />
  );
}

// Loading
export function Loading() {
  // Shared feedback prevents each page from creating a different loading design.
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: 300,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

// Empty State
export function Empty({
  title = "Nothing here yet",
  subtitle = "New records will appear here.",
}) {
  // Reusable empty-state text explains why a list or table has no records.
  return (
    <div className="empty">
      <Typography variant="h6">{title}</Typography>
      <Typography>{subtitle}</Typography>
    </div>
  );
}

// Confirm Dialog
export function Confirm({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  danger = false,
}) {
  // Destructive actions use the same confirmation pattern throughout the app.
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Typography color="text.secondary">{children}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          color={danger ? "error" : "primary"}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Snackbar Notification
export function Notice({ notice, onClose }) {
  // A single notice component displays success and error feedback consistently.
  return (
    <Snackbar
      open={Boolean(notice)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={notice?.type || "success"}
        onClose={onClose}
        variant="filled"
      >
        {notice?.message}
      </Alert>
    </Snackbar>
  );
}
