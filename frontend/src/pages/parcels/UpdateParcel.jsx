import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getParcelDetails, updateParcel, clearSelectedParcel } from "../../store/slices/parcelsSlice";

const UpdateParcel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedParcel, loading, error } = useSelector((state) => state.parcels.details);
  const updateState = useSelector((state) => state.parcels.update);

  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    recipientName: "",
    recipientPhone: "",
    pickupLocation: "",
    deliveryLocation: "",
    weight: "",
    description: "",
  });

  useEffect(() => {
    dispatch(getParcelDetails(id));
    return () => {
      dispatch(clearSelectedParcel());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedParcel) {
      setFormData({
        senderName: selectedParcel.senderName || "",
        senderPhone: selectedParcel.senderPhone || "",
        recipientName: selectedParcel.recipientName || "",
        recipientPhone: selectedParcel.recipientPhone || "",
        pickupLocation: selectedParcel.pickupLocation || "",
        deliveryLocation: selectedParcel.deliveryLocation || "",
        weight: selectedParcel.weight || "",
        description: selectedParcel.description || "",
      });
    }
  }, [selectedParcel]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateParcel({ id, parcelData: formData })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        navigate(`/parcels/${id}`);
      }
    });
  };

  if (loading) return <div className="text-center mt-10">Loading parcel details...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Update Parcel</h2>
      
      {updateState.error && <p className="text-red-600 mb-4">{updateState.error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sender Name</label>
          <input
            type="text"
            name="senderName"
            value={formData.senderName}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sender Phone</label>
          <input
            type="text"
            name="senderPhone"
            value={formData.senderPhone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Name</label>
          <input
            type="text"
            name="recipientName"
            value={formData.recipientName}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Phone</label>
          <input
            type="text"
            name="recipientPhone"
            value={formData.recipientPhone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pickup Location</label>
          <input
            type="text"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Delivery Location</label>
          <input
            type="text"
            name="deliveryLocation"
            value={formData.deliveryLocation}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={updateState.loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {updateState.loading ? "Updating..." : "Update Parcel"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link to={`/parcels/${id}`} className="text-blue-600 hover:underline">
          Cancel and go back
        </Link>
      </div>
    </div>
  );
};

export default UpdateParcel;