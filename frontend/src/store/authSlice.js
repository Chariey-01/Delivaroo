// Session state (BACKENDPRD §19).
//
// Email + password against Flask-JWT-Extended, not the passwordless flow the earlier
// prototype used. The tokens themselves are not kept here: they live in
// lib/tokenStorage so the API client can read them without importing the store, which
// would be a cycle. This slice owns who is signed in and how the last attempt went.

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api';
import { clearTokens, hasSession } from '../lib/tokenStorage';
import { ROLE, roleOf } from '../lib/roles';

/** A thunk that reports a failure as its plain message rather than a serialised Error. */
const withMessage = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (error) {
    return rejectWithValue(error?.message || 'Something went wrong. Please try again.');
  }
};

export const signup = createAsyncThunk('auth/signup', withMessage(authApi.register));
export const login = createAsyncThunk('auth/login', withMessage(authApi.login));
export const logout = createAsyncThunk('auth/logout', withMessage(authApi.logout));

/**
 * Restore a session from a stored token on page load. Resolves to null with no token
 * rather than firing a request that is certain to 401, which is what makes the
 * "signed out" state settle in one tick instead of after a round trip.
 */
export const loadSession = createAsyncThunk(
  'auth/loadSession',
  async () => (hasSession() ? authApi.me() : null),
);

const initialState = {
  user: null,
  /**
   * 'idle' before anything has been asked, 'loading' during a request, 'ready' once
   * the session question has been answered either way. Route guards wait for 'ready'
   * so a refresh on a protected URL does not bounce the user to /login mid-check.
   */
  status: 'idle',
  /** Separate from `status` so a failed login does not look like an unresolved session. */
  submitting: false,
  error: null,
};

const signedIn = (state, action) => {
  state.submitting = false;
  state.status = 'ready';
  state.user = action.payload;
  state.error = null;
};

const failed = (state, action) => {
  state.submitting = false;
  state.error = action.payload || 'Something went wrong. Please try again.';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    /** Local-only sign-out, for a 401 that arrives outside a thunk. */
    sessionExpired(state) {
      clearTokens();
      state.user = null;
      state.status = 'ready';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.status = 'ready';
        state.user = action.payload || null;
      })
      // A stored token that no longer works is a signed-out user, not an error worth
      // showing: nothing the person did caused it.
      .addCase(loadSession.rejected, (state) => {
        state.status = 'ready';
        state.user = null;
        clearTokens();
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'ready';
        state.submitting = false;
        state.error = null;
      });

    builder
      .addMatcher(
        (action) => [signup.pending.type, login.pending.type].includes(action.type),
        (state) => {
          state.submitting = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => [signup.fulfilled.type, login.fulfilled.type].includes(action.type),
        signedIn,
      )
      .addMatcher(
        (action) => [signup.rejected.type, login.rejected.type].includes(action.type),
        failed,
      );
  },
});

export const { clearAuthError, sessionExpired } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsSignedIn = (state) => Boolean(state.auth.user);
export const selectAuthStatus = (state) => state.auth.status;
/** True until the stored-token question has been answered — guards must wait on this. */
export const selectAuthResolving = (state) => state.auth.status !== 'ready';
export const selectAuthSubmitting = (state) => state.auth.submitting;
export const selectAuthError = (state) => state.auth.error;
export const selectRole = (state) => roleOf(state.auth.user);
export const selectIsAdmin = (state) => roleOf(state.auth.user) === ROLE.ADMIN;

export default authSlice.reducer;
