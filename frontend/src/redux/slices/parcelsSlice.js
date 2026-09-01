import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  parcels: [],
  selectedParcel: null,

  loading: false,
  error: null,

  creating: false,
  updating: false,
  cancelling: false,
};

const parcelsSlice = createSlice({
  name: "parcels",

  initialState,

  reducers: {
    // Store the user's parcels
    setParcels: (state, action) => {
      state.parcels = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Select one parcel for the details page
    setSelectedParcel: (state, action) => {
      state.selectedParcel = action.payload;
    },

    // Add a newly created parcel
    addParcel: (state, action) => {
      state.parcels.push(action.payload);
      state.creating = false;
    },

    // Update an existing parcel
    updateParcel: (state, action) => {
      const updatedParcel = action.payload;

      const index = state.parcels.findIndex(
        (parcel) => parcel.id === updatedParcel.id
      );

      if (index !== -1) {
        state.parcels[index] = updatedParcel;
      }

      if (state.selectedParcel?.id === updatedParcel.id) {
        state.selectedParcel = updatedParcel;
      }

      state.updating = false;
    },

    // Remove a cancelled parcel
    removeParcel: (state, action) => {
      state.parcels = state.parcels.filter(
        (parcel) => parcel.id !== action.payload
      );

      if (state.selectedParcel?.id === action.payload) {
        state.selectedParcel = null;
      }

      state.cancelling = false;
    },

    // Loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Error state
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.creating = false;
      state.updating = false;
      state.cancelling = false;
    },

    // Creation loading state
    setCreating: (state, action) => {
      state.creating = action.payload;
    },

    // Update loading state
    setUpdating: (state, action) => {
      state.updating = action.payload;
    },

    // Cancellation loading state
    setCancelling: (state, action) => {
      state.cancelling = action.payload;
    },

    // Clear errors
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setParcels,
  setSelectedParcel,
  addParcel,
  updateParcel,
  removeParcel,
  setLoading,
  setError,
  setCreating,
  setUpdating,
  setCancelling,
  clearError,
} = parcelsSlice.actions;

export default parcelsSlice.reducer;
