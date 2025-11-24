import { useEffect, useState } from "react";
import axiosClient from "../../../utils/axiosClient";
import ENDPOINTS from "../../../utils/apiEndpoints";

export const useWorkflowClients = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    let ignore = false;
    const fetchClients = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.workflowClients);
        if (!ignore) setClients(res.data || []);
      } catch (err) {
        console.error("Failed to load workflow clients:", err);
        if (!ignore) setClients([]);
      }
    };
    fetchClients();
    return () => {
      ignore = true;
    };
  }, []);

  return { clients };
};
