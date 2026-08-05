import axios from "axios";

// Axios Instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hotel_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    const body = response.data;

    if (body?.status === "error") {
      return Promise.reject(
        new Error(body.message || "Request failed")
      );
    }

    return body?.data ?? body;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hotel_token");
      localStorage.removeItem("hotel_user");

      if (!location.pathname.includes("/login")) {
        location.href = "/login";
      }
    }

    return Promise.reject(
      new Error(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Network error"
      )
    );
  }
);

// API Endpoints
export const endpoints = {
  // Authentication
  login: (data) =>
    api.post("/api/auth/login", data),

  signup: (data) =>
    api.post("/api/auth/signup", data),

  users: () =>
    api.get("/api/auth/users"),

  changePassword: (data) =>
    api.put("/api/auth/change-password", data),

  // Hotels
  hotels: () =>
    api.get("/api/hotels"),

  hotel: (id) =>
    api.get(`/api/hotels/${id}`),

  addHotel: (data) =>
    api.post("/api/hotels", data),

  approveHotel: (id) =>
    api.put(`/api/hotels/approve/${id}`),

  rejectHotel: (id) =>
    api.put(`/api/hotels/reject/${id}`),

  // Rooms
  rooms: () =>
    api.get("/getAllRooms"),

  addRoom: (data) =>
    api.post("/addRoom", data),

  updateRoom: (id, data) =>
    api.put(`/updateById/${id}`, data),

  deleteRoom: (id) =>
    api.delete(`/deleteRoomById/${id}`),

  // Hotel Images
  images: (id) =>
    api.get(`/api/hotel-images/hotel/${id}`),

  addImage: (data) =>
    api.post("/api/hotel-images", data),

  deleteImage: (id) =>
    api.delete(`/api/hotel-images/${id}`),

  // Bookings
  bookings: () =>
    api.get("/api/bookings"),

  myBookings: () =>
    api.get("/api/bookings/my"),

  cancelBooking: (id) =>
    api.put(`/api/bookings/cancel/${id}`),

  deleteBooking: (id) =>
    api.delete(`/api/bookings/${id}`),
};