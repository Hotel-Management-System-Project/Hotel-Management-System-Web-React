/**
 * Displays and manages room inventory. It supports hotel-wise records, room
 * forms, multiple images, availability and price filters, and pagination.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  DeleteOutlineRounded,
  EditRounded,
  FilterAltOffRounded,
  HotelRounded,
  PeopleAltRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import {
  containsText,
  isValidHttpUrl,
  paginate,
  parseImageUrls
} from "../utils/data";
import {
  Empty,
  Loading,
  Notice,
  PageHeader,
  Status,
} from "../components/Common";

const empty = {
  hotelId: "",
  roomNumber: "",
  roomType: "Deluxe",
  pricePerNight: "",
  capacity: 2,
  airConditioned: true,
  hasWifi: true,
  hasTv: false,
  availabilityStatus: true,
  quantity: 1,
};

const ROOMS_PER_PAGE = 4;

export default function Rooms() {
  // Keep API data, active filters, image indexes, and edit-dialog values separate.
  const { isAdmin, isCustomer, isOwner } = useAuth();
  const { selectedHotel, loadingHotels } = useHotelSelection();
  const [params] = useSearchParams();
  const queryHotelId = params.get("hotelId");
  const queryHotelName = params.get("hotelName");

  const [rows, setRows] = useState([]);
  const [approvedHotels, setApprovedHotels] = useState([]);
  const [adminHotelId, setAdminHotelId] = useState("");
  const [search, setSearch] = useState("");
  const [roomType, setRoomType] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [hotelsById, setHotelsById] = useState({});
  const [imagesByHotel, setImagesByHotel] = useState({});
  const [imagesByRoom, setImagesByRoom] = useState({});
  const [imageIndexes, setImageIndexes] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(empty);
  const [imageUrls, setImageUrls] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const adminHotel = approvedHotels.find(
    (hotel) => Number(hotel.hotelId) === Number(adminHotelId),
  );
  const activeHotelId = isOwner
    ? selectedHotel?.hotelId
    : isAdmin
      ? adminHotelId
      : queryHotelId;
  const activeHotelName = isOwner
    ? selectedHotel?.hotelName
    : isAdmin
      ? adminHotel?.hotelName
      : queryHotelName;

  // Load rooms, hotel information, and multiple images required by each card.
  const load = async () => {
    setLoading(true);
    try {
      const [roomsResult, hotelsResult] = await Promise.all([
        endpoints.rooms(),
        endpoints.hotels().catch(() => []),
      ]);
      const roomList = Array.isArray(roomsResult) ? roomsResult : [];
      const hotelList = Array.isArray(hotelsResult) ? hotelsResult : [];

      setRows(roomList);
      setApprovedHotels(
        hotelList.filter(
          (hotel) => String(hotel.status || "").toUpperCase() === "APPROVED",
        ),
      );
      setHotelsById(
        Object.fromEntries(hotelList.map((hotel) => [hotel.hotelId, hotel])),
      );

      const hotelIds = [
        ...new Set(roomList.map((room) => room.hotelId).filter(Boolean)),
      ];
      const imageEntries = await Promise.all(
        hotelIds.map(async (hotelId) => {
          try {
            const images = await endpoints.images(hotelId);
            const firstImage = Array.isArray(images)
              ? images[0]?.imageUrl
              : null;
            return [hotelId, firstImage || null];
          } catch {
            return [hotelId, null];
          }
        }),
      );
      setImagesByHotel(Object.fromEntries(imageEntries));

      const roomImageEntries = await Promise.all(
        roomList.map(async (room) => {
          try {
            const images = await endpoints.roomImages(room.roomId);
            return [room.roomId, Array.isArray(images) ? images : []];
          } catch {
            return [room.roomId, []];
          }
        }),
      );
      setImagesByRoom(Object.fromEntries(roomImageEntries));
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Reload inventory whenever the selected owner property changes.
  useEffect(() => {
    load();
  }, []);

  // Filters always start from page one to avoid showing an empty later page.
  useEffect(() => {
    setPage(1);
  }, [activeHotelId, search, roomType, availability, minPrice, maxPrice]);

  // Copy a room into the form so the same dialog supports create and edit modes.
  const edit = (room) => {
    setForm(
      room
        ? {
            ...empty,
            ...room,
            // Older API responses did not include these amenity fields. Always
            // submit real booleans because Spring validates AC and TV as
            // required values during an update.
            airConditioned: Boolean(room.airConditioned),
            hasWifi: room.hasWifi !== false,
            hasTv: Boolean(room.hasTv),
          }
        : { ...empty, hotelId: activeHotelId || "" },
    );
    setImageUrls(
      room
        ? (imagesByRoom[room.roomId] || [])
            .map((image) => image.imageUrl)
            .join("\n")
        : "",
    );
    setEditId(room?.roomId || null);
    setOpen(true);
  };

  // Save room fields first, then synchronize its collection of image URLs.
  const save = async () => {
    const payload = {
      ...form,
      hotelId: Number(activeHotelId || form.hotelId),
      roomNumber: Number(form.roomNumber),
      pricePerNight: Number(form.pricePerNight),
      capacity: Number(form.capacity),
      quantity: Number(form.quantity || 1),
    };
    try {
      const nextUrls = parseImageUrls(imageUrls);
      const invalidUrl = nextUrls.find((url) => !isValidHttpUrl(url));
      if (invalidUrl) {
        throw new Error(`Invalid room image URL: ${invalidUrl}`);
      }

      if (!editId && (payload.quantity < 1 || payload.quantity > 100)) {
        throw new Error("Room quantity must be between 1 and 100");
      }

      // Quantity 1 uses the normal endpoint; larger values use one bulk request.
      const savedRooms = editId
        ? [await endpoints.updateRoom(editId, payload)]
        : payload.quantity > 1
          ? await endpoints.addRoomsBulk({
              hotelId: payload.hotelId,
              startRoomNumber: payload.roomNumber,
              quantity: payload.quantity,
              roomType: payload.roomType,
              pricePerNight: payload.pricePerNight,
              capacity: payload.capacity,
              airConditioned: payload.airConditioned,
              hasWifi: payload.hasWifi,
              hasTv: payload.hasTv,
              availabilityStatus: payload.availabilityStatus,
            })
          : [await endpoints.addRoom(payload)];

      // In bulk mode the entered image collection is attached to every new room.
      for (const savedRoom of savedRooms) {
        const roomId = editId || savedRoom?.roomId;
        if (!roomId) throw new Error("A saved room id was not returned");

        const existingImages = imagesByRoom[roomId] || [];
        const nextUrlSet = new Set(nextUrls);
        const existingUrlSet = new Set(
          existingImages.map((image) => image.imageUrl),
        );
        await Promise.all([
          ...existingImages
            .filter((image) => !nextUrlSet.has(image.imageUrl))
            .map((image) => endpoints.deleteRoomImage(image.imageId)),
          ...nextUrls
            .filter((url) => !existingUrlSet.has(url))
            .map((imageUrl) => endpoints.addRoomImage({ roomId, imageUrl })),
        ]);
      }
      setOpen(false);
      setNotice({
        type: "success",
        message: editId
          ? "Room updated successfully."
          : `${savedRooms.length} room(s) added successfully.`,
      });
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  // Room deletion is confirmed because related images may also be removed.
  const remove = async (room) => {
    if (!window.confirm(`Delete room #${room.roomNumber}?`)) return;
    try {
      await endpoints.deleteRoom(room.roomId);
      setNotice({
        type: "success",
        message: `Room #${room.roomNumber} deleted successfully.`,
      });
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  // Move only the selected card's carousel while wrapping at both ends.
  const changeImage = (roomId, imageCount, direction) => {
    setImageIndexes((current) => {
      const activeIndex = current[roomId] || 0;
      return {
        ...current,
        [roomId]: (activeIndex + direction + imageCount) % imageCount,
      };
    });
  };

  if (loading || loadingHotels) return <Loading />;

  let visible =
    isOwner && !activeHotelId
      ? []
      : activeHotelId
        ? rows.filter((room) => Number(room.hotelId) === Number(activeHotelId))
        : rows;
  if (isCustomer) {
    visible = visible.filter((room) => room.availabilityStatus);
  }
  visible = visible.filter((room) => {
      const hotel = hotelsById[room.hotelId];
    const matchesSearch = containsText(search, [
      room.roomNumber,
      room.roomType,
      hotel?.hotelName,
    ]);
    const matchesType =
      roomType === "ALL" ||
      String(room.roomType || "").toUpperCase() === roomType;
    const matchesAvailability =
      availability === "ALL" ||
      (availability === "AVAILABLE"
        ? Boolean(room.availabilityStatus)
        : !room.availabilityStatus);
    const price = Number(room.pricePerNight || 0);
    const matchesMin = minPrice === "" || price >= Number(minPrice);
    const matchesMax = maxPrice === "" || price <= Number(maxPrice);
    return (
      matchesSearch &&
      matchesType &&
      matchesAvailability &&
      matchesMin &&
      matchesMax
    );
  });

  const roomTypes = [
    ...new Set(
      rows
        .map((room) =>
          String(room.roomType || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ].sort();

  // Clear all room filters while retaining the user's selected owner property.
  const clearFilters = () => {
    setSearch("");
    setRoomType("ALL");
    setAvailability("ALL");
    setMinPrice("");
    setMaxPrice("");
  };

  // Admin hotel filtering is local to this page and does not affect owner context.
  const changeAdminHotel = (hotelId) => {
    setAdminHotelId(hotelId);
    clearFilters();
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(visible.length / ROOMS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const paginatedRooms = paginate(visible, currentPage, ROOMS_PER_PAGE);

  const title = activeHotelName
    ? `${activeHotelName} Rooms`
    : isCustomer
      ? "Available Rooms"
      : isOwner
        ? "My Rooms"
        : "Rooms";

  return (
    <div className="page">
      <PageHeader
        eyebrow={activeHotelId ? "Selected hotel" : "Room collection"}
        title={title}
        subtitle={
          activeHotelId
            ? `Room inventory for ${activeHotelName || `hotel #${activeHotelId}`}.`
            : isOwner
              ? "Choose a hotel from the sidebar to manage its rooms."
              : isCustomer
                ? "Explore comfortable rooms across our approved hotels."
                : "Manage room inventory across every property."
        }
        action={
          !isCustomer && activeHotelId ? (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => edit()}
            >
              Add room
            </Button>
          ) : null
        }
      />

      {/* All roles use the same select-first room filter. */}
      <>
        <Card sx={{ mb: 3 }}>
          <CardContent
            sx={{
              p: { xs: 1.75, md: 2 },
              "&:last-child": { pb: { xs: 1.75, md: 2 } },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Hotel and room filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isAdmin
                    ? "Select a hotel and narrow its rooms."
                    : `Filter rooms for ${
                        activeHotelName || "the selected hotel"
                      }.`}
                </Typography>
              </Box>
              <Button
                startIcon={<FilterAltOffRounded />}
                onClick={clearFilters}
                disabled={
                  !search &&
                  roomType === "ALL" &&
                  availability === "" &&
                  minPrice === "" &&
                  maxPrice === ""
                }
              >
                Clear filters
              </Button>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  xl: isAdmin
                    ? "2fr 1.5fr 1.2fr 1fr 1fr 1.2fr"
                    : "1.7fr 1.2fr 1fr 1fr 1.1fr",
                },
                gap: 1.25,
              }}
            >
              {isAdmin && (
                <FormControl fullWidth size="small">
                  <InputLabel id="admin-hotel-filter-label">
                    Approved hotel
                  </InputLabel>
                  <Select
                    labelId="admin-hotel-filter-label"
                    value={adminHotelId}
                    label="Approved hotel"
                    onChange={(event) => changeAdminHotel(event.target.value)}
                  >
                    <MenuItem value="">
                      <em>All approved hotels</em>
                    </MenuItem>
                    {approvedHotels.map((hotel) => (
                      <MenuItem key={hotel.hotelId} value={hotel.hotelId}>
                        {hotel.hotelName} — {hotel.city} (
                        {
                          rows.filter(
                            (room) =>
                              Number(room.hotelId) === Number(hotel.hotelId),
                          ).length
                        }{" "}
                        rooms)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                size="small"
                label="Search rooms"
                placeholder="Room number or hotel"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl fullWidth size="small">
                <InputLabel id="room-type-filter-label">Room type</InputLabel>
                <Select
                  labelId="room-type-filter-label"
                  value={roomType}
                  label="Room type"
                  onChange={(event) => setRoomType(event.target.value)}
                >
                  <MenuItem value="ALL">All room types</MenuItem>
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type
                        .toLowerCase()
                        .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Minimum price"
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                slotProps={{
                  htmlInput: { min: 0 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                size="small"
                label="Maximum price"
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                slotProps={{
                  htmlInput: { min: 0 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl fullWidth size="small">
                <InputLabel id="availability-filter-label" shrink>
                  Availability
                </InputLabel>
                <Select
                  labelId="availability-filter-label"
                  value={availability}
                  label="Availability"
                  onChange={(event) => setAvailability(event.target.value)}
                  displayEmpty
                  renderValue={(value) =>
                    value
                      ? value === "ALL"
                        ? "All statuses"
                        : value[0] + value.slice(1).toLowerCase()
                      : "Select availability"
                  }
                >
                  <MenuItem value="" disabled>Select availability</MenuItem>
                  <MenuItem value="ALL">All statuses</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  {!isCustomer && <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>}
                </Select>
              </FormControl>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mt: 1.25 }}
            >
              <Typography variant="body2" color="text.secondary">
                {isAdmin
                  ? `${approvedHotels.length} approved hotels available`
                  : activeHotelName
                    ? `Selected hotel: ${activeHotelName}`
                    : "Select a hotel from the sidebar"}
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {visible.length} matching rooms
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </>

      {!visible.length ? (
        <Card>
          <Empty
            title={
              isOwner && !activeHotelId
                ? "Select a hotel from the sidebar"
                : !availability
                  ? "Select availability to view rooms"
                  : "No rooms found"
            }
            subtitle={
              !availability
                ? "Choose All statuses to display every permitted room, or select availability."
                : undefined
            }
          />
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRooms.map((room) => {
              const hotel = hotelsById[room.hotelId];
              const roomImages = imagesByRoom[room.roomId] || [];
              const currentImageIndex = Math.min(
                imageIndexes[room.roomId] || 0,
                Math.max(roomImages.length - 1, 0),
              );
              const imageUrl =
                roomImages[currentImageIndex]?.imageUrl ||
                imagesByHotel[room.hotelId];
              return (
                <Grid key={room.roomId} size={{ xs: 12, sm: 6, xl: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      overflow: "hidden",
                      transition: "transform .2s ease, box-shadow .2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 18px 40px rgba(16,24,40,.14)",
                      },
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      {imageUrl ? (
                        <CardMedia
                          component="img"
                          height="210"
                          image={imageUrl}
                          alt={`${hotel?.hotelName || "Hotel"} ${room.roomType} room`}
                          sx={{ objectFit: "cover" }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 210,
                            display: "grid",
                            placeItems: "center",
                            color: "common.white",
                            background:
                              "linear-gradient(135deg, #DC2626 0%, #7F56D9 100%)",
                          }}
                        >
                          <HotelRounded sx={{ fontSize: 72, opacity: 0.85 }} />
                        </Box>
                      )}

                      <Box sx={{ position: "absolute", top: 14, right: 14 }}>
                        <Status
                          value={
                            room.availabilityStatus
                              ? "AVAILABLE"
                              : "UNAVAILABLE"
                          }
                        />
                      </Box>
                      {roomImages.length > 1 && (
                        <>
                          <IconButton
                            aria-label={`Previous image for room ${room.roomNumber}`}
                            onClick={() =>
                              changeImage(room.roomId, roomImages.length, -1)
                            }
                            sx={{
                              position: "absolute",
                              left: 10,
                              top: "50%",
                              transform: "translateY(-50%)",
                              bgcolor: "rgba(15,23,42,.68)",
                              color: "white",
                              "&:hover": { bgcolor: "rgba(15,23,42,.9)" },
                            }}
                          >
                            <ChevronLeftRounded />
                          </IconButton>
                          <IconButton
                            aria-label={`Next image for room ${room.roomNumber}`}
                            onClick={() =>
                              changeImage(room.roomId, roomImages.length, 1)
                            }
                            sx={{
                              position: "absolute",
                              right: 10,
                              top: "50%",
                              transform: "translateY(-50%)",
                              bgcolor: "rgba(15,23,42,.68)",
                              color: "white",
                              "&:hover": { bgcolor: "rgba(15,23,42,.9)" },
                            }}
                          >
                            <ChevronRightRounded />
                          </IconButton>
                        </>
                      )}
                      <Chip
                        label={room.roomType || "Standard"}
                        sx={{
                          position: "absolute",
                          left: 14,
                          bottom: 14,
                          bgcolor: "rgba(15,23,42,.82)",
                          color: "white",
                          fontWeight: 700,
                          backdropFilter: "blur(8px)",
                        }}
                      />
                      {roomImages.length > 1 && (
                        <Chip
                          label={`${currentImageIndex + 1} / ${roomImages.length}`}
                          size="small"
                          sx={{
                            position: "absolute",
                            right: 14,
                            bottom: 14,
                            bgcolor: "rgba(255,255,255,.9)",
                            color: "#101828",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6">
                        Room #{room.roomNumber}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.8}
                        sx={{ mt: 0.5, color: "text.secondary" }}
                      >
                        <HotelRounded fontSize="small" />
                        <Typography variant="body2">
                          {hotel?.hotelName ||
                            activeHotelName ||
                            `Hotel #${room.hotelId}`}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                        {room.hasWifi !== false && (
                          <Chip size="small" label="Free Wi-Fi" variant="outlined" />
                        )}
                        <Chip
                          size="small"
                          label={room.airConditioned ? "AC" : "Non-AC"}
                          color={room.airConditioned ? "primary" : "default"}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={room.hasTv ? "TV" : "No TV"}
                          variant="outlined"
                        />
                      </Stack>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-end"
                        sx={{ mt: 3 }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Price per night
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            ₹
                            {Number(room.pricePerNight).toLocaleString("en-IN")}
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.7}
                          sx={{ color: "text.secondary", pb: 0.4 }}
                        >
                          <PeopleAltRounded fontSize="small" />
                          <Typography variant="body2">
                            {room.capacity} guests
                          </Typography>
                        </Stack>
                      </Stack>

                      {!isCustomer && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<EditRounded />}
                            onClick={() => edit(room)}
                          >
                            Edit room
                          </Button>
                          <IconButton
                            color="error"
                            aria-label={`Delete room ${room.roomNumber}`}
                            onClick={() => remove(room)}
                            sx={{
                              border: "1px solid",
                              borderColor: "error.main",
                            }}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {pageCount > 1 && (
            <Box
              sx={{
                mt: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {(currentPage - 1) * ROOMS_PER_PAGE + 1}–
                {Math.min(currentPage * ROOMS_PER_PAGE, visible.length)} of{" "}
                {visible.length} rooms
              </Typography>
              <Pagination
                count={pageCount}
                page={currentPage}
                color="primary"
                shape="rounded"
                onChange={(_, nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editId ? "Edit room" : `Add room to ${activeHotelName || "hotel"}`}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            pt: "10px!important",
          }}
        >
          {!activeHotelId && (
            <TextField
              label="Hotel id"
              value={form.hotelId}
              onChange={(event) =>
                setForm({ ...form, hotelId: event.target.value })
              }
            />
          )}
          {["roomNumber", "roomType", "pricePerNight", "capacity"].map(
            (field) => (
              <TextField
                key={field}
                label={field.replace(/([A-Z])/g, " $1")}
                value={form[field]}
                onChange={(event) =>
                  setForm({ ...form, [field]: event.target.value })
                }
              />
            ),
          )}
          <FormControl fullWidth>
            <InputLabel id="room-ac-type-label">Cooling type</InputLabel>
            <Select
              labelId="room-ac-type-label"
              label="Cooling type"
              value={form.airConditioned ? "AC" : "NON_AC"}
              onChange={(event) =>
                setForm({
                  ...form,
                  airConditioned: event.target.value === "AC",
                })
              }
            >
              <MenuItem value="AC">AC room</MenuItem>
              <MenuItem value="NON_AC">Non-AC room</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="room-tv-label">Television</InputLabel>
            <Select
              labelId="room-tv-label"
              label="Television"
              value={form.hasTv ? "TV" : "NO_TV"}
              onChange={(event) =>
                setForm({ ...form, hasTv: event.target.value === "TV" })
              }
            >
              <MenuItem value="TV">TV available</MenuItem>
              <MenuItem value="NO_TV">No TV</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked disabled />}
            label="Free Wi-Fi included by default"
          />
          {!editId && (
            <TextField
              label="Number of rooms"
              type="number"
              value={form.quantity}
              onChange={(event) =>
                setForm({ ...form, quantity: event.target.value })
              }
              inputProps={{ min: 1, max: 100 }}
              helperText="Uses sequential numbers starting from the room number above (maximum 100)."
              sx={{ gridColumn: "1 / -1" }}
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={form.availabilityStatus}
                onChange={(event) =>
                  setForm({
                    ...form,
                    availabilityStatus: event.target.checked,
                  })
                }
              />
            }
            label="Available"
          />
          <TextField
            label="Room image URLs"
            placeholder={
              "https://example.com/room-front.jpg\nhttps://example.com/room-bathroom.jpg"
            }
            value={imageUrls}
            onChange={(event) => setImageUrls(event.target.value)}
            multiline
            minRows={4}
            helperText="Add one image URL per line. You can add multiple room images."
            sx={{ gridColumn: "1 / -1" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
