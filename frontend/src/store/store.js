import { configureStore } from "@reduxjs/toolkit";
import parcelsReducer from "./slices/parcelsSlice";

export const store = configureStore({
  reducer: {
    parcels: parcelsReducer,
  },
});
