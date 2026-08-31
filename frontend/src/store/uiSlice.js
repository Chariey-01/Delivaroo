// Cross-screen UI state. Small on purpose: only the things more than one screen needs.

import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    /** { message, tone } | null — one at a time, the newest wins. */
    toast: null,
  },
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toast = action.payload;
      },
      prepare(payload) {
        const { message, tone = 'info' } =
          typeof payload === 'string' ? { message: payload } : payload;
        return { payload: { message, tone, id: Date.now() } };
      },
    },
    dismissToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, dismissToast } = uiSlice.actions;
export const selectToast = (state) => state.ui.toast;
export default uiSlice.reducer;
