// The Redux store (W1-08).
//
// `makeStore` exists so a test can build a fresh store — with a seeded state when it
// needs one — instead of sharing the singleton between test cases and inheriting
// whichever session the previous one left behind.

import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import ui from './uiSlice';

// Feature slices are added here as they land. Keeping the map in one object means a
// teammate adding `parcels` touches this line and nothing else.
const reducer = { auth, ui };

export const makeStore = (preloadedState) => configureStore({ reducer, preloadedState });

export const store = makeStore();
