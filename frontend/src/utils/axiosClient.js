import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

// axios instance
const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies by default
});

export default axiosClient;
