/**
 * Shares the hotel currently selected by a hotel owner. This lets Dashboard,
 * Rooms, and Bookings consistently display data for the same property.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { endpoints } from "../services/api";
import { toArray } from "../utils/data";
import { useAuth } from "./useAuth";
import { HotelSelectionContext } from "./hotelSelectionStore";

const SELECTED_HOTEL_KEY = "selected_hotel";

const belongsToOwner = (hotel, user) => {
  // Support both nested owner objects and flat ownerId values from the backend.
  const ownerId = hotel?.owner?.userId ?? hotel?.ownerId;
  const ownerEmail = hotel?.owner?.email;
  const idMatches =
    user?.userId != null &&
    ownerId != null &&
    Number(ownerId) === Number(user.userId);
  const emailMatches =
    Boolean(ownerEmail) &&
    Boolean(user?.email) &&
    ownerEmail.toLowerCase() === user.email.toLowerCase();
  return idMatches || emailMatches;
};

function readSavedHotel() {
  // Restore the chosen property after a browser refresh.
  try {
    return JSON.parse(localStorage.getItem(SELECTED_HOTEL_KEY) || "null");
  } catch {
    localStorage.removeItem(SELECTED_HOTEL_KEY);
    return null;
  }
}

function saveSelectedHotel(hotel) {
  // Save only the small amount of data required to restore the selection.
  if (!hotel) {
    localStorage.removeItem(SELECTED_HOTEL_KEY);
    return;
  }

  localStorage.setItem(
    SELECTED_HOTEL_KEY,
    JSON.stringify({
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
    }),
  );
}

export function HotelSelectionProvider({ children }) {
  // Authentication determines whether hotel-selection behavior is required.
  const { isOwner, user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotelState] = useState(null);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelError, setHotelError] = useState("");

  // Load this owner's hotels and restore a still-valid previous selection.
  const refreshHotels = useCallback(async () => {
    if (!isOwner || !user?.email) {
      setHotels([]);
      setSelectedHotelState(null);
      setHotelError("");
      return;
    }

    setLoadingHotels(true);
    setHotelError("");
    try {
      const result = await endpoints.hotels();
      const allHotels = toArray(result, "hotels");
      const ownerHotels = allHotels.filter((hotel) =>
        belongsToOwner(hotel, user),
      );
      setHotels(ownerHotels);

      const savedHotel = readSavedHotel();

      const validSavedHotel = ownerHotels.find(
        (hotel) => Number(hotel.hotelId) === Number(savedHotel?.hotelId),
      );
      const nextHotel = validSavedHotel || ownerHotels[0] || null;
      setSelectedHotelState(nextHotel);

      if (nextHotel) {
        saveSelectedHotel(nextHotel);
      } else {
        saveSelectedHotel(null);
        if (allHotels.length > 0) {
          setHotelError(
            "Hotels loaded, but none match this owner account. Check the hotel's owner_id.",
          );
        }
      }
    } catch (error) {
      setHotels([]);
      setSelectedHotelState(null);
      setHotelError(
        error.message ||
          "Hotels could not be loaded. Restart the backend and try again.",
      );
    } finally {
      setLoadingHotels(false);
    }
  }, [isOwner, user?.email, user?.userId]);

  // Reload properties whenever the authenticated owner changes.
  useEffect(() => {
    refreshHotels();
  }, [refreshHotels]);

  // Called by the sidebar dropdown when the active property changes.
  const selectHotel = (hotelId) => {
    const nextHotel = hotels.find(
      (hotel) => Number(hotel.hotelId) === Number(hotelId),
    );
    if (!nextHotel) return;

    setSelectedHotelState(nextHotel);
    saveSelectedHotel(nextHotel);
  };

  // Memoization prevents unnecessary updates in every consuming page.
  const value = useMemo(
    () => ({
      hotels,
      selectedHotel,
      selectHotel,
      loadingHotels,
      hotelError,
      refreshHotels,
    }),
    [hotels, selectedHotel, loadingHotels, hotelError, refreshHotels],
  );

  return (
    <HotelSelectionContext.Provider value={value}>
      {children}
    </HotelSelectionContext.Provider>
  );
}
