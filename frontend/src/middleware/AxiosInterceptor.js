import axios from 'axios';

const AxiosInterceptor = axios.create({
  baseURL: 'http://167.99.196.172:4000', // Or any other default API URL
  withCredentials: true, // Ensures cookies are sent with requests
});

// Interceptor to check JWT before any request
AxiosInterceptor.interceptors.request.use(
  async (config) => {
    try {
      // Verifying JWT before each request
      await AxiosInterceptor.get('/verify');
    } catch (error) {
      console.log("JWT verification failed.");
      throw error; // Error will be caught in App.js to handle redirection
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default AxiosInterceptor;
