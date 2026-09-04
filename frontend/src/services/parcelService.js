import axios from "axios";
import { API_BASE_URL } from "../api/viteEnv";
import { getAccessToken } from "../lib/tokenStorage";

// Production receives the backend origin through VITE_API_URL; local development
// leaves it blank and lets Vite proxy the relative /api path.
const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Parcel API calls
export const createParcel = async (parcelData) => {
  const response = await api.post("/parcels", parcelData);
  return response.data;
};

export const listParcels = async () => {
  const response = await api.get("/parcels");
  return response.data;
};

export const getParcelDetails = async (id) => {
  const response = await api.get(`/parcels/${id}`);
  return response.data;
};

export const updateParcel = async (id, parcelData) => {
  const response = await api.put(`/parcels/${id}`, parcelData);
  return response.data;
};

export const cancelParcel = async (id) => {
  const response = await api.patch(`/parcels/${id}/cancel`);
  return response.data;
};
