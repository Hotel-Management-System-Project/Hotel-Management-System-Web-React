import { useContext } from "react";
import { ThemeModeContext } from "./themeModeStore";

export const useThemeMode = () => useContext(ThemeModeContext);
