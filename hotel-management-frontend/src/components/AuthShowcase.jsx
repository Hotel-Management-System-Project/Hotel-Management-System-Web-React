/**
 * Displays the shared branding and feature panel used beside Login and Signup.
 * The `signup` prop changes the message without duplicating the whole design.
 */
import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  ApartmentRounded,
  AutoGraphRounded,
  CheckCircleRounded,
  MeetingRoomRounded,
} from "@mui/icons-material";

export default function AuthShowcase({ signup = false }) {
  // One boolean selects the correct benefits for Login or owner registration.
  const features = signup
    ? [
        "Register and manage multiple properties",
        "Create room inventory with pricing and images",
        "Track customer bookings hotel by hotel",
      ]
    : [
        "One secure workspace for every role",
        "Live rooms, properties, and reservations",
        "Hotel-wise insights and revenue visibility",
      ];

  return (
    <section className="auth-showcase">
      <Box className="auth-brand">
        <Box className="auth-brand-mark">S</Box>
        <Box>
          <Typography fontWeight={850} fontSize={21}>
            StayFlow
          </Typography>
          <Typography variant="caption">Hotel management</Typography>
        </Box>
      </Box>

      <Box className="auth-showcase-copy">
        <Chip
          className="auth-showcase-chip"
          icon={signup ? <ApartmentRounded /> : <AutoGraphRounded />}
          label={signup ? "OWNER ONBOARDING" : "HOSPITALITY OPERATIONS"}
        />
        <Typography className="auth-showcase-title">
          {signup
            ? "Turn every property into a better guest experience."
            : "Everything your hotel needs, in one calm workspace."}
        </Typography>
        <Typography className="auth-showcase-lead">
          {signup
            ? "Create your owner account, submit properties for approval, and manage rooms and reservations from one place."
            : "StayFlow connects administrators, property owners, rooms, and bookings without operational clutter."}
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 4 }}>
          {features.map((feature) => (
            <Stack
              key={feature}
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <CheckCircleRounded sx={{ fontSize: 20 }} />
              <Typography>{feature}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box className="auth-preview-card">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="caption">TODAY'S OVERVIEW</Typography>
            <Typography fontWeight={800}>Property performance</Typography>
          </Box>
          <MeetingRoomRounded />
        </Stack>
        <Box className="auth-preview-bars">
          {[42, 66, 52, 88, 72, 94, 78].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </Box>
      </Box>
    </section>
  );
}
