import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { routeBetween } from '../api/geo';
import DeliveryMap from '../components/maps/DeliveryMap';
import PlaceSearch from '../components/maps/PlaceSearch';
import PageShell from './PageShell';
import { color, radius } from '../theme';

/**
 * The signed-in landing screen.
 *
 * Parcel booking and the parcel list belong to other members of the team; what this
 * screen carries today is the map integration (W2-17) wired end to end — pick two
 * addresses, see the markers, the route, the distance and the duration — so the
 * pieces are proven working before the booking flow is built on top of them.
 */
export default function Dashboard() {
  const user = useSelector(selectUser);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [routing, setRouting] = useState(false);

  const setBoth = async (next) => {
    const from = next.pickup !== undefined ? next.pickup : pickup;
    const to = next.destination !== undefined ? next.destination : destination;
    if (next.pickup !== undefined) setPickup(next.pickup);
    if (next.destination !== undefined) setDestination(next.destination);

    if (from?.lat != null && to?.lat != null) {
      setRouting(true);
      try {
        setRoute(await routeBetween(from, to));
      } finally {
        setRouting(false);
      }
    } else {
      setRoute(null);
    }
  };

  return (
    <PageShell
      title={`Hello, ${user?.fullName?.split(' ')[0] || 'there'}.`}
      subtitle="Choose a pickup and a destination to see the route, the distance and the estimated time."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 'min(100%,300px)' }}>
          <PlaceSearch
            label="Pickup"
            placeholder="Where is the parcel now?"
            value={pickup}
            onChange={(place) => setBoth({ pickup: place })}
          />
          <PlaceSearch
            label="Destination"
            placeholder="Where is it going?"
            value={destination}
            onChange={(place) => setBoth({ destination: place })}
          />

          {route && (
            <dl
              style={{
                display: 'flex',
                gap: '28px',
                margin: '4px 0 0',
                padding: '16px 18px',
                borderRadius: radius.card,
                background: color.white,
                border: '1px solid rgba(17,17,17,.08)',
              }}
            >
              <div>
                <dt style={{ fontSize: '12px', color: color.muted }}>Distance</dt>
                <dd style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 700, color: color.ink }}>
                  {route.distanceKm.toFixed(1)} km
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: '12px', color: color.muted }}>Estimated time</dt>
                <dd style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 700, color: color.ink }}>
                  {Math.round(route.durationSeconds / 60)} min
                </dd>
              </div>
              {route.estimated && (
                <div style={{ alignSelf: 'center', fontSize: '12.5px', color: color.muted, maxWidth: '20ch' }}>
                  Approximate — the live routing service was unreachable.
                </div>
              )}
            </dl>
          )}
          {routing && <p style={{ fontSize: '13px', color: color.muted }}>Calculating route…</p>}
        </div>

        <div style={{ flex: '1 1 420px', minWidth: 'min(100%,300px)' }}>
          <DeliveryMap pickup={pickup} destination={destination} route={route} />
        </div>
      </div>
    </PageShell>
  );
}
