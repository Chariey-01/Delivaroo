import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { listParcels } from "../../store/slices/parcelsSlice";
import { Link } from "react-router-dom";

const ParcelList = () => {
  const dispatch = useDispatch();
  const { parcels, loading, error } = useSelector((state) => state.parcels.list);

  useEffect(() => {
    dispatch(listParcels());
  }, [dispatch]);

  if (loading) return <div className="text-center mt-10">Loading parcels...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Parcels</h2>
        <Link to="/parcels/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create New Parcel
        </Link>
      </div>

      {parcels.length === 0 ? (
        <p className="text-gray-500">No parcels found. Create one to get started!</p>
      ) : (
        <div className="grid gap-4">
          {parcels.map((parcel) => (
            <div key={parcel.id} className="border p-4 rounded shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {parcel.senderName} → {parcel.recipientName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From {parcel.pickupLocation} to {parcel.deliveryLocation}
                  </p>
                  <p className="text-sm text-gray-500">Weight: {parcel.weight} kg</p>
                </div>
                <Link
                  to={`/parcels/${parcel.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParcelList;