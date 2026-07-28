import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import {
  ApartmentRounded,
  MeetingRoomRounded,
  BookOnlineRounded,
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
import { useAuth } from "../context/AuthContext";
import { Loading, Metric, PageHeader } from "../components/Common";

export default function Dashboard() {
  const { isAdmin, isOwner, user } = useAuth();

  const [data, setData] = useState({
    hotels: [],
    rooms: [],
    bookings: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      endpoints.hotels().catch(() => []),
      endpoints.rooms().catch(() => []),
      (isAdmin
        ? endpoints.bookings()
        : endpoints.myBookings()
      ).catch(() => []),
    ])
      .then(([allHotels, allRooms, bookings]) => {
        const hotels = isOwner
          ? allHotels.filter(
              (h) =>
                Number(h.owner?.userId ?? h.ownerId) ===
                Number(user?.userId)
            )
          : allHotels;

        const hotelIds = new Set(
          hotels.map((h) => Number(h.hotelId))
        );

        const rooms = isOwner
          ? allRooms.filter((r) =>
              hotelIds.has(Number(r.hotelId))
            )
          : allRooms;

        setData({
          hotels,
          rooms,
          bookings,
        });
      })
      .finally(() => setLoading(false));
  }, [isAdmin, isOwner, user?.userId]);

  const revenue = data.bookings.reduce(
    (sum, booking) =>
      sum + Number(booking.totalAmount || 0),
    0
  );

  const monthly = useMemo(() => {
    const result = {};

    data.bookings.forEach((booking) => {
      const key = (booking.checkInDate || "Unknown").slice(0, 7);

      result[key] =
        (result[key] || 0) + Number(booking.totalAmount || 0);
    });

    return Object.entries(result)
      .sort()
      .slice(-6)
      .map(([month, value]) => ({
        month,
        value,
      }));
  }, [data.bookings]);

  const roomTypes = useMemo(() => {
    const counts = data.rooms.reduce((acc, room) => {
      const type = room.roomType || "Other";

      acc[type] = (acc[type] || 0) + 1;

      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data.rooms]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          isAdmin
            ? "Administration"
            : isOwner
            ? "Hotel Owner Portal"
            : "Guest Portal"
        }
        title={
          isOwner
            ? "My Property Overview"
            : `Good day, ${user?.email?.split("@")[0]}`
        }
        subtitle={
          isOwner
            ? "Performance for properties registered to your owner account."
            : "Latest hotels overview."
        }
      />

      {isOwner && (
        <Alert severity="info" sx={{ mb: 3 }
        
        }>
          Approval and rejection are administrator operations.
          This dashboard shows your property inventory and
          booking performance.
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label={isOwner ? "My Hotels" : "Total Hotels"}
            value={data.hotels.length}
            icon={<ApartmentRounded />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label={isOwner ? "My Rooms" : "Rooms"}
            value={data.rooms.length}
            icon={<MeetingRoomRounded />}
            color="#7F56D9"
            helper={`${
              data.rooms.filter((r) => r.availabilityStatus)
                .length
            } available`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label={isOwner ? "Hotel Bookings" : "Bookings"}
            value={data.bookings.length}
            icon={<BookOnlineRounded />}
            color="#F79009"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Metric
            label="Booking Value"
            value={`₹${revenue.toLocaleString("en-IN")}`}
            icon={<PaymentsRounded />}
            color="#12B76A"
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Revenue Overview
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Booking value grouped by check-in month
              </Typography>

              <div className="chart-box">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={monthly}
                    margin={{
                      top: 25,
                      right: 15,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString(
                          "en-IN"
                        )}`,
                        "Revenue",
                      ]}
                    />

                    <Bar
                      dataKey="value"
                      fill="#155EEF"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Room Inventory
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Distribution by room type
              </Typography>

              <div className="chart-box">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={roomTypes}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {roomTypes.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            [
                              "#155EEF",
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
    </div>
  );
}