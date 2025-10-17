// src/components/NewBatch.jsx
import React, { useState, useContext, useRef, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import axiosClient from "../../utils/axiosClient";
import ENDPOINTS from "../../utils/apiEndpoints";
import socket from "../../utils/socket";

export default function NewBatch({ onBatchAdded }) {
  const { user } = useContext(UserContext);

  const [formData, setFormData] = useState({
    created_by: user.user_id || null,
    batch_size: "",
    client_id: "",
    date_received: "",
    method_received: "",
    bank_statements: false,
    added_on_drive: true,
    total_urgent_foreign: "",
    cc_availability: "",
    corrections: false,
    foreign_urgents: [], // Array for dynamic foreign/urgent rows
  });

  const [open, setOpen] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open && firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle changes to total_urgent_foreign: dynamically adjust foreign_urgents array
  const handleTotalUrgentChange = (e) => {
    const num = parseInt(e.target.value, 10) || 0;
    setFormData((prev) => {
      let newForeignUrgents = [...prev.foreign_urgents];
      if (num > newForeignUrgents.length) {
        // Add empty objects if increasing
        const toAdd = num - newForeignUrgents.length;
        for (let i = 0; i < toAdd; i++) {
          newForeignUrgents.push({ patient_name: "", medical_aid_nr: "" });
        }
      } else if (num < newForeignUrgents.length) {
        // Slice if decreasing
        newForeignUrgents = newForeignUrgents.slice(0, num);
      }
      return {
        ...prev,
        total_urgent_foreign: num.toString(), // Store as string for input consistency
        foreign_urgents: newForeignUrgents,
      };
    });
  };

  // Handle changes in individual foreign/urgent rows
  const handleForeignUrgentChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.foreign_urgents];
      updated[index] = {
        ...updated[index],
        [name]: value,
      };
      return { ...prev, foreign_urgents: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseInt(formData.total_urgent_foreign, 10) || 0;
    if (total !== formData.foreign_urgents.length) {
      alert("Mismatch between total urgent/foreign and entered details. Please check.");
      return;
    }
    try {
      const response = await axiosClient.post(ENDPOINTS.addBatch, formData);
      if (response.data) {
        const createdBatch = response.data.batch;
        onBatchAdded?.(createdBatch);
        setFormData((prev) => ({
          ...prev,
          batch_size: "",
          client_id: "",
          date_received: "",
          method_received: "",
          bank_statements: false,
          corrections: false,
          total_urgent_foreign: "",
          cc_availability: "",
          foreign_urgents: [],
        }));
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to add batch:", error);
    }
  };

  return (
    <div className="container-col">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-class w-fit">
          New Batch
        </button>
      ) : (
        <div className="mt-4">
          <h3 className="font-bold mb-4">Add New Batch</h3>
          <form
            onSubmit={handleSubmit}
            className="flex flex-row flex-wrap gap-4 text-gray-dark"
          >
            <input
              ref={firstFieldRef}
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
              onChange={handleTotalUrgentChange}
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

            {/* Dynamic foreign/urgent rows */}
            {formData.foreign_urgents.map((fu, index) => (
              <div key={index} className="flex flex-row flex-wrap gap-4 w-full mt-4 border-t pt-4 items-center">
                <h4 className="font-semibold">{index + 1}</h4>
                <input
                  type="text"
                  name="patient_name"
                  placeholder="Patient Name"
                  value={fu.patient_name}
                  onChange={(e) => handleForeignUrgentChange(index, e)}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="medical_aid_nr"
                  placeholder="Medical Aid Number"
                  value={fu.medical_aid_nr}
                  onChange={(e) => handleForeignUrgentChange(index, e)}
                  className="border p-2 rounded"
                  required
                />
              </div>
            ))}

            <div className="flex gap-2 self-center w-full mt-4">
              <button type="submit" className="btn-class min-w-[100px]">
                Add
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-class min-w-[100px] bg-gray-300 text-gray-dark"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}