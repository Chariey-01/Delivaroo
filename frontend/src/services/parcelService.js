import {
  cancelParcel,
  createParcel,
  getParcel,
  listParcels,
  updateDestination
} from '../api/parcels';

export { cancelParcel, createParcel, getParcel };
export const getParcels = listParcels;
export const updateParcel = (parcelId, parcelData) =>
  updateDestination(parcelId, parcelData.destination ?? parcelData);

export default { cancelParcel, createParcel, getParcel, getParcels, updateParcel };
