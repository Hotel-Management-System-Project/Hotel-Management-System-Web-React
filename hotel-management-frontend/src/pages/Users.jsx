/**
 * Gives administrators a searchable and paginated view of customers and hotel
 * owners, including role summaries and permitted user-management actions.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DeleteOutlineRounded,
  ApartmentRounded,
  EmailRounded,
  PeopleAltRounded,
  PersonSearchRounded,
  PhoneRounded,
  SearchRounded,
} from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { endpoints } from "../services/api";
import { useAuth } from "../context/useAuth";
import {
  Confirm,
  Empty,
  Loading,
  Notice,
  PageHeader,
} from "../components/Common";

const PAGE_SIZE = 4;

export default function Users() {
  // Admin list data and table controls are stored independently.
  const { isAdmin } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [accountType, setAccountType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [serverPaginated, setServerPaginated] = useState(false);
  const [notice, setNotice] = useState(null);

  // Ask Spring Boot for only the current page instead of downloading every user.
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await endpoints.users(page, PAGE_SIZE, accountType, query);
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [];

      setAccounts(content);
      setServerPaginated(!Array.isArray(data) && Array.isArray(data?.content));
      setTotalElements(
        Number.isFinite(Number(data?.totalElements))
          ? Number(data.totalElements)
          : content.length,
      );
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Reload when pagination, account type, or search text changes.
  useEffect(() => {
    if (isAdmin) loadAccounts();
  }, [isAdmin, page, accountType, query]);

  // Select customers or hotel owners without mutating the original response.
  const roleAccounts = useMemo(
    () => {
      return accounts.filter((account) => {
        const role = String(account.role || "")
          .replace(/^ROLE_/, "")
          .toUpperCase();
        return accountType === "ALL"
          ? role === "CUSTOMER" || role === "HOTEL_OWNER"
          : role === accountType;
      });
    },
    [accounts, accountType],
  );

  // Apply search to the active role tab only.
  const filteredAccounts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return roleAccounts;

    return roleAccounts.filter((account) =>
      [account.fullName, account.email, account.phone, account.userId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [roleAccounts, query]);

  // Support both the current List response and a future Spring Page response.
  const visibleAccounts = serverPaginated
    ? filteredAccounts
    : filteredAccounts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const paginationTotal = serverPaginated
    ? totalElements
    : filteredAccounts.length;

  // Admin can delete either a customer or a hotel-owner account.
  const deleteAccount = async () => {
    if (!deleting) return;

    try {
      await endpoints.deleteUser(deleting.userId);
      const shouldMoveBack = visibleAccounts.length === 1 && page > 0;
      setDeleting(null);
      setNotice({
        type: "success",
        message: `${deleting.fullName || deleting.email} was deleted successfully.`,
      });
      if (shouldMoveBack) setPage((current) => current - 1);
      else await loadAccounts();
    } catch (error) {
      setDeleting(null);
      setNotice({
        type: "error",
        message: error.message || "Account could not be deleted.",
      });
    }
  };

  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  if (loading) return <Loading />;

  return (
    <Box className="page">
      <PageHeader
        eyebrow="Account management"
        title="Customers & Hotel Owners"
        subtitle="View registered customers and property-owner accounts."
      />

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={accountType}
          onChange={(_, value) => {
            setAccountType(value);
            setQuery("");
            setPage(0);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1.5 }}
        >
          <Tab
            value="ALL"
            icon={<PeopleAltRounded />}
            iconPosition="start"
            label="All"
          />
          <Tab
            value="CUSTOMER"
            icon={<PeopleAltRounded />}
            iconPosition="start"
            label="Customers"
          />
          <Tab
            value="HOTEL_OWNER"
            icon={<ApartmentRounded />}
            iconPosition="start"
            label="Hotel owners"
          />
        </Tabs>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
          maxWidth: 680,
          mb: 3,
        }}
      >
        <Card>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(220,38,38,.10)",
                color: "primary.main",
              }}
            >
              {accountType === "HOTEL_OWNER" ? (
                <ApartmentRounded />
              ) : (
                <PeopleAltRounded />
              )}
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Total{" "}
                {accountType === "CUSTOMER"
                  ? "customers"
                  : accountType === "HOTEL_OWNER"
                    ? "hotel owners"
                    : accountType === "ALL"
                      ? "accounts"
                      : "selected accounts"}
              </Typography>
              <Typography variant="h5">
                {serverPaginated ? totalElements : roleAccounts.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(18,183,106,.10)",
                color: "success.main",
              }}
            >
              <PersonSearchRounded />
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Search results
              </Typography>
              <Typography variant="h5">{filteredAccounts.length}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {accountType === "CUSTOMER"
                ? "Customer directory"
                : accountType === "HOTEL_OWNER"
                  ? "Hotel owner directory"
                  : accountType === "ALL"
                    ? "Customer and owner directory"
                    : "Select an account type"}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Four accounts are displayed on each page.
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder={`Search ${
              accountType === "CUSTOMER"
                ? "customer"
                : accountType === "HOTEL_OWNER"
                  ? "hotel owner"
                  : "accounts"
            }...`}
          value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 310 } }}
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
        </Box>

        {filteredAccounts.length === 0 ? (
          <Empty
            title={
              !accountType
                ? "Select an account type to view records"
                : query
                ? "No matching accounts"
                : `No ${
                    accountType === "CUSTOMER"
                      ? "customers"
                      : accountType === "HOTEL_OWNER"
                        ? "hotel owners"
                        : "accounts"
                  } found`
            }
            subtitle={
              !accountType
                ? "Choose All, Customers, or Hotel Owners above."
                : query
                ? "Try searching with a different name, email, or phone number."
                : "New registered accounts will appear here."
            }
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 780 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Account
                    </TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registered</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleAccounts.map((customer) => {
                    const rowRole = String(customer.role || "")
                      .replace(/^ROLE_/, "")
                      .toUpperCase();
                    const rowIsCustomer = rowRole === "CUSTOMER";
                    return (
                    <TableRow key={customer.userId} hover>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
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
                              {customer.fullName ||
                                (rowIsCustomer
                                  ? "Unnamed customer"
                                  : "Unnamed hotel owner")}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {rowIsCustomer
                                ? "Customer"
                                : "Owner"}{" "}
                              ID #{customer.userId}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <EmailRounded
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography variant="body2">
                              {customer.email}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            <PhoneRounded
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {customer.phone || "No phone number"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            customer.activeStatus === false
                              ? "Inactive"
                              : "Active"
                          }
                          color={
                            customer.activeStatus === false
                              ? "default"
                              : "success"
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        {customer.createdAt
                          ? new Intl.DateTimeFormat("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(customer.createdAt))
                          : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          alignItems="center"
                        >
                          {!rowIsCustomer && (
                            <Chip
                              size="small"
                              label="Property owner"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                          <Tooltip
                            title={
                              rowIsCustomer
                                ? "Delete customer"
                                : "Delete hotel owner"
                            }
                          >
                            <IconButton
                              color="error"
                              onClick={() => setDeleting(customer)}
                              aria-label={`Delete ${
                                customer.fullName || customer.email
                              }`}
                            >
                              <DeleteOutlineRounded />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={paginationTotal}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              labelRowsPerPage="Accounts per page"
            />
          </>
        )}
      </Card>

      <Confirm
        open={Boolean(deleting)}
        title={`Delete ${
          String(deleting?.role || "").replace(/^ROLE_/, "") === "HOTEL_OWNER"
            ? "hotel owner"
            : "customer"
        }?`}
        onClose={() => setDeleting(null)}
        onConfirm={deleteAccount}
        confirmText="Delete account"
        danger
      >
        This permanently deletes {deleting?.fullName || deleting?.email}. Their
        related hotels, rooms, images, and booking records may also be removed.
        This action cannot be undone.
      </Confirm>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </Box>
  );
}
