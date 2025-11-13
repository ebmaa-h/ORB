import React, { useState, useContext, useRef, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import axiosClient from "../../utils/axiosClient";
import ENDPOINTS from "../../utils/apiEndpoints";

const METHOD_OPTIONS = [
  "email",
  "driver",
  "courier",
  "doctor",
  "fax",
  "collect",
  "relative",
  "other",
];

export default function NewBatch({ onBatchCreated }) {
  const { user } = useContext(UserContext);

  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    created_by: user.user_id || null,
    batch_size: "",
    client_id: "",
    date_received: "",
    method_received: METHOD_OPTIONS[0],
    bank_statements: false,
    added_on_drive: false,
    total_urgent_foreign: "",
    cc_availability: "",
    foreign_urgents: [],
    corrections: false,
  });

  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.workflowClients, { withCredentials: true });
        setClients(res.data || []);
      } catch (err) {
        console.error("Failed to load clients:", err);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTotalUrgentChange = (e) => {
    const num = parseInt(e.target.value, 10) || 0;
    setFormData((prev) => {
      let newForeignUrgents = [...prev.foreign_urgents];
      if (num > newForeignUrgents.length) {
        const toAdd = num - newForeignUrgents.length;
        for (let i = 0; i < toAdd; i++) {
          newForeignUrgents.push({ patient_name: "", medical_aid_nr: "" });
        }
      } else if (num < newForeignUrgents.length) {
        newForeignUrgents = newForeignUrgents.slice(0, num);
      }
      return {
        ...prev,
        total_urgent_foreign: num.toString(),
        foreign_urgents: newForeignUrgents,
      };
    });
  };

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
    if (!formData.client_id) {
      alert("Please select a client");
      return;
    }

    try {
      const payload = {
        ...formData,
        client_id: Number(formData.client_id),
      };

      const response = await axiosClient.post(ENDPOINTS.addBatch, payload);
      if (response.data) {
        setFormData({
          created_by: user.user_id || null,
          batch_size: "",
          client_id: "",
          date_received: "",
          method_received: METHOD_OPTIONS[0],
          bank_statements: false,
          added_on_drive: false,
          total_urgent_foreign: "",
          cc_availability: "",
          foreign_urgents: [],
          corrections: false,
        });
        if (typeof onBatchCreated === "function") {
          onBatchCreated();
        }
      }
    } catch (error) {
      console.error("Failed to add batch:", error);
    }
  };

  return (
    <div>
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
        <select
          name="client_id"
          value={formData.client_id}
          onChange={handleChange}
          className="border p-2 rounded min-w-[220px]"
          required
        >
          <option value="" disabled>
            Select client
          </option>
          {clients.map((client) => {
            const label = `Dr ${(client.first || "").trim()} ${(client.last || "").trim()}`.trim();
            return (
              <option key={client.client_id} value={client.client_id}>
                {label}
              </option>
            );
          })}
        </select>
        <input
          type="date"
          name="date_received"
          value={formData.date_received}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <select
          name="method_received"
          value={formData.method_received}
          onChange={handleChange}
          className="border p-2 rounded min-w-[160px]"
        >
          {METHOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
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
            name="added_on_drive"
            checked={formData.added_on_drive}
            onChange={handleChange}
          />
          Added on Drive
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

        {formData.foreign_urgents.map((fu, index) => (
          <div key={index} className="container-row-outer p-0 place-items-center m-0">
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
          <button type="submit" className="btn-class min-w-[100px] bg-green text-white">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
