import { useContext } from "react";
import { HotelSelectionContext } from "./hotelSelectionStore";

export const useHotelSelection = () => useContext(HotelSelectionContext);
