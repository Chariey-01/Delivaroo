import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getParcelDetails, clearSelectedParcel } from "../../store/slices/parcelsSlice";

const ParcelDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedParcel, loading, error } = useSelector((state) => state.parcels.details);

  useEffect(() => {
    dispatch(getParcelDetails(id));
    return () => {
      dispatch(clearSelectedParcel());
    };
  }, [dispatch, id]);

  if (loading) return <div className="text-center mt-10">Loading parcel details...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (!selectedParcel) return <div className="text-center mt-10">Parcel not found.</div>;

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

      <div className="mt-8 flex gap-4">
        <Link to="/parcels" className="text-blue-600 hover:underline">
          Back to Parcels
        </Link>
        <Link to={`/parcels/update/${id}`} className="text-green-600 hover:underline">
          Edit Parcel
        </Link>
      </div>
    </div>
  );
};

export default ParcelDetails;