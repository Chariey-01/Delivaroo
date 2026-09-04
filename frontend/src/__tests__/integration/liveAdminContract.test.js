import { api } from '../../api/client';
import {
  assignDeliveryAgent,
  createParcel,
  normalizeParcel,
  updatePresentLocation,
  verifyParcelWeight
} from '../../api/parcels';
import { mockApi, ok } from '../testUtils';

test('live admin API adapter calls backend endpoints used by the admin portal', async () => {
  const calls = mockApi({
    'GET /api/admin/users': ok([]),
    'GET /api/admin/couriers': ok([]),
    'GET /api/admin/audit': ok([]),
    'GET /api/admin/notifications': ok([]),
    'GET /api/settings': ok({ acceptingOrders: true }),
    'PATCH /api/admin/settings': ok({ acceptingOrders: false }),
    'GET /api/transport/availability': ok({ ROAD: 'AVAILABLE' }),
    'PATCH /api/admin/transport/availability': ok({ ROAD: 'OFFLINE' }),
  });

  await api('/admin/users');
  await api('/admin/couriers');
  await api('/admin/audit');
  await api('/admin/notifications');
  await api('/settings');
  await api('/admin/settings', { method: 'PATCH', body: { acceptingOrders: false } });
  await api('/transport/availability');
  await api('/admin/transport/availability', { method: 'PATCH', body: { mode: 'ROAD', status: 'OFFLINE' } });

  expect(calls.map((call) => call.path)).toEqual([
    '/api/admin/users',
    '/api/admin/couriers',
    '/api/admin/audit',
    '/api/admin/notifications',
    '/api/settings',
    '/api/admin/settings',
    '/api/transport/availability',
    '/api/admin/transport/availability',
  ]);
});

test('parcel adapter preserves live backend weight fields', async () => {
  const parcel = normalizeParcel({
    id: 'p1',
    tracking_number: 'DLV-1',
    declared_weight_kg: '3.50',
    verified_weight_kg: '4.25',
    weighed_at: '2026-09-02T10:00:00',
    weighed_by: 'admin@example.test',
  });

  expect(parcel).toMatchObject({
    declaredWeightKg: 3.5,
    verifiedWeightKg: 4.25,
    weighedAt: '2026-09-02T10:00:00',
    weighedBy: 'admin@example.test',
  });
});

test('parcel write helpers call live assignment location and weight endpoints', async () => {
  const rawParcel = { id: 'p1', tracking_number: 'DLV-1' };
  const calls = mockApi({
    'POST /api/parcels': ok(rawParcel),
    'PATCH /api/admin/parcels/p1/delivery-agent': ok(rawParcel),
    'PATCH /api/admin/parcels/p1/location': ok(rawParcel),
    'PATCH /api/admin/parcels/p1/weight': ok(rawParcel),
  });

  await createParcel({ declaredWeightKg: 3 });
  await assignDeliveryAgent('p1');
  await updatePresentLocation('p1', { label: 'Voi', lat: -3.4, lng: 38.5 });
  await verifyParcelWeight('p1', { weightKg: 4.2 });

  expect(calls.map((call) => [call.path, call.options.body])).toEqual([
    ['/api/parcels', JSON.stringify({ declaredWeightKg: 3 })],
    ['/api/admin/parcels/p1/delivery-agent', JSON.stringify({})],
    ['/api/admin/parcels/p1/location', JSON.stringify({ address: 'Voi', latitude: -3.4, longitude: 38.5 })],
    ['/api/admin/parcels/p1/weight', JSON.stringify({ weightKg: 4.2 })],
  ]);
});
