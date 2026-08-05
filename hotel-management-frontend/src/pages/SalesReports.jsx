/**
 * Generates hotel-wise sales summaries for owners. Bookings are grouped into
 * daily, weekly, monthly, or yearly periods for operational reporting.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  BookOnlineRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useHotelSelection } from "../context/useHotelSelection";
import { Empty, Loading, Metric, Notice, PageHeader } from "../components/Common";

const PERIOD_OPTIONS = [
  ["DAILY", "Daily"],
  ["WEEKLY", "Weekly"],
  ["MONTHLY", "Monthly"],
  ["YEARLY", "Yearly"],
];

function toDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  // Use local date fields so Indian timezone conversion cannot change the day.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Return a sortable display key for the selected reporting interval.
function getPeriodKey(dateValue, period) {
  const date = toDate(dateValue);
  if (!date) return "Unknown";

  if (period === "DAILY") return formatDate(date);
  if (period === "MONTHLY") return formatDate(date).slice(0, 7);
  if (period === "YEARLY") return String(date.getFullYear());

  // Weekly reports start on Monday and end on Sunday.
  const monday = new Date(date);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${formatDate(monday)} to ${formatDate(sunday)}`;
}

export default function SalesReports() {
  const { isOwner } = useAuth();
  const { selectedHotel, loadingHotels } = useHotelSelection();
  const [bookings, setBookings] = useState([]);
  const [period, setPeriod] = useState("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Every hotel selection loads only that property's booking records.
  useEffect(() => {
    if (!selectedHotel || !isOwner) {
      setBookings([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const result = await endpoints.hotelBookings(selectedHotel.hotelId);
        setBookings(Array.isArray(result) ? result : []);
      } catch (error) {
        setNotice({ type: "error", message: error.message });
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwner, selectedHotel?.hotelId]);

  // Cancelled or rejected reservations do not contribute to realized sales.
  const validBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const status = String(booking.status || "").toUpperCase();
        const bookingDate = booking.checkInDate || "";
        const insideStart = !startDate || bookingDate >= startDate;
        const insideEnd = !endDate || bookingDate <= endDate;
        return (
          !["CANCELLED", "REJECTED"].includes(status) &&
          insideStart &&
          insideEnd
        );
      }),
    [bookings, startDate, endDate],
  );

  // Convert individual bookings into one summary row for each selected period.
  const reportRows = useMemo(() => {
    const groups = validBookings.reduce((result, booking) => {
      const key = getPeriodKey(booking.checkInDate, period);
      if (!result[key]) {
        result[key] = { period: key, bookings: 0, revenue: 0 };
      }
      result[key].bookings += 1;
      result[key].revenue += Number(booking.totalAmount || 0);
      return result;
    }, {});

    return Object.values(groups)
      .sort((left, right) => left.period.localeCompare(right.period))
      .map((row) => ({
        ...row,
        average: row.bookings ? row.revenue / row.bookings : 0,
      }));
  }, [validBookings, period]);

  const totalRevenue = validBookings.reduce(
    (sum, booking) => sum + Number(booking.totalAmount || 0),
    0,
  );
  const averageBooking = validBookings.length
    ? totalRevenue / validBookings.length
    : 0;

  if (loading || loadingHotels) return <Loading />;

  if (!isOwner) {
    return <Alert severity="error">Sales reports are for hotel owners only.</Alert>;
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Hotel-wise analytics"
        title={
          selectedHotel
            ? `${selectedHotel.hotelName} Sales Report`
            : "Select a Hotel"
        }
        subtitle="Analyze booking sales by day, week, month, or year."
      />

      {!selectedHotel ? (
        <Alert severity="info">
          Select a hotel from the sidebar to generate its sales report.
        </Alert>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
              >
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Report period</InputLabel>
                  <Select
                    label="Report period"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                  >
                    {PERIOD_OPTIONS.map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="From date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Metric
                label="Total sales"
                value={`₹${totalRevenue.toLocaleString("en-IN")}`}
                icon={<PaymentsRounded />}
                color="#12B76A"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Metric
                label="Bookings"
                value={validBookings.length}
                icon={<BookOnlineRounded />}
                color="#F79009"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Metric
                label="Average booking"
                value={`₹${Math.round(averageBooking).toLocaleString("en-IN")}`}
                icon={<TrendingUpRounded />}
                color="#7F56D9"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Metric
                label="Report periods"
                value={reportRows.length}
                icon={<ReceiptLongRounded />}
              />
            </Grid>
          </Grid>

          {reportRows.length === 0 ? (
            <Empty
              title="No sales data"
              subtitle="No completed or active bookings match the selected dates."
            />
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ height: 420 }}>
                  <CardContent sx={{ height: "100%" }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      Revenue trend
                    </Typography>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={reportRows}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) =>
                            `₹${Number(value).toLocaleString("en-IN")}`
                          }
                        />
                        <Bar dataKey="revenue" fill="#DC2626" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <TableContainer component={Card} sx={{ maxHeight: 420 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">Sales</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportRows.map((row) => (
                        <TableRow key={row.period} hover>
                          <TableCell>{row.period}</TableCell>
                          <TableCell align="right">{row.bookings}</TableCell>
                          <TableCell align="right">
                            ₹{row.revenue.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </>
      )}

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
