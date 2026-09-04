import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getParcelDetails, cancelParcel, clearSelectedParcel } from "../../store/slices/parcelsSlice";
import ParcelMap from "../../components/maps/ParcelMap";

const ParcelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedParcel, loading, error } = useSelector((state) => state.parcels.details);
  const cancelState = useSelector((state) => state.parcels.cancellation);

  useEffect(() => {
    dispatch(getParcelDetails(id));
    return () => {
      dispatch(clearSelectedParcel());
    };
  }, [dispatch, id]);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this parcel?")) {
      dispatch(cancelParcel(id)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          navigate("/parcels");
        }
      });
    }
  };

  if (loading) return <div className="text-center mt-10">Loading parcel details...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (!selectedParcel) return <div className="text-center mt-10">Parcel not found.</div>;

  // MOCK DATA FOR MAP (Replace with real data from API later)
  const pickupLocation = { lat: -1.2921, lng: 36.8219 }; // Nairobi
  const deliveryLocation = { lat: -1.3032, lng: 36.8322 }; // Another spot in Nairobi
  const routePath = [pickupLocation, deliveryLocation]; // Straight line for mock

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Parcel Details</h2>
      
      <div className="space-y-4">
        <div>
          <span className="font-semibold">Status:</span> {selectedParcel.status}
        </div>
        <div>
          <span className="font-semibold">Sender:</span> {selectedParcel.senderName} ({selectedParcel.senderPhone})
        </div>
        <div>
          <span className="font-semibold">Recipient:</span> {selectedParcel.recipientName} ({selectedParcel.recipientPhone})
        </div>
        <div>
          <span className="font-semibold">Pickup:</span> {selectedParcel.pickupLocation}
        </div>
        <div>
          <span className="font-semibold">Delivery:</span> {selectedParcel.deliveryLocation}
        </div>
        <div>
          <span className="font-semibold">Weight:</span> {selectedParcel.weight} kg
        </div>
        <div>
          <span className="font-semibold">Description:</span> {selectedParcel.description || "N/A"}
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Route Map</h3>
        <ParcelMap 
          pickupLocation={pickupLocation} 
          deliveryLocation={deliveryLocation} 
          routePath={routePath}
        />
      </div>

      <div className="mt-8 flex gap-4 items-center">
        <Link to="/parcels" className="text-blue-600 hover:underline">
          Back to Parcels
        </Link>
        <Link to={`/parcels/update/${id}`} className="text-green-600 hover:underline">
          Edit Parcel
        </Link>
        {selectedParcel.status !== "cancelled" && (
          <button
            onClick={handleCancel}
            disabled={cancelState.loading}
            className="text-red-600 hover:underline disabled:opacity-50"
          >
            {cancelState.loading ? "Cancelling..." : "Cancel Parcel"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ParcelDetails;