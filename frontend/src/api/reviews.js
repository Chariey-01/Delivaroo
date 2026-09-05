import { get, patch, post } from './client';

const query = (params) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item != null && item !== '')).toString();
  return value ? `?${value}` : '';
};

export const createReview = (parcelId, rating, comment) => post('/reviews', { parcel_id: parcelId, rating, comment });
export const listMyReviews = (params = {}) => get(`/reviews/me${query(params)}`);
export const listPublicReviews = (params = {}) => get(`/reviews/public${query(params)}`, { auth: false });
export const listAdminReviews = (params = {}) => get(`/admin/reviews${query(params)}`);
export const moderateReview = (id, decision) => patch(`/admin/reviews/${id}/${decision}`, {});
