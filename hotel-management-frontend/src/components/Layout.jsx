import { useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  ApartmentRounded,
  BookOnlineRounded,
  DashboardRounded,
  ExpandMoreRounded,
  LogoutRounded,
  MeetingRoomRounded,
  MenuRounded,
  PeopleRounded,
  SettingsRounded,
} from '@mui/icons-material';
//import { useAuth } from '../context/AuthContext';

const width = 252;

export default function Layout() {
    
  const mobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);

  const {
    user,
    logout,
    isAdmin,
    isOwner,
    isCustomer,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    ['Dashboard', '/dashboard', <DashboardRounded />],
    [
      isOwner
        ? 'My Hotels'
        : isCustomer
          ? 'Browse Hotels'
          : 'Hotels',
      '/hotels',
      <ApartmentRounded />,
    ],
    [
      isOwner
        ? 'My Rooms'
        : isCustomer
          ? 'Available Rooms'
          : 'Rooms',
      '/rooms',
      <MeetingRoomRounded />,
    ],
    [
      isOwner
        ? 'Hotel Bookings'
        : isCustomer
          ? 'My Bookings'
          : 'Bookings',
      '/bookings',
      <BookOnlineRounded />,
    ],
    ...(isAdmin
      ? [['Users', '/users', <PeopleRounded />]]
      : []),
    ['Settings', '/settings', <SettingsRounded />],
  ];

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.3,
          px: 1,
          py: 1.5,
        }}
      >
        <div className="logo-mark">S</div>

        <Box>
          <Typography fontWeight={800}>
            StayFlow
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {isAdmin
              ? 'Administration'
              : isOwner
                ? 'Owner portal'
                : 'Guest portal'}
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
        {isAdmin
          ? 'ADMINISTRATION'
          : isOwner
            ? 'MY PROPERTY'
            : 'MY ACCOUNT'}
      </Typography>

      <List>
        {items.map(([label, path, icon]) => (
          <ListItemButton
            key={path}
            selected={location.pathname === path}
            onClick={() => {
              navigate(path);
              setOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: '#EFF4FF',
                color: 'primary.main',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: 'inherit',
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
          mt: 'auto',
          p: 1.5,
          bgcolor: '#F8FAFC',
          borderRadius: 2,
        }}
      >
        <Typography variant="caption">
          Signed in as
        </Typography>

        <Typography fontWeight={700} noWrap>
          {user?.email}
        </Typography>

        <Typography
          variant="caption"
          color="primary.main"
        >
          {user?.role?.replace('_', ' ')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          left: mobile ? 0 : width,
          width: mobile
            ? '100%'
            : `calc(100% - ${width}px)`,
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              display: mobile
                ? 'inline-flex'
                : 'none',
            }}
          >
            <MenuRounded />
          </IconButton>

          <Typography
            fontWeight={750}
            sx={{ flex: 1 }}
          >
            {
              items.find(
                (item) =>
                  item[1] === location.pathname,
              )?.[0]
            }
          </Typography>

          <IconButton
            onClick={(event) =>
              setAnchor(event.currentTarget)
            }
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#E0EAFF',
                color: '#155EEF',
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
                navigate('/settings');
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
            '& .MuiDrawer-paper': {
              width,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          pt: '64px',
          flexGrow: 1,
          width: mobile
            ? '100%'
            : `calc(100% - ${width}px)`,
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}