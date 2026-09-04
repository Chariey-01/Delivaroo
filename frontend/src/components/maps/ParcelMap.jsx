import { useJsApiLoader, GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../api/viteEnv';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const ParcelMap = ({ pickupLocation, deliveryLocation, routePath }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  if (!isLoaded) return <div>Loading Maps...</div>;

  const center = pickupLocation || { lat: -1.2921, lng: 36.8219 }; // Nairobi default

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
    >
      {/* Pickup Marker */}
      {pickupLocation && <Marker position={pickupLocation} label="P" />}
      
      {/* Delivery Marker */}
      {deliveryLocation && <Marker position={deliveryLocation} label="D" />}

      {/* Route Path */}
      {routePath && routePath.length > 0 && (
        <Polyline
          path={routePath}
          options={{ strokeColor: "#FF0000", strokeOpacity: 1, strokeWeight: 2 }}
        />
      )}
    </GoogleMap>
  );
};

export default ParcelMap;
