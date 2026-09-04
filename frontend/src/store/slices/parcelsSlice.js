import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createParcel as createParcelAPI,
  listParcels as listParcelsAPI,
  getParcelDetails as getParcelDetailsAPI,
  updateParcel as updateParcelAPI,
  cancelParcel as cancelParcelAPI,
} from "../../services/parcelService";

// Async Thunks
export const createParcel = createAsyncThunk(
  "parcels/createParcel",
  async (parcelData, { rejectWithValue }) => {
    try {
      return await createParcelAPI(parcelData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const listParcels = createAsyncThunk(
  "parcels/listParcels",
  async (_, { rejectWithValue }) => {
    try {
      return await listParcelsAPI();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getParcelDetails = createAsyncThunk(
  "parcels/getParcelDetails",
  async (id, { rejectWithValue }) => {
    try {
      return await getParcelDetailsAPI(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateParcel = createAsyncThunk(
  "parcels/updateParcel",
  async ({ id, parcelData }, { rejectWithValue }) => {
    try {
      return await updateParcelAPI(id, parcelData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelParcel = createAsyncThunk(
  "parcels/cancelParcel",
  async (id, { rejectWithValue }) => {
    try {
      return await cancelParcelAPI(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

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
    clearParcelErrors: (state) => {
      state.create.error = null;
      state.list.error = null;
      state.details.error = null;
      state.update.error = null;
      state.cancellation.error = null;
    },

    clearSelectedParcel: (state) => {
      state.selectedParcel = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create Parcel
      .addCase(createParcel.pending, (state) => {
        state.create.loading = true;
        state.create.error = null;
        state.create.success = false;
      })
      .addCase(createParcel.fulfilled, (state, action) => {
        state.create.loading = false;
        state.create.success = true;
        state.parcels.push(action.payload);
      })
      .addCase(createParcel.rejected, (state, action) => {
        state.create.loading = false;
        state.create.error = action.payload;
      })

      // List Parcels
      .addCase(listParcels.pending, (state) => {
        state.list.loading = true;
        state.list.error = null;
      })
      .addCase(listParcels.fulfilled, (state, action) => {
        state.list.loading = false;
        state.parcels = action.payload;
      })
      .addCase(listParcels.rejected, (state, action) => {
        state.list.loading = false;
        state.list.error = action.payload;
      })

      // Get Parcel Details
      .addCase(getParcelDetails.pending, (state) => {
        state.details.loading = true;
        state.details.error = null;
      })
      .addCase(getParcelDetails.fulfilled, (state, action) => {
        state.details.loading = false;
        state.selectedParcel = action.payload;
      })
      .addCase(getParcelDetails.rejected, (state, action) => {
        state.details.loading = false;
        state.details.error = action.payload;
      })

      // Update Parcel
      .addCase(updateParcel.pending, (state) => {
        state.update.loading = true;
        state.update.error = null;
        state.update.success = false;
      })
      .addCase(updateParcel.fulfilled, (state, action) => {
        state.update.loading = false;
        state.update.success = true;
        state.selectedParcel = action.payload;

        const index = state.parcels.findIndex(
          (parcel) => parcel.id === action.payload.id
        );

        if (index !== -1) {
          state.parcels[index] = action.payload;
        }
      })
      .addCase(updateParcel.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload;
      })

      // Cancel Parcel
      .addCase(cancelParcel.pending, (state) => {
        state.cancellation.loading = true;
        state.cancellation.error = null;
        state.cancellation.success = false;
      })
      .addCase(cancelParcel.fulfilled, (state, action) => {
        state.cancellation.loading = false;
        state.cancellation.success = true;

        state.selectedParcel = action.payload;

        const index = state.parcels.findIndex(
          (parcel) => parcel.id === action.payload.id
        );

        if (index !== -1) {
          state.parcels[index] = action.payload;
        }
      })
      .addCase(cancelParcel.rejected, (state, action) => {
        state.cancellation.loading = false;
        state.cancellation.error = action.payload;
      });
  },
});

export const { clearParcelErrors, clearSelectedParcel } = parcelsSlice.actions;

export default parcelsSlice.reducer;