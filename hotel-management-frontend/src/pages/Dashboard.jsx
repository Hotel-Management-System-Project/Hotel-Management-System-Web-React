/**
 * Builds role-specific dashboard statistics and charts from hotel, room, and
 * booking data so each user sees a useful operational summary.
 */
import { useEffect, useMemo, useState } from "react";
import { Alert, Card, CardContent, Grid, Typography } from "@mui/material";
import {
  ApartmentRounded,
  BookOnlineRounded,
  MeetingRoomRounded,
  PaymentsRounded,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import { Loading, Metric, Notice, PageHeader } from "../components/Common";

export default function Dashboard() {
  // Store the source records once; dashboard numbers are derived from them.
  const { isAdmin, isOwner, user } = useAuth();
  const { selectedHotel, loadingHotels } = useHotelSelection();
  const [data, setData] = useState({ hotels: [], rooms: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    // Fetch dashboard dependencies together to reduce loading time.
    if (loadingHotels) return;

    const load = async () => {
      setLoading(true);
      try {
        const bookingRequest = isAdmin
          ? endpoints.bookings()
          : isOwner
            ? selectedHotel
              ? endpoints.hotelBookings(selectedHotel.hotelId)
              : Promise.resolve([])
            : endpoints.myBookings();

        const [allHotels, allRooms, bookings] = await Promise.all([
          endpoints.hotels().catch(() => []),
          endpoints.rooms().catch(() => []),
          bookingRequest.catch(() => []),
        ]);

        if (isOwner) {
          const hotelId = selectedHotel?.hotelId;
          setData({
            hotels: selectedHotel ? [selectedHotel] : [],
            rooms: hotelId
              ? allRooms.filter(
                  (room) => Number(room.hotelId) === Number(hotelId),
                )
              : [],
            bookings,
          });
        } else {
          setData({
            hotels: Array.isArray(allHotels) ? allHotels : [],
            rooms: Array.isArray(allRooms) ? allRooms : [],
            bookings: Array.isArray(bookings) ? bookings : [],
          });
        }
      } catch (error) {
        setNotice({
          type: "error",
          message: error.message || "Dashboard data could not be loaded.",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin, isOwner, selectedHotel?.hotelId, loadingHotels]);

  const revenue = data.bookings.reduce(
    (sum, booking) => sum + Number(booking.totalAmount || 0),
    0,
  );

  // Group booking value by check-in month for the revenue chart.
  const monthly = useMemo(() => {
    const result = {};
    data.bookings.forEach((booking) => {
      const key = (booking.checkInDate || "Unknown").slice(0, 7);
      result[key] = (result[key] || 0) + Number(booking.totalAmount || 0);
    });
    return Object.entries(result)
      .sort()
      .slice(-6)
      .map(([month, value]) => ({ month, value }));
  }, [data.bookings]);

  // Count rooms by type for the inventory chart.
  const roomTypes = useMemo(
    () =>
      Object.entries(
        data.rooms.reduce((result, room) => {
          const type = room.roomType || "Other";
          result[type] = (result[type] || 0) + 1;
          return result;
        }, {}),
      ).map(([name, value]) => ({ name, value })),
    [data.rooms],
  );

  if (loading || loadingHotels) return <Loading />;

  const ownerTitle = selectedHotel
    ? `${selectedHotel.hotelName} Overview`
    : "Select a Hotel";

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          isAdmin
            ? "Administration"
            : isOwner
              ? "Selected hotel"
              : "Guest portal"
        }
        title={isOwner ? ownerTitle : `Good day, ${user?.email?.split("@")[0]}`}
        subtitle={
          isOwner
            ? "Rooms, customer bookings, and revenue for the selected hotel."
            : "Latest hospitality operations overview."
        }
      />
      {isOwner && !selectedHotel && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a hotel using the Change hotel option in the sidebar.
        </Alert>
      )}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label={isOwner ? "Selected hotel" : "Total hotels"}
            value={data.hotels.length}
            icon={<ApartmentRounded />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label="Rooms"
            value={data.rooms.length}
            icon={<MeetingRoomRounded />}
            color="#7F56D9"
            helper={`${data.rooms.filter((room) => room.availabilityStatus).length} available`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label={isOwner ? "Customer bookings" : "Bookings"}
            value={data.bookings.length}
            icon={<BookOnlineRounded />}
            color="#F79009"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label="Booking value"
            value={`₹${revenue.toLocaleString("en-IN")}`}
            icon={<PaymentsRounded />}
            color="#12B76A"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Revenue overview</Typography>
              <Typography color="text.secondary" variant="body2">
                Booking value grouped by check-in month
              </Typography>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthly}
                    margin={{ top: 25, right: 15, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString("en-IN")}`,
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="value" fill="#DC2626" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Room inventory</Typography>
              <Typography color="text.secondary" variant="body2">
                Distribution by room type
              </Typography>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomTypes}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {roomTypes.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            [
                              "#DC2626",
                              "#7F56D9",
                              "#12B76A",
                              "#F79009",
                              "#F04438",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
