import { Link } from "react-router-dom";

import {
  ApartmentRounded,
  ArrowForwardRounded,
  BedRounded,
  BookOnlineRounded,
  CheckCircleRounded,
  HotelRounded,
  InsightsRounded,
  SecurityRounded,
  TrendingUpRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import { useAuth } from "../context/AuthContext";

/*
  Dark-theme code has been removed because this file does not exist:

  ../context/ThemeModeContext

  Removed code:
  import { useThemeMode } from "../context/ThemeModeContext";

  Also removed:
  const { mode, toggleMode } = useThemeMode();

  Dark mode and light mode icons were also removed.
*/

const features = [
  [
    "Property management",
    "Register and manage multiple hotels from one owner workspace.",
    <ApartmentRounded />,
  ],
  [
    "Room inventory",
    "Control room types, capacity, pricing and live availability.",
    <BedRounded />,
  ],
  [
    "Booking operations",
    "Review reservations and manage every guest stay.",
    <BookOnlineRounded />,
  ],
  [
    "Revenue insights",
    "Understand booking value and property performance.",
    <InsightsRounded />,
  ],
];

const steps = [
  [
    "01",
    "Create owner profile",
    "Enter your business and contact information.",
  ],
  [
    "02",
    "Register your property",
    "Add hotel details and submit them for approval.",
  ],
  [
    "03",
    "Start hotel operations",
    "Add rooms, manage bookings and track performance.",
  ],
];

export default function Home() {
  // Get currently logged-in user from AuthContext
  const { user } = useAuth();

  return (
    <Box className="home-page">
      {/* ================= HEADER / NAVBAR ================= */}
      <Box component="header" className="home-nav">
        <Container maxWidth="xl">
          <Box className="home-nav-inner">
            {/* Website logo and name */}
            <Box className="home-brand">
              <Box className="logo-mark">S</Box>

              <Box>
                <Typography fontWeight={850}>
                  StayFlow
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Hotel owner platform
                </Typography>
              </Box>
            </Box>

            {/* Login, Register or Dashboard buttons */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              {user ? (
                // Show dashboard button when user is logged in
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  endIcon={<ArrowForwardRounded />}
                >
                  Open dashboard
                </Button>
              ) : (
                // Show login and registration buttons
                <Stack direction="row" spacing={1}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                  >
                    Login
                  </Button>

                  <Button
                    component={Link}
                    to="/signup"
                    variant="contained"
                    endIcon={<ArrowForwardRounded />}
                  >
                    Register property
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ================= MAIN CONTENT ================= */}
      <Box component="main">
        {/* ================= HERO SECTION ================= */}
        <Box className="home-hero">
          <Container maxWidth="xl">
            <Box className="home-hero-grid">
              {/* Hero left section */}
              <Box>
                <Chip
                  icon={<CheckCircleRounded />}
                  label="Built exclusively for hotel owners"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 3 }}
                />

                <Typography
                  component="h1"
                  className="home-title"
                >
                  Run every property.{" "}
                  <Box component="span">
                    Grow with confidence.
                  </Box>
                </Typography>

                <Typography className="home-lead">
                  One dependable workspace to register properties,
                  manage rooms, monitor bookings, and understand
                  revenue across your hotel business.
                </Typography>

                {/* Secure access information */}
                <Box className="home-owner-note">
                  <Box className="home-owner-note-icon">
                    <SecurityRounded />
                  </Box>

                  <Box>
                    <Typography fontWeight={800}>
                      Secure hotel-owner access
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Already registered?{" "}
                      <Link to="/login">
                        Sign in to your workspace
                      </Link>
                    </Typography>
                  </Box>
                </Box>

                {/* Trust points */}
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2.5}
                  className="home-trust"
                >
                  <span>
                    <CheckCircleRounded />
                    Admin approval
                  </span>

                  <span>
                    <SecurityRounded />
                    Role-based security
                  </span>

                  <span>
                    <TrendingUpRounded />
                    Business insights
                  </span>
                </Stack>
              </Box>

              {/* Hero right dashboard card */}
              <Box className="home-showcase">
                <Box className="home-orbit home-orbit-one" />
                <Box className="home-orbit home-orbit-two" />

                <Card className="home-property-card">
                  <CardContent>
                    <Box className="home-dashboard-heading">
                      <Box className="home-card-icon">
                        <HotelRounded />
                      </Box>

                      <Chip
                        label="LIVE"
                        size="small"
                        color="success"
                      />
                    </Box>

                    <Typography
                      variant="overline"
                      color="primary.main"
                      fontWeight={800}
                    >
                      Owner overview
                    </Typography>

                    <Typography variant="h4">
                      My Properties
                    </Typography>

                    <Typography color="text.secondary">
                      3 hotels · 24 rooms · 18 available
                    </Typography>

                    {/* Dashboard statistics */}
                    <Box className="home-mini-metrics">
                      <Box>
                        <Typography variant="caption">
                          Bookings
                        </Typography>

                        <Typography variant="h5">
                          42
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption">
                          Occupancy
                        </Typography>

                        <Typography variant="h5">
                          78%
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption">
                          Revenue
                        </Typography>

                        <Typography variant="h5">
                          ₹1.25L
                        </Typography>
                      </Box>
                    </Box>

                    {/* Performance information */}
                    <Box className="home-performance">
                      <Box>
                        <Typography fontWeight={750}>
                          Monthly performance
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Booking revenue trend
                        </Typography>
                      </Box>

                      <Typography
                        color="success.main"
                        fontWeight={850}
                      >
                        +18.4%
                      </Typography>
                    </Box>

                    {/* Simple graph bars */}
                    <Box className="home-bars">
                      {[38, 52, 46, 70, 62, 88, 78].map(
                        (height, index) => (
                          <span
                            key={index}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        )
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Floating information box */}
                <Box className="home-floating-stat">
                  <CheckCircleRounded color="success" />

                  <Box>
                    <Typography fontWeight={800}>
                      All systems ready
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Properties connected
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* ================= STATISTICS SECTION ================= */}
        <Box className="home-stats">
          <Container maxWidth="xl">
            <Box className="home-stats-grid">
              <Box>
                <Typography variant="h3">
                  One
                </Typography>

                <Typography>
                  workspace for every property
                </Typography>
              </Box>

              <Box>
                <Typography variant="h3">
                  24/7
                </Typography>

                <Typography>
                  inventory visibility
                </Typography>
              </Box>

              <Box>
                <Typography variant="h3">
                  100%
                </Typography>

                <Typography>
                  role-based operations
                </Typography>
              </Box>

              <Box>
                <Typography variant="h3">
                  Live
                </Typography>

                <Typography>
                  booking performance
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* ================= FEATURES SECTION ================= */}
        <Box
          component="section"
          className="home-features"
        >
          <Container maxWidth="xl">
            <Box className="home-section-heading">
              <Typography className="eyebrow">
                OWNER PLATFORM
              </Typography>

              <Typography variant="h3">
                Everything needed to manage your hotels
              </Typography>

              <Typography color="text.secondary">
                Clear hotel-wise control without operational
                clutter.
              </Typography>
            </Box>

            <Box className="home-feature-grid">
              {features.map(
                ([title, description, icon]) => (
                  <Card
                    key={title}
                    className="home-feature-card"
                  >
                    <CardContent>
                      <Box className="home-feature-icon">
                        {icon}
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{ mt: 2 }}
                      >
                        {title}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {description}
                      </Typography>
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          </Container>
        </Box>

        {/* ================= ONBOARDING STEPS ================= */}
        <Box
          component="section"
          className="home-process"
        >
          <Container maxWidth="xl">
            <Box className="home-section-heading">
              <Typography className="eyebrow">
                SIMPLE ONBOARDING
              </Typography>

              <Typography variant="h3">
                From registration to operations
              </Typography>

              <Typography color="text.secondary">
                Three clear steps to bring your property into
                StayFlow.
              </Typography>
            </Box>

            <Box className="home-steps">
              {steps.map(
                ([number, title, description]) => (
                  <Box
                    className="home-step"
                    key={number}
                  >
                    <Typography className="home-step-number">
                      {number}
                    </Typography>

                    <Typography variant="h6">
                      {title}
                    </Typography>

                    <Typography color="text.secondary">
                      {description}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Container>
        </Box>

        {/* ================= CALL TO ACTION ================= */}
        <Container maxWidth="xl">
          <Box className="home-cta">
            <Box>
              <Typography
                variant="overline"
                sx={{ opacity: 0.75 }}
              >
                STAYFLOW FOR OWNERS
              </Typography>

              <Typography variant="h4">
                Your properties deserve one clear operating
                system.
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  opacity: 0.8,
                }}
              >
                Register once, submit your hotel, and manage
                operations after approval.
              </Typography>
            </Box>

            <ApartmentRounded className="home-cta-icon" />
          </Box>
        </Container>
      </Box>

      {/* ================= FOOTER ================= */}
      <Box
        component="footer"
        className="home-footer"
      >
        <Container maxWidth="xl">
          <Box className="home-footer-inner">
            <Typography variant="body2">
              © 2026 StayFlow. Built for hotel owners.
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Properties · Rooms · Bookings · Insights
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}