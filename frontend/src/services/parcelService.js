import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parcelApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createParcel = async (parcelData) => {
  const response = await parcelApi.post("/parcels", parcelData);
  return response.data;
};

export const getParcels = async () => {
  const response = await parcelApi.get("/parcels");
  return response.data;
};

export const getParcel = async (parcelId) => {
  const response = await parcelApi.get(`/parcels/${parcelId}`);
  return response.data;
};

export const updateParcel = async (parcelId, parcelData) => {
  const response = await parcelApi.put(
    `/parcels/${parcelId}`,
    parcelData
  );
  return response.data;
};

export const cancelParcel = async (parcelId) => {
  const response = await parcelApi.delete(`/parcels/${parcelId}`);
  return response.data;
};

export default parcelApi;
