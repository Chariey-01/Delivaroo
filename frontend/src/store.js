import { configureStore } from "@reduxjs/toolkit";
import parcelsReducer from "./redux/slices/parcelsSlice";

export const store = configureStore({
  reducer: {
    parcels: parcelsReducer,
  },
});
