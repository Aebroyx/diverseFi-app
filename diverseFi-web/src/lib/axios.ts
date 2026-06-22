import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This enables sending cookies with requests
});

// Flag to track if a token refresh is in progress
let isRefreshing = false;
// Queue to store failed requests while refreshing token
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process the queue of failed requests
const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Add response interceptor for automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid retrying refresh-token endpoint itself
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      // Don't attempt refresh if we're on auth pages (login/register)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/auth/')) {
          return Promise.reject(error);
        }
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await axiosInstance.post('/auth/refresh-token');

        // Token refreshed successfully, process the queue
        processQueue();
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, clear the queue
        processQueue(refreshError);
        isRefreshing = false;

        // Only redirect if not already on auth pages to prevent loops
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath.startsWith('/auth/');

          if (!isAuthPage) {
            // Use replace to prevent back button issues
            window.location.replace('/auth/login');
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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

// Helper function to extract user-friendly error message from API error
export const getErrorMessage = (error: Error, fallback: string): string => {
  try {
    const errorResponse = JSON.parse(error.message);

    // Check if it's a structured API error response
    if (errorResponse.status === 'error' && errorResponse.message) {
      return errorResponse.message;
    }

    // Fallback to original message if not a structured error
    return error.message || fallback;
  } catch {
    // If JSON parsing fails, return the original message or fallback
    return error.message || fallback;
  }
};

export default axiosInstance;
