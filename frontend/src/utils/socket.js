// socket.js
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL;

// only create socket instance, don’t connect yet
const socket = io(API_URL, { 
  autoConnect: false, // <-- IMPORTANT
  withCredentials: true
});

export default socket;
