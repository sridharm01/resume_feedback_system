import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";

function InstituteSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    instituteName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactPerson: "",
    contactNumber: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      instituteName,
      email,
      password,
      confirmPassword,
      contactPerson,
      contactNumber
    } = formData;

    if (!instituteName || !email || !password || !confirmPassword || !contactPerson || !contactNumber) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // TODO: Connect with backend API
      // await axios.post("/api/institute-signup", formData);

      alert("Institute signup successful!");
      navigate("/instlogin");
    } catch (err) {
      setError("Signup failed. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Institute Sign Up</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="instituteName"
          placeholder="Institute Name"
          value={formData.instituteName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="contactPerson"
          placeholder="Contact Person"
          value={formData.contactPerson}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="contactNumber"
          placeholder="Contact Number"
          value={formData.contactNumber}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Institute Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Create Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already registered?{" "}
        <span
          className="text-blue-600 cursor-pointer"
          onClick={() => navigate("/instlogin")}
        >
          Log in
        </span>
      </p>
    </div>
  );
}

export default InstituteSignup;
