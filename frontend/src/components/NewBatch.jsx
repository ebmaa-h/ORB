import React, { useState, useContext } from "react";
import axiosClient from "../config/axiosClient";
import { UserContext } from "../context/UserContext";
import ENDPOINTS from "../config/apiEndpoints";

export default function NewBatch({ onBatchAdded }) {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    pending: true,
    status: false,
    created_by: user?.id || null,
    admitted_by: null,
    billed_by: null,
    batch_size: "",
    client_id: "",
    date_received: "",
    method_received: "",
    bank_statements: false,
    added_on_workflow: true,
    total_urgent_foreign: "",
    cc_availability: "",
    corrections: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.post(ENDPOINTS.addBatch, formData);
      if (response.data) {
        onBatchAdded?.(response.data); // update workflow if parent passes callback
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to add batch:", error);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="btn-class min-w-[100px] max-h-[35px]"
      >
        Add new
      </button>

        <h2 className="text-lg font-bold mb-4">Add New Batch</h2>
        <form onSubmit={handleSubmit} className="flex flex-row gap-4 text-gray-dark">
          <input
            type="number"
            name="batch_size"
            placeholder="Batch Size"
            value={formData.batch_size}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            name="client_id"
            placeholder="Client ID"
            value={formData.client_id}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="date"
            name="date_received"
            value={formData.date_received}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="method_received"
            placeholder="Method Received"
            value={formData.method_received}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="bank_statements"
              checked={formData.bank_statements}
              onChange={handleChange}
            />
            Bank Statements
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="corrections"
              checked={formData.corrections}
              onChange={handleChange}
            />
            Corrections
          </label>
          <input
            type="number"
            name="total_urgent_foreign"
            placeholder="Total Urgent Foreign"
            value={formData.total_urgent_foreign}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="cc_availability"
            placeholder="CC Availability"
            value={formData.cc_availability}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="btn-class min-w-[100px] mt-2 self-center"
          >
            Save
          </button>
        </form>
    </div>
  );
}
