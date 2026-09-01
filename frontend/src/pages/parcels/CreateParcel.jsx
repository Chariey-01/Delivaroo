import { useState } from "react";

function CreateParcel() {
  const [formData, setFormData] = useState({
    destination: "",
    weightCategory: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.destination.trim()) {
      newErrors.destination = "Destination is required";
    }

    if (!formData.weightCategory) {
      newErrors.weightCategory = "Please select a weight category";
    }

    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      console.log("Parcel submitted:", formData);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="create-parcel">
      <h1>Create Parcel</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="destination">Destination</label>

          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="Enter destination"
            value={formData.destination}
            onChange={handleChange}
          />

          {errors.destination && (
            <p className="error">{errors.destination}</p>
          )}
        </div>

        <div>
          <label htmlFor="weightCategory">Weight Category</label>

          <select
            id="weightCategory"
            name="weightCategory"
            value={formData.weightCategory}
            onChange={handleChange}
          >
            <option value="">Select weight</option>
            <option value="light">Light (0–5 kg)</option>
            <option value="medium">Medium (5–20 kg)</option>
            <option value="heavy">Heavy (20+ kg)</option>
          </select>

          {errors.weightCategory && (
            <p className="error">{errors.weightCategory}</p>
          )}
        </div>

        <div>
          <p>
            Estimated Price:{" "}
            <strong>
              {formData.weightCategory ? "KES 1,500" : "KES 0"}
            </strong>
          </p>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Parcel"}
        </button>
      </form>
    </div>
  );
}

export default CreateParcel;
