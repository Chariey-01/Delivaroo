import { configureStore } from '@reduxjs/toolkit';
import parcels from './redux/slices/parcelsSlice';
import auth from './store/authSlice';
import ui from './store/uiSlice';

const reducer = { auth, ui, parcels };

export const makeStore = (preloadedState) => configureStore({ reducer, preloadedState });

export const store = makeStore();
