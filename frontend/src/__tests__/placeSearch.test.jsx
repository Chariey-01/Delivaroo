// W2-17 — the address autocomplete, which is the part of the maps work a user
// actually touches. Debounce and abort behaviour matter here: without them a fast
// typist gets results from a query they have already replaced.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceSearch from '../components/maps/PlaceSearch';
import { installGoogleMaps, uninstallGoogleMaps } from '../__mocks__/googleMaps';
import { resetGoogleMapsLoader } from '../lib/loadGoogleMaps';

const PREDICTIONS = [
  { place_id: 'p1', description: 'Westlands, Nairobi', structured_formatting: { main_text: 'Westlands' } },
  { place_id: 'p2', description: 'Westgate, Nairobi', structured_formatting: { main_text: 'Westgate' } },
];

const GEOCODE = [
  {
    place_id: 'p1',
    formatted_address: 'Westlands, Nairobi, Kenya',
    geometry: { location: { lat: () => -1.2641, lng: () => 36.8078 } },
    address_components: [{ long_name: 'Westlands' }],
  },
];

afterEach(() => {
  uninstallGoogleMaps();
  resetGoogleMapsLoader();
});

describe('PlaceSearch', () => {
  test('stays quiet until the third character', async () => {
    const user = userEvent.setup();
    const maps = installGoogleMaps({ predictions: PREDICTIONS });

    render(<PlaceSearch value={null} onChange={jest.fn()} label="Pickup" />);
    await user.type(screen.getByRole('combobox'), 'we');

    // Past the debounce window, and still no request.
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(maps.autocompleteQueries).toHaveLength(0);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('shows predictions once there is enough to search on', async () => {
    const user = userEvent.setup();
    installGoogleMaps({ predictions: PREDICTIONS });

    render(<PlaceSearch value={null} onChange={jest.fn()} label="Pickup" />);
    await user.type(screen.getByRole('combobox'), 'west');

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('Westlands, Nairobi')).toBeInTheDocument();
  });

  test('choosing a prediction resolves it to coordinates before reporting it', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    installGoogleMaps({ predictions: PREDICTIONS, geocode: GEOCODE });

    render(<PlaceSearch value={null} onChange={onChange} label="Pickup" />);
    await user.type(screen.getByRole('combobox'), 'west');
    await user.click(await screen.findByText('Westlands, Nairobi'));

    // A prediction alone has no lat/lng — handing that up would put a marker nowhere.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', lat: -1.2641, lng: 36.8078 }),
      ),
    );
  });

  test('the keyboard can move through the list and select', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    installGoogleMaps({ predictions: PREDICTIONS, geocode: GEOCODE });

    render(<PlaceSearch value={null} onChange={onChange} label="Pickup" />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'west');
    await screen.findByRole('listbox');

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0].id).toBe('p1');
  });

  test('Escape closes the list without choosing anything', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    installGoogleMaps({ predictions: PREDICTIONS });

    render(<PlaceSearch value={null} onChange={onChange} label="Pickup" />);
    await user.type(screen.getByRole('combobox'), 'west');
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  test('a chosen place replaces the search box and can be cleared', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const chosen = { id: 'p1', label: 'Westlands, Nairobi, Kenya', name: 'Westlands', lat: -1.26, lng: 36.8 };

    render(<PlaceSearch value={chosen} onChange={onChange} label="Pickup" />);

    expect(screen.getByText('Westlands, Nairobi, Kenya')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /change/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('a denied location permission is reported, not swallowed', async () => {
    const user = userEvent.setup();
    installGoogleMaps({});

    navigator.geolocation = {
      getCurrentPosition: (_ok, fail) => fail(new Error('denied')),
    };

    render(<PlaceSearch value={null} onChange={jest.fn()} label="Pickup" />);
    await user.click(screen.getByRole('button', { name: /use my current location/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/location permission denied/i);
  });

  test('"use my location" reports the reverse-geocoded place', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    installGoogleMaps({ geocode: GEOCODE });

    navigator.geolocation = {
      getCurrentPosition: (ok) => ok({ coords: { latitude: -1.2641, longitude: 36.8078 } }),
    };

    render(<PlaceSearch value={null} onChange={onChange} label="Pickup" />);
    await user.click(screen.getByRole('button', { name: /use my current location/i }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Westlands, Nairobi, Kenya' }),
      ),
    );
  });
});
