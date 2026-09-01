import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const createParcel = async (parcelData) => {
  const response = await axios.post(`${API_URL}/api/parcels`, parcelData);

  return response.data;
};
