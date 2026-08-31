// W2-22 — the frontend/backend integration pass.
//
// The Flask app is still a skeleton, so these lock the *contract* the frontend has
// been written against: the paths from BACKENDPRD §19–§21, the request shapes, the
// bearer header, and the snake_case → camelCase normalisation. When the backend lands,
// a mismatch shows up here as a failing expectation naming the exact field — which is
// considerably cheaper than finding it by clicking through the UI.

import { authApi, parcelsApi } from '../../api';
import { clearTokens, getAccessToken, setTokens } from '../../lib/tokenStorage';
import { fail, mockApi, ok } from '../testUtils';

beforeEach(() => clearTokens());

describe('auth endpoints', () => {
  test('register posts to /api/auth/register in the backend field names', async () => {
    const calls = mockApi({
      'POST /api/auth/register': ok({
        access_token: 'a',
        refresh_token: 'r',
        user: { id: 1, email: 'a@b.c', role: 'USER', profile: { full_name: 'A B', phone: '+254' } },
      }),
    });

    const user = await authApi.register({
      email: '  A@B.C  ',
      password: 'supersecret',
      fullName: 'A B',
      phone: '+254',
    });

    expect(calls[0].path).toBe('/api/auth/register');
    // Email is normalised before it leaves the client, as §4 requires of storage.
    expect(calls[0].body).toEqual({
      email: 'a@b.c',
      password: 'supersecret',
      full_name: 'A B',
      phone: '+254',
    });
    expect(user).toEqual({
      id: 1,
      email: 'a@b.c',
      role: 'USER',
      isActive: true,
      fullName: 'A B',
      phone: '+254',
      profileImage: null,
    });
    expect(getAccessToken()).toBe('a');
  });

  test('register omits an empty phone rather than sending an empty string', async () => {
    const calls = mockApi({ 'POST /api/auth/register': ok({ user: { id: 1, email: 'a@b.c' } }) });

    await authApi.register({ email: 'a@b.c', password: 'supersecret', fullName: 'A B', phone: '' });

    expect(calls[0].body).not.toHaveProperty('phone');
  });

  test('login posts to /api/auth/login and stores the pair', async () => {
    const calls = mockApi({
      'POST /api/auth/login': ok({ access_token: 'a', refresh_token: 'r', user: { id: 1, role: 'ADMIN' } }),
    });

    const user = await authApi.login({ email: 'a@b.c', password: 'pw' });

    expect(calls[0].path).toBe('/api/auth/login');
    expect(calls[0].body).toEqual({ email: 'a@b.c', password: 'pw' });
    expect(user.role).toBe('ADMIN');
    expect(getAccessToken()).toBe('a');
  });

  test('me reads /api/auth/me with the bearer token', async () => {
    setTokens({ access: 'token-123' });
    const calls = mockApi({ 'GET /api/auth/me': ok({ user: { id: 1, email: 'a@b.c', role: 'user' } }) });

    const user = await authApi.me();

    expect(calls[0].path).toBe('/api/auth/me');
    expect(calls[0].options.headers.Authorization).toBe('Bearer token-123');
    // Role casing from the database must not decide what the guards see.
    expect(user.role).toBe('USER');
  });

  test('logout revokes server-side and clears locally', async () => {
    setTokens({ access: 'a', refresh: 'r' });
    const calls = mockApi({ 'POST /api/auth/logout': ok(null) });

    await authApi.logout();

    expect(calls[0].path).toBe('/api/auth/logout');
    expect(getAccessToken()).toBeNull();
  });

  test('a logout the server refuses still signs the user out of this browser', async () => {
    setTokens({ access: 'a', refresh: 'r' });
    mockApi({ 'POST /api/auth/logout': fail(500, 'Server error') });

    await expect(authApi.logout()).resolves.toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});

describe('parcel endpoints', () => {
  beforeEach(() => setTokens({ access: 'token' }));

  const rawParcel = {
    id: 7,
    tracking_number: 'SD123456',
    status: 'IN_TRANSIT',
    price: '450.00',
    distance: '12.4',
    duration: '1800',
    pickup_address: 'Westlands',
    pickup_latitude: '-1.2641',
    pickup_longitude: '36.8078',
    destination_address: 'Karen',
    destination_latitude: '-1.3191',
    destination_longitude: '36.7062',
    present_latitude: '-1.29',
    present_longitude: '36.75',
    created_at: '2026-08-27T10:00:00Z',
  };

  test('a parcel is flattened into the shape the UI and the map read', async () => {
    mockApi({ 'GET /api/parcels/7': ok(rawParcel) });

    const parcel = await parcelsApi.getParcel(7);

    expect(parcel.trackingNumber).toBe('SD123456');
    // Numeric strings from SQLAlchemy's Numeric type must arrive as numbers, or the
    // map arithmetic and the price formatting both silently do string things.
    expect(parcel.price).toBe(450);
    expect(parcel.pickup).toEqual({ address: 'Westlands', lat: -1.2641, lng: 36.8078 });
    expect(parcel.presentLocation).toEqual({ lat: -1.29, lng: 36.75 });
  });

  test('a parcel with no present location reports null, not NaN', async () => {
    mockApi({ 'GET /api/parcels/7': ok({ ...rawParcel, present_latitude: null, present_longitude: null }) });

    const parcel = await parcelsApi.getParcel(7);

    expect(parcel.presentLocation).toBeNull();
  });

  test('a list response is accepted either bare or wrapped in items', async () => {
    mockApi({ 'GET /api/parcels': ok([rawParcel, rawParcel]) });
    await expect(parcelsApi.listParcels()).resolves.toHaveLength(2);

    mockApi({ 'GET /api/parcels': ok({ items: [rawParcel] }) });
    await expect(parcelsApi.listParcels()).resolves.toHaveLength(1);
  });

  test('admin status update targets the admin route with the status body', async () => {
    const calls = mockApi({ 'PATCH /api/admin/parcels/7/status': ok(rawParcel) });

    await parcelsApi.updateParcelStatus(7, 'DELIVERED');

    expect(calls[0].path).toBe('/api/admin/parcels/7/status');
    expect(calls[0].body).toEqual({ status: 'DELIVERED' });
  });

  test('admin location update sends latitude/longitude, the names §14 validates', async () => {
    const calls = mockApi({ 'PATCH /api/admin/parcels/7/location': ok(rawParcel) });

    await parcelsApi.updatePresentLocation(7, { lat: -1.29, lng: 36.75 });

    expect(calls[0].body).toEqual({ latitude: -1.29, longitude: 36.75 });
  });

  test('admin listing forwards only the filters that were set', async () => {
    const calls = mockApi({ 'GET /api/admin/parcels?status=PENDING&page=2': ok([]) });

    await parcelsApi.listAllParcels({ status: 'PENDING', page: 2, q: '' });

    expect(calls[0].path).toBe('/api/admin/parcels?status=PENDING&page=2');
  });

  test("a user forbidden from another user's parcel gets the backend's message", async () => {
    mockApi({ 'GET /api/parcels/99': fail(403, 'You are not authorized to view this parcel') });

    await expect(parcelsApi.getParcel(99)).rejects.toThrow(
      'You are not authorized to view this parcel',
    );
  });

});
