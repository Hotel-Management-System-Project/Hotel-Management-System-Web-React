/**
 * Loads and manages reservation data. The page adapts its records and available
 * actions for administrators, hotel owners, and customers, with search/filters.
 */
import { useEffect, useMemo, useState } from "react";
import {
  CancelOutlined,
  CheckCircleOutlineRounded,
  DeleteOutlineRounded,
  EmailRounded,
  FilterAltOffRounded,
  HotelRounded,
  MeetingRoomRounded,
  PhoneRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import {
  containsText,
  groupBy,
  indexBy,
  paginate,
  toArray,
} from "../utils/data";
import {
  Confirm,
  Empty,
  Loading,
  Notice,
  PageHeader,
  Status,
} from "../components/Common";

const BOOKINGS_PER_PAGE = 4;

async function includePaymentDetails(bookings) {
  return Promise.all(
    bookings.map(async (booking) => {
      try {
        const payment = await endpoints.bookingPayment(booking.bookingId);
        return { ...booking, payment };
      } catch {
        return { ...booking, payment: null };
      }
    }),
  );
}

function paymentPresentation(payment) {
  const method = String(payment?.method || "NOT_SELECTED").toUpperCase();
  const status = String(payment?.status || "NOT_RECORDED").toUpperCase();
  return {
    method:
      method === "RAZORPAY"
        ? "Online (Razorpay)"
        : method === "CASH"
          ? "Cash at hotel"
          : "Not selected",
    status,
    color:
      status === "PAID"
        ? "success"
        : status === "FAILED"
          ? "error"
          : status === "PENDING"
            ? "warning"
            : "default",
  };
}

export default function Bookings() {
  // Authentication and selected-hotel contexts decide which records are visible.
  const { isAdmin, isOwner } = useAuth();
  const { selectedHotel, loadingHotels } = useHotelSelection();
  const [rows, setRows] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [roomsById, setRoomsById] = useState({});
  const [hotelsById, setHotelsById] = useState({});
  const [bookingRoomsByBooking, setBookingRoomsByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hotelFilter, setHotelFilter] = useState("ALL");

  // Load bookings plus related users, rooms, and hotels needed by the table.
  const load = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [bookings, users, bookingRooms, rooms, hotels] =
          await Promise.all([
            endpoints.bookings(),
            endpoints.users(),
            endpoints.bookingRooms(),
            endpoints.rooms(),
            endpoints.hotels(),
          ]);

        const bookingList = toArray(bookings, "bookings");
        const userList = toArray(users, "users");
        const bookingRoomList = toArray(bookingRooms, "bookingRooms");
        const roomList = toArray(rooms, "rooms");
        const hotelList = toArray(hotels, "hotels");

        setRows(await includePaymentDetails(bookingList));
        setUsersById(indexBy(userList, "userId"));
        setRoomsById(indexBy(roomList, "roomId"));
        setHotelsById(indexBy(hotelList, "hotelId"));
        setBookingRoomsByBooking(groupBy(bookingRoomList, "bookingId"));
      } else {
        const result = isOwner
          ? selectedHotel
            ? await endpoints.hotelBookings(selectedHotel.hotelId)
            : []
          : await endpoints.myBookings();
        setRows(await includePaymentDetails(toArray(result, "bookings")));
      }
    } catch (error) {
      setNotice({ type: "error", message: error.message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload when the role or hotel selection changes.
  useEffect(() => {
    if (!loadingHotels) load();
  }, [isAdmin, isOwner, selectedHotel?.hotelId, loadingHotels]);

  // Return to the first page after the selected hotel changes.
  useEffect(() => {
    setPage(1);
  }, [rows.length, selectedHotel?.hotelId]);

  // Run cancel/delete actions and refresh the records after success.
  const run = async () => {
    if (!action) return;
    try {
      if (action.type === "delete") {
        await endpoints.deleteBooking(action.row.bookingId);
      } else if (action.type === "complete") {
        await endpoints.completeBooking(action.row.bookingId);
      } else {
        await endpoints.cancelBooking(action.row.bookingId);
      }
      setNotice({
        type: "success",
        message:
          action.type === "delete"
            ? `Booking #${action.row.bookingId} deleted successfully.`
            : action.type === "complete"
              ? `Booking #${action.row.bookingId} completed successfully.`
              : `Booking #${action.row.bookingId} cancelled successfully.`,
      });
      setAction(null);
      await load();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  // Join booking-room relations with room and hotel lookup objects.
  const bookingDetails = useMemo(
    () =>
      Object.fromEntries(
        rows.map((booking) => {
          const details = (bookingRoomsByBooking[booking.bookingId] || []).map(
            (bookingRoom) => {
              const room = roomsById[bookingRoom.roomId];
              const hotel = hotelsById[room?.hotelId];
              return { bookingRoom, room, hotel };
            },
          );
          return [booking.bookingId, details];
        }),
      ),
    [rows, bookingRoomsByBooking, roomsById, hotelsById],
  );

  // Apply text and status filters without modifying the original API records.
  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();

    return rows.filter((booking) => {
      const customer = usersById[booking.userId];
      const details = bookingDetails[booking.bookingId] || [];
      const bookingStatus = String(booking.status || "BOOKED").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" || bookingStatus === statusFilter;
      const matchesHotel =
        hotelFilter === "ALL" ||
        details.some(
          ({ room }) => Number(room?.hotelId) === Number(hotelFilter),
        );
      const searchableValues = [
        booking.bookingId,
        `BK-${booking.bookingId}`,
        customer?.fullName,
        customer?.email,
        customer?.phone,
        ...details.flatMap(({ room, hotel }) => [
          hotel?.hotelName,
          hotel?.city,
          room?.roomNumber,
          room?.roomType,
        ]),
        booking.payment?.method,
        booking.payment?.status,
      ];
      const matchesSearch = containsText(value, searchableValues);

      return matchesSearch && matchesStatus && matchesHotel;
    });
  }, [rows, usersById, bookingDetails, search, statusFilter, hotelFilter]);

  // A changed filter may reduce the page count, so reset pagination safely.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, hotelFilter]);

  if (loading || loadingHotels) return <Loading />;

  const title = isOwner
    ? selectedHotel
      ? `${selectedHotel.hotelName} Bookings`
      : "Hotel Bookings"
    : isAdmin
      ? "Bookings"
      : "My Bookings";

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRows.length / BOOKINGS_PER_PAGE),
  );
  const currentPage = Math.min(page, pageCount);
  const visibleBookings = paginate(
    filteredRows,
    currentPage,
    BOOKINGS_PER_PAGE,
  );

  return (
    <Box className="page">
      <PageHeader
        eyebrow={isOwner ? "Selected hotel" : "Reservations"}
        title={title}
        subtitle={
          isAdmin
            ? "View each customer, hotel, room, stay period, and booking status."
            : isOwner
              ? "Customer reservations received by the selected hotel."
              : "Track and manage your reservations."
        }
      />

      {/* All roles use the same select-first booking filter. */}
      <>
        <Card sx={{ mb: 2.5 }}>
          <Box
            sx={{
              p: { xs: 1.75, md: 2 },
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: isAdmin ? "2fr 1fr" : "2fr 1fr auto",
                lg: isAdmin ? "2fr 1fr 1.4fr auto" : "2fr 1fr auto",
              },
              gap: 1.25,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              label={isOwner ? "Search hotel bookings" : "Search bookings"}
              placeholder={
                isOwner
                  ? "Booking ID or customer ID"
                  : "Booking, customer, hotel, or room"
              }
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
              <InputLabel id="booking-status-filter-label" shrink>Status</InputLabel>
              <Select
                labelId="booking-status-filter-label"
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
                <MenuItem value="BOOKED">Booked</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>

            {isAdmin && (
              <FormControl size="small" fullWidth>
                <InputLabel id="booking-hotel-filter-label">Hotel</InputLabel>
                <Select
                  labelId="booking-hotel-filter-label"
                  value={hotelFilter}
                  label="Hotel"
                  onChange={(event) => setHotelFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All hotels</MenuItem>
                  {Object.values(hotelsById)
                    .sort((a, b) =>
                      String(a.hotelName).localeCompare(String(b.hotelName)),
                    )
                    .map((hotel) => (
                      <MenuItem key={hotel.hotelId} value={hotel.hotelId}>
                        {hotel.hotelName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <Button
              startIcon={<FilterAltOffRounded />}
              disabled={
                !search &&
                statusFilter === "ALL" &&
                (!isAdmin || hotelFilter === "ALL")
              }
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setHotelFilter("ALL");
              }}
              sx={{ whiteSpace: "nowrap" }}
            >
              Clear
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Chip
                size="small"
                color="primary"
                label={`${filteredRows.length} shown`}
              />
              {rows.length} total booking{rows.length === 1 ? "" : "s"}
            </Typography>
          </Box>
        </Card>
      </>

      <Card>
        {!filteredRows.length ? (
          <Empty
            title={
              isOwner && !selectedHotel
                ? "Select a hotel from the sidebar"
                : !statusFilter
                  ? "Select a status to view bookings"
                : rows.length
                  ? "No bookings match these filters"
                  : "No bookings yet"
            }
            subtitle={
              !statusFilter
                ? "Choose All statuses to display every booking, or select a specific status."
                : rows.length
                ? "Change or clear the filters to see more bookings."
                : "New records will appear here."
            }
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: isAdmin ? 1280 : 940 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking</TableCell>
                    {(isAdmin || isOwner) && <TableCell>Customer</TableCell>}
                    {isAdmin && <TableCell>Hotel and room</TableCell>}
                    {isOwner && <TableCell>Room</TableCell>}
                    <TableCell>Stay period</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {visibleBookings.map((booking) => {
                    const customer = usersById[booking.userId];
                    const details = bookingDetails[booking.bookingId] || [];
                    const ownerCustomerName =
                      booking.customerName ||
                      booking.fullName ||
                      booking.userFullName ||
                      booking.user?.fullName;
                    const ownerCustomerEmail =
                      booking.customerEmail ||
                      booking.email ||
                      booking.userEmail ||
                      booking.user?.email;
                    const ownerCustomerPhone =
                      booking.customerPhone ||
                      booking.phone ||
                      booking.userPhone ||
                      booking.user?.phone;
                    const payment = paymentPresentation(booking.payment);

                    return (
                      <TableRow key={booking.bookingId} hover>
                        <TableCell>
                          <Typography fontWeight={800}>
                            BK-{booking.bookingId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reservation #{booking.bookingId}
                          </Typography>
                        </TableCell>

                        {(isAdmin || isOwner) && (
                          <TableCell>
                            {isAdmin && customer ? (
                              <Stack
                                direction="row"
                                spacing={1.25}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: "rgba(220,38,38,.12)",
                                    color: "primary.main",
                                    fontWeight: 800,
                                  }}
                                >
                                  {(customer.fullName || customer.email || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={750}>
                                    {customer.fullName || "Unnamed customer"}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                  >
                                    <EmailRounded sx={{ fontSize: 14 }} />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {customer.email}
                                    </Typography>
                                  </Stack>
                                  {customer.phone && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                    >
                                      <PhoneRounded sx={{ fontSize: 14 }} />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {customer.phone}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            ) : (
                              <Stack
                                direction="row"
                                spacing={1.25}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: "rgba(220,38,38,.12)",
                                    color: "primary.main",
                                    fontWeight: 800,
                                  }}
                                >
                                  {(ownerCustomerName || "Customer")
                                    .charAt(0)
                                    .toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={750}>
                                    {ownerCustomerName ||
                                      `Customer #${booking.userId || "—"}`}
                                  </Typography>
                                  {ownerCustomerEmail && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                    >
                                      <EmailRounded sx={{ fontSize: 14 }} />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {ownerCustomerEmail}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {ownerCustomerPhone && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                    >
                                      <PhoneRounded sx={{ fontSize: 14 }} />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {ownerCustomerPhone}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            )}
                          </TableCell>
                        )}

                        {isAdmin && (
                          <TableCell>
                            {details.length ? (
                              <Stack spacing={1}>
                                {details.map(({ bookingRoom, room, hotel }) => (
                                  <Box
                                    key={bookingRoom.bookingRoomId}
                                    sx={{
                                      p: 1.25,
                                      minWidth: 230,
                                      borderRadius: 2,
                                      bgcolor: "action.hover",
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      alignItems="center"
                                    >
                                      <HotelRounded
                                        sx={{
                                          fontSize: 18,
                                          color: "primary.main",
                                        }}
                                      />
                                      <Typography fontWeight={750}>
                                        {hotel?.hotelName ||
                                          `Hotel #${room?.hotelId || "—"}`}
                                      </Typography>
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      alignItems="center"
                                      sx={{ mt: 0.5 }}
                                    >
                                      <MeetingRoomRounded
                                        sx={{ fontSize: 18 }}
                                      />
                                      <Typography variant="body2">
                                        Room #{room?.roomNumber || "—"}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label={room?.roomType || "Unknown type"}
                                      />
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Chip
                                label="No room linked"
                                color="warning"
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </TableCell>
                        )}

                        {isOwner && (
                          <TableCell>
                            {booking.roomNumber ? (
                              <Stack spacing={0.75} alignItems="flex-start">
                                <Chip
                                  icon={<MeetingRoomRounded />}
                                  color="primary"
                                  label={`Room #${booking.roomNumber}`}
                                  sx={{ fontWeight: 800 }}
                                />
                                {booking.roomType && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {booking.roomType}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Room unavailable
                              </Typography>
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <Typography fontWeight={650}>
                            {booking.checkInDate || "—"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            to {booking.checkOutDate || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={750}>
                            ₹
                            {Number(booking.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.6} alignItems="flex-start">
                            <Typography variant="body2" fontWeight={700}>
                              {payment.method}
                            </Typography>
                            <Chip
                              size="small"
                              color={payment.color}
                              variant={payment.color === "default" ? "outlined" : "filled"}
                              label={payment.status.replaceAll("_", " ")}
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Status value={booking.status || "BOOKED"} />
                        </TableCell>

                        <TableCell align="right">
                          {isOwner && (
                            <Tooltip title="Complete booking">
                              <span>
                                <IconButton
                                  color="success"
                                  disabled={
                                    String(booking.status).toUpperCase() !== "BOOKED" ||
                                    !booking.checkOutDate ||
                                    booking.checkOutDate > new Date().toISOString().slice(0, 10)
                                  }
                                  onClick={() =>
                                    setAction({ type: "complete", row: booking })
                                  }
                                >
                                  <CheckCircleOutlineRounded />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {!isOwner && (
                            <>
                              <Tooltip title="Cancel booking">
                                <span>
                                  <IconButton
                                    color="warning"
                                    disabled={
                                      String(booking.status).toUpperCase() ===
                                      "CANCELLED"
                                    }
                                    onClick={() =>
                                      setAction({ type: "cancel", row: booking })
                                    }
                                  >
                                    <CancelOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              {isAdmin && (
                                <Tooltip title="Delete booking">
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      setAction({ type: "delete", row: booking })
                                    }
                                  >
                                    <DeleteOutlineRounded />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {pageCount > 1 && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 2.5,
                  py: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(currentPage - 1) * BOOKINGS_PER_PAGE + 1}–
                  {Math.min(
                    currentPage * BOOKINGS_PER_PAGE,
                    filteredRows.length,
                  )}{" "}
                  of {filteredRows.length} bookings
                </Typography>
                <Pagination
                  page={currentPage}
                  count={pageCount}
                  color="primary"
                  shape="rounded"
                  onChange={(_, nextPage) => setPage(nextPage)}
                />
              </Stack>
            )}
          </>
        )}
      </Card>

      <Confirm
        open={Boolean(action)}
        title={`${action?.type === "delete" ? "Delete" : action?.type === "complete" ? "Complete" : "Cancel"} booking?`}
        onClose={() => setAction(null)}
        onConfirm={run}
        danger={action?.type !== "complete"}
      >
        {action?.type === "complete"
          ? "Mark this reservation as completed after checkout?"
          : "This action cannot be automatically reversed."}
      </Confirm>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Box>
  );
}
