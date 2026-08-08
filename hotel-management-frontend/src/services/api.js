/**
 * Centralizes communication with the Spring Boot REST API. Axios interceptors
 * attach JWT tokens and endpoint functions keep HTTP logic out of UI pages.
 */
import axios from "axios";

// Axios Instance
export const api = axios.create({
  // VITE_API_URL supports deployment; an empty URL uses Vite's local proxy.
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // Automatically authorize each protected request made through this instance.
  const token = localStorage.getItem("hotel_token")?.trim();

  if (token) {
    // Axios 1 uses AxiosHeaders. Its set method reliably preserves the bearer
    // token on GET, POST, PUT and DELETE requests, including JSON submissions.
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Unwrap the standard Spring response before returning it to a page.
    const body = response.data;

    if (String(body?.status || "").toLowerCase() === "error") {
      return Promise.reject(new Error(body.message || "Request failed"));
    }

    return body?.data ?? body;
  },
  (error) => {
    // A 401 means the backend rejected the JWT. Clear it even when the local
    // expiry time has not passed because its signature/secret may be stale.
    if (error.response?.status === 401) {
      localStorage.removeItem("hotel_token");
      localStorage.removeItem("hotel_user");
      localStorage.removeItem("selected_hotel");
      localStorage.removeItem("hotel_session_version");

      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login?reason=session-expired");
      }

      return Promise.reject(
        new Error("Your session is invalid or expired. Please sign in again."),
      );
    }

    // A hotel submission performs several protected requests. Include the
    // rejected URL so the backend permission that needs fixing is visible.
    if (error.response?.status === 403) {
      const endpoint = error.config?.url || "protected endpoint";
      const responseBody = error.response?.data;
      const message =
        responseBody?.message ||
        responseBody?.detail ||
        (typeof responseBody === "string" ? responseBody : "") ||
        "You do not have permission for this operation";

      return Promise.reject(
        new Error(`403 from ${endpoint}: ${message}`),
      );
    }

    const responseBody = error.response?.data;
    const responseMessage =
      responseBody?.message ||
      responseBody?.detail ||
      responseBody?.error ||
      (typeof responseBody === "string" ? responseBody : "");

    return Promise.reject(
      new Error(responseMessage || error.message || "Network error"),
    );
  },
);

// API Endpoints
export const endpoints = {
  // Authentication
  login: (data) => api.post("/api/auth/login", data),

  signup: (data) => api.post("/api/auth/signup", data),

  sendSignupOtp: (email) =>
    api.post("/api/auth/send-signup-otp", { email }),

  verifySignupOtp: (email, code) =>
    api.post("/api/auth/verify-signup-otp", { email, code }),

  // User management is restricted to authenticated administrators.
  users: () => api.get("/api/admin/users"),

  // Protected admin endpoint deletes either a customer or hotel owner.
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),

  changePassword: (data) => api.put("/api/auth/change-password", data),

  // Hotels
  hotels: () => api.get("/api/hotels"),

  hotel: (id) => api.get(`/api/hotels/${id}`),

  addHotel: (data) => api.post("/api/hotels", data),

  submitHotel: (id) => api.put(`/api/hotels/${id}/submit`),

  approveHotel: (id) => api.put(`/api/hotels/approve/${id}`),

  rejectHotel: (id) => api.put(`/api/hotels/reject/${id}`),

  deleteHotel: (id) => api.delete(`/api/hotels/${id}`),

  // Rooms
  rooms: () => api.get("/getAllRooms"),

  addRoom: (data) => api.post("/addRoom", data),

  addRoomsBulk: (data) => api.post("/addRoomsBulk", data),

  updateRoom: (roomId, data) => {
    // Send the token explicitly for this owner-only operation. The request
    // interceptor also adds it, but this check produces a useful error before
    // contacting Spring when the browser session was not saved correctly.
    const token = localStorage.getItem("hotel_token")?.trim();

    if (!token) {
      return Promise.reject(
        new Error("Login token is missing. Please sign in again."),
      );
    }

    // Use the room primary key. This is the same endpoint verified in Postman
    // and avoids collisions when different hotels reuse room numbers.
    return api.put(`/updateById/${roomId}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  },

  deleteRoom: (id) => api.delete(`/deleteRoomById/${id}`),

  roomImages: (roomId) => api.get(`/api/room-images/room/${roomId}`),

  addRoomImage: (data) => api.post("/api/room-images", data),

  updateRoomImage: (imageId, data) =>
    api.put(`/api/room-images/${imageId}`, data),

  deleteRoomImage: (imageId) => api.delete(`/api/room-images/${imageId}`),

  // Hotel Images
  images: (id) => api.get(`/api/hotel-images/hotel/${id}`),

  addImage: (data) => api.post("/api/hotel-images", data),

  deleteImage: (id) => api.delete(`/api/hotel-images/${id}`),

  // Bookings
  bookings: () => api.get("/api/bookings"),

  myBookings: () => api.get("/api/bookings/my"),

  hotelBookings: (hotelId) => api.get(`/api/bookings/hotel/${hotelId}`),

  bookingPayment: (bookingId) =>
    api.get(`/api/payments/booking/${bookingId}`),

  bookingRooms: () => api.get("/api/booking-rooms"),

  cancelBooking: (id) => api.put(`/api/bookings/cancel/${id}`),

  completeBooking: (id) => api.put(`/api/bookings/complete/${id}`),

  deleteBooking: (id) => api.delete(`/api/bookings/${id}`),
};
