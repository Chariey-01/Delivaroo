import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  parcels: [],
  selectedParcel: null,

  create: {
    loading: false,
    error: null,
    success: false,
  },

  list: {
    loading: false,
    error: null,
  },

  details: {
    loading: false,
    error: null,
  },

  update: {
    loading: false,
    error: null,
    success: false,
  },

  cancellation: {
    loading: false,
    error: null,
    success: false,
  },
};

const parcelsSlice = createSlice({
  name: "parcels",
  initialState,

  reducers: {
    // Create parcel
    createParcelStart: (state) => {
      state.create.loading = true;
      state.create.error = null;
      state.create.success = false;
    },

    createParcelSuccess: (state, action) => {
      state.create.loading = false;
      state.create.success = true;
      state.create.error = null;

      state.parcels.push(action.payload);
    },

    createParcelFailure: (state, action) => {
      state.create.loading = false;
      state.create.error = action.payload;
      state.create.success = false;
    },

    // List parcels
    listParcelsStart: (state) => {
      state.list.loading = true;
      state.list.error = null;
    },

    listParcelsSuccess: (state, action) => {
      state.list.loading = false;
      state.list.error = null;
      state.parcels = action.payload;
    },

    listParcelsFailure: (state, action) => {
      state.list.loading = false;
      state.list.error = action.payload;
    },

    // Parcel details
    getParcelStart: (state) => {
      state.details.loading = true;
      state.details.error = null;
    },

    getParcelSuccess: (state, action) => {
      state.details.loading = false;
      state.details.error = null;
      state.selectedParcel = action.payload;
    },

    getParcelFailure: (state, action) => {
      state.details.loading = false;
      state.details.error = action.payload;
    },

    // Update parcel
    updateParcelStart: (state) => {
      state.update.loading = true;
      state.update.error = null;
      state.update.success = false;
    },

    updateParcelSuccess: (state, action) => {
      state.update.loading = false;
      state.update.error = null;
      state.update.success = true;

      const index = state.parcels.findIndex(
        (parcel) => parcel.id === action.payload.id
      );

      if (index !== -1) {
        state.parcels[index] = action.payload;
      }

      if (state.selectedParcel?.id === action.payload.id) {
        state.selectedParcel = action.payload;
      }
    },

    updateParcelFailure: (state, action) => {
      state.update.loading = false;
      state.update.error = action.payload;
      state.update.success = false;
    },

    // Cancel parcel
    cancelParcelStart: (state) => {
      state.cancellation.loading = true;
      state.cancellation.error = null;
      state.cancellation.success = false;
    },

    cancelParcelSuccess: (state, action) => {
      state.cancellation.loading = false;
      state.cancellation.error = null;
      state.cancellation.success = true;

      const index = state.parcels.findIndex(
        (parcel) => parcel.id === action.payload.id
      );

      if (index !== -1) {
        state.parcels[index] = action.payload;
      }

      if (state.selectedParcel?.id === action.payload.id) {
        state.selectedParcel = action.payload;
      }
    },

    cancelParcelFailure: (state, action) => {
      state.cancellation.loading = false;
      state.cancellation.error = action.payload;
      state.cancellation.success = false;
    },

    // Reset states
    resetCreateState: (state) => {
      state.create.loading = false;
      state.create.error = null;
      state.create.success = false;
    },

    resetUpdateState: (state) => {
      state.update.loading = false;
      state.update.error = null;
      state.update.success = false;
    },

    resetCancellationState: (state) => {
      state.cancellation.loading = false;
      state.cancellation.error = null;
      state.cancellation.success = false;
    },
  },
});

export const {
  createParcelStart,
  createParcelSuccess,
  createParcelFailure,

  listParcelsStart,
  listParcelsSuccess,
  listParcelsFailure,

  getParcelStart,
  getParcelSuccess,
  getParcelFailure,

  updateParcelStart,
  updateParcelSuccess,
  updateParcelFailure,

  cancelParcelStart,
  cancelParcelSuccess,
  cancelParcelFailure,

  resetCreateState,
  resetUpdateState,
  resetCancellationState,
} = parcelsSlice.actions;

export default parcelsSlice.reducer;
