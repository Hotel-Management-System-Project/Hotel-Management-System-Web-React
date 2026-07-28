// 
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AddRounded,
  CheckRounded,
  CloseRounded,
  SettingsRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { endpoints } from "../services/api";
import { useAuth } from "../context/AuthContext";

import {
  Empty,
  Loading,
  Notice,
  PageHeader,
  Status,
} from "../components/Common";

const blank = {
  ownerId: "",
  hotelName: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  rating: 0,
};

export default function Hotels() {
  const { isAdmin, isOwner, isCustomer, user } = useAuth();

  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [notice, setNotice] = useState(null);

  const load = () => {
    endpoints
      .hotels()
      .then((response) => {
        const list = Array.isArray(response) ? response : [];

        if (isOwner) {
          setRows(
            list.filter(
              (hotel) =>
                Number(hotel.owner?.userId ?? hotel.ownerId) ===
                Number(user?.userId)
            )
          );
        } else if (isCustomer) {
          setRows(
            list.filter(
              (hotel) =>
                String(hotel.status).toUpperCase() === "APPROVED"
            )
          );
        } else {
          setRows(list);
        }
      })
      .catch((error) => {
        setNotice({
          type: "error",
          message: error.message,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (hotelId, action) => {
    try {
      if (action === "approve") {
        await endpoints.approveHotel(hotelId);
      } else {
        await endpoints.rejectHotel(hotelId);
      }

      load();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    }
  };

  const submit = async () => {
    try {
      await endpoints.addHotel({
        ...form,
        ownerId: isOwner ? user.userId : Number(form.ownerId),
        rating: Number(form.rating),
      });

      setOpen(false);
      setForm(blank);
      load();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    }
  };

  const manage = (hotel) => {
    localStorage.setItem(
      "selected_hotel",
      JSON.stringify({
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName,
      })
    );

    navigate(
      `/rooms?hotelId=${hotel.hotelId}&hotelName=${encodeURIComponent(
        hotel.hotelName
      )}`
    );
  };

  if (loading) return <Loading />;

  const fields = Object.keys(blank).filter(
    (field) => !isOwner || field !== "ownerId"
  );
    return (
    <div className="page">
      <PageHeader
        eyebrow={
          isOwner
            ? "My Properties"
            : isCustomer
            ? "Explore Stays"
            : "Property Administration"
        }
        title={
          isOwner
            ? "My Hotels"
            : isCustomer
            ? "Browse Hotels"
            : "Hotels"
        }
        subtitle={
          isOwner
            ? "Select a hotel to manage its rooms and inventory."
            : isCustomer
            ? "Browse administrator-approved hotels."
            : "Review and manage all property requests."
        }
        // action={
        //   !isCustomer && (
        //     <Button
        //       variant="contained"
        //       startIcon={<AddRounded />}
        //       onClick={() => setOpen(true)}
        //     >
        //       {isOwner ? "Submit Hotel" : "Add Hotel"}
        //     </Button>
        //   )
        // }
        action={
  isOwner && (
    <Button
      variant="contained"
      startIcon={<AddRounded />}
      onClick={() => setOpen(true)}
    >
      Submit Hotel
    </Button>
  )
}
      />

      {!rows.length ? (
        <Card>
          <Empty title="No hotels found" />
        </Card>
      ) : (
        <Grid container spacing={2.5} className="hotel-grid">
          {rows.map((hotel) => (
            <Grid
              key={hotel.hotelId}
              size={{ xs: 12, md: 6, xl: 4 }}
            >
              <Card className="hotel-card">
                <CardContent>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        className="hotel-name"
                      >
                        {hotel.hotelName}
                      </Typography>

                      <Typography className="hotel-location">
                        {hotel.city}, {hotel.state}
                      </Typography>
                    </Box>

                    <Status value={hotel.status || "PENDING"} />
                  </Stack>

                  <Typography className="hotel-description">
                    {hotel.description || "No description provided."}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    className="hotel-footer"
                  >
                    <Typography className="hotel-rating">
                      Rating <b>{hotel.rating || 0}/5</b>
                    </Typography>

                    {isAdmin && (
                      <Box className="admin-actions">
                        <Tooltip title="Approve">
                          <IconButton
                            color="success"
                            onClick={() =>
                              review(hotel.hotelId, "approve")
                            }
                          >
                            <CheckRounded />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reject">
                          <IconButton
                            color="error"
                            onClick={() =>
                              review(hotel.hotelId, "reject")
                            }
                          >
                            <CloseRounded />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Stack>

                  {isOwner && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SettingsRounded />}
                      className="hotel-manage-btn"
                      onClick={() => manage(hotel)}
                    >
                      Manage {hotel.hotelName}
                    </Button>
                  )}

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isOwner ? "Submit Hotel" : "Add Hotel"}
        </DialogTitle>

        <DialogContent
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
            },
            gap: 2,
            pt: "10px !important",
          }}
        >
          {fields.map((field) => (
            <TextField
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              value={form[field]}
              multiline={field === "description"}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field]: e.target.value,
                })
              }
              sx={
                ["description", "address"].includes(field)
                  ? { gridColumn: "1 / -1" }
                  : {}
              }
            />
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={submit}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Notice
        notice={notice}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}