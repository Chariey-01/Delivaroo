// W2-17 — Google Maps integration.
//
// The API itself is replaced by src/__mocks__/googleMaps.js; what is tested is the
// app's side of the contract: that markers are placed for the points it was given,
// that a route is drawn, that the viewport is fitted, that a tap reports a location,
// and — the part that matters most for the team — that a missing API key degrades to
// a readable notice instead of a crash.

import { render, screen, waitFor } from '@testing-library/react';
import { directionsResult, installGoogleMaps, uninstallGoogleMaps } from '../__mocks__/googleMaps';
import { resetGoogleMapsLoader } from '../lib/loadGoogleMaps';
import DeliveryMap from '../components/maps/DeliveryMap';
import { haversineKm, routeBetween, reverseGeocode, searchPlaces } from '../api/geo';

const NAIROBI = { lat: -1.2921, lng: 36.8219 };
const MOMBASA = { lat: -4.0435, lng: 39.6682 };

afterEach(() => {
  uninstallGoogleMaps();
  resetGoogleMapsLoader();
});

describe('DeliveryMap', () => {
  test('places a marker for each point it is given', async () => {
    const maps = installGoogleMaps();

    render(<DeliveryMap pickup={NAIROBI} destination={MOMBASA} />);

    await waitFor(() => expect(maps.markers).toHaveLength(2));
    expect(maps.markers.map((m) => m.title)).toEqual(['Pickup', 'Destination']);
  });

  test('adds the present-location marker when the parcel is in transit', async () => {
    const maps = installGoogleMaps();

    render(
      <DeliveryMap pickup={NAIROBI} destination={MOMBASA} presentLocation={{ lat: -2.5, lng: 38 }} />,
    );

    await waitFor(() => expect(maps.markers).toHaveLength(3));
    expect(maps.markers.map((m) => m.title)).toContain('Present location');
  });

  test('ignores a point with no coordinates rather than dropping a marker at 0,0', async () => {
    const maps = installGoogleMaps();

    render(<DeliveryMap pickup={NAIROBI} destination={{ address: 'Not yet geocoded' }} />);

    await waitFor(() => expect(maps.markers).toHaveLength(1));
    expect(maps.markers[0].title).toBe('Pickup');
  });

  test('draws the route polyline and fits every point into view', async () => {
    const maps = installGoogleMaps();
    const route = { coordinates: [NAIROBI, { lat: -2.5, lng: 38 }, MOMBASA], estimated: false };

    render(<DeliveryMap pickup={NAIROBI} destination={MOMBASA} route={route} />);

    await waitFor(() => expect(maps.polylines).toHaveLength(1));
    expect(maps.polylines[0].path).toEqual(route.coordinates);
    expect(maps.polylines[0].strokeOpacity).toBe(1);
    expect(maps.fitBounds.at(-1).bounds.points.length).toBeGreaterThan(2);
  });

  test('draws an estimated route faintly, so a guess does not look measured', async () => {
    const maps = installGoogleMaps();

    render(
      <DeliveryMap
        pickup={NAIROBI}
        destination={MOMBASA}
        route={{ coordinates: [NAIROBI, MOMBASA], estimated: true }}
      />,
    );

    await waitFor(() => expect(maps.polylines).toHaveLength(1));
    expect(maps.polylines[0].strokeOpacity).toBeLessThan(1);
  });

  test('a tap on the map reports the location', async () => {
    const maps = installGoogleMaps();
    const onPick = jest.fn();

    render(<DeliveryMap pickup={NAIROBI} onPick={onPick} />);

    await waitFor(() => expect(maps.maps).toHaveLength(1));
    maps.maps[0].listeners.click({ latLng: { lat: () => -1.3, lng: () => 36.8 } });

    expect(onPick).toHaveBeenCalledWith({ lat: -1.3, lng: 36.8 });
  });

  test('with no API key it explains itself instead of crashing', async () => {
    // No window.google and no VITE_GOOGLE_MAPS_API_KEY (the Jest env stub leaves it blank).
    render(<DeliveryMap pickup={NAIROBI} />);

    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
  });
});

describe('geo service', () => {
  test('autocomplete needs three characters before it calls out', async () => {
    const maps = installGoogleMaps({ predictions: [] });

    await expect(searchPlaces('ab')).resolves.toEqual([]);
    expect(maps.autocompleteQueries).toHaveLength(0);
  });

  test('predictions are mapped to the flat place shape', async () => {
    installGoogleMaps({
      predictions: [
        {
          place_id: 'abc',
          description: 'Westlands, Nairobi',
          structured_formatting: { main_text: 'Westlands' },
        },
      ],
    });

    const [place] = await searchPlaces('west');

    expect(place).toMatchObject({ id: 'abc', label: 'Westlands, Nairobi', name: 'Westlands' });
    // A prediction has no coordinates yet — resolvePlace fills those in on selection.
    expect(place.lat).toBeNull();
  });

  test('autocomplete returns nothing rather than throwing when Maps is unavailable', async () => {
    await expect(searchPlaces('westlands')).resolves.toEqual([]);
  });

  test('reverse geocoding falls back to the coordinates when nothing is found', async () => {
    installGoogleMaps({ geocode: [] });

    const place = await reverseGeocode({ lat: -1.2921, lng: 36.8219 });

    expect(place.label).toBe('-1.2921, 36.8219');
    expect(place.name).toBe('Dropped pin');
  });

  test('reverse geocoding uses the formatted address when there is one', async () => {
    installGoogleMaps({
      geocode: [
        {
          place_id: 'xyz',
          formatted_address: 'Kenyatta Ave, Nairobi',
          address_components: [{ long_name: 'Kenyatta Ave' }],
        },
      ],
    });

    const place = await reverseGeocode({ lat: -1.2921, lng: 36.8219 });

    expect(place).toMatchObject({ id: 'xyz', label: 'Kenyatta Ave, Nairobi', name: 'Kenyatta Ave' });
  });

  test('routeBetween reports the distance and duration Directions returned', async () => {
    installGoogleMaps({
      route: directionsResult({ km: 12.5, minutes: 30, path: [NAIROBI, MOMBASA] }),
    });

    const route = await routeBetween(NAIROBI, MOMBASA);

    expect(route.distanceKm).toBeCloseTo(12.5);
    expect(route.durationSeconds).toBe(1800);
    expect(route.estimated).toBe(false);
    expect(route.coordinates).toHaveLength(2);
  });

  test('routeBetween falls back to a flagged estimate when Directions fails', async () => {
    installGoogleMaps({ route: null });

    const route = await routeBetween(NAIROBI, MOMBASA);

    expect(route.estimated).toBe(true);
    // The detour factor is applied to the straight-line distance, so it must be longer.
    expect(route.distanceKm).toBeGreaterThan(haversineKm(NAIROBI, MOMBASA));
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.coordinates).toEqual([NAIROBI, MOMBASA]);
  });

  test('haversine measures a known distance sensibly', () => {
    // Nairobi to Mombasa is roughly 440 km in a straight line.
    expect(haversineKm(NAIROBI, MOMBASA)).toBeGreaterThan(400);
    expect(haversineKm(NAIROBI, MOMBASA)).toBeLessThan(480);
    expect(haversineKm(NAIROBI, NAIROBI)).toBeCloseTo(0);
  });
});
