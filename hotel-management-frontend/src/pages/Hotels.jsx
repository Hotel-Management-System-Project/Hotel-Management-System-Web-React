/**
 * Handles hotel listing and management. It supports role-based visibility,
 * property forms, image URLs, approval actions, filtering, and pagination.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AddPhotoAlternateRounded,
  AddRounded,
  CheckRounded,
  CloseRounded,
  DeleteOutlineRounded,
  FilterAltOffRounded,
  ImageNotSupportedRounded,
  SearchRounded,
  SettingsRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import {
  containsText,
  isValidHttpUrl,
  paginate,
  parseImageUrls,
} from "../utils/data";
import {
  Confirm,
  Empty,
  Loading,
  Notice,
  PageHeader,
  Status,
} from "../components/Common";

const blank = {
  hotelName: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

// The first room is compulsory because only complete properties reach admin.
const blankRoom = {
  startRoomNumber: "101",
  quantity: 1,
  roomType: "Deluxe",
  pricePerNight: "",
  capacity: 2,
  airConditioned: true,
  hasWifi: true,
  hasTv: false,
};

// State-to-city data keeps hotel locations consistent for search and filtering.
const INDIA_LOCATIONS = {
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Kolhapur",
    "Solapur",
    "Nagar",
    "Parbhani",
    "Nanded",
  ],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"],
  Delhi: ["New Delhi", "Delhi"],
  "Uttar Pradesh": ["Lucknow", "Agra", "Varanasi", "Noida", "Kanpur"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Ooty", "Salem"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Munnar", "Alappuzha"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Durgapur"],
};

const HOTELS_PER_PAGE = 4;

export default function Hotels() {
  // State is divided into API records, dialog form values, and list controls.
  const { isAdmin, isOwner, isCustomer, user } = useAuth();
  const { selectHotel } = useHotelSelection();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [images, setImages] = useState({});
  const [roomCounts, setRoomCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [imageUrls, setImageUrls] = useState("");
  const [roomForm, setRoomForm] = useState(blankRoom);
  const [roomImageUrls, setRoomImageUrls] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // Keep records hidden until the user chooses All or a specific status.
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [minimumRating, setMinimumRating] = useState("ALL");

  // Fetch hotels first, then load the image list for each hotel card.
  const load = async () => {
    try {
      const result = await endpoints.hotels();
      const all = Array.isArray(result) ? result : [];
      const visible = isOwner
        ? all.filter((hotel) => {
            const ownerId = hotel.owner?.userId ?? hotel.ownerId;
            const idMatches =
              user?.userId != null &&
              ownerId != null &&
              Number(ownerId) === Number(user.userId);
            const emailMatches =
              hotel.owner?.email &&
              user?.email &&
              hotel.owner.email.toLowerCase() === user.email.toLowerCase();
            return idMatches || emailMatches;
          })
        : isCustomer
          ? all.filter(
              (hotel) => String(hotel.status).toUpperCase() === "APPROVED",
            )
          : isAdmin
            ? all.filter(
                (hotel) => String(hotel.status).toUpperCase() !== "DRAFT",
              )
            : all;

      setRows(visible);

      // Count attached rooms so owners cannot submit an empty hotel request.
      if (isOwner) {
        const roomResult = await endpoints.rooms().catch(() => []);
        const rooms = Array.isArray(roomResult) ? roomResult : [];
        const counts = rooms.reduce((result, room) => {
          result[room.hotelId] = (result[room.hotelId] || 0) + 1;
          return result;
        }, {});
        setRoomCounts(counts);
      }

      const imageEntries = await Promise.all(
        visible.map(async (hotel) => {
          try {
            const hotelImages = await endpoints.images(hotel.hotelId);
            return [
              hotel.hotelId,
              Array.isArray(hotelImages) ? hotelImages : [],
            ];
          } catch {
            return [hotel.hotelId, []];
          }
        }),
      );
      setImages(Object.fromEntries(imageEntries));
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Load again if the authenticated user's role changes.
  useEffect(() => {
    load();
  }, []);

  const cities = [
    ...new Set(
      rows.map((hotel) => String(hotel.city || "").trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const filteredRows = rows.filter((hotel) => {
    if (!statusFilter) return false;
    const matchesSearch = containsText(search, [
      hotel.hotelName,
      hotel.description,
      hotel.address,
      hotel.city,
      hotel.state,
      hotel.pincode,
    ]);
    const matchesStatus =
      statusFilter === "ALL" ||
      String(hotel.status || "DRAFT").toUpperCase() === statusFilter;
    const matchesCity =
      cityFilter === "ALL" ||
      String(hotel.city || "").toLowerCase() ===
        String(cityFilter).toLowerCase();
    const matchesRating =
      minimumRating === "ALL" ||
      Number(hotel.rating || 0) >= Number(minimumRating);
    return matchesSearch && matchesStatus && matchesCity && matchesRating;
  });

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRows.length / HOTELS_PER_PAGE),
  );
  const paginatedRows = paginate(filteredRows, page, HOTELS_PER_PAGE);

  // Reset pagination whenever filters change.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  // Keep the current page valid after records are added or removed.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, cityFilter, minimumRating]);

  // Restore every list control to its default value.
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCityFilter("ALL");
    setMinimumRating("ALL");
  };

  // City and state have linked dropdowns, so they are excluded from text fields.
  const fields = Object.keys(blank).filter(
    (field) => !["city", "state"].includes(field),
  );

  // Admin approval/rejection uses one handler because both actions refresh data.
  const review = async (id, type) => {
    try {
      await (type === "approve"
        ? endpoints.approveHotel(id)
        : endpoints.rejectHotel(id));
      setNotice({
        type: "success",
        message:
          type === "approve"
            ? "Hotel request approved successfully."
            : "Hotel request rejected successfully.",
      });
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  // Create the hotel, attach compulsory rooms, then send one complete request.
  const submit = async () => {
    const urls = parseImageUrls(imageUrls);
    const roomUrls = parseImageUrls(roomImageUrls);
    const invalidUrls = [...urls, ...roomUrls].filter(
      (url) => !isValidHttpUrl(url),
    );

    if (!form.state || !form.city) {
      setNotice({
        type: "error",
        message: "Select both state and city.",
      });
      return;
    }

    if (invalidUrls.length) {
      setNotice({
        type: "error",
        message:
          "Invalid image URL. Every image must start with http:// or https://.",
      });
      return;
    }

    const quantity = Number(roomForm.quantity);
    if (quantity < 1 || quantity > 100) {
      setNotice({
        type: "error",
        message: "Room quantity must be between 1 and 100.",
      });
      return;
    }

    if (
      !roomForm.startRoomNumber ||
      !roomForm.roomType.trim() ||
      Number(roomForm.pricePerNight) <= 0 ||
      Number(roomForm.capacity) < 1
    ) {
      setNotice({
        type: "error",
        message: "Complete all compulsory room details before submitting.",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await endpoints.addHotel({
        ...form,
        ownerId: user.userId,
      });
      const hotelId = created?.hotelId ?? created?.data?.hotelId;

      if (!hotelId) {
        throw new Error("Hotel was created but its id was not returned");
      }

      if (urls.length) {
        await Promise.all(
          urls.map((imageUrl) => endpoints.addImage({ hotelId, imageUrl })),
        );
      }

      // The backend generates sequential numbers from startRoomNumber.
      const createdRooms = await endpoints.addRoomsBulk({
        hotelId,
        startRoomNumber: Number(roomForm.startRoomNumber),
        quantity,
        roomType: roomForm.roomType.trim(),
        pricePerNight: Number(roomForm.pricePerNight),
        capacity: Number(roomForm.capacity),
        airConditioned: Boolean(roomForm.airConditioned),
        hasWifi: true,
        hasTv: Boolean(roomForm.hasTv),
        availabilityStatus: true,
      });

      // Apply the entered room images to every room created in this request.
      if (roomUrls.length) {
        await Promise.all(
          createdRooms.flatMap((room) =>
            roomUrls.map((imageUrl) =>
              endpoints.addRoomImage({ roomId: room.roomId, imageUrl }),
            ),
          ),
        );
      }

      // PENDING is set only after the hotel has at least one attached room.
      await endpoints.submitHotel(hotelId);

      setOpen(false);
      setForm(blank);
      setImageUrls("");
      setRoomForm(blankRoom);
      setRoomImageUrls("");
      setNotice({
        type: "success",
        message: `Hotel with ${createdRooms.length} room(s) submitted to the administrator.`,
      });
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Select the hotel before navigating so owner pages show the correct property.
  const manage = (hotel) => {
    selectHotel(hotel.hotelId);
    navigate("/rooms");
  };

  // Submit a completed draft; the backend rejects hotels that have no rooms.
  const submitForApproval = async (hotel) => {
    try {
      await endpoints.submitHotel(hotel.hotelId);
      setNotice({
        type: "success",
        message: `${hotel.hotelName} was submitted to the administrator.`,
      });
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  // Confirmed deletion is followed by a full refresh to remove dependent UI data.
  const deleteHotel = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await endpoints.deleteHotel(deleteTarget.hotelId);
      setNotice({
        type: "success",
        message: `${deleteTarget.hotelName} and all its rooms were deleted.`,
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          isOwner
            ? "My properties"
            : isCustomer
              ? "Explore stays"
              : "Property administration"
        }
        title={isOwner ? "My Hotels" : isCustomer ? "Browse Hotels" : "Hotels"}
        subtitle={
          isOwner
            ? "Submit properties with images and manage hotel-wise inventory."
            : isCustomer
              ? "Browse administrator-approved hotels."
              : "Review property requests, images, and approval status."
        }
        action={
          isOwner ? (
            <Button
              startIcon={<AddRounded />}
              variant="contained"
              onClick={() => setOpen(true)}
            >
              Add hotel
            </Button>
          ) : null
        }
      />

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
                Hotel filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Find properties by name, location, status, or rating.
              </Typography>
            </Box>
            <Button
              startIcon={<FilterAltOffRounded />}
              onClick={clearFilters}
              disabled={
                !search &&
                statusFilter === "" &&
                cityFilter === "ALL" &&
                minimumRating === "ALL"
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
                lg: "2fr repeat(3, minmax(150px, 1fr))",
              },
              gap: 1.25,
            }}
          >
            <TextField
              size="small"
              label="Search hotels"
              placeholder="Name, address, city, or state"
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

            <FormControl size="small" fullWidth>
              <InputLabel id="hotel-status-filter-label" shrink>Status</InputLabel>
              <Select
                labelId="hotel-status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(event) => setStatusFilter(event.target.value)}
                displayEmpty
                renderValue={(value) =>
                  value
                    ? value === "ALL"
                      ? "All statuses"
                      : value[0] + value.slice(1).toLowerCase()
                    : "Select status"
                }
              >
                <MenuItem value="" disabled>Select status</MenuItem>
                <MenuItem value="ALL">All statuses</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                {isOwner && <MenuItem value="DRAFT">Draft</MenuItem>}
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="hotel-city-filter-label">City</InputLabel>
              <Select
                labelId="hotel-city-filter-label"
                value={cityFilter}
                label="City"
                onChange={(event) => setCityFilter(event.target.value)}
              >
                <MenuItem value="ALL">All cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="hotel-rating-filter-label">
                Minimum rating
              </InputLabel>
              <Select
                labelId="hotel-rating-filter-label"
                value={minimumRating}
                label="Minimum rating"
                onChange={(event) => setMinimumRating(event.target.value)}
              >
                <MenuItem value="ALL">Any rating</MenuItem>
                <MenuItem value="3">3+ stars</MenuItem>
                <MenuItem value="4">4+ stars</MenuItem>
                <MenuItem value="4.5">4.5+ stars</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
            Showing {filteredRows.length} of {rows.length} hotels
          </Typography>
        </CardContent>
      </Card>

      {!filteredRows.length ? (
        <Card>
          <Empty
            title={
              !statusFilter
                ? "Select a status to view hotels"
                : rows.length
                  ? "No hotels match these filters"
                  : "No hotels found"
            }
            subtitle={
              !statusFilter
                ? "Choose All statuses to display every hotel, or select a specific status."
                : rows.length
                ? "Change or clear the filters to see more hotels."
                : "New properties will appear here."
            }
          />
        </Card>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {paginatedRows.map((hotel) => {
              const cover = images[hotel.hotelId]?.[0]?.imageUrl;
              return (
                <Grid key={hotel.hotelId} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Card sx={{ height: "100%", overflow: "hidden" }}>
                    {cover ? (
                      <CardMedia
                        component="img"
                        height="210"
                        image={cover}
                        alt={`${hotel.hotelName} property`}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 210,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "action.hover",
                          color: "text.secondary",
                        }}
                      >
                        <Stack alignItems="center" spacing={1}>
                          <ImageNotSupportedRounded fontSize="large" />
                          <Typography variant="body2">
                            No hotel image
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        gap={2}
                      >
                        <Box>
                          <Typography variant="h6">
                            {hotel.hotelName}
                          </Typography>
                          <Typography color="text.secondary">
                            {hotel.city}, {hotel.state}
                          </Typography>
                        </Box>
                        <Status value={hotel.status || "DRAFT"} />
                      </Stack>

                      <Typography color="text.secondary" sx={{ my: 2 }}>
                        {hotel.description || "No description provided."}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography>
                          Rating <b>{hotel.rating || 0}/5</b>
                        </Typography>
                        {isAdmin &&
                          String(hotel.status).toUpperCase() === "PENDING" && (
                          <Box>
                            <Tooltip title="Approve">
                              <IconButton
                                color="success"
                                onClick={() => review(hotel.hotelId, "approve")}
                              >
                                <CheckRounded />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                color="error"
                                onClick={() => review(hotel.hotelId, "reject")}
                                aria-label={`Reject ${hotel.hotelName}`}
                              >
                                <CloseRounded />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete hotel">
                              <IconButton
                                color="error"
                                onClick={() => setDeleteTarget(hotel)}
                                aria-label={`Delete ${hotel.hotelName}`}
                                sx={{
                                  ml: 0.5,
                                  border: "1px solid",
                                  borderColor: "error.main",
                                }}
                              >
                                <DeleteOutlineRounded />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Stack>

                      {isOwner && (
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{ mt: 2 }}
                        >
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<SettingsRounded />}
                            onClick={() => manage(hotel)}
                          >
                            Manage hotel
                          </Button>
                          {["DRAFT", "REJECTED"].includes(
                            String(hotel.status).toUpperCase(),
                          ) && (
                            <Box sx={{ width: "100%" }}>
                              <Button
                                fullWidth
                                variant="contained"
                                disabled={!roomCounts[hotel.hotelId]}
                                onClick={() => submitForApproval(hotel)}
                              >
                                Submit for approval
                              </Button>
                              {!roomCounts[hotel.hotelId] && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  display="block"
                                  textAlign="center"
                                  sx={{ mt: 0.5 }}
                                >
                                  Add at least one room first
                                </Typography>
                              )}
                            </Box>
                          )}
                          <Button
                            fullWidth
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineRounded />}
                            onClick={() => setDeleteTarget(hotel)}
                          >
                            Delete hotel
                          </Button>
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
                Showing {(page - 1) * HOTELS_PER_PAGE + 1}–
                {Math.min(page * HOTELS_PER_PAGE, filteredRows.length)} of{" "}
                {filteredRows.length} hotels
              </Typography>
              <Pagination
                page={page}
                count={pageCount}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
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
        onClose={() => !saving && setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add hotel and compulsory rooms</DialogTitle>
        <DialogContent
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            pt: "10px!important",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ gridColumn: "1/-1" }}
          >
            1. Hotel details
          </Typography>
          {fields.map((key) => (
            <TextField
              key={key}
              label={key.replace(/([A-Z])/g, " $1")}
              value={form[key]}
              onChange={(event) =>
                setForm({ ...form, [key]: event.target.value })
              }
              multiline={key === "description"}
              sx={
                ["description", "address"].includes(key)
                  ? { gridColumn: "1/-1" }
                  : {}
              }
            />
          ))}

          <FormControl required fullWidth>
            <InputLabel>State</InputLabel>
            <Select
              label="State"
              value={form.state}
              onChange={(event) =>
                setForm({
                  ...form,
                  state: event.target.value,
                  city: "",
                })
              }
            >
              {Object.keys(INDIA_LOCATIONS).map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl required fullWidth disabled={!form.state}>
            <InputLabel>City</InputLabel>
            <Select
              label="City"
              value={form.city}
              onChange={(event) =>
                setForm({ ...form, city: event.target.value })
              }
            >
              {(INDIA_LOCATIONS[form.state] || []).map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Hotel image URLs"
            value={imageUrls}
            onChange={(event) => setImageUrls(event.target.value)}
            multiline
            minRows={3}
            placeholder={
              "https://example.com/hotel-front.jpg\nhttps://example.com/room.jpg"
            }
            helperText="Add one image URL per line. The first image becomes the card cover."
            InputProps={{
              startAdornment: (
                <AddPhotoAlternateRounded
                  color="primary"
                  sx={{ mr: 1, alignSelf: "flex-start", mt: 1.5 }}
                />
              ),
            }}
            sx={{ gridColumn: "1/-1" }}
          />

          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ gridColumn: "1/-1", mt: 1 }}
          >
            2. Compulsory room details
          </Typography>

          <TextField
            required
            label="Starting room number"
            type="number"
            value={roomForm.startRoomNumber}
            onChange={(event) =>
              setRoomForm({
                ...roomForm,
                startRoomNumber: event.target.value,
              })
            }
            helperText="Example: start 101 with quantity 5 creates 101 to 105."
          />
          <TextField
            required
            label="Number of rooms"
            type="number"
            value={roomForm.quantity}
            inputProps={{ min: 1, max: 100 }}
            onChange={(event) =>
              setRoomForm({ ...roomForm, quantity: event.target.value })
            }
            helperText="You can add up to 100 rooms at once."
          />
          <TextField
            required
            label="Room type"
            value={roomForm.roomType}
            onChange={(event) =>
              setRoomForm({ ...roomForm, roomType: event.target.value })
            }
          />
          <TextField
            required
            label="Price per night"
            type="number"
            value={roomForm.pricePerNight}
            onChange={(event) =>
              setRoomForm({ ...roomForm, pricePerNight: event.target.value })
            }
          />
          <TextField
            required
            label="Guest capacity"
            type="number"
            value={roomForm.capacity}
            inputProps={{ min: 1 }}
            onChange={(event) =>
              setRoomForm({ ...roomForm, capacity: event.target.value })
            }
          />
          <FormControl fullWidth>
            <InputLabel id="hotel-room-cooling-label">Cooling type</InputLabel>
            <Select
              labelId="hotel-room-cooling-label"
              label="Cooling type"
              value={roomForm.airConditioned ? "AC" : "NON_AC"}
              onChange={(event) =>
                setRoomForm({
                  ...roomForm,
                  airConditioned: event.target.value === "AC",
                })
              }
            >
              <MenuItem value="AC">AC room</MenuItem>
              <MenuItem value="NON_AC">Non-AC room</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="hotel-room-tv-label">Television</InputLabel>
            <Select
              labelId="hotel-room-tv-label"
              label="Television"
              value={roomForm.hasTv ? "TV" : "NO_TV"}
              onChange={(event) =>
                setRoomForm({
                  ...roomForm,
                  hasTv: event.target.value === "TV",
                })
              }
            >
              <MenuItem value="TV">TV available</MenuItem>
              <MenuItem value="NO_TV">No TV</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Wi-Fi"
            value="Free Wi-Fi included"
            disabled
            helperText="Free Wi-Fi is enabled by default for every new room."
          />
          <TextField
            label="Room image URLs"
            value={roomImageUrls}
            onChange={(event) => setRoomImageUrls(event.target.value)}
            multiline
            minRows={3}
            placeholder="https://example.com/room-front.jpg"
            helperText="One URL per line. These images are attached to every generated room."
            sx={{ gridColumn: "1/-1" }}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={saving} variant="contained" onClick={submit}>
            {saving ? "Submitting…" : "Submit hotel"}
          </Button>
        </DialogActions>
      </Dialog>

      <Confirm
        open={Boolean(deleteTarget)}
        title="Delete hotel permanently?"
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={deleteHotel}
        confirmText={deleting ? "Deleting…" : "Delete hotel"}
        danger
      >
        {deleteTarget
          ? `${deleteTarget.hotelName}, all rooms, hotel images, and room-booking links will be permanently deleted. This action cannot be undone.`
          : ""}
      </Confirm>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
