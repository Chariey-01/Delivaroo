// A stand-in for the Google Maps JavaScript API.
//
// The real API needs layout APIs jsdom does not implement and a network key, so the
// suites install this instead. It records what the app asked for, which is the part
// worth asserting: that markers are placed, a polyline drawn, and the viewport fitted.

export function installGoogleMaps({ predictions = [], geocode = [], route } = {}) {
  const state = {
    maps: [],
    markers: [],
    polylines: [],
    fitBounds: [],
    autocompleteQueries: [],
    geocodeRequests: [],
    routeRequests: [],
  };

  class LatLngBounds {
    constructor() {
      this.points = [];
    }
    extend(point) {
      this.points.push(point);
      return this;
    }
  }

  class Map {
    constructor(node, options) {
      this.node = node;
      this.options = options;
      this.listeners = {};
      state.maps.push(this);
    }
    addListener(event, handler) {
      this.listeners[event] = handler;
    }
    setCenter(center) {
      this.center = center;
    }
    setZoom(zoom) {
      this.zoom = zoom;
    }
    fitBounds(bounds, padding) {
      state.fitBounds.push({ bounds, padding });
    }
  }

  class Marker {
    constructor(options) {
      Object.assign(this, options);
      state.markers.push(this);
    }
    setMap(map) {
      this.map = map;
      if (map === null) state.markers = state.markers.filter((m) => m !== this);
    }
  }

  class Polyline {
    constructor(options) {
      Object.assign(this, options);
      state.polylines.push(this);
    }
    setMap(map) {
      this.map = map;
      if (map === null) state.polylines = state.polylines.filter((p) => p !== this);
    }
  }

  const maps = {
    Map,
    Marker,
    Polyline,
    LatLngBounds,
    Point: class {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    TravelMode: { DRIVING: 'DRIVING' },
    places: {
      PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
      AutocompleteService: class {
        getPlacePredictions(request, callback) {
          state.autocompleteQueries.push(request);
          callback(predictions, predictions.length ? 'OK' : 'ZERO_RESULTS');
        }
      },
    },
    Geocoder: class {
      async geocode(request) {
        state.geocodeRequests.push(request);
        return { results: geocode };
      }
    },
    DirectionsService: class {
      async route(request) {
        state.routeRequests.push(request);
        if (!route) throw new Error('Directions unavailable');
        return route;
      }
    },
  };

  global.window.google = { maps };
  return state;
}

export function uninstallGoogleMaps() {
  delete global.window.google;
}

/** A Directions-shaped result for `routeBetween`. */
export const directionsResult = ({ km = 12.5, minutes = 30, path = [] } = {}) => ({
  routes: [
    {
      legs: [{ distance: { value: km * 1000 }, duration: { value: minutes * 60 } }],
      overview_path: path,
    },
  ],
});
