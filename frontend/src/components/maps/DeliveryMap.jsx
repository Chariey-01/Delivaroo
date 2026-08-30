// W2-17 — the delivery map.
//
// Pickup marker, destination marker, present location, and the route between them
// (README "Maps"). Written against the Maps JavaScript API directly rather than a
// React wrapper: the imperative map object has to be held in a ref either way, and
// this keeps the dependency list — and the React 19 peer ranges — clear.
//
// Renders a plain notice instead of a map when no API key is configured, so a
// teammate who has not set one up still gets a working app and an obvious reason.

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, MapsConfigError } from '../../lib/loadGoogleMaps';
import { CITY_CENTER } from '../../api/geo';
import { color, radius } from '../../theme';

const MARKERS = {
  pickup: { glyph: 'A', fill: color.white, stroke: color.ink, label: 'Pickup' },
  destination: { glyph: 'B', fill: color.ink, stroke: color.orange, label: 'Destination' },
  present: { glyph: '', fill: color.orange, stroke: color.white, label: 'Present location' },
};

/** An SVG pin, so the markers match the palette instead of Google's default red. */
const pinIcon = (maps, kind) => {
  const { fill, stroke } = MARKERS[kind];
  return {
    path: 'M 0,0 m -9,0 a 9,9 0 1,0 18,0 a 9,9 0 1,0 -18,0',
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: stroke,
    strokeWeight: 3,
    scale: 1.4,
    anchor: new maps.Point(0, 0),
  };
};

function Notice({ children, tone = color.muted, overlay = false }) {
  return (
    <div
      role="status"
      style={{
        // Overlaid rather than stacked: the map container has to stay mounted for its
        // ref, so a notice beside it in flow would double the height of the frame.
        ...(overlay ? { position: 'absolute', inset: 0, background: color.paper } : { height: '100%' }),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: 1.55,
        color: tone,
      }}
    >
      {children}
    </div>
  );
}

export default function DeliveryMap({
  pickup,
  destination,
  presentLocation,
  route,
  onPick,
  height = 'clamp(260px,38vw,420px)',
  zoom = 12,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const lineRef = useRef(null);
  const clickRef = useRef(onPick);

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  // The click handler is read through a ref so changing it does not tear down and
  // rebuild the whole map.
  useEffect(() => {
    clickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        mapRef.current = new maps.Map(containerRef.current, {
          center: pickup ?? destination ?? CITY_CENTER,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Lets a customer drop a pin instead of typing an address.
        mapRef.current.addListener('click', (event) => {
          clickRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        setReady(true);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError);
      });

    return () => {
      cancelled = true;
    };
    // Built once. Everything that changes afterwards is applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers, route and viewport, redrawn whenever the points move.
  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    lineRef.current?.setMap(null);
    lineRef.current = null;

    const points = [];
    const place = (position, kind) => {
      if (!position || position.lat == null || position.lng == null) return;
      markersRef.current.push(
        new maps.Marker({
          map,
          position,
          icon: pinIcon(maps, kind),
          title: MARKERS[kind].label,
          label: MARKERS[kind].glyph
            ? { text: MARKERS[kind].glyph, fontSize: '11px', fontWeight: '700' }
            : undefined,
        }),
      );
      points.push(position);
    };

    place(pickup, 'pickup');
    place(destination, 'destination');
    place(presentLocation, 'present');

    const path = route?.coordinates?.length > 1 ? route.coordinates : null;
    if (path) {
      lineRef.current = new maps.Polyline({
        map,
        path,
        strokeColor: color.orange,
        strokeWeight: 4,
        strokeOpacity: route.estimated ? 0.65 : 1,
      });
      points.push(...path);
    }

    // Keep every marker and the whole route in frame.
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
    } else if (points.length > 1) {
      const bounds = new maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 48);
    }
  }, [ready, pickup, destination, presentLocation, route]);

  const frame = {
    position: 'relative',
    height,
    borderRadius: radius.card,
    overflow: 'hidden',
    border: '1px solid rgba(17,17,17,.1)',
    background: color.paper,
  };

  if (error) {
    return (
      <div style={frame}>
        <Notice tone={error instanceof MapsConfigError ? color.muted : color.danger}>
          {error.message}
        </Notice>
      </div>
    );
  }

  return (
    <div style={frame}>
      <div ref={containerRef} data-testid="delivery-map" style={{ height: '100%', width: '100%' }} />
      {!ready && <Notice overlay>Loading map…</Notice>}
    </div>
  );
}
