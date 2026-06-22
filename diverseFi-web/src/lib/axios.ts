import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This enables sending cookies with requests
});

// Helper function to handle API errors
export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    // If we have a response with data, throw the entire error response
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    // Fallback to error message if no response data
    throw new Error(error.message || 'Something went wrong');
  }
  throw error;
};

export default axiosInstance;
