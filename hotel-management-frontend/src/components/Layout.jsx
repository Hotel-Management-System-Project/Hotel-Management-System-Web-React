/**
 * Provides the shared application shell: role-based sidebar, top navigation,
 * theme control, account menu, hotel selector, and the Outlet for active pages.
 */
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ApartmentRounded,
  BookOnlineRounded,
  DashboardRounded,
  DarkModeRounded,
  ExpandMoreRounded,
  LogoutRounded,
  LightModeRounded,
  AssessmentRounded,
  MeetingRoomRounded,
  MenuRounded,
  PeopleRounded,
  SettingsRounded,
} from "@mui/icons-material";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import { useThemeMode } from "../context/useThemeMode";
import { endpoints } from "../services/api";

const width = 252;

export default function Layout() {
  // These local states control the mobile drawer and account menu.
  const mobile = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [unreadBookings, setUnreadBookings] = useState(0);
  const [ownerBookingIds, setOwnerBookingIds] = useState([]);

  const { user, logout, isAdmin, isOwner, isCustomer } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const {
    hotels,
    selectedHotel,
    selectHotel,
    loadingHotels,
    hotelError,
    refreshHotels,
  } = useHotelSelection();

  // Poll the active owner's hotel and compare booking IDs with locally read IDs.
  useEffect(() => {
    setUnreadBookings(0);
    setOwnerBookingIds([]);
    if (!isOwner || !selectedHotel?.hotelId) return undefined;

    const hotelId = selectedHotel.hotelId;
    const storageKey = `stayflow_seen_bookings_${user?.userId || user?.email}_${hotelId}`;

    const checkNewBookings = async () => {
      try {
        const result = await endpoints.hotelBookings(hotelId);
        const bookingIds = (Array.isArray(result) ? result : [])
          .map((booking) => booking.bookingId)
          .filter((id) => id !== null && id !== undefined)
          .map(String);
        setOwnerBookingIds(bookingIds);

        const savedValue = localStorage.getItem(storageKey);
        if (savedValue === null) {
          // Existing bookings are the initial baseline, not false notifications.
          localStorage.setItem(storageKey, JSON.stringify(bookingIds));
          setUnreadBookings(0);
          return;
        }

        const seenIds = new Set(JSON.parse(savedValue));
        setUnreadBookings(
          bookingIds.filter((bookingId) => !seenIds.has(bookingId)).length,
        );
      } catch {
        // Notification polling must not interrupt normal sidebar navigation.
      }
    };

    checkNewBookings();
    const timer = window.setInterval(checkNewBookings, 15000);
    return () => window.clearInterval(timer);
  }, [isOwner, selectedHotel?.hotelId, user?.userId, user?.email]);

  // Opening Hotel Bookings acknowledges every booking currently loaded.
  const markOwnerBookingsRead = () => {
    if (!isOwner || !selectedHotel?.hotelId) return;
    const storageKey = `stayflow_seen_bookings_${user?.userId || user?.email}_${selectedHotel.hotelId}`;
    localStorage.setItem(storageKey, JSON.stringify(ownerBookingIds));
    setUnreadBookings(0);
  };

  // Navigation names and available pages change according to the current role.
  const items = [
    ["Dashboard", "/dashboard", <DashboardRounded />],
    [
      isOwner ? "My Hotels" : isCustomer ? "Browse Hotels" : "Hotels",
      "/hotels",
      <ApartmentRounded />,
    ],
    [
      isOwner ? "My Rooms" : isCustomer ? "Available Rooms" : "Rooms",
      "/rooms",
      <MeetingRoomRounded />,
    ],
    [
      isOwner ? "Hotel Bookings" : isCustomer ? "My Bookings" : "Bookings",
      "/bookings",
      isOwner ? (
        <Badge badgeContent={unreadBookings} color="error" max={99}>
          <BookOnlineRounded />
        </Badge>
      ) : (
        <BookOnlineRounded />
      ),
    ],
    ...(isOwner
      ? [["Sales Reports", "/reports", <AssessmentRounded />]]
      : []),
    ...(isAdmin ? [["Customers & Owners", "/users", <PeopleRounded />]] : []),
    ["Settings", "/settings", <SettingsRounded />],
  ];

  // Reuse the same sidebar content on permanent desktop and temporary mobile UI.
  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.3,
          px: 1,
          py: 1.5,
        }}
      >
        <div className="logo-mark">S</div>

        <Box>
          <Typography fontWeight={800}>StayFlow</Typography>

          <Typography variant="caption" color="text.secondary">
            {isAdmin
              ? "Administration"
              : isOwner
                ? "Owner portal"
                : "Guest portal"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{ px: 2, py: 1 }}
      >
        {isAdmin ? "ADMINISTRATION" : isOwner ? "MY PROPERTY" : "MY ACCOUNT"}
      </Typography>

      {isOwner && (
        <Box sx={{ px: 1, pb: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="sidebar-hotel-label">Change hotel</InputLabel>
            <Select
              labelId="sidebar-hotel-label"
              label="Change hotel"
              value={selectedHotel?.hotelId ?? ""}
              disabled={loadingHotels || hotels.length === 0}
              onChange={(event) => selectHotel(event.target.value)}
            >
              {hotels.map((hotel) => (
                <MenuItem key={hotel.hotelId} value={hotel.hotelId}>
                  {hotel.hotelName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {hotelError && (
            <Alert
              severity="error"
              sx={{ mt: 1, px: 1, py: 0.5, fontSize: 12 }}
              action={
                <Button size="small" onClick={refreshHotels}>
                  Retry
                </Button>
              }
            >
              {hotelError}
            </Alert>
          )}
        </Box>
      )}

      <List>
        {items.map(([label, path, icon]) => (
          <ListItemButton
            key={path}
            selected={location.pathname === path}
            onClick={() => {
              if (path === "/bookings") markOwnerBookingsRead();
              navigate(path);
              setOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                bgcolor: "#FEF2F2",
                color: "primary.main",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: "inherit",
              }}
            >
              {icon}
            </ListItemIcon>

            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontWeight: 650,
                fontSize: 14,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box
        sx={{
          mt: "auto",
          p: 1.5,
          bgcolor: mode === "dark" ? "#202838" : "#F8FAFC",
          color: mode === "dark" ? "#F8FAFC" : "#101828",
          border: "1px solid",
          borderColor: mode === "dark" ? "#344054" : "#EAECF0",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: mode === "dark" ? "#A8B1C1" : "#667085" }}
        >
          Signed in as
        </Typography>

        <Typography
          fontWeight={700}
          noWrap
          sx={{ color: mode === "dark" ? "#FFFFFF" : "#101828" }}
        >
          {user?.email}
        </Typography>

        <Typography variant="caption" color="primary.main">
          {user?.role?.replace("_", " ")}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          left: mobile ? 0 : width,
          width: mobile ? "100%" : `calc(100% - ${width}px)`,
          borderBottom: "1px solid #EAECF0",
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              display: mobile ? "inline-flex" : "none",
            }}
          >
            <MenuRounded />
          </IconButton>

          <Typography fontWeight={750} sx={{ flex: 1 }}>
            {items.find((item) => item[1] === location.pathname)?.[0]}
          </Typography>

          <IconButton
            onClick={toggleMode}
            aria-label="Toggle light and dark theme"
            title={mode === "dark" ? "Use light theme" : "Use dark theme"}
            sx={{ mr: 1 }}
          >
            {mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}
          </IconButton>

          <IconButton onClick={(event) => setAnchor(event.currentTarget)}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "#FEE2E2",
                color: "#DC2626",
              }}
            >
              {user?.email?.[0]?.toUpperCase()}
            </Avatar>

            <ExpandMoreRounded />
          </IconButton>

          <Menu
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={() => setAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAnchor(null);
                navigate("/settings");
              }}
            >
              Account settings
            </MenuItem>

            <MenuItem onClick={logout}>
              <LogoutRounded sx={{ mr: 1 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {mobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: { width },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          pt: "64px",
          flexGrow: 1,
          width: mobile ? "100%" : `calc(100% - ${width}px)`,
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
